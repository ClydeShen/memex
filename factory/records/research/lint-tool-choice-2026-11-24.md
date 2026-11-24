# Lint tool choice, complexity by path, jscpd and fast-check

Date: 2026-11-24. Follow-up to `code-quality-tooling-2026-11-24.md` in the same folder. Repository read at commit `3d00ad8a` on `epic/v0-end-to-end`; nothing in it was changed.

Decisions already made by the user: one tool only (Biome, or oxlint + oxfmt); the goal is mechanical boundary rules whose messages tell the agent how to fix the problem; fast-check covers the formal checks (no TLA+ or Lean); cognitive complexity 15 for deep modules and 10 for shallow modules; jscpd is configured now and turned on when product code starts.

Claim tags: **[O]** official docs, release notes or source; **[R]** registry or package contents read on 2026-11-24 (`npm view`, `npm pack`); **[S]** second-hand; **[I]** inferred (my judgement).

Versions compared: Biome 2.6.8 (2026-11-15; repo pins 2.6.3), oxlint 1.95.0 and oxfmt 0.80.0 (2026-11-23), oxlint-tsgolint 7.0.2008 (2026-11-21), jscpd 5.4.3 (2026-11-08), fast-check 4.11.0 (2026-11-21), @fast-check/vitest 0.5.0 [R].

## Summary

- **Recommendation: stay with Biome.** It covers every rule the repo uses now, including cognitive complexity with per-path limits, naming conventions and file names. Its formatter is stable. GritQL plugins can set their own message and severity, and since 2.5 they can offer safe or unsafe fixes. Nothing on the critical path is alpha. Confidence: medium.
- **What we lose:** real type-aware rules on the TypeScript 7 checker (tsgolint: `await-thenable`, `no-unsafe-*`, `no-unnecessary-type-assertion`, `restrict-template-expressions`). We also lose the full ESLint rule API for custom rules, and oxlint's `--format=agent`.
- **Look at oxlint + oxfmt again when all three hold:** oxfmt reaches 1.0; oxlint JS plugins leave alpha; oxlint has a cognitive-complexity rule that is native, or under a clear licence.
- **Deep modules:** classify by dependency direction, not only by path. A deep module is a listed concept directory that does no I/O, imports no npm package and no adapter, sees ports only as types, is imported only through its entry file, and is tested only through that file with fast-check. Adapters implement a port and pass its Conformance Suite. Deep gets complexity 15; everything else gets 10. The lists are in protected files. Today no directory meets every deep rule without a small refactor.
- **jscpd:** add a `.jscpd.json` and a `dup` script now. Turning it on is one change: add `pnpm run dup` to `check`.
- **fast-check:** use plain `fc.assert` inside Vitest tests, with no new package. Fix the seed in `pnpm check`. Run a separate exploration script with random seeds in cleanup stories.

## 1. Biome 2.6 versus oxlint + oxfmt for this goal

### Comparison

