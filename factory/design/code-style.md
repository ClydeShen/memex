# Code style and constraints

This file sets the shared code style of Memex. For the toolchain, see [tech-stack.md](./tech-stack.md). For architecture constraints, see [roadmap.md](./roadmap.md) section 1 and the ADRs.

- **Status**: accepted (2026-10-11).
- **Position**: these are style guidelines, not dogma. Judge each case by best practice. If a rule clearly makes the code worse in a place, do not apply it there, and write a one-line "why" comment next to the code (see section 10). **What matters most is a consistent style across the whole codebase.**
- **How it is enforced**: each rule says how it is checked:
  - **[Auto]**: a tool checks it, and the check fails on a violation. The rule name is in parentheses.
  - **[Review]**: no tool can check it; code review does.
- The configuration of the automated checks lands in V0.1. If a rule turns out not to be workable during configuration, change this file.

---

## 1. Dependency inversion and SOLID

Dependency inversion (DIP) is the most important rule. It is ADR 0008 and constraint A2 at the code level.

1. **Depend only on the contracts.** A Provider can import only `@memex/contracts`. Core code does not import any concrete Provider. Concrete implementations are imported only in the **composition entry point** and recorded in the registry (GLOSSARY: Composition Root; for the dependency direction, see project-structure.md). Providers cannot import each other. **[Auto]** (dependency-cruiser)
2. **Dependencies come in from outside.** Everything a function or a Provider needs comes in through parameters or the context at `init`. Do not import concrete implementations inside, and do not read global state. **[Review]**
3. **Only the Composition Root can read environment variables.** Configuration needed elsewhere is read by the Composition Root and passed in. **[Auto]** (`noProcessEnv`, except in the Composition Root)
4. **Use factory functions instead of classes.** Write Providers and other components as factory functions that take dependencies and return an object. Then there is no `this`, and no wrong `this` binding. It also matches the arrow function style of section 2. **[Review]**
5. **Use the other four SOLID principles as design references, not mechanically.** For example, single responsibility does not mean "one function per file"; interface segregation means that ports are small and a Provider gets only the `services` it really needs. **[Review]**

```ts
// Preferred: a factory function, dependencies passed in as parameters, only contract types referenced
import type { IntuitionProvider, Judgement } from "@memex/contracts";

export const createFakeIntuition = (config: FakeIntuitionConfig): IntuitionProvider => ({
  kind: "intuition",
  type: "intuition.fake",
  capabilities: { supportsLogprobs: false },
  judge: async (state, questions) => judgeWithSeed(config.seed, state, questions),
  dispose: async () => {},
});
```

In the example, the configuration comes in through the factory parameters. Only one of this and `init(config, ctx)` in contract v0 is kept; V0 decides which (contracts.md section 6).

## 2. How to write functions

1. **Use arrow functions by default**, written as `const name = (...) => ...`. **[Auto]** (`useArrowFunction`, covers only function expressions) **[Review]** (function declarations)
2. **`function` is allowed in these cases**:
   - Function overloads: TypeScript overload signatures can be written only on `function` declarations;
   - Cases that really need hoisting.
3. **Exported functions state their return type.** The return type is part of the interface. When it is written out, a signature change is found earlier. **[Auto]** (`useExplicitType`)
4. **Do not change the parameters passed in.** **[Auto]** (`noParameterAssign`)

> Whether to forbid `function` declarations with a Biome 2 GritQL plugin is decided after a test in V0.1.

## 3. Control flow: return early

1. **Handle special cases and failures first, and return at once.** Put the main flow last, not nested inside an `if`.
2. **If the `if` already returned, do not write an `else` after it.** **[Auto]** (`noUselessElse`)
3. **If nesting gets too deep, split the function.** **[Auto]** (`noExcessiveCognitiveComplexity`)
4. **Do not nest ternary expressions.** **[Auto]** (`noNestedTernary`)

```ts
// Preferred
const authorize = (action: ActionRequest, actor: Actor): Decision => {
  if (!isKnownAction(action.name)) return deny("unknown action");
  if (!canExecute(actor, action)) return deny("actor lacks permission");
  return allow();
};
```

