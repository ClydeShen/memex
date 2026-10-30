// The structural checks of an as-built page (`pnpm docs:check`). Each problem is one line of text
// that names the page, the line and the reason.

import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { asList, coveredFiles, listPages, type Page, readPage } from "./pages.ts";

const REQUIRED_FIELDS = ["package", "covers", "verified-at", "verified-on", "verified-by"];
const PATH_EXTENSION = /\.(?:ts|mts|js|mjs|cjs|json|jsonc|md|yaml|yml)$/;
const SYMBOL = /^[A-Za-z_$][\w$]*(?:\(\))?$/;
const PACKAGE_NAME = /^@[\w-]+\/[\w.-]+$/;
const LINE_REFERENCE = /[\w-]\.\w+:\d+|#L\d+/;
const INVARIANTS_HEADING = /^##\s+(?:\d+\.\s*)?Key invariants\b/i;
const EXTERNAL_LINK = /^(?:[a-z]+:|#)/i;

type Context = { root: string; page: Page; covered: string[]; packages: Set<string> };

const workspacePackages = (root: string): Set<string> =>
  new Set(
    globSync("**/package.json", { cwd: root, exclude: (name) => name === "node_modules" })
      .map((file) => JSON.parse(readFileSync(join(root, file), "utf8")) as { name?: string })
      .flatMap((manifest) => (manifest.name === undefined ? [] : [manifest.name])),
  );

const checkFrontMatter = (page: Page): string[] =>
  REQUIRED_FIELDS.filter((field) =>
    asList(page.frontMatter[field]).every((value) => value === ""),
  ).map((field) => `front matter has no "${field}"`);

const fromPage = (context: Context, target: string): string =>
  normalize(join(context.root, dirname(context.page.path), target));

const checkLink = (context: Context, target: string): string | null => {
  if (EXTERNAL_LINK.test(target)) return null;
  const path = decodeURI(target.replace(/#.*$/, ""));
  return existsSync(fromPage(context, path)) ? null : `link to a missing path: ${target}`;
};

const pathExists = (context: Context, path: string): boolean => {
  const trimmed = path.replace(/\/$/, "");
  return (
    existsSync(join(context.root, trimmed)) ||
    existsSync(fromPage(context, trimmed)) ||
    context.covered.some((file) => file.endsWith(`/${trimmed}`) || file.includes(`/${trimmed}/`))
  );
};

const symbolExists = (context: Context, symbol: string): boolean => {
  const name = new RegExp(
    `(?<![\\w$])${symbol.replace(/\(\)$/, "").replaceAll("$", "\\$")}(?![\\w$])`,
  );
  return context.covered.some((file) => name.test(readFileSync(join(context.root, file), "utf8")));
};

// Code in backticks: a path, a package name or a symbol. Commands, globs and placeholders are skipped.
const checkCode = (context: Context, code: string): string | null => {
  if (/[\s*<>]/.test(code) || code in context.page.frontMatter) return null;
  if (PACKAGE_NAME.test(code)) {
    return context.packages.has(code) ? null : `unknown package: ${code}`;
  }
  if (code.includes("/") || PATH_EXTENSION.test(code)) {
    return pathExists(context, code) ? null : `path not found: ${code}`;
  }
  if (SYMBOL.test(code)) {
    return symbolExists(context, code) ? null : `symbol not found in the covered files: ${code}`;
  }
  return null;
};

const checkLine = (context: Context, text: string): string[] => {
  const problems: string[] = [];
  if (LINE_REFERENCE.test(text)) problems.push("line number reference; link to the file instead");
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const problem = target === undefined ? null : checkLink(context, target);
    if (problem !== null) problems.push(problem);
  }
  for (const [, code] of text.matchAll(/`([^`]+)`/g)) {
    const problem = code === undefined ? null : checkCode(context, code);
    if (problem !== null) problems.push(problem);
  }
  return problems;
};

const isTableRow = (text: string): boolean => text.startsWith("|") && !/^\|[\s|:-]+\|$/.test(text);

// Every row of the "Key invariants" table links to a test file that exists.
const checkInvariants = (context: Context): string[] => {
  const start = context.page.body.findIndex(({ text }) => INVARIANTS_HEADING.test(text));
  if (start < 0) return ['no "Key invariants" section'];
  const next = context.page.body.findIndex(
    ({ text }, index) => index > start && text.startsWith("## "),
  );
  const rows = context.page.body
    .slice(start + 1, next < 0 ? undefined : next)
    .filter(({ text }) => isTableRow(text));
  // The first row is the header.
  return rows.slice(1).flatMap(({ text, line }) => {
    const tests = [...text.matchAll(/\]\(([^)\s]+\.test\.ts)\)/g)].map(
      ([, target]) => target ?? "",
    );
    const proven = tests.some((target) => existsSync(fromPage(context, target)));
    return proven ? [] : [`${line}: invariant without a link to an existing test file`];
  });
};

const checkBody = (context: Context): string[] => {
  const problems: string[] = [];
  let inFence = false;
  for (const { text, line } of context.page.body) {
    if (text.trimStart().startsWith("```")) inFence = !inFence;
    else if (!inFence)
      problems.push(...checkLine(context, text).map((problem) => `${line}: ${problem}`));
  }
  return problems;
};

export const checkPage = (
  root: string,
  path: string,
  packages = workspacePackages(root),
): string[] => {
  const page = readPage(root, path);
  const context = {
    root,
    page,
    covered: coveredFiles(root, asList(page.frontMatter.covers)),
    packages,
  };
  return [...checkFrontMatter(page), ...checkBody(context), ...checkInvariants(context)].map(
    (problem) => `${path}:${problem}`,
  );
};

export const checkPages = (root: string): string[] => {
  const packages = workspacePackages(root);
  return listPages(root).flatMap((path) => checkPage(root, path, packages));
};