| Aspect | Biome 2.6 | oxlint 1.95 + oxfmt 0.80 |
|---|---|---|
| Rule count | 816 rules across languages [O]; the 2.5 release post says over 500 lint rules [O] | 873 rules, 111 on by default [O] |
| Rules useful to agents that only one tool has natively | `useNamingConvention`, `noExcessiveCognitiveComplexity`, `useFilenamingConvention` with kebab-case, `noExcessiveLinesPerFile`, organize imports in the linter [O] | `max-depth`, `max-statements`, `import/no-cycle`, unicorn and import plugins, `typescript/switch-exhaustiveness-check` with real types [O] |
| Type-aware rules | Biome's own inference, no TypeScript compiler [O]. The rules are in `nursery` ("experimental and the behavior can change at any time") and turn on a project scanner [O]. The engine was rewritten in 2.6 (on demand, memoized) [O] | tsgolint, built on TypeScript 7.0.2; 59 to 60 of the typescript-eslint type-aware rules; released as stable 2026-07-22 [O]. Pin the tsgolint version to the TypeScript version [O] |
| Custom rules | GritQL plugins: a pattern plus `register_diagnostic(span, message, severity)`. No semantic model or file kind; node names "can change between versions" [O]. JavaScript plugins: "Developer Preview", and "Breaking changes can happen in patch releases" [O] | JS plugins with the ESLint v9 API: scope analysis, control flow, tokens, fixes, options [O]. "currently in alpha" [O]. No type information in JS plugins [O] |
| Custom message, fix suggestion, autofix | Message: yes. Severity: yes. Fix: a `=>` rewrite with `fix_kind` `safe` or `unsafe`. Without `--write` it is shown as a suggestion. With no `fix_kind`, it is treated as unsafe [O]. Plugin code fixes arrived in 2.5 (2026-06-05) [O]. No link field is mentioned [O] | Message: yes (`context.report`). Fixes: listed as supported [O]. Suggestions: only "Language server (IDE) support + suggestions" is mentioned [O]. `messageId` and `meta.docs.url` are not mentioned in the docs [O] |
| Speed of custom rules | GritQL "run on every file, regardless of whether the content of the file matches", with low, controlled memory [O] | No published numbers for JS plugins [O]. `createOnce` is recommended for speed [O] |
| Built-in messages | Rule design has three "pillars": explain the error, explain why, say what to do (usually a code action) [O]. The CLI shows a code frame and the rule category [S] | Default output has a code frame, the rule code and a `help` line [O]. JSON and SARIF include a rule `url` / `helpUri` [O] |
| Safe and unsafe fixes | `--write` applies safe fixes; `--write --unsafe` adds unsafe ones; a per-rule `fix` option (`none`, `safe`, `unsafe`) [O] | `--fix`; `--fix-suggestions` ("May change program behavior"); `--fix-dangerously` [O] |
| Machine-readable output | `json` and `json-pretty` (experimental, "may change in patch releases"), `sarif`, `github`, `gitlab`, `junit`, `checkstyle`, `rdjson`, `summary`, `concise`. Several reporters at once, with `--reporter-file` [O] | `json`, `sarif` 2.1.0, `github` (automatic inside GitHub Actions), `gitlab`, `junit`, `checkstyle`, `stylish`, `unix`, and `agent`: one line per problem with location, severity, rule, message and help, "intended for consumption by AI agents" [O] |
| Per-path overrides | `overrides[].includes` globs; "the last matching override takes precedence"; overrides can add plugins [O]. Per-override rule options are not stated in the docs but follow the rule shape [I] | `overrides[].files` with `rules`, `plugins`, `jsPlugins`; rule options per override [O]. `typeAware` and `typeCheck` are root-only [O] |
| Editor and hooks | VS Code extension and LSP; `biome check --staged` for pre-commit [O] (already used) | VS Code and other editors through the language server [O]. The docs give a Claude Code `PostToolUse` example and an `AGENTS.md` example for Codex [O]. No `--staged` flag was found; pass the staged paths [I] |
| Formatter | Stable since Biome 1.x; the repo already uses it [O] | oxfmt beta (2026-02-24), 0.x; passes "100% of Prettier's JavaScript and TypeScript conformance tests"; claims 2 to 3 times the speed of Biome [O]. Stable release is still missing Prettier plugins and embedded-code work [O] |
| Release maturity | 2.x stable. The project says it is "led by volunteers" [O]. Minor releases about every two to four months in 2026 (2.4 Feb, 2.5 Jun, 2.6 Oct) [O] | oxlint 1.x stable since June 2025 [O]; several releases a week [R]. oxfmt is beta, JS plugins are alpha [O] |

### Weighing it for the goal

- **Boundaries.** dependency-cruiser owns module boundaries in both setups. Its rule `comment` already says what is allowed. So the lint tool's share of "boundaries" is small: no `process.env`, no default exports, arrow functions only, naming. Both tools can do these [I].
- **Messages that teach.** Both let a custom rule set its own message. GritQL is enough for syntax patterns such as "no function declaration" or "no `as unknown as`". Rules that need scope (for example "this identifier is a Projector, so it must start with `project`") need the ESLint-style API. Biome's JS plugins are only a developer preview [O]/[I].
- **Type-aware rules.** This is oxlint's real advantage. The repo forbids `any` and parses external data with Zod, so the `no-unsafe-*` gap matters less (tech-stack.md V0-02, finding 3) [I]. Biome's nursery `noFloatingPromises`, `noMisusedPromises` and `useExhaustiveSwitchCases` cover the most common agent mistakes, with weaker inference [O]/[I].
- **Cognitive complexity.** The user wants it with two limits. Biome has it natively [O]. oxlint does not [O]. It would need eslint-plugin-sonarjs as an alpha JS plugin. That package's `LICENSE` file (Sonar Source-Available) does not match its `package.json` (LGPL-3.0), and it pulls in its own TypeScript 6 [R]. The other way is to write our own JS rule [I].
- **Risk.** Moving now puts a 0.x formatter and an alpha plugin API on the path of every commit [O]/[I].

