import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { checkDeepModules, deepListInBiome, deepListInDependencyCruiser } from "./deep-modules.ts";

const DEEP = "memex/packages/runtime/src/planner";
const ADAPTER_SOURCE =
  'import type { StoragePort } from "@memex/contracts";\nexport const adapter: StoragePort = { read: () => "" };\n';
const NOTHING = { errors: [], warnings: [] };
const state = { root: "" };

beforeEach(() => {
  state.root = mkdtempSync(join(tmpdir(), "deep-modules-"));
});

afterEach(() => {
  rmSync(state.root, { recursive: true, force: true });
});

const write = (path: string, text: string): void => {
  mkdirSync(dirname(join(state.root, path)), { recursive: true });
  writeFileSync(join(state.root, path), text);
};

const biome = (includes: string[]): string =>
  JSON.stringify({
    overrides: [
      {
        includes,
        linter: {
          rules: {
            complexity: {
              noExcessiveCognitiveComplexity: {
                level: "error",
                options: { maxAllowedComplexity: 15 },
              },
            },
          },
        },
      },
    ],
  });

const cruiser = (list: string[]): string =>
  `const DEEP_MODULES = [${list.map((path) => `"${path}"`).join(", ")}];\nmodule.exports = {};\n`;

const valueExports = (count: number): string =>
  Array.from({ length: count }, (_, index) => `export const name${index} = ${index};`).join("\n");

const typeExports = (count: number): string =>
  Array.from({ length: count }, (_, index) => `export type Type${index} = string;`).join("\n");

const setup = (indexSource: string, importFastCheck = true): void => {
  write("biome.json", biome([`${DEEP}/**`]));
  write(".dependency-cruiser.cjs", cruiser([DEEP]));
  write(`${DEEP}/index.ts`, indexSource);
  write(
    `${DEEP}/index.test.ts`,
    importFastCheck ? 'import fc from "fast-check";\n' : 'import { test } from "vitest";\n',
  );
};

describe("deep-module lists", () => {
  test("reads an empty list from both files", () => {
    write("biome.json", biome(["!**"]));
    write(".dependency-cruiser.cjs", cruiser([]));
    expect(deepListInBiome(state.root)).toEqual([]);
    expect(deepListInDependencyCruiser(state.root)).toEqual([]);
    expect(checkDeepModules(state.root)).toEqual(NOTHING);
  });

  test("fails when the two lists differ", () => {
    write("biome.json", biome([`${DEEP}/**`]));
    write(".dependency-cruiser.cjs", cruiser([]));
    expect(checkDeepModules(state.root).errors[0]).toContain("The deep-module lists differ");
  });
});

describe("deep module entry file", () => {
  test("passes with 5 runtime exports and 3 type exports", () => {
    setup(`${valueExports(5)}\n${typeExports(3)}`);
    expect(checkDeepModules(state.root).errors).toEqual([]);
  });

  test("fails with 6 runtime exports and says that the user sets the limit", () => {
    setup(valueExports(6));
    const [message] = checkDeepModules(state.root).errors;
    expect(message).toContain("6 runtime exports, the limit is 5");
    expect(message).toContain("tell the user");
  });

  test("fails without an entry file", () => {
    write("biome.json", biome([`${DEEP}/**`]));
    write(".dependency-cruiser.cjs", cruiser([DEEP]));
    expect(checkDeepModules(state.root).errors[0]).toContain("index.ts");
  });

  test("fails when no test uses fast-check", () => {
    setup(valueExports(1), false);
    expect(checkDeepModules(state.root).errors[0]).toContain("fast-check");
  });
});

describe("ports", () => {
  const withoutDeep = (): void => {
    write("biome.json", biome(["!**"]));
    write(".dependency-cruiser.cjs", cruiser([]));
    write(
      "memex/packages/contracts/src/storage/storage.ts",
      "export type StoragePort = { read: () => string };\n",
    );
  };

  test("warns about a port with one adapter and fails without a Conformance Suite", () => {
    withoutDeep();
    write("memex/packages/fakes/src/memory-storage.ts", ADAPTER_SOURCE);
    const report = checkDeepModules(state.root);
    expect(report.warnings[0]).toContain("hypothetical");
    expect(report.errors[0]).toContain("storage-conformance.ts");
  });

  test("passes a port with a Conformance Suite and two adapters", () => {
    withoutDeep();
    write(
      "memex/packages/contracts/src/storage/storage-conformance.ts",
      "export const runSuite = 1;\n",
    );
    write("memex/packages/fakes/src/a.ts", ADAPTER_SOURCE);
    write("memex/providers/files/src/b.ts", ADAPTER_SOURCE);
    expect(checkDeepModules(state.root)).toEqual(NOTHING);
  });

  test("does not look at a port without an adapter", () => {
    withoutDeep();
    expect(checkDeepModules(state.root)).toEqual(NOTHING);
  });
});
