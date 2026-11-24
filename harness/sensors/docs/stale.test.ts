import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { findStalePages } from "./stale.ts";

const PAGE_PATH = "factory/as-built/demo.md";
let root = "";
let restoreGitEnv = (): void => {};

// A hook such as pre-push sets GIT_DIR. Git commands in a fixture would then act on that repository
// instead of the temporary one, so the tests run without any GIT_* variable.
const isolateGit = (): (() => void) => {
  const saved = Object.entries(process.env).filter(([name]) => name.startsWith("GIT_"));
  for (const [name] of saved) delete process.env[name];
  return () => {
    for (const [name, value] of saved) process.env[name] = value;
  };
};

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
const createFixture = (): void => {
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
};

beforeEach(() => {
  restoreGitEnv = isolateGit();
  createFixture();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  restoreGitEnv();
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

describe("with GIT_DIR set by a hook", () => {
  test("does not change the repository that GIT_DIR points to", () => {
    const other = mkdtempSync(join(tmpdir(), "docs-stale-other-"));
    const otherGit = (...args: string[]): string =>
      execFileSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.com", ...args], {
        cwd: other,
        encoding: "utf8",
      }).trim();
    try {
      otherGit("init", "--quiet");
      otherGit("commit", "--quiet", "--allow-empty", "--message", "chore: other");
      const head = otherGit("rev-parse", "HEAD");

      rmSync(root, { recursive: true, force: true });
      process.env.GIT_DIR = join(other, ".git");
      // The setup that beforeEach runs, now with GIT_DIR set.
      restoreGitEnv = isolateGit();
      createFixture();
      findStalePages(root);

      restoreGitEnv();
      restoreGitEnv = (): void => {};
      delete process.env.GIT_DIR;
      expect(otherGit("rev-parse", "HEAD")).toBe(head);
      expect(otherGit("rev-list", "--count", "HEAD")).toBe("1");
    } finally {
      delete process.env.GIT_DIR;
      rmSync(other, { recursive: true, force: true });
    }
  });
});