### Recommendation

Keep Biome as the only lint and format tool. Upgrade from 2.6.3 to 2.6.8 [R]. Use these Biome features for the goal:

1. Write each new boundary or taste rule as a GritQL file in `harness/sensors/`. The message names the rule, says what to write instead, and points to the code-style section. Add a `=>` rewrite with `fix_kind = "safe"` only when the rewrite cannot change behaviour [O]/[I].
2. Turn on the nursery type rules that fit: `noFloatingPromises`, `noMisusedPromises` (already on), `useExhaustiveSwitchCases`, `noUnsafeReturn` if it exists in 2.6.8 (not verified) [I].
3. For agents, use the `concise` reporter in hooks, and `sarif` if CI starts to collect results [O]/[I].

What we lose, and how to live with it: the TypeScript-checker rules (mitigated by `strict`, no `any`, and Zod at the boundary), the ESLint plugin ecosystem, and `--format=agent` (`concise` is close) [I].

## 2. Two complexity limits by path

### Biome configuration (sketch)

The root `linter.rules` keeps the strict default. One override raises the limit for the listed deep modules. A later override sets tests back to the default if needed. The last matching override wins [O].

```json
{
  "linter": {
    "rules": {
      "complexity": {
        "noExcessiveCognitiveComplexity": {
          "level": "error",
          "options": { "maxAllowedComplexity": 10 }
        }
      }
    }
  },
  "overrides": [
    {
      "includes": ["memex/packages/runtime/src/event-log/**"],
      "linter": {
        "rules": {
          "complexity": {
            "noExcessiveCognitiveComplexity": {
              "level": "error",
              "options": { "maxAllowedComplexity": 15 }
            }
          }
        }
      }
    },
    {
      "includes": ["**/*.test.ts"],
      "linter": {
        "rules": {
          "complexity": {
            "noExcessiveCognitiveComplexity": {
              "level": "error",
              "options": { "maxAllowedComplexity": 10 }
            }
          }
        }
      }
    }
  ]
}
```

The `harness/**` and `.claude/hooks/**` override must stay the last entry, so their rule stays off [I]. The `event-log` path is only an example. Under the rules below, `event-log/` does not qualify yet (see "Fit with the current layout"). Check that rule options work inside an override with one trial file. The docs do not say so in words [O]/[I].

### Definitions used (from the user)

- A module is anything with an interface and an implementation. The interface is everything a caller must know: types, invariants, ordering, error modes, configuration.
- Deep module: a lot of behaviour behind a small interface. Shallow module: the interface is nearly as large as the implementation (pass-through, adapter-like).
- Tests: a deep module is tested only through its interface ("the interface is the test surface"). An adapter is tested at the seam it fills, with conformance tests against its port.
- Deep and shallow meet through dependency inversion. The deep module owns the logic and depends on ports. Shallow adapters implement the ports, and the Composition Root injects them (ADR 0008). "One adapter means a hypothetical seam; two adapters means a real one."

### Classification: three kinds, each with checkable rules

Everything below is my proposal [I]. Each rule is something dependency-cruiser, Biome or a small sensor can check. The aim is that the limit of 15 costs more than it gives unless the module really is deep.

