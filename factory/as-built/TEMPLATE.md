---
package: "@memex/runtime"
covers:
  - memex/packages/runtime/src/**
  - memex/packages/runtime/package.json
verified-at: <the 40-character hash of HEAD when the page was checked>
verified-on: <YYYY-MM-DD>
verified-by: <story number, for example V0-29>
design-refs:
  - factory/records/decisions/0008-dependency-inversion-and-config-driven-composition.md
  - factory/design/architecture/contracts.md
---

# @memex/runtime as built

> This page describes what the code **is now**, not what is planned (that is in the design documents). Field details are in the generated JSON Schema and are not repeated here.
> Last checked at commit `<short hash>` (<YYYY-MM-DD>). The files checked are listed in the front matter under covers.

## 1. Responsibility

<One to three sentences: what this package does and what it does not do. Use the terms of GLOSSARY.md.>

Design: <ADR number or a link to the section of a design document>.

## 2. Public entry point

- The only entry point: [`src/index.ts`](../../memex/packages/runtime/src/index.ts).
- Exports (generated): [generated/exports.md](./generated/exports.md)
- Contracts and schemas: [generated/json-schema/](./generated/json-schema/)

## 3. Internal structure

| Directory | Responsibility (one sentence) | Key files | Design |
|---|---|---|---|
| `event-log/` | <responsibility> | [`append-event.ts`](../../memex/packages/runtime/src/event-log/append-event.ts) | <ADR or section> |
| `<directory>/` | | | |

List only the important concept directories, not the plain and simple ones.

## 4. Dependencies

- Allowed dependencies: <the rules from `.dependency-cruiser.cjs`; give the path of the rule file, do not copy the rules>
- Current dependency graph (generated): [generated/dependency-graph.md](./generated/dependency-graph.md)
- Dependencies that need an explanation: <only the dependencies that are not obvious, and why>

## 5. Key invariants

| Invariant | Test that proves it |
|---|---|
| <a constraint that reading the code does not show> | [`<file under test>.test.ts`](../../memex/packages/runtime/src/<directory>/<file under test>.test.ts) |

Every row must have a test. An invariant without a test goes in section 7.

## 6. Deviations from the design

| What the design document says | What the code does | Reason / status |
|---|---|---|
| <document path and section: what it says> | <what the code actually does> | <why; whether the design document was updated> |

When there is no deviation, write "None" and keep this section.

## 7. Known gaps

- <parts that are in the design but not in the code yet; give the issue number for each>

## 8. How to check this page

```sh
pnpm docs:check          # paths, links, front matter
pnpm docs:stale          # changes in the covered files since verified-at
pnpm check
```

Every path and symbol in backticks on this page must be found in the covered files.
