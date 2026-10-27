# Playbook: Starting and Running Agent-Driven Projects

This playbook is a framework and checklist for software projects that AI agents help build. It says what to prepare before the first line of product code, how work moves between people and agents, and how to keep the plan, the code, and the docs consistent. You can copy this directory into another project, or share it on its own, without any other document.

## Files

| File | Content |
|---|---|
| [framework.md](./framework.md) | The map: core ideas, seven phases (define, decide, architect, guardrails, plan, operate, maintain), and how to scale them |
| [glossary.md](./glossary.md) | The terms and roles of the playbook |
| [workflow.md](./workflow.md) | How work moves, for all roles: states, Definitions of Ready, Done, and Blocked, transitions, round limit, release, loop cards, closure rules, delivery health |
| [delivery-planning.md](./delivery-planning.md) | The planner's tasks: write issues and epics, set dependencies and parallel work, verify and sync, report to the owner |
| [review.md](./review.md) | The reviewer's procedure: what to examine, in which order, how to decide, how to settle a disagreement |
| [guardrails.md](./guardrails.md) | Layers of checks, Git conventions, security and data requirements, logging and errors, parallel work and merge conflicts |
| [testing.md](./testing.md) | Who owns which tests, where to put tests, minimum and nice-to-have practices |
| [feedback.md](./feedback.md) | Useful feedback, review findings, the order of sources in a conflict, and how feedback goes back into the harness |
| [social-contract.md](./social-contract.md) | A catalog of team agreements for what tools do not enforce. Teams select from it |
| [practices.md](./practices.md) | Judgment practices: four-dimension confidence, search before asking, live verification tiers, and more |
| [writing-standards.md](./writing-standards.md) | How to write: one glossary, ASD-STE100 for procedures, explanatory writing, dates, decisions, evidence |
| [document-map.md](./document-map.md) | Which documents a project prepares, who maintains them, and when |
| [checklist.yaml](./checklist.yaml) | The setup checklist as structured data, with harness weights. Shape: [checklist.schema.json](./checklist.schema.json) |
| [language-profiles.md](./language-profiles.md) | Tools for each role, per language (Node/TypeScript, Python, C#), and how to add a language |
| [templates/](./templates/) | Templates: ADR, story, epic, AGENTS.md, research note |

## How to use

1. Read [framework.md](./framework.md) for the core ideas and the phases, and [glossary.md](./glossary.md) for the terms.
2. Select the phases for your project size (framework, section 4).
3. Select your language and one tool for each role in [language-profiles.md](./language-profiles.md).
4. Copy [checklist.yaml](./checklist.yaml) into the project and work through it. Score it at the end of each milestone.
5. Create the documents from [document-map.md](./document-map.md). Write them to [writing-standards.md](./writing-standards.md).
6. Set up the workflow with [workflow.md](./workflow.md). Give each role its standard: [delivery-planning.md](./delivery-planning.md) for planners, [review.md](./review.md) for reviewers, [templates/agents-md.md](./templates/agents-md.md) for implementing agents.
7. Set the guardrails, the tests, and the feedback rules with [guardrails.md](./guardrails.md), [testing.md](./testing.md), and [feedback.md](./feedback.md).
8. Select your team agreements from [social-contract.md](./social-contract.md). Copy the agreements for agents into AGENTS.md.

## Maturity

The playbook comes from the preparation work on one real project, in October 2026. That project had no product code yet. The playbook has not been used in a second project.

| Status | Meaning |
|---|---|
| **Used** | Applied in a real project, where it produced real artifacts (documents, issues, and so on). "Used" does not mean that the effect is proven |
| **Designed** | Specified in a real project's documents, but not implemented yet |
| **Researched** | Only researched. Not adopted in a real project yet |

| Part | Status |
|---|---|
| Documents, glossary, ADRs, research notes, writing standards, judgment practices | Used |
| Stories, epics, the ready mark, delivery planning | Used |
| Workflow states and transitions, review, verification flow, release, loop cards | Designed |
| Guardrails: layers of checks, Git conventions, logging and errors | Designed |
| Testing and feedback | Researched; parts designed |
| Social contract | Researched |
| Language profiles | Node/TypeScript designed; Python and C# researched |

## Maintenance rules

- **Maintainer**: a planner (a person or an agent) maintains the playbook. The owner confirms each change before it is committed.
- **When to update**:
  1. When a project that uses the playbook confirms, rejects, or changes a practice, update it here, give the reason, and update the maturity table.
  2. Check the tools and versions in the language profiles every quarter, or before you use them in a new project. Write the date of the check.
  3. When you use the playbook in a new project and find a gap or an error, write it back here.
- **One place for each rule**: each file has one purpose (the table above). Write a rule in the file that owns its topic, and link to it from other files. Do not copy it.
- **Written for teams**: write every rule for several people and several agents working in parallel. A smaller project drops what it does not need.
- **No project-specific content**: do not name or describe a specific project, its files, or its domain terms. Use generic examples.
- **No tool facts from memory**: get versions and capabilities from a command or the official docs. Write the source and the date.

## Scope and limits

- Fits: software projects that AI agents help build and that live longer than a few weeks, with or without CI or a hosting server.
- Does not fit: one-off scripts and throwaway prototypes.
- Partly fits: projects that produce no code (project management, media production). The checks and tests do not apply; the social contract, the writing standards, the loop cards, and the feedback log can be used as they are.
- Covers the delivery harness: the harness around the agent (guides, sensors, gates) plus the workflow and the team agreements. Most sources use "harness" only for the first part.

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
| 2026-10-14 | Added social-contract.md: a catalog of team agreements for what tools do not enforce, written in ASD-STE100. One base principle (leave all work so that a person who never spoke to you can continue it), and agreements for starting and stopping work, continuing the work of others, records, decisions and disagreement, the shared and the personal harness, agents, mistakes, and the agreements themselves. Each agreement is Recommended or Good to know; teams select and copy them, and copy the agreements for agents into AGENTS.md. A rule that a tool can enforce cheaply is a setting, not an agreement. The document map lists the team's agreements file; the AGENTS.md template has a section for them. |
| 2026-10-14 | Reviewed the whole playbook for conflicts, open loops, and file boundaries. Each file now has one purpose, and each rule has one place. New files: glossary.md (all terms and roles; "owner" means only the person who decides, who can name a person for an area); workflow.md (states, Definitions of Ready, Done, and Blocked, transitions, round limit, release, loop cards, closure rules, delivery health; moved from framework.md and delivery-planning.md); guardrails.md (layers of checks, Git conventions, security, logging and errors, parallel work; moved from framework.md). framework.md is now the map of the phases. Maturity is in one table in this file. Fixes: a structure change always needs an ADR; revert a failing main branch first; the planner changes acceptance tests after the owner confirms the requirement; an issue closed without verification goes back to verifying, and closing keywords are not used; only confirmed review findings send work back; a claim can be removed (in progress to ready); a rejected merge and a revert each count as a round; a release contains only closed issues or changes behind a switch that is off; an issue that is not live-verified can close when its live check is on the release smoke test list; acceptance examples that need connecting code start as pending. Checklist: verification-flow is Required and runs after integration. Social contract: D1 is limited to decisions in your role, G1 reverts first, E5 is removed (it is a setting). practices.md keeps only judgment practices. |
| 2026-10-13 | Translated the playbook into English. Added the language matrix (Node/TypeScript, Python, C#), with versions checked against npm, PyPI, and NuGet on that date. |
| 2026-10-18 | Checked the playbook against third-party sources ([research note](../factory/records/research/harness-playbook-validation-2026-10-17.md)). Replaced "agents work on their own when the core is complete" with graded autonomy levels in `scoring.autonomy` (supervised, unattended task, unattended backlog, parallel), because autonomy is a design decision, not a reward for a score. Weight 3 now means only checks and hard limits: story-spec, ready-done-blocked, agents-md, and agent-log-access moved to weight 2, because they are guides; contracts and boundary-check became Recommended, because a project with one package has no seams to check. protect-checks and required-check-on-server became Required, because they protect every other check. The last gate is now the outermost layer that everyone passes, so a project without CI or a hosting server can meet required-check-on-server with its pre-push hook or agent session gate and a written gap. Added `project.type`, `project.last_gate`, and `project.throughput`; testing M4 now has a tolerant (default) and a strict policy for flaky tests, and workflow 4.2 allows a time-limited fix forward for tolerant projects. verify-as-user now applies to sessions that change run-time behaviour; verification can be done by an agent in a fresh context, and before the merge in a small project. Added the kinds of project to framework.md section 4, and projects without code to the scope. |
| 2026-10-18 | Added comprehension debt: agreements F8 (read agent changes to contracts, core logic, security, and data; sample the rest) and F9 (do not accept a change you cannot explain), two delivery health signals (review sampling, cost per closed issue), the `review-sampling` checklist item (weight 2), and the glossary term. Added practice 9, low-load proposals: when an agent plans, orchestrates, or reports, it asks the least of the owner to read, decide, watch, and maintain (one recommendation, at most three questions with defaults, the cheapest option to maintain, reports split into done, not done, and owner actions). Pointers in delivery-planning.md 9.7 and the AGENTS.md template. |