| Kind | Where | Complexity limit | Imports allowed (dependency-cruiser) | Test rule |
|---|---|---|---|---|
| **Deep module** | a concept directory listed in `biome.json` and `.dependency-cruiser.cjs` | 15 | `@memex/contracts`, files of its own directory, the entry file of another deep module, and **type-only** imports of ports. No `node:*` built-ins (`dependencyTypes: ["core"]`), no npm packages (`npm`), no adapter packages (`fakes`, `providers/*`, `worlds`) | Tests import only the entry file. At least one test file uses fast-check |
| **Adapter** | a package that implements a port from `@memex/contracts`: `memex/packages/fakes`, `memex/providers/*`, `factory/validation/worlds`; and named I/O files inside runtime (see below) | 10 | as now (contracts only for Providers); may use `node:*` and its declared npm packages | Must pass the port's Conformance Suite (GLOSSARY: "Conformance Suite") |
| **Shallow module** (default) | everything else | 10 | as now | normal unit tests |

dependency-cruiser has the data these rules need. Its dependency types include `core` (Node built-ins) and `type-only` [R] (read in the 18.9.0 type declarations, `shared-types.d.mts`). The repo already sets `tsPreCompilationDeps: true`, so type-only imports are seen [O, repo].

The rules for a deep directory `D`, written as dependency-cruiser `forbidden` rules (sketch):

1. `deep-no-io`: from `^D/` (excluding `\.test\.ts$`) to `dependencyTypes: ["core", "npm"]` is forbidden. Comment: "D is a deep module: it does no I/O. Put the I/O behind a port in @memex/contracts and let the Composition Root inject an adapter."
2. `deep-no-adapters`: from `^D/` to `fakes`, `providers/*` or `worlds` is forbidden. Comment: "Depend on the port, not on an adapter."
3. `deep-entry-only`: from outside `^D/` to `^D/` other than `D/<name>.ts` is forbidden. Comment: "Import D only through D/<name>.ts; its other files are hidden."
4. `deep-tests-through-interface`: from `^D/.*\.test\.ts$` to `^D/` other than the entry file is forbidden. This makes "the interface is the test surface" mechanical. A refactor inside `D` cannot break a test.
5. Ports that `D` needs are types. A non-type import of a port module from `D` is forbidden (`dependencyTypesNot: ["type-only"]`).

A sensor in `harness/sensors/` (run in `pnpm check`) checks what dependency-cruiser cannot:

- The deep list in `biome.json` and in `.dependency-cruiser.cjs` is the same, and each entry is an existing concept directory.
- The entry file of each deep directory has at most N runtime exports (for example 5; exported types do not count).
- Each deep directory has a test file that imports `fast-check`.
- Each port in `@memex/contracts` that has an adapter has a Conformance Suite, and each adapter's test calls it.
- The seam rule: a port with one adapter is reported as a hypothetical seam (a warning, not a failure). A fake used only to run the Conformance Suite counts as the second adapter. This is a choice; see the open questions.

### Why an agent cannot just move code to get 15

- The list lives in `biome.json` and `.dependency-cruiser.cjs`. Both are in `permissions.deny` [O, repo `tech-stack.md`]. Only the user, or `planner` with the user, can add a directory. A change made through a script is caught by the git checks of the cleanup stories [O, repo].
- Even inside a listed directory, code that does I/O, imports an npm package, or imports an adapter fails `deep-no-io` or `deep-no-adapters`. Adapter-like code, which is the shallow kind, cannot sit there [I].
- A wide interface fails the export limit, and outside callers fail `deep-entry-only`. A directory that is large because it holds many small functions gets nothing [I].
- Tests that reach inside fail `deep-tests-through-interface`. So the higher limit comes with stricter testing [I].
- New directories start shallow, with the limit of 10 [I].

### Fit with the current layout

Checked against project-structure.md, code-style.md, contracts.md and the code [O, repo]:

