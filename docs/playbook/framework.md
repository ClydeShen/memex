# A Framework for Starting Agent-Driven Projects

This file organizes what a project should prepare before the first line of product code into a language-agnostic framework. It comes from the preparation of Memex, but it stands on its own. Three companion files cover the non-technical side: which documents to prepare ([document-map.md](./document-map.md)), how to write them ([writing-standards.md](./writing-standards.md)), and how people and agents judge and collaborate ([practices.md](./practices.md)). How to use and maintain the playbook is in [README.md](./README.md). The checklist is [checklist.md](./checklist.md), tools per language are in [language-profiles.md](./language-profiles.md), and templates are in [templates/](./templates/).

**Status markers** (the "status" column of each practice):
- **Used**: Memex uses it, and it has produced real artifacts (documents, issues, and so on).
- **Designed**: written into the Memex docs, but the code that implements it does not exist yet. Not validated.
- **Researched**: only researched. Memex has not adopted it yet.

"Used" only means used. It does not mean the effect is proven.

---

## 1. Core ideas

| # | Idea | Why | Status |
|---|---|---|---|
| 1 | **The repository is the single source of truth.** Conversations and memories get lost; documents, issues, and code do not. Agents get their context by reading the repository, so decisions, constraints, and terms must be written there | A new agent or a new session needs no verbal handoff | Used |
| 2 | **Decisions carry a date and a source, and are recorded immediately.** Write important decisions as ADRs. To change an existing decision, write a new ADR first | Otherwise documents contradict each other and nobody knows which one is current | Used |
| 3 | **What can be checked automatically is not left to discipline.** Mark every rule as "automatic" or "review", and turn review rules into automatic checks where you can. Instructions to an agent (AGENTS.md, prompts) are suggestions; tools (linters, structural tests, hooks, CI) are physical constraints. Enforce code style and writing conventions with tools wherever a tool can do it | Agents miss things, and so do people; a rule an agent may skip is not a guardrail | Used (marking); Designed (the checks) |
| 4 | **Contracts first, dependencies inverted.** Define the interfaces between components first. Components depend only on interfaces. Concrete implementations appear only in one composition entry point | Components can be built in parallel and replaced independently; problems at the seams show up early | Designed |
| 5 | **Prove the thinnest end-to-end path first, then thicken it.** At the start of a milestone, run the whole path once with the least content possible | Building layer by layer pushes integration problems to the very end | Designed |
| 6 | **Acceptance criteria must be checkable by a command.** Each criterion has a command, a visible result, or a concrete value. The planner runs the commands itself and does not take the implementer's word for it | "It's done" is not evidence | Used (in stories); Designed (the verification flow) |
| 7 | **Search before asking.** Answer what you can from official sources, source code, or measurement yourself. Ask people only questions that cannot be looked up or that are a matter of preference | Fewer interruptions, better questions | Used |
| 8 | **Grade the evidence.** Mark each fact as official, secondhand, inference, or measured. Take version numbers and dates from a lookup, not from memory | Tools and versions change fast; memory goes stale | Used |
| 9 | **Separate planning from implementation.** The planning agent reads code, writes plans and docs, and verifies results. The implementing agent writes code from stories. They communicate only through issues | Clean context, clear responsibility, and the plan cannot be changed quietly mid-implementation | Used (just started) |
| 10 | **Clean up at milestone boundaries.** Every epic that produces code ends with a cleanup story: architecture review, fix severe issues, re-index, update the as-built docs | Technical debt does not pile up; the next epic builds on a tidy structure | Designed |
| 11 | **Decide at the last responsible moment.** A default is not a commitment. A choice that can be configuration is not a one-time decision | Keeps options open and avoids locking in early | Used |
| 12 | **Machine details stay out of the repository.** Machines, paths, and secrets go only in files that are not committed. The repository holds requirements and check methods | The repository may be public; docs do not break when you change machines | Used |
| 13 | **Configure a trusted work environment first; writing code comes late.** Unlike a traditional project, the main early work is to set the limits and conditions before implementation: what the agent may do, what it may not do, and how each rule is checked. Code structure, uniform code patterns, and as-built docs matter more than in a traditional project | Trust and reliability come from narrowing what the agent can produce. This applies most fully to new projects; retrofitting it onto an inconsistent existing codebase can cost more than it returns | Used (Memex prepared this before any code) |
| 14 | **Review moves; it does not disappear.** Line-by-line review of style becomes less important, because tools enforce style. Review moves **left** to the plan (stories, contracts, acceptance criteria), moves **up** to the guardrails (are the rules and tests strong enough?), and **stays** on behavior and security (run the acceptance commands; security scanning) | Tools cannot tell whether code does the right thing or is secure, and a weak test passes broken code | Used (acceptance in stories); Designed (verification flow, scanning) |

