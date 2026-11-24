import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SCRIPT = join(import.meta.dirname, "post-edit.ts");
const ROOT_NODE_MODULES = join(import.meta.dirname, "..", "..", "..", "node_modules");
const BLOCK = 2;

let project = "";
let outside = "";

beforeAll(() => {
  project = mkdtempSync(join(tmpdir(), "post-edit-"));
  outside = mkdtempSync(join(tmpdir(), "post-edit-outside-"));
  // The hook runs Biome from the project's node_modules.
  symlinkSync(ROOT_NODE_MODULES, join(project, "node_modules"), "junction");
  writeFileSync(
    join(project, "biome.json"),
    JSON.stringify({ linter: { rules: { suspicious: { noDebugger: "error" } } } }),
  );
  writeFileSync(join(project, "clean.ts"), "export const a = 1;\n");
  writeFileSync(join(project, "bad.ts"), "debugger;\n");
  writeFileSync(join(outside, "bad.ts"), "debugger;\n");
});

afterAll(() => {
  rmSync(project, { recursive: true, force: true });
  rmSync(outside, { recursive: true, force: true });
});

const run = (file: string | undefined): { status: number | null; stderr: string } => {
  const input = { cwd: project, tool_input: file === undefined ? {} : { file_path: file } };
  const result = spawnSync(process.execPath, [SCRIPT], {
    input: JSON.stringify(input),
    encoding: "utf8",
  });
  return { status: result.status, stderr: result.stderr };
};

describe("post-edit hook", () => {
  it("blocks and reports the rule when Biome fails", () => {
    const result = run(join(project, "bad.ts"));
    expect(result.status).toBe(BLOCK);
    expect(result.stderr).toContain("biome check failed for");
    expect(result.stderr).toContain("noDebugger");
  });

  it("accepts a file with a Windows-style path", () => {
    expect(run(join(project, "clean.ts").replaceAll("/", "\\")).status).toBe(0);
  });

  it("passes a clean file", () => {
    expect(run(join(project, "clean.ts")).status).toBe(0);
  });

  it("skips a file that is not TypeScript", () => {
    expect(run(join(project, "notes.md")).status).toBe(0);
  });

  it("skips a file outside the project", () => {
    expect(run(join(outside, "bad.ts")).status).toBe(0);
  });

  it("passes when the input has no file", () => {
    expect(run(undefined).status).toBe(0);
  });
});
