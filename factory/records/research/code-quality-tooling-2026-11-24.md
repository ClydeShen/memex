# Stricter code-quality tooling: research

Date: 2026-11-24. Repository state read: branch `epic/v0-end-to-end`, commit `3d00ad8a`. Read-only; nothing was installed in the repository.

Claim tags:

- **[O]** official: read in the tool's own docs, release notes, source, package metadata, or the owner's paper or blog.
- **[R]** registry: read from `npm view`, `npm pack` (package contents) or the GitHub releases API on 2026-11-24. This is also first-hand.
- **[S]** second-hand: from a search summary, a third-party article, or an official page that cites someone else.
- **[I]** inferred: my judgement, not stated by a source.

Conflict of interest: this file is written by Claude (Anthropic). No Anthropic product is recommended here.

## Versions checked (2026-11-24, [R])

| Tool | Latest | Released | Note |
|---|---|---|---|
| Biome | 2.6.8 | 2026-11-15 | repo pins 2.6.3 |
| oxlint | 1.95.0 | 2026-11-23 | |
| oxlint-tsgolint | 7.0.2008 | 2026-11-21 | built on TypeScript 7.0.2; Windows x64 and arm64 binaries |
| tsrs | 7.1.0-beta.tsrs5 | 2026-11-23 | "A Rust port of the TypeScript 7 compiler" (oxc-project) |
| oxfmt | 0.80.0 | 2026-11-23 | still 0.x, beta |
| ESLint | 10.15.0 | 2026-11-13 | |
| typescript-eslint | 8.74.0 | 2026-11 | peer `typescript >=4.8.4 <6.1.0` |
| TypeScript | 7.0.2 (latest), 7.1.0-beta (2026-10-20) | | 7.1 beta exports `./sync` and `./async` API entry points |
| eslint-plugin-sonarjs | 4.2.2 | 2026-09-28 | depends on `typescript >=5 <6.1.0` |
| eslint-plugin-perfectionist | 5.14.0 | 2026-11-15 | |
| eslint-plugin-boundaries | 7.4.4 | 2026-11-15 | |
| eslint-plugin-project-structure | 3.14.6 | 2026-11-05 | |
| eslint-plugin-check-file | 3.3.2 | 2026-07-18 | has an official oxlint example |
| dependency-cruiser | 18.9.0 | 2026-11-22 | repo pins 18.7.0 |
| knip | 6.48.0 | 2026-11-22 | repo pins 6.43.0 |
| jscpd | 5.4.3 | 2026-11-08 | MIT |
| Semgrep CE | 1.186.0 (PyPI) | 2026-11-18 | has a `win_amd64` wheel |
| fast-check | 4.11.0 | 2026-11-21 | |
| TLA+ tools | v1.8.0 | 2026-11-19 | `tla2tools.jar` (Java) |
| Apalache | v0.63.0 | 2026-11-09 | |
| Quint | 0.34.0 | 2026-11-22 | npm `@informalsystems/quint` |
| Lean 4 | v4.36.0 | 2026-11-16 | |

## Summary

The current setup already covers most concerns. The biggest gap is type-aware linting. Biome's type rules are in `nursery`, and they use Biome's own type inference, not the TypeScript checker. typescript-eslint still cannot run with TypeScript 7 ([O], peer range). oxlint's type-aware backend, tsgolint, is built on TypeScript 7.0.2 and covers 59 of 61 typescript-eslint type-aware rules ([O]). That is the one change with a clear gain.

A full move from Biome to oxlint and oxfmt is possible but not yet worth it. oxfmt is still 0.x. oxlint JS plugins are alpha. oxlint has no `naming-convention` rule and no GritQL. So I recommend adding oxlint for the type-aware rules only, and keeping Biome for the rest. Evaluate the full move again when oxfmt reaches 1.0 ([I]).

Complexity: keep Biome's `noExcessiveCognitiveComplexity`. It is the same algorithm as `sonarjs/cognitive-complexity` ([O]). Lower the threshold from 15 to 10, and add function-length and parameter limits. sonarjs is not needed for this.

Formal methods: do not adopt TLA+ or Lean now. Use fast-check model-based tests for the Event Log first. TLA+ (or Quint) pays off only when a concurrent or crash-recovery protocol exists.

### Recommendation table: one owner per concern

