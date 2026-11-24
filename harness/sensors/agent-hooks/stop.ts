import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, matchesGlob } from "node:path";
import { deniedPatterns, type Failure, protectedFilesIn, reasonFor } from "./stop-reason.ts";

type HookInput = {
  cwd: string;
  stop_hook_active: boolean;
};

type Check = { name: string; command: string; args: string[]; shell?: boolean };

const MAX_REASON_LENGTH = 6000;

const input = JSON.parse(readFileSync(0, "utf8")) as HookInput;

const git = (args: string[]): string[] =>
  execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: input.cwd, encoding: "utf8" })
    .split("\n")
    .filter((line) => line !== "");

const changedFiles = (): string[] => {
  const files = new Set([
    ...git(["diff", "--name-only", "HEAD"]),
    ...git(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const denied = deniedPatterns(input.cwd);
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

const run = (check: Check, denied: string[]): Failure | null => {
  const result = spawnSync(check.command, check.args, {
    cwd: input.cwd,
    encoding: "utf8",
    shell: check.shell ?? false,
  });
  if (result.status === 0) return null;
  const output = `${result.stdout}${result.stderr}`.slice(-MAX_REASON_LENGTH);
  return { name: check.name, output, protectedFiles: protectedFilesIn(output, denied) };
};

if (!input.stop_hook_active) {
  const files = changedFiles();
  const checks = files.length === 0 ? [] : checksFor(files);
  const denied = deniedPatterns(input.cwd);
  const failures = checks.map((check) => run(check, denied)).filter((failure) => failure !== null);
  if (failures.length > 0) {
    process.stdout.write(JSON.stringify({ decision: "block", reason: reasonFor(failures) }));
  }
}
