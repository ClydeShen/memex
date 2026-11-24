import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const BIOME = join(
  import.meta.dirname,
  "..",
  "..",
  "node_modules",
  "@biomejs",
  "biome",
  "bin",
  "biome",
);

type Rule = {
  file: string;
  message: string;
  violation: string;
  clean: string;
};

const RULES: Rule[] = [
  {
    file: "no-function-declaration.grit",
    message: "Use an arrow function",
    violation: "export function run(): number { return 1; }\n",
    clean: "export const run = (): number => 1;\n",
  },
  {
    file: "no-vague-identifier.grit",
    message: "Use a name from the glossary or the domain",
    violation: "export const data = 1;\n",
    clean: "export const eventCount = 1;\n",
  },
  {
    file: "no-let.grit",
    message: "Use const only",
    violation: "export let counter = 1;\n",
    clean: "export const counter = 1;\n",
  },
  {
    file: "no-boolean-parameter.grit",
    message: "Split it into two named functions",
    violation: "export const open = (urgent: boolean): number => Number(urgent);\n",
    clean: "export const open = (count: number): number => count;\n",
  },
  {
    file: "no-try-catch-outside-trust-boundary.grit",
    message: "Let the error reach the caller",
    violation:
      "export const run = (): void => { try { Math.abs(1); } catch (error) { throw error; } };\n",
    clean: "export const run = (): void => { Math.abs(1); };\n",
  },
  {
    file: "no-repo-mock.grit",
    message: "Replace the dependency at its port with a fake",
    violation: 'vi.mock("./registry.ts", () => ({}));\n',
    clean: 'vi.mock("external-library", () => ({}));\n',
  },
  {
    file: "no-snapshot.grit",
    message: "Assert the expected value with toBe or toEqual",
    violation: "expect(1).toMatchSnapshot();\nexpect(1).toMatchInlineSnapshot();\n",
    clean: "expect(1).toBe(1);\n",
  },
  {
    file: "no-truthiness-assertion.grit",
    message: "Assert the exact value with toBe or toEqual",
    violation: "expect(1).toBeTruthy();\nexpect(1).toBeFalsy();\nexpect(1).toBeDefined();\n",
    clean: "expect(1).toBe(1);\n",
  },
];

let directory = "";

beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), "grit-rules-"));
  for (const { file } of RULES) {
    copyFileSync(join(import.meta.dirname, file), join(directory, file));
  }
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

const lint = (rule: Rule, source: string): { status: number | null; output: string } => {
  writeFileSync(join(directory, "biome.json"), JSON.stringify({ plugins: [`./${rule.file}`] }));
  writeFileSync(join(directory, "sample.ts"), source);
  const result = spawnSync(process.execPath, [BIOME, "lint", "--max-diagnostics=50", "sample.ts"], {
    cwd: directory,
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
};

describe("GritQL rules", () => {
  describe.each(RULES)("$file", (rule) => {
    test("reports a violation with a message that says how to fix it", () => {
      const result = lint(rule, rule.violation);
      expect(result.status).toBe(1);
      expect(result.output).toContain(rule.message);
    });

    test("accepts the clean code", () => {
      const result = lint(rule, rule.clean);
      expect(result.output).not.toContain(rule.message);
    });
  });
});