| Concern | Owner | Settings | Turn off / do not add | Confidence |
|---|---|---|---|---|
| Formatting | Biome formatter | keep current (`lineWidth` 100, spaces) | oxfmt, Prettier for now | High |
| Import order | Biome assist `organizeImports` | turn it on explicitly in `biome.json` (`assist.actions.source.organizeImports: "on"`) | Perfectionist `sort-imports`, oxlint `sort-imports`, oxfmt `sortImports` | Medium (the default-on state was not verified) |
| File names | Biome `useFilenamingConvention` | kebab-case (have) | check-file filename rules, oxlint `unicorn/filename-case` | High |
| Folder names | not enforced now; if needed, `check-file/folder-naming-convention` as an oxlint JS plugin, or a 30-line sensor script | kebab-case | project-structure naming rules | Low |
| Folder structure | review only (project-structure.md) | — | eslint-plugin-project-structure (needs ESLint; oxlint compatibility unknown) | Medium |
| Module boundaries, cycles | dependency-cruiser | keep the rules; drop the TypeScript 6 `packageExtensions` once TypeScript 7.1 is stable (dependency-cruiser 18.8.0+ accepts `>=7.1.0 <8.0.0`) | eslint-plugin-boundaries, Biome `noImportCycles`, oxlint `import/no-cycle` | High |
| Unused exports, files, dependencies | knip | keep | Biome has no equivalent; no overlap | High |
| Unused locals and imports | Biome `noUnusedVariables`, `noUnusedImports` | set to `error` | tsc `noUnusedLocals`/`noUnusedParameters`, oxlint `no-unused-vars` | Medium |
| Duplication | jscpd, report only, in cleanup stories | `minTokens` 50, `threshold` as a report, not a gate | sonarjs `no-identical-functions` | Low |
| Complexity | Biome `noExcessiveCognitiveComplexity` | `maxAllowedComplexity: 10` in product code; add `noExcessiveLinesPerFunction` (about 60 lines) and `useMaxParams` (3 or 4) | sonarjs `cognitive-complexity`, ESLint/oxlint `complexity` | Medium (the numbers are a judgement) |
| Type safety (compiler) | tsc (TypeScript 7) | keep `strict`, `erasableSyntaxOnly`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` | — | High |
| `enum`, `namespace`, parameter properties | tsc `erasableSyntaxOnly` | keep | Biome `noEnum`, `noNamespace`, `noParameterProperties` are duplicates; keep or drop, your choice | High |
| Type-aware lint rules | oxlint + tsgolint | `--type-aware`; enable `no-floating-promises`, `no-misused-promises`, `await-thenable`, `switch-exhaustiveness-check`, `no-unnecessary-type-assertion`, `no-unsafe-*`, `restrict-template-expressions` | Biome nursery `noFloatingPromises`, `noMisusedPromises` | Medium |
| Explicit return types | Biome `useExplicitType` (have) | keep | oxlint `explicit-function-return-type` | Medium |
| Naming (identifiers) | Biome `useNamingConvention` | keep | oxlint has no equivalent | High |
| Function style (arrow only) | Biome `useArrowFunction` + GritQL `no-function-declaration` | keep | oxlint `func-style` | High |
| Test hygiene | Biome `noFocusedTests`, `noSkippedTests` | keep | oxlint `vitest/*` duplicates | High |
| Security patterns | CodeQL default setup (planned) + Biome `security` recommended rules | as planned | Semgrep CE (rules licence and overlap), sonarjs security rules | Medium |
| Architecture-level "taste" rules | Biome GritQL plugins in `harness/sensors/` | one file per rule, with a remediation message | — | Medium |

## 1. eslint-plugin-sonarjs: complexity and maintainability rules

### Facts

- Version 4.2.2, 2026-09-28 [R]. 295 rules, 230 in `recommended`, 71 need type information, 13 deprecated (counted from the README table in the package) [R].
- It depends directly on `typescript >=5 <6.1.0` [R]. So it brings its own TypeScript 6 copy. It does not run on the TypeScript 7 API [I].
- Licence: `package.json` says `LGPL-3.0-only`, but the `LICENSE` file in the package is the "SONAR Source-Available License v1.0" [R]. The two disagree. Ask a lawyer before you depend on it, or assume the stricter one [I].
- `recommended` "enables most of the rules ... with the error severity" [O].

Complexity and maintainability rules, defaults read from the package source and docs [R]:

| Rule | In `recommended` | Default |
|---|---|---|
| `cognitive-complexity` (S3776) | yes | `threshold` 15 (`DEFAULT_THRESHOLD = 15` in the rule source) |
| `cyclomatic-complexity` (S1541) | no | `threshold` 10 |
| `expression-complexity` (S1067) | no | `max` 3 operators |
| `max-lines` (S104) | no | 1000 |
| `max-lines-per-function` (S138) | no | 200 |
| `nested-control-flow` (S134) | no | `maximumNestingLevel` 3 |
| `max-switch-cases` (S1479) | yes | 30 |
| `no-nested-functions` (S2004) | yes | `threshold` 5 |
| `no-duplicate-string` (S1192) | no | `threshold` 3 |
| `no-identical-functions` (S4144) | yes | — |
| `no-nested-conditional` (S3358) | yes | — |
| `no-nested-switch`, `no-nested-template-literals` | no / yes | — |

### What SonarSource itself says

- The 15 is empirical, not scientific. G. Ann Campbell (author of the Cognitive Complexity white paper) wrote on 2024-10-02 that they "borrowed the default threshold of 10 from Cyclomatic Complexity", found it "noisy" on open-source projects, and raised it, "finally landing at 15". C, C++ and Objective-C use 25 [O].
- For AI-generated code, a Sonar blog post (2026-03-01) suggests an "AI Hardened" profile. Its example lowers `python:S3776` from 15 to **8**. It also tightens the new-code gate to 90 % coverage and 1 % duplication [O]. The post gives no data for these numbers [O]. So it is vendor opinion.
- Sonar's built-in "Sonar way" quality gate has no complexity condition. Per-function limits live in the quality profile (the rule), not the gate [S].

### How teams set a complexity budget

- Per-function threshold as an error, on new code only ("Clean as You Code") [S]. In SonarQube this is the profile plus the new-code gate.
- Ratchet with suppressions: ESLint has bulk suppressions (`--suppress-all`, `--suppress-rule`, `--prune-suppressions`, file `eslint-suppressions.json`). New violations fail; old ones are recorded [O]. Biome has `biome lint --suppress --reason=...`, which writes suppression comments [O].
- Memex is small and new, so no baseline is needed. Set the final threshold now [I].

### Comparison

| | Algorithm | Default | Notes |
|---|---|---|---|
| sonarjs `cognitive-complexity` | Cognitive Complexity (nesting-weighted) | 15 | ESLint plugin |
| Biome `noExcessiveCognitiveComplexity` | "the same as `sonarjs/cognitive-complexity`" | 15, range 1–254 | already on in this repo [O] |
| ESLint core `complexity` | cyclomatic (McCabe), `variant: classic` or `modified` | 20 | counts `?.`, default parameters, `\|\|=`, `&&=` [O] |
| oxlint `complexity` | cyclomatic, `classic` or `modified` | 20 | since oxlint 1.37.0, opt-in (restriction category) [O] |
| oxlint cognitive complexity | none native | — | only via the sonarjs JS plugin (alpha) [O]/[I] |

Recommendation: keep Biome's rule. Set `maxAllowedComplexity` to 10 for `memex/` and `factory/validation/` [I]. 10 is between Sonar's general default (15) and its AI example (8). Code-style section 3 already wants early returns and short functions, so 10 should rarely hit good code [I]. Add `noExcessiveLinesPerFunction` (about 60) and `useMaxParams` (3 or 4; code-style section 10 already prefers an options object) [I]. Both are in Biome's `complexity` group, not nursery [O]. Check the numbers against the current code before you commit them [I].

## 2. Replacing Biome with oxlint and oxfmt

### Maturity

- oxlint 1.0 was stable in June 2025 [O]. It is now 1.95.0 [R]. The rules page lists 873 rules, 111 on by default [O].
- Type-aware linting: "tsgolint v7" was released as stable on 2026-07-22 [O]. "tsgolint is built directly on TypeScript v7, hence its compatibility is tied to a specific TypeScript release" [O]. Version `7.0.2xxx` means TypeScript 7.0.2 [O].
  - Coverage: 59 of 61 typescript-eslint type-aware rules (blog); the docs page now says 60 of 62 [O].
  - Speed: 12–18 times faster than ESLint with typescript-eslint on four large repositories (vendor benchmark, Apple M4 Pro) [O].
  - It follows TypeScript 7 configuration rules. `baseUrl` and options removed in 7.0 are not supported [O]. Memex already runs TypeScript 7, so this fits [I].
  - `--type-check` reports compiler errors from the same program [O]. It only covers files oxlint lints. Keep `tsc` as the type-check owner [I].
  - Second backend: `tsrs`, a Rust port of TypeScript 7.1, used automatically when installed [O]. It is at a beta version [R]. Do not use it yet [I].
  - Limits: "Rule coverage is incomplete (but very close)", high memory on very large codebases, and monorepo packages need built `.d.ts` [O]. Memex packages export `.ts` source through `exports`, so the `.d.ts` point may not apply. Not verified [I].
- JS plugins: "currently in alpha" [O]. They target the ESLint v9+ plugin API. Not supported: custom parsers, and "Lint rules that rely on TypeScript type-awareness" (no `parserServices`) [O]. eslint-plugin-sonarjs is on the conformance-tested list [O]. Its 71 type-aware rules will not work there [I]. No speed numbers are published for JS plugins [O]. The page does not mention Windows [O].
- oxfmt: alpha 2025-12-01, beta 2026-02-24 [O]. The beta passes "100% of Prettier's JavaScript and TypeScript conformance tests" [O]. It has built-in import sorting (similar to Perfectionist `sort-imports`), Tailwind sorting and `package.json` sorting (on by default) [O]. It has `--migrate prettier` and `--migrate biome` [O]. Left for stable: Prettier plugin support, embedded code, stability, speed [O]. It claims about 30 times faster than Prettier and 2–3 times faster than Biome (vendor) [O]. No 1.0 announcement found [S].

### Native rule coverage for this repo's current Biome rules

Checked by the oxc.rs rule page for each rule (HTTP 200 = exists, 404 = missing) [O]:

| Biome rule now on | oxlint native equivalent |
|---|---|
| `useArrowFunction` | `prefer-arrow-callback` |
| GritQL `no-function-declaration` | `func-style: "expression"` (docs do not say how overloads are handled; not verified) |
| `noExcessiveCognitiveComplexity` | **none** (only cyclomatic `complexity`) |
| `useExplicitType` | `typescript/explicit-function-return-type`, `explicit-module-boundary-types` |
| `noFloatingPromises`, `noMisusedPromises` | `typescript/no-floating-promises`, `no-misused-promises` (type-aware, real checker) |
| `noParameterAssign`, `noUselessElse`, `noNestedTernary` | `no-param-reassign`, `no-else-return`, `no-nested-ternary` |
| `noProcessEnv` | `node/no-process-env` |
| `noEnum` | **none** (`no-restricted-syntax` is missing); tsc `erasableSyntaxOnly` covers it |
| `noNamespace`, `noParameterProperties` | `typescript/no-namespace`, `typescript/parameter-properties` |
| `noNonNullAssertion`, `noExplicitAny` | `typescript/no-non-null-assertion`, `typescript/no-explicit-any` |
| `noDefaultExport`, `noCommonJs` | `import/no-default-export`, `import/no-commonjs` |
| `useNamingConvention` | **none** (`typescript/naming-convention` is missing) |
| `useFilenamingConvention` | `unicorn/filename-case` |
| `noMagicNumbers` | `no-magic-numbers` |
| `noFocusedTests`, `noSkippedTests` | `vitest/no-focused-tests`, `vitest/no-disabled-tests` |
| organize imports | none in oxlint (`import/order` is missing); oxfmt `sortImports` (off by default) |

Also present natively: `max-depth`, `max-lines`, `max-lines-per-function`, `max-params`, `max-statements`, `max-nested-callbacks`, `import/no-cycle`, `no-restricted-imports`, `typescript/consistent-type-imports`, `typescript/switch-exhaustiveness-check` (since 1.12.0), `typescript/strict-boolean-expressions` ("not yet fully implemented") [O].

### What we lose by leaving Biome

- The GritQL plugin system. oxlint has no pattern language; custom rules are JS plugins (alpha) [O]/[I].
- `useNamingConvention` [O]. Possible replacement: typescript-eslint `naming-convention` through a JS plugin. Not verified; that package has the `<6.1.0` TypeScript peer range [R].
- Cognitive complexity natively. Replacement: sonarjs as a JS plugin [O].
- One tool and one config for format, lint and imports. With oxlint you need oxlint plus oxfmt [I].
- Biome GritQL is itself not final: "actively being worked on", and node names "can change between versions" [O]. So the loss is a young feature, not a stable one.

### What we gain

- Type-aware rules on the real TypeScript 7 checker, including the `no-unsafe-*` family and `await-thenable`, which Biome lacks (tech-stack V0-02, finding 3) [O]/[I].
- A path to the ESLint plugin ecosystem (sonarjs, check-file) without ESLint [O].

### Migration path

1. Now: add `oxlint` + `oxlint-tsgolint@7` as dev tools. Turn on only the type-aware rules (`--type-aware`, all other categories off). Run it in `pnpm lint`, the Stop hook, and the PostToolUse hook. Turn off Biome nursery `noFloatingPromises` and `noMisusedPromises`. Both binaries are platform packages; check whether pnpm `allowBuilds` needs an entry [I].
2. Pin tsgolint to the TypeScript version: tsgolint `7.0.2xxx` with TypeScript `7.0.2`. Bump them together [O]/[I].
3. When oxfmt reaches 1.0 and JS plugins reach beta: run `oxfmt --migrate biome` and compare output on the repo; port the GritQL rule to `func-style`; decide what to do about naming conventions; then remove Biome [I].
4. Update `tech-stack.md`, `code-style.md` rule names, the `.claude/hooks/` scripts and `permissions.deny` (a new `.oxlintrc.json` must be protected like `biome.json`) [I].

## 3. Lint rules for code written by AI agents

### What is published

| Source | Date | Type | What it says |
|---|---|---|---|
| OpenAI, "Harness engineering: leveraging Codex in an agent-first world" (Ryan Lopopolo) | 2026-02-11 | practitioner report [O] | Layer rules "enforced mechanically via custom linters ... and structural tests". "we write the error messages to inject remediation instructions into agent context". They "statically enforce structured logging, naming conventions for schemas and types, file size limits". Parse data at the boundary. Enforce "invariants, not micromanaging implementations". No thresholds given |
| Factory, "Using Linters to Direct Agents" (Alvin Sng) | 2025-09-05 | practitioner opinion [O] | Categories: grep-ability (no default exports, explicit DTOs), glob-ability (predictable file layout, colocated tests), architectural boundaries (no cross-layer imports, no cycles), security (no `eval`, `new Function`, plaintext secrets; schema validation), testability (no network in unit tests), observability (structured logging), docs (TSDoc on public APIs). No metrics |
| Sonar, "How to optimize SonarQube for reviewing AI-generated code" | 2026-03-01 | vendor advice [O] | Cognitive complexity 8 (Python example), 90 % new-code coverage, 1 % duplication. No data |
| Sonar, "The Coding Personalities of Leading LLMs" | 2025-08 | vendor study [S] | Over 90 % of issues in LLM-written Java were code smells; 4,400+ tasks, six models. Not independently confirmed |
| Better Stack, "Anti-Slop: Oxlint Rules" (rules by Dillon Mulroy) | 2026-08-24 | community [S] | JS-plugin rules such as `no-chained-type-assertions` (`as unknown as`), `no-unknown-returns`, `require-safety-comment-for-type-assertion`. No measurements |
| Fowler site, "Harness engineering" (Böckeler) and Anthropic posts | 2026 | covered in the 2026-10-14 research | linters as computational sensors; messages written for the LLM |

### Evidence versus opinion

- I found no controlled study that shows a lint rule or threshold improves agent output [I]. Everything above is practitioner experience or vendor advice.
- The one consistent claim from two independent makers (OpenAI, Factory): mechanical boundary rules plus error messages that say how to fix. These are [O] statements of their practice, not measured results.
- Sonar's numbers come from the vendor that sells the checker [O]. Treat them as opinion.

### Concrete rules for this repo (beyond what is on)

| Goal | Rule and setting | Tool | Status here |
|---|---|---|---|
| Small functions | `noExcessiveCognitiveComplexity` 10; `noExcessiveLinesPerFunction` ~60; `useMaxParams` 3–4 | Biome | add [I] |
| Small files | `noExcessiveLinesPerFile` ~400 (OpenAI mentions file size limits, no number) | Biome | add, report first [I] |
| No type laundering | forbid `as unknown as` with a GritQL rule; or typescript-eslint `consistent-type-assertions` `assertionStyle: "never"` (unverified in oxlint) | Biome GritQL | add [I] |
| Exhaustive handling of `Result` errors | `switch-exhaustiveness-check` | oxlint type-aware | add [I] |
| No unsafe `any` flow | `no-unsafe-argument`, `-assignment`, `-call`, `-member-access`, `-return` | oxlint type-aware | add [I] |
| Explicit types | `useExplicitType` | Biome | on |
| No clever code | `noNestedTernary`, `noParameterAssign`, `noUselessElse`, arrow-only | Biome | on |
| Named exports, ESM | `noDefaultExport`, `noCommonJs` | Biome | on |
| Naming | `useNamingConvention`, kebab-case files | Biome | on |
| Boundaries, no cycles | dependency-cruiser rules | dependency-cruiser | on |
| Teaching messages | every custom rule (GritQL, dependency-cruiser `comment`) says what to do instead | all | partly on; keep as a standard [I] |
| Import order | `organizeImports` | Biome | turn on explicitly [I] |

Keep rule changes rare. An agent cannot tell its own mistake from a new rule (a community guide says this [S]; it matches the Stop-hook design [I]).

## 4. TLA+ and Lean 4 for a TypeScript system

### How teams use TLA+ in a test-like loop

- Bounded model checking with TLC: small constants, run in CI, fail on an invariant violation [S]. TLA+ tools v1.8.0 (2026-11-19) added better TLC error messages, `TLCSet("exit", TRUE)`, trace statistics and a REPL prototype; SANY now returns non-zero exit codes on more errors [R].
- Apalache (v0.63.0) is a symbolic checker, used for bounded or inductive proofs [R]/[S].
- Quint (0.34.0, npm) is a TLA+-based language with a programmer syntax and a CLI (`quint run` random simulation, `quint verify` through Apalache) [S].

### How teams link a spec to the code

| Method | Source | Result |
|---|---|---|
| Model-based test-case generation (spec → tests) | MongoDB, PVLDB 2020; retrospective 2025-06-02 | Worked: 4,913 generated tests gave 100 % branch coverage, against 21 % for hand-written tests and 92 % for AFL fuzzing [O] |
| Trace checking (code → traces → TLC) | same | Failed for the server: a month to instrument, atomicity gap between spec and code, stopped after 10 weeks [O] |
| Trace validation with partial traces | Cirstea, Kuppe, Loillier, Merz, SEFM 2024 | Instrumented Java writes JSON traces; TLC checks them against a trace spec. Found discrepancies in all case studies [O] |
| Spec → ITF traces → replay in TypeScript | `@firfi/quint-connect` 2.1.1 (community, Apache-2.0) | Exists; not evaluated [R]/[S]. The official Quint Connect is Rust [S] |
| Property-based model tests | fast-check `fc.commands`, `fc.modelRun`, `fc.asyncModelRun`, `fc.scheduledModelRun` (races), `replayPath` for a minimal counterexample [O] | Already in the stack (fast-check, planned V0.3) |

MongoDB's lessons [O]: write the spec before the code; model events that are easy to observe (messages), not internal thread state; generation from the spec is cheaper than checking traces from the code.

For a TypeScript bridge, TLC can read NDJSON traces through `ndJsonDeserialize` in the TLA+ CommunityModules `Json` module [O]. A TS program can write such a trace [I].

### Lean 4

- Fits: pure functions with crisp properties. AWS Cedar is the model case: an executable Lean model, proofs about it, and differential random testing of the Rust code against the model; releases are blocked unless model, proofs and tests are current; the Lean model is about 10 times smaller than the code [O].
- Does not fit: I/O, processes, timing, the file system, or code that changes often. Proofs break on each change [I].
- Windows: elan installs through a PowerShell script (`elan-init.ps1`) [O]. Lean v4.36.0 (2026-11-16) [R].

### Tooling on Windows and in CI

- TLA+: `tla2tools.jar` needs a Java runtime [R] (the minimum Java version was not checked). It runs the same on Windows. A VS Code extension exists [S].
- Quint: npm package; `verify` needs Apalache and a JVM [S].
- CI: a Linux job with Java, TLC with small bounds, a time limit of a few minutes [I].

### Cost

- TLA+: days to learn the basics; each spec costs days to weeks; the spec drifts unless something (generated tests or trace checks) ties it to the code [S]/[I].
- Lean: weeks to months before proofs pay off; Cedar had a dedicated team [I].

### Which parts of Memex would gain

Read from `memex/packages/runtime/src/event-log/event-log.ts`: appends go through an in-process promise queue; each event names the previous one (`memexparent`); the log is a JSONL file; there is no cross-process lock, and a half-written last line would make `read` throw.

| Area | Best tool now | When to add TLA+/Quint or Lean |
|---|---|---|
| Event Log ordering and the parent chain | fast-check model test: commands `append`, `read`, `reopen`, `crash mid-write`; model = an array; check the chain and the order. `scheduledModelRun` for interleaved appends | TLA+/Quint if two processes may write one log, or if crash recovery gets a protocol [I] |
| Replay determinism (Projection after replay is equal) | fast-check property, already planned | Lean only if the Projector becomes a stable, pure core worth proving [I] |
| Canonical JSON and the Trace hash | fast-check: `canonicalize(parse(canonicalize(x))) == canonicalize(x)`; order-independence of keys | not needed [I] |
| Process-per-Experiment isolation (ADR 0004) | tests that check no shared state leaks; OS-level, so a model checker cannot prove it | no [I] |
| Child-process JSONL protocol (requests, results, timeouts, cancellation) | fast-check async model tests | TLA+/Quint once cancellation and retries exist; that is where concurrency bugs hide [I] |
| Graded Policy decisions (ADR 0022) | fast-check properties (monotonic risk levels) | Lean, Cedar-style, if Policy becomes a security boundary for real users [I] |

## 5. Overlap and conflict map

### Which tool can cover which concern

F = format, IO = import order, FN = file names, FS = folder structure, MB = module boundaries, UC = unused code, DU = duplication, CX = complexity, SE = security patterns, TY = type rules. "x" = covers it, "p" = partly. Sources: each tool's docs above [O]; cells for ESLint plugins are from their README rule lists [R].

| Tool | F | IO | FN | FS | MB | UC | DU | CX | SE | TY |
|---|---|---|---|---|---|---|---|---|---|---|
| Biome | x | x | x | | p (`noRestrictedImports`, `noImportCycles`, `noPrivateImports`) | p (locals, imports) | | x | p | p (nursery) |
| oxfmt | x | x (`sortImports`) | | | | | | | | |
| oxlint | | p (`sort-imports`) | x | | p (`import/no-cycle`, `no-restricted-imports`) | p | | p (cyclomatic) | p | x (tsgolint) |
| typescript-eslint | | p (`consistent-type-imports`) | | | | p | | | p | x (blocked on TS 7) |
| Perfectionist | | x | | | | | | | | |
| project-structure | | | x | x | x (`independent-modules`) | | | | | |
| check-file | | | x | p (folder names) | | | | | | |
| boundaries | | | | p | x | | | | | |
| dependency-cruiser | | | | p | x | p (orphans) | | | | |
| knip | | | | | | x (files, exports, deps) | | | | |
| jscpd | | | | | | | x | | | |
| Semgrep CE | | | | | p | | | | x | |
| sonarjs | | | | | | p | p | x | p | p (71 type-aware rules) |
| tsc | | | | | | p (`noUnused*`) | | | | x |

### One owner per concern

See the recommendation table in the summary. The short version:

- Biome owns format, import order, file names, identifier names, complexity, function style, test hygiene, unused locals.
- oxlint (type-aware only) owns the type-aware lint rules.
- tsc owns type checking and erasable syntax.
- dependency-cruiser owns module boundaries and cycles.
- knip owns unused files, exports and dependencies.
- jscpd owns duplication (report only).
- CodeQL owns security data flow; Biome `security` rules stay as the cheap local layer.

Do not add: Perfectionist, eslint-plugin-boundaries, eslint-plugin-project-structure, sonarjs, Semgrep CE, ESLint itself. Each one duplicates an owner above, or needs ESLint, which needs TypeScript 6 [I].

Semgrep notes: the engine is LGPL-2.1; the registry rules are under the "Semgrep Rules License v1.0" [R]; Windows support is labelled beta [O]. It overlaps CodeQL [I].

### Rules that conflict with the formatter

- With any Prettier-style formatter (Biome, oxfmt): `max-len`, `quotes`, `no-mixed-operators`, `no-tabs`, `no-confusing-arrow`, `lines-around-comment`, `curly` with `multi-line`, `unicorn/template-indent`; and `arrow-body-style`, `prefer-arrow-callback` when fixes run inside the formatter plugin [O] (eslint-config-prettier). oxlint's style rules are off by default [O]; keep them off except the ones named in this file.
- Import sorting: only one of Biome `organizeImports`, oxfmt `sortImports`, oxlint `sort-imports`, Perfectionist `sort-imports`. Two sorters with different orders fight on every save [I].
- `noExcessiveLinesPerFunction` and `max-lines-per-function` count lines after formatting; a formatter change can move code over the limit [I].

## Where the earlier research and the design docs are out of date

The 2026-10-14 research (`factory/records/research/qa-harness-tools-2026-10-14.md`) covers QA (tests, mutation, hooks), not lint tools. Points that changed:

1. `tech-stack.md`: "oxfmt is still at 0.x" is still true (0.80.0), but oxfmt is now beta with full Prettier JS/TS conformance [O].
2. `tech-stack.md`: "TS 7 + ESLint cannot be installed together" is still true for typescript-eslint 8.74.0 [R]. The maintainers say nothing can be done "until TS 7 provides an API" (2026-07-08) [O]. TypeScript 7.1 beta now ships API entry points [R], so this may change with 7.1 stable.
3. `tech-stack.md` V0-02 finding 3 ("Biome stays" because Biome covers 31 of 63 type-aware rules and ESLint is blocked): a third option now exists, oxlint with tsgolint on TypeScript 7 [O].
4. `tech-stack.md` dependency-cruiser note: 18.8.0+ accepts TypeScript `>=7.1.0 <8.0.0` and checks that the native compiler runs [R]. The `packageExtensions` TypeScript 6 copy can go after the repo moves to TypeScript 7.1.
5. Versions: Biome 2.6.8, dependency-cruiser 18.9.0, knip 6.48.0, fast-check 4.11.0 are newer than the pins [R].
6. The QA research's hook design (A3) runs only Biome on edit. If oxlint is added, both hooks must run it too [I].
7. The QA research left open whether StrykerJS's TypeScript checker works with TypeScript 7. Not checked here; still open.

## Open questions for the user

1. Do you accept two lint tools (Biome plus type-aware oxlint) for a while, or do you want one tool even if that means waiting?
2. Complexity numbers: 10 for cognitive complexity, about 60 lines per function, 3 or 4 parameters, about 400 lines per file. Accept, or pick your own?
3. Should `harness/` and `.claude/hooks/` get the new rules, or stay lenient as now (protected files)?
4. Keep the Biome `noEnum`/`noNamespace`/`noParameterProperties` rules that duplicate `erasableSyntaxOnly`, for the clearer messages, or drop them for one owner?
5. jscpd: add it as a report in the cleanup stories, or skip duplication checks for now?
6. Formal methods: accept "fast-check model tests now, TLA+/Quint only when a concurrent protocol appears"? Is multi-process writing to one Event Log ever planned?
7. sonarjs licence: if you want sonarjs later, the licence mismatch (LGPL in `package.json`, Sonar Source-Available in `LICENSE`) needs a decision.

## Not verified

- Whether `biome check` fails on unorganized imports with the current `biome.json` (no `assist` section).
- How oxlint `func-style` treats TypeScript overload signatures.
- Whether oxlint and tsgolint run on this repo (exports pointing at `.ts`, `allowImportingTsExtensions`) and how fast. A throwaway trial outside the repo would settle it.
- Whether eslint-plugin-project-structure or typescript-eslint `naming-convention` load as oxlint JS plugins.
- The minimum Java version for TLA+ tools 1.8.0 and Apalache 0.63.0.
- The tsrs announcement post (the blog URL returned 404; only the docs page and npm metadata were read).

## Sources

- eslint-plugin-sonarjs 4.2.2 package (README, docs, rule source, LICENSE): `npm pack eslint-plugin-sonarjs@4.2.2`; changelog https://github.com/SonarSource/SonarJS/blob/master/packages/analysis/src/jsts/rules/CHANGELOG.md
- S3776 default of 15, G. Ann Campbell: https://community.sonarsource.com/t/s3776-reason-for-the-current-default-value-of-15/127103
- Cognitive Complexity white paper: https://www.sonarsource.com/resources/cognitive-complexity/
- Sonar, AI-generated code settings: https://www.sonarsource.com/blog/how-to-optimize-sonarqube-for-reviewing-ai-generated-code/
- Sonar, Coding Personalities of Leading LLMs: https://www.sonarsource.com/blog/the-coding-personalities-of-leading-llms
- SonarQube quality gates: https://docs.sonarsource.com/sonarqube-server/2025.4/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates
- ESLint `complexity`: https://eslint.org/docs/latest/rules/complexity
- ESLint bulk suppressions: https://eslint.org/docs/latest/use/suppressions
- eslint-config-prettier special rules: https://github.com/prettier/eslint-config-prettier/blob/main/README.md
- Biome cognitive complexity: https://biomejs.dev/linter/rules/no-excessive-cognitive-complexity/
- Biome rules list: https://biomejs.dev/linter/javascript/rules/
- Biome GritQL: https://biomejs.dev/reference/gritql/
- Biome organize imports: https://biomejs.dev/assist/actions/organize-imports/
- Biome CLI (`--suppress`): https://biomejs.dev/reference/cli/
- oxlint rules: https://oxc.rs/docs/guide/usage/linter/rules.html (and per-rule pages under `/rules/<plugin>/<rule>.html`)
- oxlint `complexity`: https://oxc.rs/docs/guide/usage/linter/rules/eslint/complexity.html
- oxlint `func-style`: https://oxc.rs/docs/guide/usage/linter/rules/eslint/func-style.html
- oxlint type-aware linting: https://oxc.rs/docs/guide/usage/linter/type-aware.html
- tsgolint v7 stable: https://oxc.rs/blog/2026-07-22-type-aware-linting-stable
- oxlint JS plugins: https://oxc.rs/docs/guide/usage/linter/js-plugins.html
- oxlint 1.0: https://oxc.rs/blog/2025-06-10-oxlint-stable
- oxfmt: https://oxc.rs/docs/guide/usage/formatter.html ; beta: https://oxc.rs/blog/2026-02-24-oxfmt-beta ; sorting: https://oxc.rs/docs/guide/usage/formatter/sorting.html
- typescript-eslint and TypeScript 7: https://github.com/typescript-eslint/typescript-eslint/issues/12518 ; TypeScript 7.0 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- eslint-plugin-check-file, eslint-plugin-boundaries, eslint-plugin-project-structure: package READMEs via `npm pack`
- dependency-cruiser 18.9.0 `src/meta.cjs` and `src/extract/transpile/meta.mjs`: `npm pack dependency-cruiser@18.9.0`
- Semgrep CE: https://semgrep.dev/blog/2025/semgrep-community-edition-fall-release-2025 ; quickstart: https://semgrep.dev/docs/getting-started/quickstart-ce ; rules licence: https://raw.githubusercontent.com/semgrep/semgrep-rules/develop/LICENSE ; PyPI: https://pypi.org/project/semgrep/
- OpenAI, Harness engineering: https://openai.com/index/harness-engineering/
- Factory, Using Linters to Direct Agents: https://factory.com/using-linters-to-direct-agents
- Better Stack, Anti-Slop oxlint rules: https://betterstack.com/community/guides/ai/anti-slop-oxlint/
- TLA+ tools v1.8.0: https://github.com/tlaplus/tlaplus/releases/tag/v1.8.0 ; CommunityModules Json: https://github.com/tlaplus/CommunityModules/blob/master/modules/Json.tla
- Apalache v0.63.0: https://github.com/apalache-mc/apalache/releases/tag/v0.63.0
- Trace validation paper: https://arxiv.org/abs/2404.16075
- MongoDB, eXtreme Modelling in Practice: https://arxiv.org/abs/2006.00915 ; retrospective: https://mongodb.com/company/blog/engineering/conformance-checking-at-mongodb-testing-our-code-matches-our-tla-specs
- Quint: https://quint-lang.org/posts/quint_connect ; TS port: https://github.com/dearlordylord/quint-connect-ts
- Cedar, verification-guided development: https://arxiv.org/abs/2407.01688 ; AWS blog: https://aws.amazon.com/blogs/opensource/lean-into-verified-software-development
- Lean install on Windows: https://lean-lang.org/install/manual/ ; releases: https://github.com/leanprover/lean4/releases
- fast-check model-based testing: https://fast-check.dev/docs/advanced/model-based-testing/
- Registry data: `npm view <package> version time peerDependencies dependencies` and the GitHub releases API, run 2026-11-24
