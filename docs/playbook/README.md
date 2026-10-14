# Playbook: Starting and Running Agent-Driven Projects

This playbook is a language-agnostic framework and checklist for software projects that AI agents help build. It says what to prepare before the first line of product code, and how to keep the plan, the code, and the docs consistent during development. It was extracted from the preparation work on a real project, but it is **self-contained**: you can copy this directory into another project, or share it on its own, without any other document.

## Files

| File | Content |
|---|---|
| [framework.md](./framework.md) | The framework: core ideas, seven phases (define, decide, architect, guardrails, plan, operate, maintain), how to scale it, common pitfalls |
| [delivery-planning.md](./delivery-planning.md) | The delivery planning standard: how planners write issues and epics, set dependencies, the suggested order, and the rules for parallel work, verify results, and sync status |
| [testing.md](./testing.md) | Testing at scale: who owns which tests, minimum practices, nice-to-have practices, copyable acceptance lines |
| [review.md](./review.md) | The review standard: what a reviewer (person or agent) examines, in which order, how to decide, and how to settle a disagreement |
| [feedback.md](./feedback.md) | Feedback loops: what useful feedback is, review findings, where feedback comes from, the order of sources when feedback conflicts, and how feedback goes back into the harness |
| [checklist.yaml](./checklist.yaml) | The checklist as structured data. Each item says what to check, when it is done, its place in the harness, why the harness needs it, and its weight. Shape: [checklist.schema.json](./checklist.schema.json) |
| [document-map.md](./document-map.md) | Which standard documents to prepare: purpose, audience, owner, when to create, when to update, writing standard |
| [writing-standards.md](./writing-standards.md) | Writing standards: a single glossary, which documents use ASD-STE100, explanatory writing, dates and evidence |
| [practices.md](./practices.md) | Collaboration and judgment practices: four-dimension confidence, sync before writing code, search before asking, live verification tiers, and more |
| [language-profiles.md](./language-profiles.md) | Tool matrix per language (Node/TypeScript, Python, C#) and how to add a language |
| [templates/](./templates/) | Templates: ADR, story, epic, AGENTS.md, research note |

## How to use

1. Read sections 1 and 2 of [framework.md](./framework.md) for the core ideas and the phases. Read [practices.md](./practices.md) for how people and agents work together.
2. Select the phases for your project size from section 4 of [framework.md](./framework.md).
3. Select your language in [language-profiles.md](./language-profiles.md). Select one tool for each role (package manager, formatter, tests, and so on).
4. Copy [checklist.yaml](./checklist.yaml) into the project and work through it. Set the status and the date of each item, and score it at the end of each milestone.
5. Create the documents from [document-map.md](./document-map.md). Write them to [writing-standards.md](./writing-standards.md).
6. Plan delivery with [delivery-planning.md](./delivery-planning.md). Set the test rules with [testing.md](./testing.md), the review procedure with [review.md](./review.md), and the feedback rules with [feedback.md](./feedback.md).
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
- Does not fit: one-off scripts and throwaway prototypes.
- The playbook has been shaped by one project so far. It has not been used in a second project. When you first use it elsewhere, write back what you find.

## Change log

| Date | Change |
|---|---|
| 2026-10-13 | First version: framework, checklist, templates, document map, writing standards (glossary, ASD-STE100), collaboration practices. The language matrix waits for the Python and C# research. |
| 2026-10-14 | Added logging, monitoring, and errors: agent access through files, command-line tools, or MCP (read-only, content treated as data); the OpenTelemetry log data model with trace context; one wide event per unit of work; exceptions as correlated log records, cause chains, stable error codes, one record per error, one style for expected failures. Added role 13 (telemetry and logging) to the language matrix, versions checked on 2026-10-14. |
| 2026-10-14 | Expanded the Git conventions: commit history as the agents' record of project history, body and trailer rules, pull request titles for squash merges, server-side enforcement because local hooks can be skipped, and no `--no-verify` for agents. |
| 2026-10-14 | Cross-checked the delivery planning standard against the framework and the practices: confidence levels, search before asking, front-loaded limits, tools before instructions, Definition of Ready as high confidence, Definition of Done in verification, live verification tiers, thinnest end-to-end first, cleanup stories, handling a stop (on hold, blocked, waiting), and delivery health signals. |
| 2026-10-14 | Made the playbook a team standard for the complex case (several people and agents in parallel). Generalized roles to planners and implementers. Added parallel work, pull requests, and merge conflicts. Removed the language-policy section (English is the default). Section references now use section names, not numbers. Removed every reference to the source project, its files, and its domain terms, so that the playbook can be shared on its own. Added the delivery planning standard, adapted for several implementers working in parallel (claims, conflict groups, WIP limits, more status values). |
| 2026-10-14 | Added the layers of checks (agent session hooks, git hooks, CI and server rules, after integration): when each runs, what it runs, who passes through it, whether it can be skipped, and its job. Rules: an inner layer runs a subset of the next, the outermost gate runs everything, one source for each rule, say which layer is the gate, expensive checks report before they block, protect the checks from the code they check. |
| 2026-10-14 | Added testing.md: test ownership (gate and acceptance tests written by someone other than the implementer and protected; a wrong protected test makes the issue blocked), minimum practices (short machine-readable output, agent session hooks, deterministic tests, no retries in gates, verify behaviour as a user, server enforcement, tests that prove they can fail, no coverage threshold), and nice-to-have practices (mutation testing report only, random order, test impact analysis, flaky platforms, hermetic tests, contract tests, visual regression, LLM evaluations, harness review). Added role 14 (mutation testing) to the language matrix. |
| 2026-10-14 | Added a score to the checklist: each item has a harness weight (W3 core harness, W2 strengthens, W1 nice to have), separate from Required and Recommended. The score is the weighted share of done items; the core is the share of done W3 items, and agents work on their own only when the core is complete. Added checklist items for short machine-readable output, agent session hooks, verifying behaviour as a user with evidence, and a required full check on the server. |
| 2026-10-14 | Replaced checklist.md with checklist.yaml and checklist.schema.json. Each item now has a stable id and says what to check, when it is done, its harness role, control, and timing, why the harness needs it, and why it has its weight. The file is a reference for people and agents; no scoring program. |
| 2026-10-14 | Added feedback.md: useful feedback is feedback the receiver acts on correctly; messages of custom checks say what is wrong, what to do, and where to read more; review findings have a failure scenario and are confirmed before code changes; a fixed order of sources settles conflicts, with no weakening of checks and a stop on oscillation; repeated problems move up a ladder (check, then guide, then AGENTS.md); checks get feedback too; a feedback log that is added to and merged, never rewritten. Checklist: extended short-machine-readable-output, agent-session-hooks, ready-done-blocked, and agents-md; added review-findings-format, feedback-on-checks, and feedback-log (all weight 2). Setups specific to large organizations or vendors are left out. |
| 2026-10-14 | Reviewed the whole playbook so that each rule fits any project, team size, domain, language, platform, and agent tool, and each word has one meaning. Defined the words once in framework.md: owner (the person who decides), planner, implementer, issue (story, epic), user (a person who uses the product); replaced "ticket" with "issue" and "user" with "owner" where it meant the person who decides. Stated the concept behind domain examples: tests go where a failure hits what matters most in the project, with money values in a payment product as one example; roles such as tech lead, architect, and business analyst can be people or agents. Removed rules that fit only some platforms or products: listen only on localhost, a risk list only for LLM products, hosting-platform details, a vendor's document as a source of a principle. Project sizes now map to the checklist levels (small: Required items; medium: plus the Recommended items that fit; large: all). log-format is now Recommended, because a project with no running service has no logs. Added fallbacks for agent tools without hooks or persistent memory, and CI results to agent log access. The AGENTS.md template has the attempt limit and the conflict rule. The document map lists the checklist copy and the feedback log. |
| 2026-10-14 | Closed the workflow loops, after a test of the playbook with three roles (a planner, an implementer, a reviewer). Added the workflow (states, owner of each state, condition of each transition; "in review" and "verifying"; merge before verification; a round limit). Added review.md, the reviewer's procedure. Added the release loop (trigger, smoke test after release, rollback, watch time, postmortems with owned and dated actions). Added loop cards (trigger, who acts, verifier and evidence, done when, limit, escalation, record) for every loop, and closure rules. Acceptance tests are written as examples of the requirement by the planner; the implementer writes only the connecting code. Changes to the structure need an ADR. Checklist: added workflow-states, release-loop, and workflow-closure-check; extended review-findings-format and change-process. |
| 2026-10-13 | Translated the playbook into English. Added the language matrix (Node/TypeScript, Python, C#), with versions checked against npm, PyPI, and NuGet on that date. |