| Item | Fits | Does not fit yet |
|---|---|---|
| Concept directories, one public entry `src/index.ts` per package, no barrels inside (project-structure section 2) | The deep entry file `D/<name>.ts` fits this pattern | The package entry `index.ts` re-exports from many directories. Deep rule 3 must allow the package `index.ts` as a caller |
| Providers and fakes depend only on contracts; Composition Root injects them (code-style section 1, ADR 0008) | This is the adapter kind exactly. Conformance Suites are already a GLOSSARY term | — |
| Dependencies come in from outside; no global state (code-style section 1, rule 2) | Deep rule 1 enforces this for deep modules | — |
| `action-executor/action-executor.ts` | Imports only `@memex/contracts` and a type from `../event-log/event-log.ts`. Policy, Environment, Event Log and clock come in as parameters. It already has the deep shape | It defines `ActionPolicy` and `ActionEnvironment` itself. contracts.md lists Policy and Environment as ports in the contracts. Move the port types to `@memex/contracts`. Its interface is still small because the logic is still small; at 10 it has no need for 15 |
| `action-executor/allow-all-policy.ts` | — | It is a Policy adapter that lives inside the core. By the rules it is an adapter. It should be tested against a Policy Conformance Suite. It could also move to `fakes` or stay as the core's documented default |
| `composition-root/registry.ts` | Pure, in-process, no `node:*` import, errors as `Result`. Can be deep | — |
| `composition-root/load-resource-file.ts` | — | Imports `node:fs/promises` and the `yaml` package. That is I/O, so `composition-root/` as a whole cannot be deep. Split it: parsing (pure) stays; file reading becomes an adapter, or stays shallow |
| `event-log/event-log.ts` | The chain, queue and validation are deep logic | It imports `node:fs/promises` and `node:crypto` (`randomUUIDv7`) directly. contracts.md calls the Event Log a core component that "cannot be replaced", so there is no port for its storage. To be deep it needs a storage port (append a line, read lines) and an id source passed in. The file store becomes an adapter, and an in-memory store gives the second adapter, so the seam is real |
| Projector (contracts.md: `rebuild` must equal the original) | Planned; pure by nature. The best deep candidate | Not written yet |

So today no directory meets all the deep rules without a small change. Start with an empty deep list. Add the Projector, and the Event Log once its storage port exists [I].

### Two complexity limits in Biome, in short

Root rule 10. One override lists the deep directories with 15. Tests stay at 10. `harness/**` and `.claude/hooks/**` stay last and off. All of it is in `biome.json`, which is protected.

## 3. jscpd

jscpd 5 is a Rust binary in platform packages; flags and the config file are the same as v4 [O]. The npm package has optional platform dependencies (including `jscpd-windows-x64-msvc`) and no install script [R]. Check whether pnpm `allowBuilds` needs anything; probably not [I].

### Config (`.jscpd.json` at the root)

```json
{
  "path": ["memex", "factory/validation"],
  "format": ["typescript"],
  "minTokens": 50,
  "minLines": 5,
  "mode": "mild",
  "ignore": [
    "**/node_modules/**",
    "**/*.test.ts",
    "**/fixtures/**",
    "factory/validation/runs/**"
  ],
  "reporters": ["ai", "sarif"],
  "output": "factory/validation/runs/jscpd",
  "threshold": 1,
  "gitignore": true
}
```

Reasons:

- `minTokens` 50 and `minLines` 5 are the jscpd defaults [O]. They are a reasonable start for a small codebase; lower values report `import` blocks and Zod schema shapes [I].
- `mode` `mild` is the default [O].
- Tests are ignored. Repeated arrange code in tests is often clearer than a shared helper, and code-style section 9 prefers tests that read on their own [I]. Revisit if test duplication grows.
- `ai` is "Token-efficient output for LLM pipelines" [O]; `sarif` is for later CI upload [O]. The report goes under `factory/validation/runs/`, which is already ignored (AGENTS.md: no generated output in git) [O, repo].
- `threshold` 1: jscpd exits 1 above 1 % duplicated lines [O]. The 1 % matches Sonar's "AI Hardened" gate (vendor opinion, no data) [O].
- `gitignore` and `path` were not checked in the v5 README; the v5 README links `docs/rust.md` for the full options [O]. Pass `path` on the command line if the key is not supported [I].
- `harness/` is not scanned: it is protected and lenient (tech-stack.md) [O, repo].

### Off now, on later with one change

- Now: commit `.jscpd.json`, add the dev dependency, and add a script `"dup": "jscpd --config .jscpd.json"`. Do not add it to `check`. Add `.jscpd.json` to `permissions.deny` like the other check configs [I].
- Later: change `check` to include `&& pnpm run dup`. One line.
- knip will see `jscpd` used in `scripts`, so it is not reported as unused (knip reads `scripts`, as in V0-02) [O, repo]/[I].

