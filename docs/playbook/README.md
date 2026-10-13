# Playbook: Starting and Running Agent-Driven Projects

This playbook is a language-agnostic framework and checklist for software projects that AI agents help build. It says what to prepare before the first line of product code, and how to keep the plan, the code, and the docs consistent during development. It was extracted from the preparation work on a real project, but it is **self-contained**: you can copy this directory into another project, or share it on its own, without any other document.

## Files

| File | Content |
|---|---|
| [framework.md](./framework.md) | The framework: core ideas, seven phases (define, decide, architect, guardrails, plan, operate, maintain), how to scale it, common pitfalls |
| [delivery-planning.md](./delivery-planning.md) | The delivery planning standard: how planners write issues and epics, set dependencies, the suggested order, and the rules for parallel work, verify results, and sync status |
| [checklist.md](./checklist.md) | A checklist. Each item has a done criterion and is marked "required" or "recommended" |
| [document-map.md](./document-map.md) | Which standard documents to prepare: purpose, audience, owner, when to create, when to update, writing standard |
| [writing-standards.md](./writing-standards.md) | Writing standards: a single glossary, which documents use ASD-STE100, explanatory writing, dates and evidence |
| [practices.md](./practices.md) | Collaboration and judgment practices: four-dimension confidence, sync before writing code, search before asking, live verification tiers, and more |
| [language-profiles.md](./language-profiles.md) | Tool matrix per language (Node/TypeScript, Python, C#) and how to add a language |
| [templates/](./templates/) | Templates: ADR, story, epic, AGENTS.md, research note |

## How to use

1. Read sections 1 and 2 of [framework.md](./framework.md) for the core ideas and the phases. Read [practices.md](./practices.md) for how people and agents work together.
2. Select the phases for your project size from section 4 of [framework.md](./framework.md).
3. Select your language in [language-profiles.md](./language-profiles.md). Select one tool for each role (package manager, formatter, tests, and so on).
4. Work through [checklist.md](./checklist.md). Tick each item when it is done and write the date.
5. Create the documents from [document-map.md](./document-map.md). Write them to [writing-standards.md](./writing-standards.md).
6. Plan delivery with [delivery-planning.md](./delivery-planning.md).
7. Copy a template from [templates/](./templates/) when you write an ADR, a story, an epic, an AGENTS.md, or a research note.

## Maintenance rules

- **Owner**: a planner (a person or an agent) who maintains the team's standards. The owner of the standard confirms each change before it is committed.
- **Source**: every practice comes from a real project. Its status says **used**, **designed**, or **researched**. "Used" does not mean the practice is proven to work.
- **When to update**:
  1. When the source project confirms, rejects, or changes a practice, update it here and give the reason.
  2. Check the tools and versions in the language matrix every quarter, or before you use them in a new project. Write the date of the check.
  3. When you use the playbook in a new project and find a gap or an error, write it back here.
- **A team standard for the complex case**: write every rule for several people and several agents working in parallel. Do not assume one person or one agent. Simple projects drop what they do not need.
- **No project-specific content**: do not name or describe a specific project, its files, or its domain terms. The playbook must make sense to a reader who has never seen the project it came from. Use generic examples.
- **No tool facts from memory**: get versions and capabilities from a command or the official docs. Write the source and the date.
- **Change log**: at the end of this file.

## Scope and limits

- Fits: software projects that AI agents help build and that live longer than a few weeks.
- Does not fit: one-off scripts and throwaway prototypes. For these, use only the "required" items of the checklist.
- The playbook has been shaped by one project so far. It has not been used in a second project. When you first use it elsewhere, write back what you find.

## Change log

| Date | Change |
|---|---|
| 2026-10-13 | First version: framework, checklist, templates, document map, writing standards (glossary, ASD-STE100), collaboration practices. The language matrix waits for the Python and C# research. |
| 2026-10-14 | Made the playbook a team standard for the complex case (several people and agents in parallel). Generalized roles to planners and implementers. Added parallel work, pull requests, and merge conflicts. Removed the language-policy section (English is the default). Section references now use section names, not numbers. Removed every reference to the source project, its files, and its domain terms, so that the playbook can be shared on its own. Added the delivery planning standard, adapted for several implementers working in parallel (claims, conflict groups, WIP limits, more status values). |
| 2026-10-13 | Translated the playbook into English. Added the language matrix (Node/TypeScript, Python, C#), with versions checked against npm, PyPI, and NuGet on that date. |