---

## 2. Phases at a glance

Seven phases. A small project can do only the minimum set of each phase (see section 4).

| Phase | Purpose | Main outputs |
|---|---|---|
| 0 Define | Say what to build, what not to build, and which words to use | Product definition, vision and principles, scope, glossary |
| 1 Decide | Record decisions, constraints, and open questions | ADRs, global constraint table, open questions, research notes |
| 2 Architect | Fix boundaries, interfaces, and the directory structure | Architecture diagrams, contracts, dependency classes, structure and naming rules, tech stack |
| 3 Guardrails | Turn rules into tools and checks | Code style, test strategy, security and data requirements, Git conventions, hooks, CI |
| 4 Plan | Break goals into executable, trackable work | Roadmap, milestone integration design, epics and stories |
| 5 Operate | Let planning and implementing agents work together | AGENTS.md, handoff document, verification flow, cleanup stories, as-built docs |
| 6 Maintain | Keep docs and code consistent over time | Consistency reviews, change process, evidence refresh |

---

## 3. The phases in detail

Each phase lists: what to do, outputs (suggested paths), done criterion, common mistakes, and where Memex does it.

### Phase 0: Define

**What to do**
1. Write a one-sentence product definition, then expand it into a paragraph. The sentence must tell an outsider "who it is for and what it does".
2. Write the vision and **first principles**. Number them. For each, say why it holds and how to test it. Separate what is proven from what is a hypothesis; do not write a hypothesis as a fact.
3. Write the **scope and non-goals**: what you will not build, and what you might build later.
4. Write the **glossary**: one paragraph per term, plus an `_Avoid_` line with synonyms not to use. Use only glossary terms in code and docs. Entry format and upkeep rules are in section 2 of [writing-standards.md](./writing-standards.md).
5. Set the **language policy**: which language for docs, code, commit messages, and canonical term names (section 1 of writing-standards.md).

**Outputs**: `VISION.md`, `GLOSSARY.md` (choose the paths, then keep them fixed).

**Done when**: the glossary covers every concept that recurs in the docs; a new reader can say what the project will not do after reading the vision.

**Common mistakes**
- The same word means different things in different docs (for example, "validation" meaning both a phase and a cognitive step). Fix: define both in the glossary and list the confusable word under `_Avoid_`.
- A hypothesis to be tested is written as a settled fact.

**In Memex**: VISION.md, GLOSSARY.md.

### Phase 1: Decide

**What to do**
1. **ADRs** (architecture decision records): one per important decision, covering the decision, the reasons, the options considered, and the consequences. Put the status at the top. Do not edit an existing decision; write a new ADR and add a "revised by" note to the old one. Template: [templates/adr.md](./templates/adr.md).
2. **Global constraint table**: list the constraints that every phase and every branch must follow. Give each an ID and a source (which ADR). Breaking any of them requires an ADR first.
3. **Open questions**: for each, write when it will be decided and the candidate options. A question without a decision date stays open forever.
4. **Research notes**: research technical facts before writing the ADR that depends on them. Mark the confidence of each finding, list the sources, and keep a "not verified" section. Template: [templates/research-note.md](./templates/research-note.md).
5. **Consistency review**: once the docs pile up, do a dedicated cross-review for contradictions, vague wording, and stale content, and record the result.

**Outputs**: `docs/adr/`, the constraint table in the roadmap, `docs/open-questions.md`, `docs/research/`.

**Done when**: every constraint traces back to an ADR; every open question has a decision date.

