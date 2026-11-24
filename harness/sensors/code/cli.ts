#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { globSync, readFileSync } from "node:fs";
import { checkComments } from "./comments.ts";
import { checkCommitSize } from "./commit-size.ts";
import { checkDeepModules } from "./deep-modules.ts";
import { checkMainExport } from "./exports.ts";

const root = process.cwd();
const COMMENT_SCOPE = /^(memex|factory\/validation|harness|\.claude\/hooks)\/.+\.(?:ts|mjs|cjs)$/;
const EXPORT_SCOPE = /^(memex|factory\/validation)\/.+\.ts$/;

const git = (...args: string[]): string =>
  execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: root, encoding: "utf8" });

const workingTreeFiles = (): string[] =>
  globSync("**/*.{ts,mjs,cjs}", { cwd: root, exclude: (name) => name === "node_modules" })
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => !file.includes("node_modules/"));

const stagedFiles = (): string[] =>
  git("diff", "--cached", "--name-only", "--diff-filter=ACM")
    .split("\n")
    .filter((file) => file !== "");

const isMerge = (): boolean => {
  try {
    git("rev-parse", "-q", "--verify", "MERGE_HEAD");
    return true;
  } catch {
    return false;
  }
};

const fileProblems = (files: string[], read: (file: string) => string): string[] =>
  files.flatMap((file) => [
    ...(COMMENT_SCOPE.test(file)
      ? checkComments(file, read(file)).map(({ line, message }) => `${file}:${line}: ${message}`)
      : []),
    ...(EXPORT_SCOPE.test(file)
      ? checkMainExport(file, read(file)).map(({ message }) => message)
      : []),
  ]);

const report = (problems: string[], warnings: string[] = []): number => {
  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }
  for (const problem of problems) {
    console.error(problem);
  }
  return problems.length === 0 ? 0 : 1;
};

const check = (): number => {
  const deep = checkDeepModules(root);
  const files = fileProblems(workingTreeFiles(), (file) => readFileSync(file, "utf8"));
  return report([...files, ...deep.errors], deep.warnings);
};

const staged = (): number => {
  const files = fileProblems(stagedFiles(), (file) => git("show", `:${file}`));
  const size = isMerge() ? [] : checkCommitSize(git("diff", "--cached", "--numstat"));
  return report([...files, ...size]);
};

const command = process.argv[2];
if (command === "check") {
  process.exitCode = check();
} else if (command === "staged") {
  process.exitCode = staged();
} else {
  console.error("usage: cli.ts check | staged");
  process.exitCode = 2;
}
