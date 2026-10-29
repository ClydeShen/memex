// Reads the as-built pages: which files are pages, and their front matter and body.

import { existsSync, globSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const AS_BUILT = "factory/as-built";
// Not pages: the template, the package list, and the generated files.
const NOT_PAGES = new Set(["TEMPLATE.md", "index.md"]);

export type FrontMatter = Record<string, string | string[]>;

export type Page = {
  path: string;
  frontMatter: FrontMatter;
  // The lines after the front matter, with the line number of each in the file.
  body: { text: string; line: number }[];
};

// The values of a front matter field, as a list.
export const asList = (value: FrontMatter[string] | undefined): string[] => {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
};

export const listPages = (root: string): string[] => {
  const directory = join(root, AS_BUILT);
  if (!existsSync(directory)) return [];
  return globSync("*.md", { cwd: directory })
    .filter((name) => !NOT_PAGES.has(name))
    .sort()
    .map((name) => `${AS_BUILT}/${name}`);
};

const unquote = (value: string): string => value.replace(/^(["'])(.*)\1$/, "$2");

// A small YAML subset: `key: value` and `key:` followed by `  - item` lines.
const parseFrontMatter = (lines: string[]): FrontMatter => {
  const frontMatter: FrontMatter = {};
  let listKey: string | null = null;
  for (const line of lines) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    const field = /^([\w-]+):\s*(.*)$/.exec(line);
    if (item?.[1] !== undefined && listKey !== null) {
      (frontMatter[listKey] as string[]).push(unquote(item[1].trim()));
    } else if (field?.[1] !== undefined && field[2] !== undefined) {
      const value = field[2].trim();
      listKey = value === "" ? field[1] : null;
      frontMatter[field[1]] = value === "" ? [] : unquote(value);
    }
  }
  return frontMatter;
};

export const readPage = (root: string, path: string): Page => {
  const lines = readFileSync(join(root, path), "utf8").replaceAll("\r\n", "\n").split("\n");
  const end = lines[0] === "---" ? lines.indexOf("---", 1) : -1;
  const frontMatter = end > 0 ? parseFrontMatter(lines.slice(1, end)) : {};
  const body = lines.slice(end + 1).map((text, index) => ({ text, line: end + index + 2 }));
  return { path, frontMatter, body };
};

// The files matched by the `covers` globs of a page, relative to the root.
export const coveredFiles = (root: string, covers: string[]): string[] =>
  [...new Set(covers.flatMap((pattern) => globSync(pattern, { cwd: root })))]
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => !file.includes("node_modules/") && statSync(join(root, file)).isFile())
    .sort();
