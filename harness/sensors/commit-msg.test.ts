import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SCRIPT = join(import.meta.dirname, "commit-msg.ts");
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

let dir = "";

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "commit-msg-"));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

const check = (message: string): { status: number | null; stderr: string } => {
  const file = join(dir, "COMMIT_EDITMSG");
  writeFileSync(file, message);
  const result = spawnSync(process.execPath, [SCRIPT, file], { encoding: "utf8" });
  return { status: result.status, stderr: result.stderr };
};

describe("commit-msg check", () => {
  it.each(TYPES)("accepts the type %s", (type) => {
    expect(check(`${type}: do a thing\n`).status).toBe(0);
  });

  it("accepts a scope", () => {
    expect(check("feat(runtime): add a thing\n").status).toBe(0);
    expect(check("docs(factory/design): fix a typo\n").status).toBe(0);
  });

  it("accepts a breaking change mark", () => {
    expect(check("feat!: replace the format\n").status).toBe(0);
    expect(check("feat(runtime)!: replace the format\n").status).toBe(0);
  });

  it("accepts a body after the subject", () => {
    expect(check("fix: handle a case\n\nRefs #1\n").status).toBe(0);
  });

  it("accepts the merge and revert messages that git writes", () => {
    expect(check("Merge branch 'side' into main\n").status).toBe(0);
    expect(check('Revert "docs: fix a typo"\n').status).toBe(0);
  });

  it("skips comment lines and empty lines before the subject", () => {
    expect(check("# Please enter a message\n\ndocs: test\n").status).toBe(0);
    expect(check("# comment\nbad message\n").status).toBe(1);
  });

  it.each([
    ["an unknown type", "feature: add a thing"],
    ["no space after the colon", "docs:test"],
    ["an empty subject", "docs: "],
    ["no type", "bad message"],
    ["an uppercase type", "Docs: fix a typo"],
    ["an empty message", ""],
  ])("rejects %s", (_name, message) => {
    const result = check(`${message}\n`);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("does not follow Conventional Commits");
  });

  it("fails with usage when no file is given", () => {
    const result = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8" });
    expect(result.status).toBe(2);
  });
});
