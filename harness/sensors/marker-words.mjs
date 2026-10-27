#!/usr/bin/env node
// Fails when a file under the given directories contains a marker word.
// Marker words tell the history of a decision ("previously", "legacy") or point to
// development records ("ADR 12", "factory/"). Shipped code explains itself in the present
// tense, so these words are a sign that history leaked into it. This is a backstop for review.
//
// Usage:
//   node harness/sensors/marker-words.mjs <directory>...

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const MARKERS = [
  /\blegacy\b/i,
  /\bpreviously\b/i,
  /\bformerly\b/i,
  /\bdeprecated\b/i,
  /\bbaselines?\b/i,
  /\bADR[- ]?\d+/i,
  /(?<![\w.-])(?:factory|harness)\//i,
];
const SKIPPED_DIRECTORIES = new Set(["node_modules", ".vitest", "coverage"]);

function listFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function findViolations(file) {
  const content = readFileSync(file);
  // Binary files cannot carry an explanation.
  if (content.includes(0)) return [];
  const violations = [];
  content
    .toString("utf8")
    .split("\n")
    .forEach((text, index) => {
      const marker = MARKERS.find((pattern) => pattern.test(text));
      if (marker) violations.push(`${relative(process.cwd(), file)}:${index + 1}: ${text.trim()}`);
    });
  return violations;
}

const directories = process.argv.slice(2);
if (directories.length === 0) {
  console.error("usage: marker-words.mjs <directory>...");
  process.exit(2);
}

const violations = directories.flatMap(listFiles).flatMap(findViolations);
if (violations.length > 0) {
  console.error("Marker words found. Shipped code describes the current state only:");
  for (const violation of violations) console.error(`  ${violation}`);
  console.error(
    "Explain the constraint in the present tense, without history or references to development records.",
  );
  process.exit(1);
}