### Overlap with Biome

Biome has no duplication rule [O]. jscpd is the single owner. Do not add sonarjs `no-identical-functions` [I].

## 4. fast-check for the core

### How to write them

- Use `fc.assert(fc.property(...))` or `fc.asyncProperty` inside normal Vitest tests [O]. `@fast-check/vitest` 0.5.0 supports Vitest 5 [R], but it is one more package and the plain API is enough (tech-stack principle 1) [I].
- Model-based tests: `fc.commands` with `fc.asyncModelRun`. Each command has `check`, `run` and `toString`. `fc.scheduledModelRun` explores async interleavings [O].
- Write hand-made arbitraries for the contract types. Do not add a Zod-to-arbitrary package [I].

### Event Log (`event-log.ts`)

The facts it relies on: appends go through an in-process promise queue; each event's `memexparent` is the id of the event before it; invalid events are rejected with a `Result`; `read` parses each JSONL line [O, repo].

| Test | Kind | Property |
|---|---|---|
| Append and read | model-based (`asyncModelRun`); model is an array | Commands: `Append(valid)`, `AppendInvalid`, `Read`, `Reopen` (a new `createEventLog` on the same file). After each `Read`, the events equal the model in order |
| Parent chain | property | For any sequence of appends: the first event has no `memexparent`; event *i* has `memexparent` = id of event *i − 1*, also across `Reopen` |
| Invalid append changes nothing | property | An `invalid-event` result leaves the file and the chain unchanged |
| Concurrent appends | property | `Promise.all` of N appends without awaiting in between: the chain still holds and N lines are written. To use `scheduledModelRun`, the file access must be injected as a port (a design change, not needed now) [I] |
| Round trip | property | Any valid event read back equals what was appended, except the generated `id` and `memexparent` |
| Torn last line | example test, then a property | A crash in the middle of a write leaves a half line. Today `read` throws. Decide the wanted behaviour first, then test it [I] |

Do not assert that ids sort in time order. The order is the file order. UUIDv7 ordering within one millisecond was not checked [I].

### Composition Root registry (`registry.ts`)

| Test | Property |
|---|---|
| Model-based register and instantiate | Model: `Map<type, kind>`. Commands: `Register(entry)`, `Instantiate(resource)`. Results: `duplicate-type` if the type is already in the map; `unregistered-type`, `kind-mismatch`, `invalid-config` and `create-failed` exactly when the model says so |
| Never throws | For arbitrary resources, configs and `create` functions that throw anything, `instantiate` resolves to a `Result` and never rejects |
| Schema before create | When `safeParse` fails, `create` is never called (a spy counts calls) |
| Order independence | Registering a set of distinct types in any order gives the same instantiate results |

### Action Executor (`action-executor.ts`)

Fakes: a policy that returns an arbitrary decision, an environment that records calls, an in-memory Event Log [I].

| Test | Property |
|---|---|
| Unknown action | No log append and no `environment.step` call |
| Not allowed | For any decision other than `allow`: `not-allowed`, no log append, no step |
| Allowed | Exactly one `memex.action.executed` event is appended before exactly one `step`; the event's `memexactor` follows from the origin (`strategy` → `agent`, `user` → `user`) |
| Log failure | If append fails: `log-failed`, and `step` is never called. This is "all changes through typed Actions" (ADR 0014) |
| Model-based sequence | Many `submit` calls: the log holds one event per allowed request, in submit order |

### Replay determinism

- No Projector exists yet [O, repo]. When it does: for any event list, `project(events)` run twice is deep-equal; `project(read(append(events)))` equals `project(events)`; and folding a prefix and then the rest equals folding everything, if the Projector is written as a fold [I].
- Trace hash: for any events, normalizing and then hashing twice gives the same hash; reordering object keys does not change it (canonical JSON); changing a non-volatile field does change it [I].

### Time budget, seeds and reproducibility

