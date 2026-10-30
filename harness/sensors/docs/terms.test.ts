import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { findAvoidedWords, parseAvoidedWords } from "./terms.ts";

const GLOSSARY = `# Glossary

**Widget**:
A synthetic term.
_Avoid_: gadget, ground truth (only in the sense of a widget), gizmo

**Ground Truth**:
Another synthetic term.
_Avoid_: answer key
`;

let root = "";

const write = (path: string, content: string): void => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "docs-terms-"));
  write("factory/design/GLOSSARY.md", GLOSSARY);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("parseAvoidedWords", () => {
  test("reads the avoided words of each term, without notes and without other terms", () => {
    expect(parseAvoidedWords(GLOSSARY)).toEqual([
      { word: "gadget", term: "Widget" },
      { word: "gizmo", term: "Widget" },
      { word: "answer key", term: "Ground Truth" },
    ]);
  });
});

describe("findAvoidedWords", () => {
  test("reports avoided words in the prose of the pages", () => {
    write("factory/as-built/demo.md", "# Demo\n\nA Gadget and the `gizmo` code name.\n");
    write("factory/as-built/generated/exports.md", "gadget\n");
    write("factory/as-built/TEMPLATE.md", "gadget\n");
    expect(findAvoidedWords(root)).toEqual([
      'factory/as-built/demo.md:3: "gadget" (the glossary says to use "Widget")',
    ]);
  });
});