**Common mistakes**
- A decision exists only in a conversation.
- An ADR changes but the documents that cite it do not (counts, IDs, and terms drift). Fix: after changing an ADR, search for every reference and update it.
- Version numbers, dates, and tool capabilities written from memory. Fix: look them up (for example, through the package registry API) and write the date of the check.

**In Memex**: the ADRs under docs/adr/; the global constraint table in the roadmap; open-questions; the research notes under docs/research with confidence markers; the consistency review of 2026-10-11 (recorded in docs/research/review-2026-10-10.md and the ADR revisions that followed).

### Phase 2: Architect

**What to do**
1. **Architecture diagrams**: use the C4 model (context, containers, components), plus a sequence diagram of the key flow. The diagrams must show who depends on whom.
2. **Contracts**: the interfaces between components. Use ports and adapters: the core depends only on ports, concrete implementations are adapters, and only one **composition entry point** knows the concrete implementations. Data types must be serializable. Reuse existing standards; do not invent your own.
3. **Dependency classes**: put every dependency in one class: hard (part of the architecture), configurable (has an interface; swapping the implementation is a config change), or optional (the system runs without it). Say when each default must be chosen.
4. **Directory and naming rules**: the directory structure should show the direction of dependencies. Write a "who may depend on whom" table. Organize directories by domain concept, not by technical layer. Do not create catch-all directories such as `utils`. Give each package one public entry point.
5. **Tech stack**: for each tool, write its role, its class, when it is introduced, and when to replace it. List what you deliberately do not use, and why.
6. **Configuration format**: use one resource format for everything configurable. Version it, validate it on load, and reference secrets only through environment variables.

**Outputs**: `docs/architecture/` (diagrams, contracts), `docs/dependencies.md`, `docs/project-structure.md`, `docs/tech-stack.md`.

**Done when**: the dependency-direction rules can be written as an automatic check (see phase 3); every port has explicit input and output types.

**Common mistakes**
- The directory structure and the dependency rules drift apart: the docs say "the core does not depend on implementations", but no tool checks it.
- Choosing every tool at once. Fix: mark the milestone at which each tool is introduced, and choose it then.

**In Memex**: docs/architecture/c4.md and contracts.md; ADR 0008 (dependency inversion) and 0009 (a single resource format); docs/dependencies.md; docs/project-structure.md; docs/tech-stack.md.

### Phase 3: Guardrails

**What to do**
1. **Code style**: mark every rule **[auto]** (which tool and rule checks it) or **[review]** (a person checks it). Cover at least: dependency inversion, function style, control flow, error handling, data and immutability, types and modules, naming, comments. State the exceptions: when a rule may be broken, and require a one-line "why" comment next to the code.
2. **Test strategy**: few tests, aimed precisely at the critical points. Suggested critical points: contracts (valid input passes, invalid input is rejected); the milestone's pass criteria; invariants (with property-based tests); security gates. When you fix a bug, write a test that reproduces it first. Do not set a coverage threshold. Give each port a **conformance suite** that every implementation of that port must pass.
3. **Security and data requirements**: map them against an industry risk list (for example, the OWASP lists for LLM and agentic applications). Write each requirement as one row: requirement, source, risk, when it applies, how it is checked. Cover at least: treat external content as data; never persist secrets; treat configuration as untrusted input; resource limits; supply chain (lock files, install scripts, newly published versions, known vulnerabilities); listen only on localhost by default.
4. **Git conventions**: a commit message format (for example, Conventional Commits). Three tiers of hooks: a light check before commit, a format check on the commit message, and the full check before push. Hooks can be skipped, so they are a local convenience, not a gate.
5. **CI and scanning**: decide when to set up CI (it can wait until the architecture settles). Code security scanning, dependency update alerts, secret scanning, and push protection can be switched on now.
6. **One command checks everything**: provide a single entry point at the root that runs type checking, lint, architecture checks, and tests.
7. **Environment details**: provide `.env.example` with the keys to fill in on each machine. Machine details go only in the uncommitted `.env`.

**Outputs**: `docs/code-style.md`, `docs/security-and-data.md`, tool configuration files, `.githooks/` or an equivalent, `.env.example`.

