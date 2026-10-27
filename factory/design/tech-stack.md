# Tech stack recommendations

This file lists the engineering tech stack of Memex: the role of each item, its dependency category, and the milestone that introduces it. For the definitions of the dependency categories, see [dependencies.md](./dependencies.md). For the milestones, see [roadmap.md](./roadmap.md). For the code style that these tools check, see [code-style.md](./code-style.md).

- **Status**: recommended (confirmed by the user 2026-10-11; the Git hooks and TUI parts were added the same day; the division of work between hooks was confirmed by the user 2026-10-12; the CJK check was added by the user's decision 2026-10-27). Version numbers are the result of `npm view <package> version` on that day. Take the latest version at the time each item is introduced.
- **Everything can be replaced**: these are engineering choices, not architecture decisions (roadmap section 4: "the test framework and lint tools follow the mainstream choice at the time"). Replacing a tool only needs a change to this file, not an ADR.
- **Except hard dependencies**: hard dependencies already set in ADRs (Node.js / TypeScript, Zod, JSONL + CloudEvents and others) stay. Replacing them needs an ADR first.

## Selection principles

1. **If a built-in Node feature is enough, do not install a package.** Node 26 runs `.ts` directly and has UUIDv7, `fetch`, `util.parseArgs` and `child_process` built in. None of these need third-party packages.
2. **Introduce an item only at the milestone that needs it** (P5). A default value is not a commitment.
3. **Record the category of each dependency** (A3). The "Category" column of this file is the record.
4. **The runtime core uses no native extensions** (E1), only pure TypeScript and WASM.

## Two facts that affect the selection (verified 2026-10-11)

- **TypeScript 7.0 is released, but it has no programmatic API yet.** The API comes in 7.1, which is still a development version. The latest typescript-eslint, 8.71.1, requires TypeScript below 6.1, so "TS 7 + ESLint" cannot be installed together now. This stack therefore uses Biome for lint. Biome does not depend on the TypeScript API.
- **Node 26 strips types and runs `.ts` files directly by default** (`process.features.typescript === "strip"`), so the experiment stage needs no build step. The cost is that only erasable type syntax can be used: turn on `erasableSyntaxOnly`, do not use `enum`, parameter properties or `namespace` with runtime code, and use `as const` objects instead of `enum`.

---

## 1. Language and runtime

| Tool | Version | Category | Role | When |
|---|---|---|---|---|
| Node.js | 26.x (`.nvmrc`) | Hard dependency | Runtime; runs `.ts` directly with no build. By the official release schedule, Node 26 enters Active LTS on 2026-10-28 and is Current before that. It is also the last version of the old odd/even release model; from Node 27 there is one major version per year | Ready |
| TypeScript | 7.0.x | Hard dependency | Type checking only (`tsc --noEmit`); it does not emit code. Turn on `strict` and `erasableSyntaxOnly`. dependency-cruiser gets its own TypeScript 6 (see "Verified in V0-02") | V0.1 |
| pnpm | 12.x (fixed by the `packageManager` field) | Development tool | Package management and monorepo (pnpm workspaces). It was chosen over npm for security (user decision, 2026-10-11): it blocks dependency install scripts by default and allows only the packages listed in `allowBuilds`; `minimumReleaseAge` delays installing newly published versions by default; `trustPolicy` can reject versions whose trust level went down; the strict `node_modules` layout stops code from using undeclared dependencies. It also installs faster and uses less disk space. The setting names were confirmed for pnpm 12 (see "Verified in V0-02") | V0.1 |

## 2. Code quality

| Tool | Version | Category | Role | When |
|---|---|---|---|---|
| Biome | 2.6.x | Development tool | Lint and formatting in one tool, with type-aware rules, independent of the TypeScript API | V0.1 |
| dependency-cruiser | 18.7.x | Development tool | Turns the architecture constraints into automated checks: the core depends only on `@memex/contracts`; Providers cannot import each other; only the Composition Root can refer to concrete implementations (A2, ADR 0008). The check fails on a violation. It parses `.ts` only with TypeScript below 7, so it gets TypeScript 6 through `packageExtensions` | V0.1 |
| knip | 6.43.x | Development tool | Finds unused files, exports and dependencies, with native monorepo support. It parses with oxc and does not need the TypeScript API | V0.1 |
| markdownlint-cli2 | 0.23.x | Development tool | Checks the Markdown format of `factory/as-built/` (ADR 0026) | V0-28 |
| CodeQL | Provided by GitHub | Development tool | Security scanning, free for public repositories, supports JS and TS. Tracks how untrusted data flows through the code, for example model output flowing into `eval`, path traversal in configuration, `child_process` command injection, prototype pollution in overlay merges (security-and-data.md X3, X5, C2). Use the GitHub default setup: turn it on in the repository Settings → Code security, with no workflow file. It scans on pushes to `main` and once a week, and only reports problems without blocking merges, so it adds none of the process load that ADR 0012 wants to avoid. The user turns on the repository setting | When V0 first merges into `main` (confirmed by the user, 2026-10-13) |
| Dependabot, `pnpm audit` | Provided by GitHub and pnpm | Development tool | Warns about known vulnerabilities in dependencies | From V0.1 (no CI needed, consistent with security-and-data.md S4) |
| CJK check (`harness/sensors/no-cjk.mjs`) | Own script, Node built-ins only | Development tool | Fails when added lines or new paths contain CJK text, so that all repository content is in English. Lines that already exist are not checked. Runs in the pre-commit hook and in CI (`.github/workflows/no-cjk.yml`, on pushes to `main` and on pull requests) | In effect (user decision, 2026-10-27) |

Alternatives:
- ESLint 10 with typescript-eslint 8: more complete rules, but TypeScript must go down to 6.0. Evaluate again after TS 7.1 is released and typescript-eslint supports TS 7.
- oxlint 1.x with oxfmt: the fastest, but oxfmt is still at 0.x.
- SonarQube Cloud: free for public repositories, but it is a cloud service and overlaps with the tools above. Not introduced for now.

### Git hooks

Purpose: run quick checks on the local machine before a commit, to stop obvious problems before they are committed. A hook can be skipped with `git commit --no-verify`, so it is only a local convenience, not a gate: the full check is `pnpm check`, and CI is the backstop after the decision gate (ADR 0012, 0020). The CJK check is the exception: it already runs in CI (user decision, 2026-10-27).

| Approach | Version | Category | Role | When |
|---|---|---|---|---|
| git's built-in `core.hooksPath` (main choice) | Built into git | — | The hook scripts are committed in the `.githooks/` directory of the repository. Until V0.1, run `git config core.hooksPath .githooks` once by hand. From V0.1, the `prepare` script of the root `package.json` runs it, so it takes effect on `pnpm install`. No package is installed (selection principle 1, security-and-data.md S3). pnpm `allowBuilds` only controls the install scripts of dependencies; the root project's own `prepare` runs as usual | In effect |
| Biome `--staged` | Built into Biome | — | The pre-commit hook runs `biome check --staged`, which checks only the staged files, with no need for lint-staged | V0.1 |

The three hooks divide the work like this (confirmed by the user, 2026-10-12; the CJK check added 2026-10-27):

| Hook | What it does | Reason |
|---|---|---|
| pre-commit | The CJK check on the staged changes (now), and `biome check --staged` (from V0.1) | Must stay light: agents commit often during local development, and the hook must not slow them down |
| commit-msg | Enforces the Conventional Commits format (`type(scope): description`) with a very short `.ts` script, run directly by Node 26 | Commit messages are an important source for tracing history; World 0 also uses the git history as a data source (ADR 0011) |
| pre-push | Runs the full `pnpm check` (type check, lint, architecture check, tests) | Code that is pushed must pass the checks |

Alternatives:
- lefthook 2.2.x: a single program written in Go, configured with one YAML file, can run several checks in parallel. The npm package ships prebuilt binaries per platform. Its own postinstall is blocked by pnpm by default, so `lefthook install` must run in `prepare` (the console of iii in specimens uses it this way). Switch when the hooks have more checks and need to run them in parallel.
- husky 9.1.x: zero dependencies; the hooks are shell scripts under `.husky/`. It does basically the same as `core.hooksPath`, with one more package.

## 3. Testing

The three V0 pass criteria (reproducible, no leaks, replaceable) are all written as tests with these tools.

| Tool | Version | Category | Role | When |
|---|---|---|---|---|
| Vitest | 5.0.x | Development tool | Unit and integration tests | V0.1 |
| @vitest/coverage-v8 | 5.0.x | Development tool | Test coverage | V0.1 |
| fast-check | 4.10.x | Development tool | Property-based testing: generates many random inputs automatically and verifies invariants, for example "the Projection is exactly the same after the log is replayed" and "the same seed gives the same result". More convincing than a few hand-written cases | V0.3 |

## 4. Contracts and data (runtime dependencies)

| Tool | Version | Category | Role | When |
|---|---|---|---|---|
| Zod | 4.6.x | Hard dependency (used only inside the contracts package) | Defines schemas and exports JSON Schema with `z.toJSONSchema()` (ADR 0009) | V0.2 |
| yaml | 2.9.x | Replaceable implementation detail | Reads multi-document resource YAML (KRM format) | V0.2 |
| canonicalize | 5.1.x | Replaceable implementation detail | RFC 8785 canonical JSON. Canonicalize first and then hash, so that the Trace hash is stable. The "reproducible" criterion depends on it | V0.3 |
| `node:crypto` | Built into Node | — | sha256 hashes; `randomUUIDv7()` for time-ordered event ids, with no need for the `uuid` package | V0.3 |
| `node:child_process` | Built into Node | — | One child process for each Experiment, communicating with JSONL (ADR 0004), with no need for `execa` | V0.5 |
| `parseArgs` from `node:util` | Built into Node | — | Parses the command-line arguments of `pnpm lab run`; enough for the validation tools | V0.5 |

The official CloudEvents SDK is not used: we only need its JSON structured format, which Zod can define, and the SDK has not been updated for more than a year (the latest version, 10.0.0, was released in 2025-06).

Note: event ids and timestamps differ on every run, so remove or replace these fields before comparing Trace hashes (the "normalized" in the V0 pass criteria).

## 5. Utility functions

| Tool | Version | Category | Role | When |
|---|---|---|---|---|
| es-toolkit | 1.52.x | Replaceable implementation detail | A modern replacement for lodash, small and fully typed | **Only when needed**. Node 26 already has `structuredClone`, `Object.groupBy`, Set operations, `Array.prototype.toSorted` and others built in, so V0 probably does not need it. When needed, choose it, not lodash |

## 6. Later milestones

| Tool | Version | Category | Role | When |
|---|---|---|---|---|
| Built-in `fetch` | Built into Node | — | Calls the OpenAI-compatible Model Backend. It must send non-standard parameters such as `logprobs`, `top_logprobs` and `chat_template_kwargs`, and sending requests directly is the simplest way. The AI SDK or the openai SDK is only an optional implementation inside a Provider (ADR 0008) | V1 |
| commander | 15.x | Replaceable implementation detail | Command-line parsing for the product commands (`memex ...`); the product commands are designed after the decision gate | P1 |
| pino | 10.x | Replaceable implementation detail | High-performance logging. ADR 0015 requires the field names of the OpenTelemetry log data model, and the default field names of pino differ and need conversion. So V0 starts with a very thin function that writes these fields directly, and switches to pino if performance is not enough | After V1, if needed |
| Docker Compose | — | Optional dependency | One-step start (a candidate product command) | P4 |
| oxigraph | 0.5.x | Default implementation of a configurable dependency (Knowledge store) | WASM graph store that runs in process (ADR 0010) | V2 |
| jsonld | 9.x | Replaceable implementation detail | Exports data as RDF (ADR 0007) | V2 or P1 |
| OpenTelemetry SDK | — | Optional dependency | Optional OTLP export (ADR 0015) | Product stage |
| tsdown | 0.23.x | Development tool | Packages and publishes the npm command-line tool. The experiment stage runs `.ts` directly and does not need it | P4 |
| changesets | 3.x | Development tool | Version numbers and changelogs | P4 |

### Terminal user interface (TUI)

The product commands (`memex ...`) are designed after the decision gate (ADR 0020), so a TUI is needed only from P1. In the validation stage, `pnpm lab` outputs only text and JSON reports and needs no TUI.

| Tool | Version | Category | Role | When |
|---|---|---|---|---|
| `styleText` from `node:util`, `node:readline` | Built into Node | — | Terminal colors and simple line input, with no need for chalk | When needed |
| Ink | 8.0.x | Replaceable implementation detail | Writes terminal interfaces as React components, for example conversation, goal progress and approval. Pure JavaScript; its layout engine yoga-layout is WASM, so it does not break E1. Claude Code, GitHub Copilot CLI and the new Hermes TUI (specimens/hermes-agent/ui-tui) all use it. It has the largest ecosystem, and ink-testing-library can test the interface | P1 |
| @clack/prompts | 1.8.x | Replaceable implementation detail | Wizard-style prompts, for first-time setup flows such as `memex init`. The OpenClaw wizard also uses Clack | P1 |

Alternatives:
- pi-tui (`@earendil-works/pi-tui` 1.1.x): imperative components, differential rendering with synchronized output (CSI 2026), designed for agent interfaces with streaming output, only 2 dependencies. `openclaw tui` of OpenClaw is built on it. It is fairly young: the package was renamed in 2026 from `@mariozechner/pi-tui`, and the old package stopped at 0.73.1. If Ink stutters on long streaming output (Ink has a frame rate cap), switch to it.
- OpenTUI (0.6.x) is not chosen: its rendering core is Zig and ships prebuilt native libraries per platform, against E1 and the "same behavior on every platform" of ADR 0013; and it is still at 0.x.

## Explicitly not introduced

| Tool | Reason |
|---|---|
| turbo, nx | pnpm workspaces with `pnpm -r` is enough; no extra task orchestration is needed |
| npm, yarn (as package managers) | pnpm is chosen, see section 1 |
| lodash | es-toolkit is chosen |
| uuid | Node 26 has `crypto.randomUUIDv7()` built in |
| execa | `node:child_process` is enough |
| Prettier | Biome includes formatting |
| lint-staged | Biome has `--staged` built in |
| commitlint | Too heavy, with a parser and configuration packages, just to check the format of one line of commit message; write a very short script when needed |
| simple-git-hooks | Installs hooks through its own postinstall, which pnpm blocks by default; `core.hooksPath` needs no install script |
| chalk | Node 26 has `util.styleText` built in |
| TypeDoc, madge | Their declared TypeScript dependency does not include TS 7 (`npm view`, 2026-10-13), see ADR 0026 |
| api-extractor | Needs `.d.ts`, which does not fit a stack with no build (ADR 0026) |
| CloudEvents SDK | See section 4 |
| tsup | tsdown is its successor, and the experiment stage needs no bundling |

## Verified in V0-02 (2026-10-27)

Tested in a throwaway pnpm workspace outside the repository, with Node 26.12.1, pnpm 12.15.0, TypeScript 7.0.2, Biome 2.6.3, dependency-cruiser 18.7.0, knip 6.43.0 and Vitest 5.0.5. The workspace had three packages under `memex/packages/`, `.ts` imports with explicit extensions, `import type`, and a workspace dependency (`workspace:*`). The results are in #42.

1. **dependency-cruiser and knip with TypeScript 7.**
   - `tsc -p .` with TypeScript 7.0.2 passes with `strict`, `erasableSyntaxOnly`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `allowImportingTsExtensions`.
   - **dependency-cruiser does not work with TypeScript 7 alone.** `depcruise --info` lists its TypeScript transpiler as `typescript >=2.0.0 <7.0.0`, so with only TypeScript 7 installed it does not read `.ts` files. TypeScript 7 has no programmatic API in its main entry point (it exports only `./lib/version.cjs`).
   - **The fallback works, in a different form than planned.** A second TypeScript in the root development dependencies cannot help, because the package name `typescript` is already TypeScript 7. Instead, `pnpm-workspace.yaml` gives dependency-cruiser its own copy:
     ```yaml
     packageExtensions:
       dependency-cruiser:
         dependencies:
           typescript: 6.0.3
     ```
     After this, `depcruise --info` reports `typescript@6.0.3` and `.ts` as supported, `tsc -v` still reports 7.0.2, and a rule "runtime may import only contracts" fails with exit code 1 on a deliberate `runtime → fakes` import. Type-only imports are reported as `type-only` (with `tsPreCompilationDeps: true`), and `@memex/contracts` resolves to its source file through the `exports` field. Remove the extension when dependency-cruiser supports TypeScript 7.
   - **knip works with TypeScript 7 as it is.** knip 6.43 parses with `oxc-parser` and has no dependency on `typescript`. It reported an unused file, an unused export and an unused exported type in a non-entry file, and recognized `tsc`, `biome`, `depcruise` and `vitest` used in `scripts`. Exports of package entry files (the `exports` field) count as public and are not reported.
2. **What changed in Vitest 5.** From the [5.0.0 release notes](https://github.com/vitest-dev/vitest/releases/tag/v5.0.0). The changes that affect this project:
   - It requires Node.js 22 and Vite 6.4. Node 26 is fine.
   - **An asynchronous assertion that is not awaited fails the test.** Verified: `expect(promise).resolves.toBe(1)` without `await` fails with "Promise returned by ... was not awaited". This supports code-style section 5, rule 4.
   - Mocks are cleared before each test by default.
   - The config file is no longer looked up in ancestor directories; inline `projects` extend the root config by default and share one Vite server. So keep one `vitest.config.ts` in the root with `test.projects`.
   - Report output (`json`, `junit`, `html`, `blob`, attachments) goes to `.vitest/` by default. Add `.vitest/` to `.gitignore`.
   - `vitest.config.ts` must have a default export. Verified: with only a named export, `vitest run` fails. Turn `noDefaultExport` off for tool configuration files (code-style section 7).
   - A test file imports a workspace package and a sibling `.ts` file with its extension, and `vitest run` passes.
3. **Biome type-aware rules compared with typescript-eslint.** typescript-eslint 8.72.1 has 63 rules that need type information (`requiresTypeChecking: true` in its rule metadata). `biome migrate eslint --include-nursery` maps **19** of them directly to Biome rules, and **12 more** with `--include-inspired`: 31 of 63 in total. Most of the type-aware ones are in the Biome `nursery` group, for example `noFloatingPromises`, `noMisusedPromises`, `useExhaustiveSwitchCases`, `useStrictBooleanExpressions` and `noUnsafeReturn`. The 32 rules with no Biome rule yet include, from the typescript-eslint `recommended-type-checked` set: `await-thenable`, `no-unsafe-argument`, `no-unsafe-assignment`, `no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-enum-comparison`, `no-unnecessary-type-assertion`, `no-duplicate-type-constituents`, `no-redundant-type-constituents`, `no-array-delete`, `restrict-template-expressions` and `unbound-method`. **Conclusion: Biome stays.** The biggest gap is the `no-unsafe-*` family, which tracks values of type `any`. Here `any` is already forbidden (`noExplicitAny`, `strict`), and external data enters as `unknown` and is parsed with Zod, so the gap matters less. Evaluate again when typescript-eslint supports TypeScript 7 (see the alternatives in section 2).
4. **The pnpm 12 security settings.** Checked against the pnpm 12 documentation ([settings](https://github.com/pnpm/pnpm.io/blob/main/docs/settings.md), [build settings](https://github.com/pnpm/pnpm.io/blob/main/docs/settings/build.md), [dependency resolution](https://github.com/pnpm/pnpm.io/blob/main/docs/settings/dependency-resolution.md)) and the `CHANGELOG.md` shipped in the pnpm 12.15.0 package. pnpm 12 is a native executable.
   - The names are unchanged: `allowBuilds` (a map from package matcher to `true` or `false`), `minimumReleaseAge` (minutes, default 1440), `trustPolicy` (`no-downgrade` or `off`, default `off`). Related: `minimumReleaseAgeExclude`, `trustPolicyExclude`, `trustPolicyIgnoreAfter`, `strictDepBuilds` (default `true`), `blockExoticSubdeps` (default `true`), and `permissions` (from 12.11.0; its `build` capability takes precedence over `allowBuilds`).
   - They go in `pnpm-workspace.yaml`. `.npmrc` holds only auth, registry, TLS and proxy settings.
   - **pnpm 12 rejects unknown keys** in `pnpm-workspace.yaml` when the project pins a pnpm version that the running pnpm satisfies. Verified: a misspelled `minimumReleaseAgee` fails with `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` ("did you mean minimumReleaseAge?"), and `minimumReleaseAge: 1440`, `trustPolicy: no-downgrade` and `allowBuilds` are accepted. So a misspelled security setting cannot be ignored without notice, as long as `packageManager` pins pnpm.
   - Verified: adding `esbuild`, whose install script is not listed in `allowBuilds`, fails with "Ignored build scripts: esbuild" and exit code 1. With `minimumReleaseAge: 30000`, adding a package published 12 days earlier fails with a cutoff message.
   - Biome and TypeScript 7 ship their binaries as optional platform packages without install scripts, so neither needs an `allowBuilds` entry.

## Not verified yet

1. **What changed in Ink 8 compared with 7.** Ink 8.0.0 was released on 2026-10-03 and requires React 19.3 or later; the release notes have not been read yet. Check them when P1 introduces it.
2. **How hooks under `core.hooksPath` behave on Windows.** Git for Windows runs hooks with its bundled sh, so they should behave as on other platforms. Test once on the local machine when V0.1 lands.

## Sources

- TypeScript 7: [InfoQ: TypeScript 7 released](https://infoq.com/news/2026/08/typescript-7-released/) · [VS Magazine: 7.0 RC](https://visualstudiomagazine.com/articles/2026/06/22/typescript-7-0-rc-moves-microsofts-go-rewrite-into-the-mainline-compiler.aspx) · [Why ESLint cannot use TS 7 yet](https://dev.to/the-modern-web/why-angular-vue-and-eslint-cant-upgrade-to-typescript-70-yet-and-why-ts-71-changes-441g) · [TS 7 migration readiness](https://www.digitalapplied.com/blog/typescript-7-native-compiler-early-adopter-migration-readiness)
- Native TypeScript in Node: [Node.js docs: TypeScript](https://nodejs.org/api/typescript.md) · [Running TypeScript natively](https://nodejs.org/en/learn/typescript/run-natively)
- Lint: [InfoQ: ESLint 10](https://infoq.com/news/2026/04/eslint-10-release) · [Oxfmt Beta](https://oxc.rs/blog/2026-02-24-oxfmt-beta) · [Biome vs Oxc 2026](https://www.pkgpulse.com/guides/biome-vs-oxc-2026) · [Biome vs ESLint vs Oxlint 2026](https://www.pkgpulse.com/guides/biome-vs-eslint-vs-oxlint-2026)
- Architecture checks: [lastminute.com: enforcing architecture boundaries with dependency-cruiser](https://technology.lastminute.com/how-we-enforce-architecture-boundaries-at-scale-on-our-app/) · [knip](https://www.npmjs.com/package/knip)
- Security scanning: [CodeQL code scanning](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-code-scanning) · [CodeQL default setup](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning) · [SonarQube Cloud subscription plans](https://docs.sonarsource.com/sonarcloud/administering-sonarcloud/managing-subscription/subscription-plans)
- Testing: [Vitest blog](https://main.vitest.dev/blog)
- Build: [tsdown benchmark](https://tsdown.dev/advanced/benchmark) · [Switching from tsup to tsdown](https://alan.norbauer.com/articles/tsdown-bundler)
- Utility functions: [es-toolkit vs lodash](https://blog.logrocket.com/es-toolkit-lodash-alternative)
- Logging: [Pino vs Winston](https://betterstack.com/community/comparisons/pino-vs-winston) · [Pino and OpenTelemetry](https://1xapi.com/blog/structured-logging-nodejs-pino-opentelemetry-2026)
- CLI: [Node CLI frameworks 2026](https://www.pkgpulse.com/guides/best-cli-frameworks-nodejs-2026)
- Git hooks: [git-config: core.hooksPath](https://git-scm.com/docs/git-config#Documentation/git-config.txt-corehooksPath) · [Biome CLI (`--staged`)](https://biomejs.dev/reference/cli/) · [pnpm build settings (allowBuilds covers only dependencies)](https://pnpm.io/settings/build) · [husky](https://typicode.github.io/husky/get-started.html) · [Husky vs Lefthook vs lint-staged 2026](https://www.pkgpulse.com/guides/husky-vs-lefthook-vs-lint-staged-git-hooks-nodejs-2026) · [Using Lefthook instead of Husky](https://recca0120.github.io/en/2026/03/08/lefthook-git-hooks/)
- TUI: [OpenTUI (Better Stack)](https://betterstack.com/community/guides/scaling-nodejs/opentui-react/) · [OpenTUI compared with Ink](https://blog.openreplay.com/opentui-alternative-ink/) · [Terminal interfaces in Node](https://blog.openreplay.com/building-terminal-interfaces-nodejs/) · [OpenClaw TUI docs](https://docs.openclaw.ai/de/cli/tui.md) · [pi-tui (depscope)](https://mcp.depscope.dev/pkg/npm/@mariozechner/pi-tui); versions and dependencies from `npm view` on 2026-10-11
- Node release schedule: [nodejs/Release schedule.json](https://github.com/nodejs/Release/blob/main/schedule.json)
- Canonical JSON and UUID: [canonicalize](https://npmjs.com/package/canonicalize) · [Native UUID in Node](https://dev.to/pierre/you-should-ditch-uuid-node-has-you-covered-10i3)
- Oxigraph: [DepScope: oxigraph](https://mcp.depscope.dev/pkg/npm/oxigraph)
