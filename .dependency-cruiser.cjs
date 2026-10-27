// Architecture boundaries: factory/design/project-structure.md, "Packages and dependency direction".
// A workspace import that pnpm cannot resolve (the package is not declared as a dependency)
// keeps its bare name, so each rule matches the bare "@memex/..." name as well as the resolved path.

const WORKSPACE = "^(memex|factory|harness)/|^@memex/";
const CONTRACTS = "^memex/packages/contracts/|^@memex/contracts$";
const FAKES = "^memex/packages/fakes/|^@memex/fakes$";
const TEST_FILE = "\\.test\\.ts$";
const PACKAGE_ROOT = "(?:memex/(?:packages|providers|apps)|factory/validation)/[^/]+";

module.exports = {
  forbidden: [
    {
      name: "memex-not-to-factory-or-harness",
      comment: "memex/ is shipped on its own: it cannot depend on factory/ or harness/.",
      severity: "error",
      from: { path: "^memex/" },
      to: { path: "^(factory|harness)/|^@memex/(lab|worlds)$" },
    },
    {
      name: "contracts-depends-on-no-workspace-package",
      comment: "@memex/contracts is the only stable boundary; it depends on no other package.",
      severity: "error",
      from: { path: "^memex/packages/contracts/" },
      to: { path: WORKSPACE, pathNot: CONTRACTS },
    },
    {
      name: "runtime-depends-only-on-contracts",
      comment: "The core depends only on @memex/contracts. Its tests can also use @memex/fakes.",
      severity: "error",
      from: { path: "^memex/packages/runtime/" },
      to: {
        path: WORKSPACE,
        pathNot: `^memex/packages/runtime/|${CONTRACTS}|${FAKES}`,
      },
    },
    {
      name: "fakes-only-in-tests",
      comment: "@memex/fakes is test-only: product code outside it imports it only from *.test.ts.",
      severity: "error",
      from: { path: "^memex/", pathNot: `^memex/packages/fakes/|${TEST_FILE}` },
      to: { path: FAKES },
    },
    {
      name: "providers-depend-only-on-contracts",
      comment: "A Provider depends only on @memex/contracts; Providers cannot import each other.",
      severity: "error",
      from: { path: "^(memex/(?:packages/fakes|providers/[^/]+))/" },
      to: { path: WORKSPACE, pathNot: `^$1/|${CONTRACTS}` },
    },
    {
      name: "worlds-depend-only-on-contracts",
      comment: "Micro Worlds and experiment Providers depend only on @memex/contracts.",
      severity: "error",
      from: { path: "^factory/validation/worlds/" },
      to: { path: WORKSPACE, pathNot: `^factory/validation/worlds/|${CONTRACTS}` },
    },
    {
      name: "lab-gets-providers-through-the-registry",
      comment:
        "The Lab depends on @memex/contracts and @memex/runtime. Concrete Providers come in only through the Composition Root registry.",
      severity: "error",
      from: { path: "^factory/validation/lab/" },
      to: {
        path: WORKSPACE,
        pathNot: `^factory/validation/lab/|^memex/packages/runtime/|^@memex/runtime$|${CONTRACTS}`,
      },
    },
    {
      name: "only-through-the-public-entry-point",
      comment: "Another package is imported only through its src/index.ts.",
      severity: "error",
      from: { path: `^(${PACKAGE_ROOT})/` },
      to: { path: `^${PACKAGE_ROOT}/`, pathNot: `^$1/|^${PACKAGE_ROOT}/src/index\\.ts$` },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "default"],
      extensions: [".ts", ".js"],
    },
  },
};
