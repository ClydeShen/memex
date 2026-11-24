#!/usr/bin/env node

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
