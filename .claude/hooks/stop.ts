// Stop hook: before the agent ends its turn, runs the type check, lint and the tests related to the
// files changed since the last commit, except the files the agent is denied to edit. On failure it
// blocks the stop and gives the reason, so the agent cannot report the work as done. The full
// `pnpm check` runs in the pre-push hook.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, matchesGlob } from "node:path";

type HookInput = {
  cwd: string;
  // biome-ignore lint/style/useNamingConvention: field names are set by Claude Code.
  stop_hook_active: boolean;
};

type Check = { name: string; command: string; args: string[]; shell?: boolean };

type Settings = { permissions?: { deny?: string[] } };

const SETTINGS_FILES = [".claude/settings.json", ".claude/settings.local.json"];
// `Edit(/path)` is relative to the project root; other forms (`//`, `~/`) point outside it.
const PROJECT_EDIT_RULE = /^Edit\(\/([^/].*)\)$/;

// Keep the reason short enough for the agent to read; the end of the output holds the summary.
const MAX_REASON_LENGTH = 6000;

const input = JSON.parse(readFileSync(0, "utf8")) as HookInput;

const git = (args: string[]): string[] =>
  execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: input.cwd, encoding: "utf8" })
    .split("\n")
    .filter((line) => line !== "");

// Files the agent is denied to edit: their changes come from someone else, and the agent cannot
// fix them, so they must not block the turn.
const deniedPatterns = (): string[] =>
  SETTINGS_FILES.map((file) => join(input.cwd, file))
    .filter((file) => existsSync(file))
    .flatMap((file) => (JSON.parse(readFileSync(file, "utf8")) as Settings).permissions?.deny ?? [])
    .flatMap((rule) => PROJECT_EDIT_RULE.exec(rule)?.[1] ?? []);

const changedFiles = (): string[] => {
  const files = new Set([
    ...git(["diff", "--name-only", "HEAD"]),
    ...git(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const denied = deniedPatterns();
  return [...files].filter(
    (file) =>
      existsSync(join(input.cwd, file)) && !denied.some((pattern) => matchesGlob(file, pattern)),
  );
};

const checksFor = (files: string[]): Check[] => {
  const tsFiles = files.filter((file) => file.endsWith(".ts"));
  const bin = (path: string): string => join(input.cwd, "node_modules", path);
  const checks: Check[] = [
    {
      name: "lint",
      command: process.execPath,
      args: [bin("@biomejs/biome/bin/biome"), "check", "--no-errors-on-unmatched", ...files],
    },
  ];
  if (tsFiles.length > 0) {
    checks.push(
      { name: "typecheck", command: "pnpm run typecheck", args: [], shell: true },
      {
        name: "related tests",
        command: process.execPath,
        args: [bin("vitest/vitest.mjs"), "related", "--run", "--passWithNoTests", ...tsFiles],
      },
    );
  }
  return checks;
};

const run = (check: Check): string | null => {
  const result = spawnSync(check.command, check.args, {
    cwd: input.cwd,
    encoding: "utf8",
    shell: check.shell ?? false,
  });
  if (result.status === 0) return null;
  const output = `${result.stdout}${result.stderr}`.slice(-MAX_REASON_LENGTH);
  return `${check.name} failed:\n${output}`;
};

// A second stop right after a block: let it through, so the hook cannot loop.
if (!input.stop_hook_active) {
  const files = changedFiles();
  // With no file arguments Biome would check the whole repository.
  const checks = files.length === 0 ? [] : checksFor(files);
  const failures = checks.map(run).filter((failure) => failure !== null);
  if (failures.length > 0) {
    const reason = `Checks failed on the changed files. Fix them before you finish.\n\n${failures.join("\n\n")}`;
    process.stdout.write(JSON.stringify({ decision: "block", reason }));
  }
}
