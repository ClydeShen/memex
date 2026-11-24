---
status: accepted
---

# Enforcement ladder, one owner for each check, and the agent-facing directories

This ADR amends ADR 0028 for `harness/`, `.githooks/`, `.claude/` and `.agents/`. The research is in `factory/records/research/code-quality-tooling-2026-11-24.md` and `factory/records/research/lint-tool-choice-2026-11-24.md`.

Most code is written by agents. A rule in a prompt is followed only when the model decides to follow it. A check that a program runs is applied every time. The user wants mechanical rules with clear boundaries, and error messages that tell the agent how to fix the problem (user decisions, 2026-11-24).

## Decision

1. **Enforcement ladder.** Put each rule at the highest level that can hold it:
   1. A program check: lint, type check, test, formatter, verification script.
   2. A Claude Code hook or permission rule. These are also programs.
   3. A prompt that loads on demand: a skill, or an `AGENTS.md` in a subdirectory.
   4. A prompt that always loads: the root `AGENTS.md`.
   5. A document.

   If an agent repeats a mistake that a rule at a lower level describes, move the rule up.
2. **One implementation, two trigger times.** Each check is one script or tool configuration. A Claude hook runs it early, on the edited file. A git hook runs it as the gate for every agent. A Claude-only check does not cover Codex, so the gate is always a git hook or `pnpm check`.
3. **Error messages.** A custom rule says what is wrong and how to fix it.
4. **One owner for each concern.** No second tool covers the same concern.

   | Concern | Owner |
   |---|---|
   | Format, lint, import order, naming, file names, complexity | Biome (only lint tool; oxlint, ESLint and sonarjs are not used) |
   | Types | `tsc` |
   | Module boundaries, cycles, deep-module rules | dependency-cruiser |
   | Unused files, exports, dependencies | knip |
   | Duplication | jscpd (configured now, on when product code starts) |
   | Security | CodeQL |
   | Properties of the core | fast-check, in Vitest |
   | Adapters | Conformance Suite of their port |
   | Git hooks | `.githooks/` (no Husky, no lint-staged) |

5. **Complexity.** Cognitive complexity is at most 15 in a deep module and at most 10 elsewhere. A deep module is listed in protected configuration and must follow the deep-module rules: no I/O and no Node built-ins, ports in `@memex/contracts` imported as types, imports only through its entry file, tests only through its entry file, and fast-check tests. Deep and shallow modules connect by dependency inversion: the deep module depends on a port, and the Composition Root injects an adapter (ADR 0008). A test fake counts as the second adapter.
6. **Directories.**

   | Directory | Holds | Does not hold |
   |---|---|---|
   | `harness/` | The only implementation of each check and tool, the standards, and the source of shared skills | Content that only Memex needs |
   | `.githooks/` | Scripts that call `pnpm` commands or `harness/` | Check logic |
   | `.claude/` | Claude hooks that call `harness/`, permission rules, copies of shared skills | Check logic, rules that other agents also need |
   | `.agents/` | Copies of shared skills for Codex, created with the first shared skill | Anything else |
   | `factory/` | Memex design, decisions, research, validation | How agents work, check rules |

   Shared prompt rules go in `AGENTS.md` files, which Codex and Claude Code both read. A skill copy must match its source in `harness/skills/`. A sensor checks this. Symbolic links are not used, because they fail on Windows.

## Considered Options

- **oxlint and oxfmt instead of Biome.** oxlint checks types with the TypeScript 7 checker. oxfmt is still 0.x, the JS plugins are alpha, and oxlint has no native cognitive-complexity or naming rule. Not chosen now. Look again when oxfmt reaches 1.0. The lost type rules are partly replaced by banning `as`, `any` and `!`.
- **TLA+ and Lean.** The system has no concurrent protocol yet, so the cost is high and the gain is low. fast-check model tests are used instead.
- **Husky.** It only sets the hook path, which `pnpm install` already does.

## Consequences

- A new rule needs a decision about its level and its owner before it is added.
- `harness/` holds more code, and `.claude/` holds less.
- The deep-module list starts empty. The first candidate is the Projector.