## 4. pipe / compose

1. **Chain pure data transformations with `pipe`**, so that each step is a small pure function. Good places are:
   - a Projector that builds a view from events;
   - normalizing a Trace and then hashing it;
   - merging configuration overlays and then validating.
2. **Do not use `pipe` for flows with side effects or conditional branches.** For example, calling a model, writing a log or executing an Action is clearer as plain sequential code with early returns, and the call stack on an error is easier to read. **[Review]**
3. **Keep pipelines short.** Past five or six steps, merge some of them into a named function. Otherwise type inference and readability get worse. **[Review]**
4. **Implement `pipe` yourself**: in a shared utility module, a dozen or so lines, fully typed. Do not introduce functional frameworks such as fp-ts or Effect. The native JavaScript pipeline operator (`|>`) is still a proposal and cannot be used.

```ts
const traceHash = (events: readonly Event[]): string =>
  pipe(events, stripVolatileFields, canonicalize, sha256);
```

## 5. Error handling: control the blast radius

Memex has three natural isolation boundaries, from the inside out:

| Boundary | Approach |
|---|---|
| A single Provider call | Expected failures (model timeout, wrong response format, missing capability) are **return values**, expressed as `Result`, not thrown exceptions. Failures are also written to the Event Log as events, so they can be replayed |
| Composition Root startup | Configuration errors and capability mismatches **fail at once** with the reason (`CapabilityMismatch` in the contracts), not at runtime |
| A single Experiment process | The outermost safety net: one Experiment crashing does not affect other Experiments (ADR 0004) |

Rules:
1. **Use `throw` only for "the program is wrong"**, that is, cases that should be impossible, such as a broken invariant. **[Review]**
2. **Expected failures return a `Result`**: `{ ok: true, value } | { ok: false, error }`. Error types are discriminated unions, and the caller handles each error with a `switch`. **[Review]**
3. **Implement the `Result` type yourself**, in `@memex/contracts`, because it is part of the contracts. Do not introduce libraries such as neverthrow.
4. **Every Promise must be handled.** **[Auto]** (Biome `noFloatingPromises`; confirm in V0.1 that this rule is available)
5. **Contain external calls at the boundary.** When you call the Model Backend or another external system, convert exceptions into a `Result` at the call site, so that exceptions thrown by third parties do not reach the core code. **[Review]**

## 6. Data and immutability

1. **Immutable by default.** Use `const`, `readonly` and `ReadonlyArray`. When something must change, return a new object; do not modify the original. This matches the "append only, never modify" approach of Event Sourcing. **[Review]**
2. **Derive types from schemas.** Data types in the contracts are derived from Zod schemas (`z.infer`). Do not write a second copy of the same type. **[Review]**
3. **All data must be serializable as JSON** (a requirement of contract v0): data types in the contracts contain no functions, `Date`, `Map` or class instances. Times are ISO 8601 strings. **[Review]**

## 7. TypeScript and modules

1. **Turn on `strict`, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.** **[Auto]** (tsc)
2. **Use only erasable type syntax**, so that Node can run `.ts` directly: turn on `erasableSyntaxOnly`, and do not use `enum`, `namespace` or parameter properties. Use `as const` objects with union types instead of `enum`. **[Auto]** (tsc, and `noEnum`, `noNamespace`, `noParameterProperties`)
3. **Do not use `any`.** When a type is really unknown, use `unknown`, then validate or narrow it. **[Auto]** (`noExplicitAny`)
4. **Do not use the non-null assertion `!`.** **[Auto]** (`noNonNullAssertion`)
5. **Use only named exports**, no default exports. **[Auto]** (`noDefaultExport`)
6. **Use only ES modules** (ESM), not CommonJS. **[Auto]** (`noCommonJs`)

## 8. Naming

1. **Use the terms in GLOSSARY.md**, and avoid the words it lists under `_Avoid_`. For example, write `Claim`, not `fact`; `Capability`, not `tool`; `Observation`, not `input`. **[Review]**
2. **Case**: camelCase for variables and functions, PascalCase for types, kebab-case for file names. **[Auto]** (`useNamingConvention`, `useFilenamingConvention`) For directory and package names, see [project-structure.md](./project-structure.md).
3. **Factory functions start with `create`**, for example `createEventLog`. Functions that return a boolean start with `is`, `has` or `can`. **[Review]**

