import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deniedPatterns, protectedFilesIn, reasonFor } from "./stop-reason.ts";

let cwd = "";

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "stop-reason-"));
  mkdirSync(join(cwd, ".claude"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

const writeSettings = (file: string, deny: string[]): void => {
  writeFileSync(join(cwd, ".claude", file), JSON.stringify({ permissions: { deny } }));
};

describe("deniedPatterns", () => {
  it("returns the project-relative paths of the Edit rules", () => {
    writeSettings("settings.json", ["Edit(/.githooks/**)", "Edit(/biome.json)"]);
    expect(deniedPatterns(cwd)).toEqual([".githooks/**", "biome.json"]);
  });

  it("reads the local settings too", () => {
    writeSettings("settings.json", ["Edit(/biome.json)"]);
    writeSettings("settings.local.json", ["Edit(/knip.json)"]);
    expect(deniedPatterns(cwd)).toEqual(["biome.json", "knip.json"]);
  });

  it("ignores rules that are not project Edit rules", () => {
    writeSettings("settings.json", ["Edit(//etc/hosts)", "Edit(~/notes)", "Read(/secret)", "Bash"]);
    expect(deniedPatterns(cwd)).toEqual([]);
  });

  it("returns nothing when there are no settings files", () => {
    rmSync(join(cwd, ".claude"), { recursive: true });
    expect(deniedPatterns(cwd)).toEqual([]);
  });
});

describe("protectedFilesIn", () => {
  const denied = [".claude/**", "biome.json"];

  it("finds a denied file named in the output", () => {
    const output = "error in .claude/hooks/stop.ts:3:1 lint/style";
    expect(protectedFilesIn(output, denied)).toEqual([".claude/hooks/stop.ts"]);
  });

  it("finds a path written with backslashes", () => {
    expect(protectedFilesIn("failed: .claude\\hooks\\stop.ts", denied)).toEqual([
      ".claude/hooks/stop.ts",
    ]);
  });

  it("does not find a file that is not denied", () => {
    expect(protectedFilesIn("error in memex/packages/runtime/src/a.ts", denied)).toEqual([]);
  });

  it("lists a file once", () => {
    const output = ".claude/hooks/a.ts and again .claude/hooks/a.ts";
    expect(protectedFilesIn(output, denied)).toEqual([".claude/hooks/a.ts"]);
  });
});

describe("reasonFor", () => {
  it("tells the agent to fix a failure in a file it may edit", () => {
    const reason = reasonFor([{ name: "lint", output: "bad", protectedFiles: [] }]);
    expect(reason).toContain("Fix them before you finish.");
    expect(reason).toContain("lint failed:\nbad");
    expect(reason).not.toContain("protected file");
  });

  it("tells the agent to report, ask the user and stop on a protected file", () => {
    const reason = reasonFor([
      { name: "typecheck", output: "boom", protectedFiles: [".claude/hooks/stop.ts"] },
    ]);
    expect(reason).toContain("protected file that you may not edit: .claude/hooks/stop.ts");
    expect(reason).toContain("Report the check, the file and the error in the issue, ask the user");
    expect(reason).toContain("and stop.");
    expect(reason).not.toContain("Fix them before you finish.");
  });

  it("gives both reasons when both kinds of failure happen", () => {
    const reason = reasonFor([
      { name: "lint", output: "a", protectedFiles: [] },
      { name: "typecheck", output: "b", protectedFiles: ["biome.json"] },
    ]);
    expect(reason).toContain("Fix them before you finish.");
    expect(reason).toContain("and stop.");
  });
});
