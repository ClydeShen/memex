#!/usr/bin/env node
// Fails when a change adds CJK text to the repository.
// Only added lines and new paths are checked, so existing records stay as they are.
//
// Usage:
//   node harness/sensors/no-cjk.mjs --staged        check the staged changes (pre-commit)
//   node harness/sensors/no-cjk.mjs <base> <head>   check the changes between two commits (CI)

import { execFileSync } from "node:child_process";

// Code point ranges, so this file itself contains no CJK characters.
const range = (from, to) => `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`;
const CJK = new RegExp(
  `[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}${range(0x3000, 0x303f)}${range(0xff00, 0xffef)}]`,
  "u",
);
const ZERO_SHA = /^0+$/;

function git(args) {
  return execFileSync("git", ["-c", "core.quotepath=false", ...args], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
}

function diffArgs(argv) {
  const base = ["diff", "-U0", "--no-color", "--no-ext-diff", "--diff-filter=ACMR"];
  if (argv[0] === "--staged") return [...base, "--cached"];
  if (argv.length === 2) {
    const [from, to] = argv;
    // A new branch has no "before" commit: check only its head commit.
    if (ZERO_SHA.test(from)) return [...base, `${to}^`, to];
    return [...base, `${from}...${to}`];
  }
  console.error("usage: no-cjk.mjs --staged | <base> <head>");
  process.exit(2);
}

function findViolations(diff) {
  const violations = [];
  let file = null;
  let line = 0;
  // Lines still expected in the current hunk, so content that starts with "+++" is not read as a header.
  let oldLeft = 0;
  let newLeft = 0;
  for (const text of diff.split("\n")) {
    if (oldLeft > 0 && text.startsWith("-")) {
      oldLeft--;
    } else if (newLeft > 0 && text.startsWith("+")) {
      if (file && CJK.test(text)) violations.push(`${file}:${line}: ${text.slice(1).trim()}`);
      line++;
      newLeft--;
    } else if (text.startsWith("+++ ")) {
      file = text === "+++ /dev/null" ? null : text.slice(6);
      if (file && CJK.test(file)) violations.push(`${file}: path contains CJK text`);
    } else if (text.startsWith("@@")) {
      const [, , oldCount, newStart, newCount] = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(
        text,
      );
      oldLeft = oldCount === undefined ? 1 : Number(oldCount);
      newLeft = newCount === undefined ? 1 : Number(newCount);
      line = Number(newStart);
    }
  }
  return violations;
}

const violations = findViolations(git(diffArgs(process.argv.slice(2))));
if (violations.length > 0) {
  console.error("Repository content must be in English. CJK text found in added lines:");
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