- `numRuns` defaults to 100. `seed` defaults to `Date.now()`. `path` replays a counterexample, and `endOnFailure` skips shrinking [O]. `fc.configureGlobal` sets them for all runners and fully resets the old settings [O].
- In `pnpm check`: set a fixed seed and a modest `numRuns` (for example 100, or 50 for model-based tests) in one Vitest setup file that calls `fc.configureGlobal`. The same inputs run every time, as code-style section 9 asks for deterministic tests [I].
- Exploration: a separate script, for example `test:explore`, with a random seed and more runs (1,000). Run it in cleanup stories. Not in `check` [I].
- When a property fails, fast-check prints the seed and `path` [O]. Pin the failing case: add a test with that `seed` and `path`, or add the value to `examples`. Keep it as a regression test (code-style section 9, rule 2) [O]/[I].
- Keep each property under about one second. Use temp directories for the Event Log, and do not use real timers. fast-check also has a time-limit option (`interruptAfterTimeLimit`); its default was not read on the page checked [S].

## 5. Final ownership table

One owner for each concern. "Off" lists what must not also check it.

| Concern | Owner | Settings | Off |
|---|---|---|---|
| Formatting | Biome formatter | as now | oxfmt, Prettier |
| Import order | Biome assist `organizeImports` | turn on explicitly | — |
| File names | Biome `useFilenamingConvention` | kebab-case | — |
| Directory names | review (project-structure.md) | — | no tool |
| Identifier names | Biome `useNamingConvention` | as now | — |
| Function style | Biome `useArrowFunction` + GritQL `no-function-declaration` | as now | — |
| Other syntax bans and taste rules | Biome rules and GritQL plugins in `harness/sensors/` | message says what to write instead | — |
| Complexity | Biome `noExcessiveCognitiveComplexity` | 10 default, 15 for listed deep modules | tsc, no other tool |
| Function and file size | Biome `noExcessiveLinesPerFunction`, `useMaxParams`, `noExcessiveLinesPerFile` | numbers to agree (first report: about 60, 3 or 4, about 400) | — |
| Deep-module checks the other tools cannot do | own sensor in `harness/sensors/` | lists equal, export limit, fast-check test present, Conformance Suite present, single-adapter warning | — |
| Module boundaries, cycles, entry points | dependency-cruiser | as now, plus the deep rules: no I/O, no adapters, entry only, tests through the entry file, ports type-only | Biome `noImportCycles`, `noRestrictedImports`, `noPrivateImports` |
| Adapter correctness | Conformance Suites in Vitest | one suite per port; every adapter runs it | — |
| Unused files, exports, dependencies | knip | as now | — |
| Unused locals and imports | Biome `noUnusedVariables`, `noUnusedImports` | `error` | tsc `noUnusedLocals`, `noUnusedParameters` |
| Duplication | jscpd | `.jscpd.json` above; joins `check` later | — |
| Type checking | tsc (TypeScript 7) | `strict` and the current flags | — |
| `enum`, `namespace`, parameter properties | tsc `erasableSyntaxOnly` | as now | Biome `noEnum`, `noNamespace`, `noParameterProperties` (to remove, for one owner) |
| Type-aware lint | Biome nursery types rules | `noFloatingPromises`, `noMisusedPromises`, `useExhaustiveSwitchCases` | — |
| Explicit return types | Biome `useExplicitType` | as now | — |
| `any`, non-null assertion | Biome `noExplicitAny`, `noNonNullAssertion` | as now | — |
| Environment variables | Biome `noProcessEnv` | off only for the Composition Root | — |
| Test hygiene | Biome `noFocusedTests`, `noSkippedTests` | as now | — |
| Security data flow | CodeQL default setup | when V0 merges into `main` | Semgrep CE |
| Local security patterns | Biome `security` group (recommended) | as now | — |
| Formal checks of the core | fast-check in Vitest | fixed seed in `check`, exploration script | TLA+, Lean |
| Marker words, CJK, commit messages | own sensors | as now | — |

## Open questions for the user

