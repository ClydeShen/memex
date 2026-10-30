#!/usr/bin/env node
// Entry point of the as-built document commands. The checks themselves are in the modules next to it.
//
// Usage (from the repository root):
//   node harness/sensors/docs/cli.ts check      pnpm docs:check
//   node harness/sensors/docs/cli.ts stale      pnpm docs:stale
//   node harness/sensors/docs/cli.ts generate   pnpm docs:generate

import { checkPages } from "./check.ts";
import { generate } from "./generate.ts";
import { findStalePages } from "./stale.ts";
import { findAvoidedWords } from "./terms.ts";

const root = process.cwd();

const check = (): number => {
  const problems = checkPages(root);
  const avoided = findAvoidedWords(root);
  if (avoided.length > 0) {
    console.warn("Words the glossary says to avoid (a report only; check each one by hand):");
    for (const line of avoided) console.warn(`  ${line}`);
  }
  if (problems.length === 0) return 0;
  console.error("As-built pages with problems:");
  for (const problem of problems) console.error(`  ${problem}`);
  return 1;
};

const stale = (): number => {
  const pages = findStalePages(root);
  if (pages.length === 0) return 0;
  console.error("As-built pages whose covered files changed after verified-at:");
  for (const { page, changes } of pages) {
    console.error(`  ${page}`);
    for (const change of changes) console.error(`    ${change}`);
  }
  return 1;
};

const generateAll = async (): Promise<number> => {
  for (const file of await generate(root)) console.log(`wrote ${file}`);
  console.log("JSON Schema: skipped, the contracts export no schemas yet (#52).");
  return 0;
};

const command = process.argv[2];
if (command === "check") process.exitCode = check();
else if (command === "stale") process.exitCode = stale();
else if (command === "generate") process.exitCode = await generateAll();
else {
  console.error("usage: cli.ts check | stale | generate");
  process.exitCode = 2;
}
