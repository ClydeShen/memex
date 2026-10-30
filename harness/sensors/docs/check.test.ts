import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { checkPage } from "./check.ts";

// A synthetic repository with one package and one page that describes it.
const FILES: Record<string, string> = {
  "memex/packages/demo/package.json": '{ "name": "@memex/demo" }',
  "memex/packages/demo/src/index.ts": "export const appendEvent = (): number => 1;\n",
  "memex/packages/demo/src/index.test.ts": "// test\n",
};

const PAGE = `---
package: "@memex/demo"
covers:
  - memex/packages/demo/src/**
verified-at: 0000000000000000000000000000000000000000
verified-on: 2026-10-29
verified-by: V0-29
---

# @memex/demo as built

## 1. Responsibility

\`@memex/demo\` appends events with \`appendEvent()\`, through [\`src/index.ts\`](../../memex/packages/demo/src/index.ts).

\`\`\`sh
pnpm docs:check   # code blocks are not checked: \`missing/path.ts\`
\`\`\`

## 5. Key invariants

| Invariant | Test that proves it |
|---|---|
| Appending returns 1 | [\`index.test.ts\`](../../memex/packages/demo/src/index.test.ts) |

## 6. Deviations from the design
`;

const PAGE_PATH = "factory/as-built/demo.md";
let root = "";

const write = (path: string, content: string): void => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

const checkWith = (page: string): string[] => {
  write(PAGE_PATH, page);
  return checkPage(root, PAGE_PATH);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "docs-check-"));
  for (const [path, content] of Object.entries(FILES)) write(path, content);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("checkPage", () => {
  test("accepts a valid page", () => {
    expect(checkWith(PAGE)).toEqual([]);
  });

  test("reports a missing front matter field", () => {
    expect(checkWith(PAGE.replace("verified-by: V0-29\n", ""))).toEqual([
      `${PAGE_PATH}:front matter has no "verified-by"`,
    ]);
  });

  test("reports a link to a missing path", () => {
    const problems = checkWith(PAGE.replace("src/index.ts)", "src/gone.ts)"));
    expect(problems).toEqual([
      `${PAGE_PATH}:14: link to a missing path: ../../memex/packages/demo/src/gone.ts`,
    ]);
  });

  test("reports a path in backticks that does not exist", () => {
    const problems = checkWith(PAGE.replace("[`src/index.ts`]", "[`src/gone.ts`]"));
    expect(problems).toEqual([`${PAGE_PATH}:14: path not found: src/gone.ts`]);
  });

  test("reports a line number reference", () => {
    const problems = checkWith(
      `${PAGE}\nSee \`index.ts:12\` and [the file](https://example.com/a.ts#L12).\n`,
    );
    expect(problems).toEqual([`${PAGE_PATH}:28: line number reference; link to the file instead`]);
  });

  test("reports a symbol that is not in the covered files", () => {
    const problems = checkWith(PAGE.replace("`appendEvent()`", "`replayEvents()`"));
    expect(problems).toEqual([
      `${PAGE_PATH}:14: symbol not found in the covered files: replayEvents()`,
    ]);
  });

  test("reports an invariant without a link to an existing test file", () => {
    const problems = checkWith(
      PAGE.replace("[`index.test.ts`](../../memex/packages/demo/src/index.test.ts)", "none"),
    );
    expect(problems).toEqual([
      `${PAGE_PATH}:24: invariant without a link to an existing test file`,
    ]);
  });

  test("reports a package name that is not in the workspace", () => {
    const problems = checkWith(PAGE.replace("`@memex/demo` appends", "`@memex/other` appends"));
    expect(problems).toEqual([`${PAGE_PATH}:14: unknown package: @memex/other`]);
  });
});
