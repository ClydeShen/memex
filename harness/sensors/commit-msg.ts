#!/usr/bin/env node
// Fails when a commit message does not follow Conventional Commits: `type(scope)!: description`.
// Merge and revert messages that git writes itself are accepted as they are.
//
// Usage:
//   node harness/sensors/commit-msg.ts <commit message file>   (commit-msg hook)

import { readFileSync } from "node:fs";

const TYPES = [
  "build",
  "chore",
  "ci",
  "docs",
  "feat",
  "fix",
  "perf",
  "refactor",
  "revert",
  "style",
  "test",
];
const CONVENTIONAL = new RegExp(`^(?:${TYPES.join("|")})(?:\\([\\w./-]+\\))?!?: \\S`);
const GIT_GENERATED = /^(?:Merge |Revert ")/;

const file = process.argv[2];
if (file === undefined) {
  console.error("usage: commit-msg.ts <commit message file>");
  process.exit(2);
}

// git strips comment lines after this hook runs, so skip them here.
const subject =
  readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trimEnd())
    .find((line) => line !== "" && !line.startsWith("#")) ?? "";

if (!CONVENTIONAL.test(subject) && !GIT_GENERATED.test(subject)) {
  console.error(`Commit message does not follow Conventional Commits: "${subject}"`);
  console.error("  Format:   type(scope)!: description     (scope and ! are optional)");
  console.error(`  Types:    ${TYPES.join(", ")}`);
  console.error("  Examples: docs: fix a typo   feat(runtime)!: replace the event log format");
  process.exit(1);
}