1. Start with an empty deep list? Or refactor first, so that it can hold the Event Log (storage port and injected id source) and later the Projector?
2. Is an export limit of 5 for a deep module's entry file acceptable?
3. Does a fake that exists only to run the Conformance Suite count as the second adapter, which makes the seam real?
4. Where do the port types the core needs (`ActionPolicy`, `ActionEnvironment`) live: in `@memex/contracts`, as contracts.md says, or in runtime as now? And does `allow-all-policy.ts` stay in the core?
5. jscpd `threshold` 1 % and tests ignored: accept?
6. The torn-last-line behaviour of the Event Log: skip the half line, or fail with a clear `Result`? The property test needs this decision.
7. Remove the Biome `noEnum`, `noNamespace` and `noParameterProperties` rules, so that tsc is the one owner? These are protected files, so the change needs you.

## Not verified

- Per-override rule options in Biome: the docs do not state it in words. One trial run settles it.
- Whether `noUnsafeReturn` and `useExhaustiveSwitchCases` are still nursery in 2.6.8, and their exact names.
- The jscpd v5 config keys `path` and `gitignore` (the README shows other keys; full options are in `docs/rust.md`).
- Whether Biome's CLI output links to the rule page; whether oxlint JS plugins can attach a docs URL.
- The default of fast-check `interruptAfterTimeLimit`.

## Sources

- Biome linter overview, fixes, severities: https://biomejs.dev/linter/
- Biome plugins (GritQL, JavaScript, `fix_kind`, `includes`): https://biomejs.dev/linter/plugins/
- Biome GritQL reference: https://biomejs.dev/reference/gritql/
- Biome reporters: https://biomejs.dev/reference/reporters/
- Biome configuration and overrides: https://biomejs.dev/reference/configuration/
- Biome CLI (`--suppress`, `--staged`): https://biomejs.dev/reference/cli/
- Biome blog list (2.4, 2.5, 2.6): https://biomejs.dev/blog/ ; v2.6: https://biomejs.dev/blog/biome-v2-6/ ; roadmap 2026: https://biomejs.dev/blog/roadmap-2026/
- Biome `noFloatingPromises`: https://biomejs.dev/linter/rules/no-floating-promises/
- Biome `noExcessiveCognitiveComplexity`: https://biomejs.dev/linter/rules/no-excessive-cognitive-complexity/
- oxlint rules: https://oxc.rs/docs/guide/usage/linter/rules.html
- oxlint CLI: https://oxc.rs/docs/guide/usage/linter/cli.html
- oxlint output formats: https://oxc.rs/docs/guide/usage/linter/output-formats.html
- oxlint and coding agents: https://oxc.rs/docs/guide/usage/coding-agents.html
- oxlint configuration and overrides: https://oxc.rs/docs/guide/usage/linter/config.html
- oxlint JS plugins: https://oxc.rs/docs/guide/usage/linter/js-plugins.html ; writing them: https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html
- oxlint type-aware linting: https://oxc.rs/docs/guide/usage/linter/type-aware.html ; tsgolint stable: https://oxc.rs/blog/2026-07-22-type-aware-linting-stable
- oxfmt beta: https://oxc.rs/blog/2026-02-24-oxfmt-beta
- jscpd 5.4.3 README (package contents, `npm pack jscpd@5.4.3`); options: https://github.com/kucherenko/jscpd/blob/master/docs/rust.md
- fast-check model-based testing: https://fast-check.dev/docs/advanced/model-based-testing/ ; global settings: https://fast-check.dev/docs/configuration/global-settings/ ; parameters: https://fast-check.dev/docs/api/interfaces/Parameters/ ; Vitest integration: https://github.com/dubzzz/fast-check/blob/main/packages/vitest/README.md
- Sonar "AI Hardened" settings (1 % duplication): https://www.sonarsource.com/blog/how-to-optimize-sonarqube-for-reviewing-ai-generated-code/
- dependency-cruiser 18.9.0 type declarations (`types/shared-types.d.mts`: dependency types `core`, `npm`, `type-only`), via `npm pack dependency-cruiser@18.9.0`
- Repository files read: `factory/design/architecture/contracts.md`, `factory/design/GLOSSARY.md` (Conformance Suite), `factory/design/project-structure.md`, `factory/design/code-style.md`, `factory/design/tech-stack.md`, `biome.json`, `.dependency-cruiser.cjs`, `knip.json`, `vitest.config.ts`, `memex/packages/runtime/src/{event-log,composition-root,action-executor}/*.ts`
