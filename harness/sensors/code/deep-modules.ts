import { existsSync, globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { kebabCase, runtimeExports } from "./exports.ts";

const MAX_RUNTIME_EXPORTS = 5;
const NO_DEEP_PATH = "!**";
const COMPLEXITY_RULE = "noExcessiveCognitiveComplexity";
const DEEP_COMPLEXITY = 15;
const ADAPTER_SOURCES = [
  "memex/providers/**/*.ts",
  "memex/packages/fakes/src/**/*.ts",
  "factory/validation/worlds/src/**/*.ts",
];
const PORT_EXPORT = /export type (\w+Port)\b/g;

type BiomeOverride = {
  includes?: string[];
  linter?: {
    rules?: { complexity?: Record<string, { options?: { maxAllowedComplexity?: number } }> };
  };
};

export type DeepModuleReport = { readonly errors: string[]; readonly warnings: string[] };

export const deepListInBiome = (root: string): string[] => {
  const config = JSON.parse(readFileSync(join(root, "biome.json"), "utf8")) as {
    overrides?: BiomeOverride[];
  };
  const deep = (config.overrides ?? []).find(
    (override) =>
      override.linter?.rules?.complexity?.[COMPLEXITY_RULE]?.options?.maxAllowedComplexity ===
      DEEP_COMPLEXITY,
  );
  return (deep?.includes ?? [])
    .filter((path) => path !== NO_DEEP_PATH)
    .map((path) => path.replace(/\/\*\*$/, ""))
    .sort();
};

export const deepListInDependencyCruiser = (root: string): string[] => {
  const text = readFileSync(join(root, ".dependency-cruiser.cjs"), "utf8");
  const list = /const DEEP_MODULES = \[([\s\S]*?)\];/.exec(text)?.[1] ?? "";
  return [...list.matchAll(/"([^"]+)"/g)].map((match) => match[1] ?? "").sort();
};

const sourcesOf = (root: string, patterns: string[]): string[] =>
  patterns
    .flatMap((pattern) => globSync(pattern, { cwd: root }))
    .map((file) => file.replaceAll("\\", "/"));

const checkModule = (root: string, directory: string): string[] => {
  const entry = `${directory}/index.ts`;
  if (!existsSync(join(root, entry))) {
    return [
      `${entry}: a deep module has an entry file. Create index.ts that exports the interface.`,
    ];
  }
  const problems: string[] = [];
  const names = runtimeExports(entry, readFileSync(join(root, entry), "utf8"));
  if (names.length > MAX_RUNTIME_EXPORTS) {
    problems.push(
      `${entry}: ${names.length} runtime exports, the limit is ${MAX_RUNTIME_EXPORTS}. The user sets this limit: tell the user, and do not raise it or move exports to get under it.`,
    );
  }
  const tests = sourcesOf(root, [`${directory}/**/*.test.ts`]);
  const usesFastCheck = tests.some((test) =>
    /from "fast-check"/.test(readFileSync(join(root, test), "utf8")),
  );
  if (!usesFastCheck) {
    problems.push(
      `${directory}: no test uses fast-check. Add a property test of the interface to a *.test.ts file in this module.`,
    );
  }
  return problems;
};

const portsIn = (root: string): { name: string; directory: string }[] =>
  sourcesOf(root, ["memex/packages/contracts/src/**/*.ts"])
    .filter((file) => !file.endsWith(".test.ts"))
    .flatMap((file) =>
      [...readFileSync(join(root, file), "utf8").matchAll(PORT_EXPORT)].map((match) => ({
        name: match[1] ?? "",
        directory: file.slice(0, file.lastIndexOf("/")),
      })),
    );

const checkPorts = (root: string): DeepModuleReport => {
  const adapterFiles = sourcesOf(root, ADAPTER_SOURCES).filter(
    (file) => !file.endsWith(".test.ts"),
  );
  const report: DeepModuleReport = { errors: [], warnings: [] };
  for (const port of portsIn(root)) {
    const adapters = adapterFiles.filter((file) =>
      readFileSync(join(root, file), "utf8").split(/\W+/).includes(port.name),
    );
    const suite = `${port.directory}/${kebabCase(port.name.replace(/Port$/, ""))}-conformance.ts`;
    if (adapters.length > 0 && !existsSync(join(root, suite))) {
      report.errors.push(
        `${port.name}: has an adapter (${adapters[0]}) but no Conformance Suite. Write ${suite}, and run it against each adapter.`,
      );
    }
    if (adapters.length === 1) {
      report.warnings.push(
        `${port.name}: has one adapter, so the seam is hypothetical. Add a second adapter (a test fake counts) or remove the port.`,
      );
    }
  }
  return report;
};

export const checkDeepModules = (root: string): DeepModuleReport => {
  const inBiome = deepListInBiome(root);
  const inCruiser = deepListInDependencyCruiser(root);
  const errors: string[] = [];
  if (inBiome.join("\n") !== inCruiser.join("\n")) {
    errors.push(
      `The deep-module lists differ. biome.json: [${inBiome.join(", ")}]. .dependency-cruiser.cjs: [${inCruiser.join(", ")}]. Make both lists the same; the user decides which module is deep.`,
    );
  }
  const ports = checkPorts(root);
  return {
    errors: [
      ...errors,
      ...inBiome.flatMap((directory) => checkModule(root, directory)),
      ...ports.errors,
    ],
    warnings: ports.warnings,
  };
};