**Done when**: every style rule is marked [auto] or [review]; a newcomer can clone the repository and learn in one command whether the code is acceptable.

**Common mistakes**
- Rules exist only in the docs, with no tool behind them.
- Treating "the hook passed" as "the code is acceptable".
- Tests chase count and coverage but miss the contracts and invariants.

**In Memex**: docs/code-style.md, security-and-data.md, the "Git hooks" section of tech-stack.md, ADR 0016 (external content and secrets).

### Phase 4: Plan

**What to do**
1. **Roadmap**: phased, with **observable** entry and exit criteria for every milestone. The global constraint table lives here too.
2. **Milestone integration design** (one per milestone, written at its start):
   1. List the components and mark which are core and which are temporary.
   2. Draw the **seams**: who produces, what data is handed over, who consumes. Write the key fields.
   3. Give every seam **three gate layers**: a schema gate (at the seam: validate the data shape), a conformance gate (at the component: the port's conformance suite), and an integration gate (at the milestone: end-to-end tests and the pass criteria).
   4. Break the work into stories with dependencies and acceptance criteria.
3. **Thinnest end-to-end path**: order the stories so that the whole path runs once with minimal content. Then **review** the seam design, fix it, finalize the contracts, and build the components in parallel.
4. **Story spec**: parent epic, background (evidence for each fact), scope (one change per item), acceptance (tickable, with a command or a value), out of scope, decision log (dated). Template: [templates/story.md](./templates/story.md).
5. **Epic spec**: one **leading word** (a short word the team already uses, for example "foundation", "end-to-end", "contracts"), a one-sentence goal, an exit criterion, the epic order, an issue table, a suggested-order table, and a dependency diagram. After an epic starts, keep its structure stable: only change statuses and append at the end. Template: [templates/epic.md](./templates/epic.md).
6. **Dependencies**: only "B uses something A produces" is a hard dependency; record it with the tracker's dependency link. Put every other ordering in the suggested order only.

**Outputs**: `docs/roadmap.md`, `docs/plans/<milestone>-integration.md`, epics and stories in the issue tracker.

**Done when**: an implementer can read any one story and know what to do and when it is done; anyone can say when any epic may close.

**Common mistakes**
- Slicing by layer (finish all of layer A, then layer B), which pushes integration to the end.
- Acceptance criteria such as "implement feature X", with nothing to run.
- An epic that becomes a bucket, with no theme and no exit criterion.
- Using dependency links to express "do this first", which blocks work for no reason.

**In Memex**: docs/roadmap.md, docs/plans/v0-integration.md, ADR 0025, the epics and stories of the V0 milestone on GitHub.

### Phase 5: Operate

**What to do**
1. **Roles**: the planning agent reads code, writes plans and docs, verifies results, and syncs status. The implementing agent writes code from stories and reports results in the issue. They communicate only through issues. Decisions go into the issue, not into direct messages.
2. **AGENTS.md**: a thin entry point for the implementing agent, about 60 lines at most: common commands, the way of working (take work from issues; report against the acceptance criteria with commands and output; do not change plans or ADRs; give the reason when you change a contract), and where to read first. **Do not describe the current state of the codebase here** (that belongs in the as-built docs, and it goes stale). Template: [templates/agents-md.md](./templates/agents-md.md).
3. **Handoff document**: where a new session starts. Cover: what to read, what to do, what to verify, what to watch out for, working habits, and what not to do.
4. **Verification flow**: when the implementing agent reports a story done, the planning agent checks each acceptance criterion and **runs the commands itself**. Only then does it close the issue and sync the epic's table, order table, diagram, and status paragraph.
5. **Cleanup story**: every epic that produces code ends with one. Steps: record a baseline (commit, check result, and a hash or output that represents behavior) → architecture review → classify findings (severe or not) → fix severe ones (refactor only) → re-index the codebase → update the as-built docs → run all checks again. Write the severity criteria so they can be checked: breaking a dependency rule, code that disagrees with the contract, anything that would force rework in the next epic, and coupling that prevents testing core logic on its own are severe.
6. **As-built docs**: describe what the code **is now**, as opposed to design docs (what we intend). One page per package, from a fixed template. Link to code by path and symbol name, never by line number. Record in the front matter the paths the page covers and the commit it was verified against. Put generated content (package list, dependency graph, export list) in a separate directory marked "generated, do not edit". Check pages with a script: complete front matter, paths and symbols exist, no line-number references. Detect stale pages with `git diff --name-only <verified commit>..HEAD -- <covered paths>`.

**Outputs**: `AGENTS.md`, `HANDOFF.md`, `docs/as-built/`, check scripts.

**Done when**: a new agent with no background can start work by reading `AGENTS.md` and a story; every close by the planning agent rests on command output.

**Common mistakes**
- The implementing agent's own report is taken as fact.
- As-built docs that restate the code, or cite line numbers, and go stale quickly.
- Adding features during cleanup, which breaks the "refactor only" boundary.
- An AGENTS.md that keeps growing until it becomes another design document.

**In Memex**: ADR 0025 and 0026; docs/research/as-built-docs-2026-10-13.md; HANDOFF.md.

### Phase 6: Maintain

**What to do**
1. **Consistency review**: at the end of every milestone, and whenever the docs grow noticeably. Check counts (constraints, ADRs), IDs, terms, cross-references, and differences between defaults and reality.
2. **Change process**: breaking a constraint requires a new ADR first. Changing a contract requires the reason in the issue and an update to the contract doc. Only the planning agent changes the plan.
3. **Evidence refresh**: check tool versions and capabilities every quarter, or whenever you need them, and write the date. Mark conclusions that no longer hold; do not delete them silently.
4. **Review this framework regularly**: write practices the project has validated back into this framework. When a practice is rejected, change its status and give the reason.

**Outputs**: review records, updated ADRs, revisions of this framework.

---

## 4. Scaling to project size

| Size | Suggested minimum |
|---|---|
| Small (one person, a few weeks, one package) | Phase 0: product definition and glossary. Phase 1: ADRs for important decisions only. Phase 3: one command checks everything, light hooks, lock file and dependency alerts. Phase 4: a roadmap plus acceptance criteria in stories. Phase 5: AGENTS.md |
| Medium (one or two people plus agents, a few months, several packages) | All phases, with the "required" items of the checklist in each. Contract-first for the main seams. The cleanup stories can be merged into one per milestone |
| Large (many people, long-lived) | All phases and the full checklist. Set up CI early. Implement every security requirement. Give the as-built docs and the consistency reviews a fixed owner and cadence |

---

## 5. Common pitfalls (from practice)

1. **Using design docs as the current state.** Design docs say what we intend; the code drifts from them. You need a separate as-built doc and a clear owner for it.
2. **Drifting counts and references.** Numbers such as "N constraints", "M ADRs", or "section 3" must change everywhere when one changes. Write as few as you can; make the ones you write searchable.
3. **Defaults treated as commitments.** Say in the docs that a default is not a commitment, and name the milestone that settles it.
4. **Self-reports taken as facts.** The planner runs the acceptance commands itself.
5. **Versions and capabilities from memory.** Tools change fast. Look them up and write the date.
6. **One word, several meanings.** Fill in `_Avoid_` in the glossary, and check it in reviews.
7. **Milestones sliced by layer.** Prove the thinnest end-to-end path first.
8. **Experiment tools treated as product.** If the project has a phase that tests ideas, say which parts are validation tools (not shipped) and which are product components (shipped after validation).
9. **Rules without tools.** For every rule, ask: can a tool check this?
10. **Cleanup that turns into a rewrite.** Cleanup is refactoring only. Write the severity criteria in advance; relax on minor issues and record them for next time.
11. **Dropping review altogether.** Tools enforce style, not correctness or security. Keep behavior and security verification, and review the guardrails themselves.
12. **Rules that live only in agent instructions.** A rule in AGENTS.md or a prompt can be skipped. If a tool can check it, make the tool check it.

---

## 6. Where this framework comes from

This framework comes from the preparation work on Memex (a cognitive agent framework written in TypeScript) in October 2026 and the discussions along the way. Each phase names where Memex does the practice. Memex had no product code yet, so most practices are "used (produced documents)" or "designed", and their effect has not been tested in practice. The framework will be updated under the maintenance rules in the README as Memex moves forward.
