// The logic of the Stop hook that decides which files the agent may not fix and what it is told when
// a check fails. Kept apart from `stop.ts`, which reads stdin and runs the checks, so tests can
// import it.

import { existsSync, readFileSync } from "node:fs";
import { join, matchesGlob } from "node:path";

export type Failure = { name: string; output: string; protectedFiles: string[] };

type Settings = { permissions?: { deny?: string[] } };

const SETTINGS_FILES = [".claude/settings.json", ".claude/settings.local.json"];
// `Edit(/path)` is relative to the project root; other forms (`//`, `~/`) point outside it.
const PROJECT_EDIT_RULE = /^Edit\(\/([^/].*)\)$/;

// Files the agent is denied to edit: their changes come from someone else, and the agent cannot
// fix them, so they must not block the turn.
export const deniedPatterns = (cwd: string): string[] =>
  SETTINGS_FILES.map((file) => join(cwd, file))
    .filter((file) => existsSync(file))
    .flatMap((file) => (JSON.parse(readFileSync(file, "utf8")) as Settings).permissions?.deny ?? [])
    .flatMap((rule) => PROJECT_EDIT_RULE.exec(rule)?.[1] ?? []);

// The protected files that a failed check names. Paths in the output may use backslashes.
export const protectedFilesIn = (output: string, denied: string[]): string[] => {
  const paths = output.replaceAll("\\", "/").match(/[\w.@-]+(?:\/[\w.@-]+)+/g) ?? [];
  return [...new Set(paths)].filter((path) => denied.some((pattern) => matchesGlob(path, pattern)));
};

const describeFailure = ({ name, output }: Failure): string => `${name} failed:\n${output}`;

// A check that fails in a protected file cannot be fixed by the agent: it reports and stops.
export const reasonFor = (failures: Failure[]): string => {
  const protectedFailures = failures.filter(({ protectedFiles }) => protectedFiles.length > 0);
  const fixable = failures.filter(({ protectedFiles }) => protectedFiles.length === 0);
  const parts: string[] = [];
  if (fixable.length > 0) {
    parts.push(
      `Checks failed on the changed files. Fix them before you finish.\n\n${fixable.map(describeFailure).join("\n\n")}`,
    );
  }
  if (protectedFailures.length > 0) {
    const files = [...new Set(protectedFailures.flatMap(({ protectedFiles }) => protectedFiles))];
    parts.push(
      `A check failed in a protected file that you may not edit: ${files.join(", ")}. Do not work around it and do not use --no-verify. Report the check, the file and the error in the issue, ask the user, and stop.\n\n${protectedFailures.map(describeFailure).join("\n\n")}`,
    );
  }
  return parts.join("\n\n");
};
