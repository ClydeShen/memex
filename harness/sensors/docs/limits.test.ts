import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { checkLimits } from "./limits.ts";

let root = "";

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "docs-limits-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const write = (path: string, lines: number): void => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), `${Array.from({ length: lines }, () => "line").join("\n")}\n`);
};

describe("checkLimits", () => {
  test("accepts documents within their limits", () => {
    write("AGENTS.md", 60);
    write("factory/design/HANDOFF.md", 100);
    write("factory/design/GLOSSARY.md", 300);
    write("factory/as-built/runtime.md", 300);
    write("harness/rules/commit-messages.md", 300);
    write("harness/agents/README.md", 300);
    write("harness/README.md", 300);
    expect(checkLimits(root)).toEqual([]);
  });

  test("fails a design document with 301 lines", () => {
    write("factory/design/GLOSSARY.md", 301);
    expect(checkLimits(root)).toEqual(["factory/design/GLOSSARY.md: 301 lines, the limit is 300"]);
  });

  test.each([
    ["factory/as-built/runtime.md"],
    ["harness/rules/code-review.md"],
    ["harness/agents/README.md"],
    ["factory/design/architecture/c4.md"],
  ])("fails %s with 301 lines", (file) => {
    write(file, 301);
    expect(checkLimits(root)).toEqual([`${file}: 301 lines, the limit is 300`]);
  });

  test("keeps AGENTS.md to 60 lines and the handoff to 100 lines", () => {
    write("AGENTS.md", 61);
    write("factory/design/HANDOFF.md", 101);
    expect(checkLimits(root)).toEqual([
      "AGENTS.md: 61 lines, the limit is 60",
      "factory/design/HANDOFF.md: 101 lines, the limit is 100",
    ]);
  });

  test("does not limit the records", () => {
    write("factory/records/research/long.md", 1000);
    expect(checkLimits(root)).toEqual([]);
  });

  test("fails a Markdown file in a directory that the check does not list", () => {
    write("factory/notes/idea.md", 5);
    write("harness/workflow/steps.md", 5);
    const problems = checkLimits(root);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain(
      "factory/notes/idea.md: not in a directory that the docs check lists",
    );
    expect(problems[1]).toContain("harness/workflow/steps.md: not in a directory");
  });

  test("ignores files that are not Markdown and other top-level documents", () => {
    write("factory/notes/data.json", 1000);
    write("README.md", 1000);
    expect(checkLimits(root)).toEqual([]);
  });
});
