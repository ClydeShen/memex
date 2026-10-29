import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { findStalePages } from "./stale.ts";

const PAGE_PATH = "factory/as-built/demo.md";
let root = "";

const git = (...args: string[]): string =>
  execFileSync(
    "git",
    [
      "-c",
      "user.name=test",
      "-c",
      "user.email=test@example.com",
      "-c",
      "core.autocrlf=false",
      ...args,
    ],
    {
      cwd: root,
      encoding: "utf8",
    },
  ).trim();

const write = (path: string, content: string): void => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

const commit = (message: string): string => {
  git("add", "--all");
  git("commit", "--quiet", "--message", message);
  return git("rev-parse", "HEAD");
};

// A temporary repository: one commit of code, then a page that was checked at that commit.
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "docs-stale-"));
  git("init", "--quiet");
  write("memex/packages/demo/src/index.ts", "export const a = 1;\n");
  write("memex/packages/other/src/index.ts", "export const b = 1;\n");
  const verifiedAt = commit("feat: demo");
  write(
    PAGE_PATH,
    `---\ncovers:\n  - memex/packages/demo/src/**\nverified-at: ${verifiedAt}\n---\n`,
  );
  commit("docs: demo page");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("findStalePages", () => {
  test("finds nothing when the covered files did not change", () => {
    write("memex/packages/other/src/index.ts", "export const b = 2;\n");
    commit("feat: change another package");
    expect(findStalePages(root)).toEqual([]);
  });

  test("lists the covered files that changed after verified-at", () => {
    write("memex/packages/demo/src/index.ts", "export const a = 2;\n");
    write("memex/packages/demo/src/nested/new.ts", "export const c = 1;\n");
    commit("feat: change demo");
    expect(findStalePages(root)).toEqual([
      {
        page: PAGE_PATH,
        changes: ["memex/packages/demo/src/index.ts", "memex/packages/demo/src/nested/new.ts"],
      },
    ]);
  });
});