## 9. Tests: few and precise

The number of tests is not the goal. Testing the right things is.

1. **Focus on the critical points.** These must have tests:
   - **Contracts**: whether a schema accepts valid input and rejects invalid input; whether the generated JSON Schema validates the example configuration.
   - **The three V0 pass criteria**: reproducible, no leaks, replaceable.
   - **Invariants**: for example "the Projection is exactly the same after the log is replayed" and "the same seed gives the same result". Verify them with many random inputs generated by fast-check.
   - **Security gates**: the Policy check, and the capability check of the Composition Root.
2. **When you fix a bug, first write a test that reproduces it**, confirm that it fails, and then fix the code. Keep the test as a regression test.
3. **No coverage target.** Coverage reports are used only to find critical paths that are not tested, not as a pass gate.
4. **Test behavior, not implementation details.** Tests go through public interfaces (ports). An internal refactor should not need test changes.
5. **Tests are deterministic.** Do not depend on real time, the network or random numbers. When needed, pass in the clock and the seed as parameters (the same principle as "dependencies come in from outside" in section 1).
6. **Put test files next to the code under test**, named `*.test.ts`.

## 10. Self-explaining code, few comments

The code itself must make clear what it does. Comments explain only what the code cannot say.

1. **Names express intent.** A name should read like a sentence, for example `isExpired(claim, now)`, not `check(c, t)`. Use the terms in GLOSSARY.md (section 8). **[Review]**
2. **When you want to write a "what this does" comment, extract a function instead.** Extract that code into a small function, and name it after what the comment would say. **[Review]**
3. **No unnamed constants.** For example, write `2` as `const MIN_CHOICE_OPTIONS = 2`. Values that can be tuned (for example the fast path certainty threshold, which belongs to Calibration) are not constants. Put them in the configuration and read them from there. **[Auto]** (`noMagicNumbers`) **[Review]**
4. **Let types carry the meaning.** **[Review]**
   - Use a discriminated union instead of a set of boolean fields. For example, use `{ status: "refuted" }`, not `isRefuted: true, isContested: false`.
   - Do not pass booleans as bare parameters. Use an options object. For example, write `run(config, { replay: true })`, not `run(config, true)`.
5. **Functions are short and do one thing**, with the early returns of section 3, so that one reading is enough to understand them. **[Auto]** (`noExcessiveCognitiveComplexity`) **[Review]**
6. **Comments say "why", not "what".** Write a comment for:
   - a trade-off that is not obvious, for example "X is not used here because Y";
   - a constraint or quirk of an external system, for example "llama.cpp returns `B` and ` B` as two different tokens; both count toward the probability of option B";
   - a deliberate exception to a rule in this file, with the reason.

   Do not write: comments that repeat the code, commented-out old code, TODOs with no owner and no deadline. **[Review]**

   Comments, prompts and error messages in `memex/` explain themselves (ADR 0028): do not write ADR numbers or paths in `factory/` and `harness/`, do not mention experiments or Baselines, and do not tell "what it was before and why it changed". Write the needed reason in place, in the present tense. The history of a decision goes in the ADR, and the ADR and the as-built documents point to the code. **[Auto]** (marker word scan) **[Review]**
7. **Write contract documentation in the schema, not in comments.** Use Zod `.describe()` to document fields. The descriptions are exported to JSON Schema with `z.toJSONSchema()`, so editor completion and documentation can see them, and because the description and the code are the same thing, it does not go stale. **[Review]**

```ts
// Not preferred: the comment repeats the code
// check if certainty is high enough
if (j.certainty > 0.8) { ... }

// Preferred: the name states the intent; the threshold belongs to Calibration and is read from the configuration
const canTakeFastPath = (judgement: Judgement, calibration: Calibration): boolean =>
  judgement.certainty >= calibration.fastPathThreshold;

if (canTakeFastPath(judgement, calibration)) { ... }
```
