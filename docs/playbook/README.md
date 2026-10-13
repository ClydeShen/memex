# Playbook: Starting and Running Agent-Driven Projects

This playbook is a language-agnostic framework and checklist for software projects that AI agents help build. It says what to prepare before the first line of product code, and how to keep the plan, the code, and the docs consistent during development. It was extracted from the preparation work on Memex, but it is **self-contained**: you can copy this directory into another project and use it without any other Memex document.

## Files

| File | Content |
|---|---|
| [framework.md](./framework.md) | The framework: core ideas, seven phases (define, decide, architect, guardrails, plan, operate, maintain), how to scale it, common pitfalls |
| [checklist.md](./checklist.md) | A checklist. Each item has a done criterion and is marked "required" or "recommended" |
| [document-map.md](./document-map.md) | Which standard documents to prepare: purpose, audience, owner, when to create, when to update, writing standard |
| [writing-standards.md](./writing-standards.md) | Writing standards: language policy, a single glossary, which documents use ASD-STE100, explanatory writing, dates and evidence |
| [practices.md](./practices.md) | Collaboration and judgment practices: four-dimension confidence, sync before writing code, search before asking, live verification tiers, and more |
| [language-profiles.md](./language-profiles.md) | Tool matrix per language (Node/TypeScript, Python, C#) and how to add a language |
| [templates/](./templates/) | Templates: ADR, story, epic, AGENTS.md, research note |

## How to use

1. Read sections 1 and 2 of [framework.md](./framework.md) for the core ideas and the phases. Read [practices.md](./practices.md) for how people and agents work together.
2. Select the phases for your project size from section 4 of [framework.md](./framework.md).
3. Select your language in [language-profiles.md](./language-profiles.md). Select one tool for each role (package manager, formatter, tests, and so on).
4. Work through [checklist.md](./checklist.md). Tick each item when it is done and write the date.
5. Create the documents from [document-map.md](./document-map.md). Write them to [writing-standards.md](./writing-standards.md).
6. Copy a template from [templates/](./templates/) when you write an ADR, a story, an epic, an AGENTS.md, or a research note.

## Maintenance rules

- **Owner**: the planning agent. The project owner confirms each change before it is committed.
- **Source**: every practice comes from a real project. Its status says **used**, **designed**, or **researched**. "Used" does not mean the practice is proven to work.
- **When to update**:
  1. When the source project confirms, rejects, or changes a practice, update it here and give the reason.
  2. Check the tools and versions in the language matrix every quarter, or before you use them in a new project. Write the date of the check.
  3. When you use the playbook in a new project and find a gap or an error, write it back here.
- **No project-specific content**: Memex appears only as an example. An example is not a rule.
- **No tool facts from memory**: get versions and capabilities from a command or the official docs. Write the source and the date.
- **Change log**: at the end of this file.

## Scope and limits

- Fits: software projects that AI agents help build and that live longer than a few weeks.
- Does not fit: one-off scripts and throwaway prototypes. For these, use only the "required" items of the checklist.
- The playbook has been shaped by one project (Memex) so far. It has not been used in a second project. When you first use it elsewhere, write back what you find.

## Change log

| Date | Change |
|---|---|
| 2026-10-13 | First version: framework, checklist, templates, document map, writing standards (glossary, ASD-STE100), collaboration practices. The language matrix waits for the Python and C# research. |
| 2026-10-13 | Translated the playbook into English. Added the language matrix (Node/TypeScript, Python, C#), with versions checked against npm, PyPI, and NuGet on that date. |
