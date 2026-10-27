# A Framework for Starting Agent-Driven Projects

This file is the map of the playbook: the core ideas, seven phases from defining the product to maintaining it, and how to scale the phases to the project size. Each phase says what to do, the outputs, and when it is done, and points to the file with the detailed rules. The terms are in [glossary.md](./glossary.md).

---

## 1. Core ideas

| # | Idea | Why |
|---|---|---|
| 1 | **The repository is the single source of truth.** Conversations and memories get lost; documents, issues, and code do not. Agents get their context by reading the repository, so decisions, constraints, and terms must be written there | A new agent or a new session needs no verbal handoff |
| 2 | **Decisions carry a date and a source, and are recorded at once** ([writing-standards.md](./writing-standards.md), section 4). Write important decisions as ADRs. To change a decision, write a new ADR first | Otherwise documents contradict each other and nobody knows which one is current |
| 3 | **What can be checked automatically is not left to discipline.** Mark every rule as "automatic" or "review", and turn review rules into automatic checks where you can. Instructions to an agent (AGENTS.md, prompts) are suggestions; tools (linters, structural tests, hooks, CI) are physical constraints | Agents miss things, and so do people; a rule an agent may skip is not a guardrail |
| 4 | **Contracts first, dependencies inverted.** Define the interfaces between components first. Components depend only on interfaces. Concrete implementations appear only in one composition entry point | Components can be built in parallel and replaced independently; problems at the seams show up early |
| 5 | **Prove the thinnest end-to-end path first, then thicken it.** At the start of a milestone, run the whole path once with the least content possible | Building layer by layer pushes integration problems to the end |
| 6 | **Acceptance criteria must be checkable by a command.** Each criterion has a command, a visible result, or a concrete value. The planner runs the commands itself | "It's done" is not evidence |
| 7 | **Search before asking** ([practices.md](./practices.md), section 3) | Fewer interruptions, better questions |
| 8 | **Grade the evidence.** Mark each fact as official, secondhand, inference, or measured. Take version numbers and dates from a lookup, not from memory | Tools and versions change fast; memory goes stale |
| 9 | **Separate planning from implementation.** Planners read code, write plans, and verify results. Implementers write code from stories. They communicate only through the tracker | Clean context, clear responsibility, and the plan cannot be changed quietly during implementation |
| 10 | **Clean up at milestone boundaries.** Every epic that produces code ends with a cleanup story | Technical debt does not pile up; the next epic builds on a tidy structure |
| 11 | **Decide at the last responsible moment.** A default is not a commitment; name the milestone that settles it. A choice that can be configuration is not a one-time decision | Keeps options open and avoids locking in early |
| 12 | **Machine details stay out of the repository.** Machines, paths, and secrets go only in files that are not committed | The repository may be public; docs do not break when you change machines |
| 13 | **Configure a trusted work environment first; writing code comes late.** The main early work is to set the limits before implementation: what the agent may do, what it may not do, and how each rule is checked | Trust comes from narrowing what the agent can produce. This applies most to new projects; retrofitting it onto an inconsistent codebase can cost more than it returns |
| 14 | **Review moves; it does not disappear.** Tools enforce style, so line-by-line review of style matters less. Review moves **left** to the plan (stories, contracts, acceptance criteria), moves **up** to the guardrails (are the rules and tests strong enough?), and **stays** on behaviour and security | Tools cannot tell whether code does the right thing or is secure, and a weak test passes broken code |
| 15 | **"Ready for agent" is a strong signal, and a health check of the delivery system.** An issue is ready only when an implementer can act on it at high confidence without asking. How often issues are ready, falsely ready, or blocked shows whether the roles upstream have done their part | An agent given a vague issue guesses instead of asking; when implementation is fast, the bottleneck moves to producing ready issues |

---

## 2. Phases at a glance

| Phase | Purpose | Main outputs |
|---|---|---|
| 0 Define | Say what to build, what not to build, and which words to use | Product definition, vision and principles, scope, glossary |
| 1 Decide | Record decisions, constraints, and open questions | ADRs, global constraint table, open questions, research notes |
| 2 Architect | Fix boundaries, interfaces, and the directory structure | Architecture diagrams, contracts, dependency classes, structure and naming rules, tech stack |
| 3 Guardrails | Turn rules into tools and checks | Code style, test strategy, security and data requirements, Git conventions, hooks, CI |
| 4 Plan | Break goals into executable, trackable work | Roadmap, milestone integration design, workflow, epics and stories |
| 5 Operate | Let planners, implementers, and reviewers work together, and release the result | AGENTS.md, handoff document, loop cards, cleanup stories, as-built docs, release runbook, team agreements |
| 6 Maintain | Keep docs and code consistent over time | Consistency reviews, change process, evidence refresh |

---

## 3. The phases in detail

### Phase 0: Define

**What to do**
1. Write a one-sentence product definition, then expand it into a paragraph. The sentence tells an outsider who it is for and what it does.
2. Write the vision and **first principles**. Number them. For each, say why it holds and how to test it. Do not write a hypothesis as a fact.
3. Write the **scope and non-goals**: what you will not build, and what you might build later.
4. Write the **glossary** ([writing-standards.md](./writing-standards.md), section 1).

**Outputs**: `VISION.md`, `GLOSSARY.md`.

**Done when**: the glossary covers every concept that recurs in the docs; a new reader can say what the project will not do after reading the vision.

**Common mistakes**
- The same word means different things in different docs.
- A hypothesis to be tested is written as a settled fact.

### Phase 1: Decide

**What to do**
1. **ADRs**: one per important decision: the decision, the reasons, the options considered, and the consequences. Do not edit an accepted ADR; write a new one. Template: [templates/adr.md](./templates/adr.md).
2. **Global constraint table**: the constraints that every phase and every branch must follow, each with an ID and its source ADR. Breaking one requires a new ADR first.
3. **Open questions**: each with a decision date and the candidate options. A question without a decision date stays open forever.
4. **Research notes**: research technical facts before you write the ADR that depends on them. Template: [templates/research-note.md](./templates/research-note.md).
5. **Consistency review**: once the docs pile up, cross-review them for contradictions, vague wording, and stale content.

**Outputs**: `docs/adr/`, the constraint table in the roadmap, `docs/open-questions.md`, `docs/research/`.

**Done when**: every constraint traces back to an ADR; every open question has a decision date.

**Common mistakes**
- A decision exists only in a conversation.
- An ADR changes, but the documents that cite it do not. After you change an ADR, search for every reference and update it.
- Version numbers, dates, and tool capabilities written from memory.

### Phase 2: Architect

**What to do**
1. **Architecture diagrams**: the C4 model (context, containers, components), and a sequence diagram of the key flow. Show who depends on whom.
2. **Contracts**: the interfaces between components. Use ports and adapters: the core depends only on ports, concrete implementations are adapters, and only one **composition entry point** knows the concrete implementations. Data types that cross a process or network boundary must be serializable. Reuse existing standards. Add an abstraction layer only if you can name the failure or the change that it isolates.
3. **Dependency classes**: put every dependency in one class: hard (part of the architecture), configurable (swapping it is a config change), or optional (the system runs without it). Say when each default must be chosen.
4. **Directory and naming rules**: the directory structure shows the direction of dependencies. Write a "who may depend on whom" table. Organize directories by domain concept, not by technical layer. No catch-all directories such as `utils`. One public entry point per package.
5. **Tech stack**: for each tool, its role, its class, when it is introduced, and when to replace it. List what you deliberately do not use, and why. Tools per language: [language-profiles.md](./language-profiles.md).
6. **Configuration format**: one resource format for everything configurable. Version it, validate it on load, and reference secrets only through environment variables.

**Outputs**: `docs/architecture/`, `docs/dependencies.md`, `docs/project-structure.md`, `docs/tech-stack.md`.

**Done when**: the dependency-direction rules can be written as an automatic check; every port has explicit input and output types.

**Common mistakes**
- The docs say "the core does not depend on implementations", but no tool checks it.
- Choosing every tool at once. Mark the milestone at which each tool is introduced, and choose it then.
- Experiment tools treated as product. If the project tests ideas first, say which parts are validation tools (not shipped) and which are product components.

### Phase 3: Guardrails

**What to do**
1. **Code style**: mark every rule **[auto]** (which tool and rule checks it) or **[review]**. Cover at least: dependency inversion, function style, control flow, error handling, data and immutability, types and modules, naming, comments. State when a rule may be broken, and require a one-line "why" comment next to the code.
2. **Test strategy and test ownership**: [testing.md](./testing.md).
3. **Security and data requirements**: [guardrails.md](./guardrails.md), section 3.
4. **Git conventions and hooks**: [guardrails.md](./guardrails.md), section 2.
5. **CI and scanning**: decide when to set up CI (it can wait until the architecture settles). Code security scanning, dependency update alerts, secret scanning, and push protection can be switched on now.
6. **One command checks everything**: a single entry point at the root that runs type checking, lint, architecture checks, and tests.
7. **Layers of checks**: [guardrails.md](./guardrails.md), section 1.
8. **Environment details**: provide `.env.example` with the keys to fill in on each machine. Machine details go only in the uncommitted `.env`. Before each commit, search the staged diff for user names and absolute local paths.
9. **Logging, monitoring, and errors**: [guardrails.md](./guardrails.md), section 4.

**Outputs**: `docs/code-style.md`, `docs/security-and-data.md`, tool configuration files, `.githooks/` or an equivalent, `.env.example`, the log format and the agents' access to logs.

**Done when**: every style rule is marked [auto] or [review]; a newcomer can clone the repository and learn in one command whether the code is acceptable.

**Common mistakes**
- Rules exist only in the docs, or only in agent instructions, with no tool behind them.
- Treating "the hook passed" as "the code is acceptable".
- Tests chase count and coverage but miss the contracts and invariants.

### Phase 4: Plan

**What to do**
1. **Roadmap**: phased, with **observable** entry and exit criteria for every milestone. The global constraint table lives here too.
2. **Milestone integration design** (one per milestone, written at its start):
   1. List the components and mark which are core and which are temporary.
   2. Draw the **seams**: who produces, what data is handed over, who consumes. Write the key fields.
   3. Give every seam three gates: a schema gate (at the seam: validate the data shape), a conformance gate (at the component: the port's conformance suite), and an integration gate (at the milestone: end-to-end tests and the pass criteria).
   4. Break the work into stories with dependencies and acceptance criteria.
3. **Thinnest end-to-end path**: order the stories so that the whole path runs once with minimal content. Then review the seam design, finalize the contracts, and build the components in parallel.
4. **Workflow**: the states, the Definitions of Ready, Done, and Blocked, the transitions, and the round limit: [workflow.md](./workflow.md).
5. **Stories, epics, dependencies, and the suggested order**: [delivery-planning.md](./delivery-planning.md). Templates: [templates/story.md](./templates/story.md), [templates/epic.md](./templates/epic.md).

**Outputs**: `docs/roadmap.md`, `docs/plans/<milestone>-integration.md`, the workflow in the tracker, epics and stories.

**Done when**: an implementer can read any one story and know what to do and when it is done; anyone can say when any epic may close.

**Common mistakes**
- Slicing by layer (finish all of layer A, then layer B), which pushes integration to the end.
- Acceptance criteria such as "implement feature X", with nothing to run.
- An epic that becomes a bucket, with no theme and no exit criterion.
- Using dependency links to express "do this first", which blocks work for no reason.

### Phase 5: Operate

**What to do**
1. **Roles**: name who holds each role ([glossary.md](./glossary.md)). Each issue has exactly one implementer at a time.
2. **AGENTS.md**: a thin entry point for implementing agents, about 60 lines at most: commands, the way of working, the team agreements for agents, and where to read first. Do not describe the current state of the codebase here. Template: [templates/agents-md.md](./templates/agents-md.md).
3. **Handoff document**: where a new session starts: what to read, what to do, what to verify, what to watch out for, and what not to do.
4. **Review and verification**: [review.md](./review.md) for reviewers; verification by a planner in [workflow.md](./workflow.md) and [delivery-planning.md](./delivery-planning.md), Task 7.
5. **Cleanup story**: every epic that produces code ends with one. Steps: record a baseline (commit, check result, and a hash or output that represents behaviour) → architecture review → classify findings (severe or not) → fix severe ones (refactor only) → re-index the codebase → update the as-built docs → run all checks again. Severe: breaking a dependency rule, code that disagrees with the contract, anything that would force rework in the next epic, and coupling that prevents testing core logic on its own.
6. **As-built docs**: describe what the code **is now**, as opposed to design docs (what we intend). One page per package, from a fixed template. Link to code by path and symbol name, never by line number. Record in the front matter the paths the page covers and the commit it was verified against. Put generated content in a separate directory marked "generated, do not edit". Check pages with a script. Detect stale pages with `git diff --name-only <verified commit>..HEAD -- <covered paths>`.
7. **Parallel work and merge conflicts**: [guardrails.md](./guardrails.md), section 5.
8. **Release and incidents**: [workflow.md](./workflow.md), section 6.
9. **Loop cards and closure rules**: [workflow.md](./workflow.md), section 7.
10. **Team agreements**: select them from [social-contract.md](./social-contract.md).

**Outputs**: `AGENTS.md`, `HANDOFF.md`, `docs/as-built/`, check scripts, merge queue configuration, `docs/release.md`, postmortems, `docs/team-agreements.md`.

**Done when**: a new agent with no background can start work by reading `AGENTS.md` and a story; every close by a planner rests on command output; no two issues in progress change the same file; every loop card is complete and the workflow passes the closure rules.

**Common mistakes**
- An implementer's own report is taken as fact.
- Design docs used as the current state of the code.
- As-built docs that restate the code, or cite line numbers, and go stale quickly.
- Cleanup that adds features or turns into a rewrite.
- An AGENTS.md that keeps growing until it becomes another design document.
- An open loop: a state with no state owner, a way back with no limit, or a release that nobody checks.

### Phase 6: Maintain

**What to do**
1. **Consistency review**: at the end of every milestone, and whenever the docs grow noticeably. Check counts, IDs, terms, cross-references, and differences between defaults and reality.
2. **Change process**:
   - Breaking a constraint requires a new ADR first.
   - Changing the structure (the directory structure or the dependency rules) requires a new ADR first.
   - Changing a contract requires the reason in the issue and an update to the contract document.
   - Only planners change the plan.
3. **Evidence refresh**: check tool versions and capabilities every quarter, or whenever you need them, and write the date. Mark conclusions that no longer hold; do not delete them silently.
4. **Feedback loop**: keep a feedback log, move repeated problems into checks, and review the checks once per milestone ([feedback.md](./feedback.md)).
5. **Write back**: write practices that the project validated or rejected back into this playbook (README, maintenance rules).

**Outputs**: review records, new ADRs, the feedback log, revisions of this playbook.

---

## 4. Scaling to project size

The rules are written for several people and several agents working in parallel. A smaller project drops what it does not need.

| Size | What to do |
|---|---|
| Small (one or two people, a few weeks to a few months, one package) | The Required items of the checklist. Keep each document short |
| Medium (a few people plus agents, several months, several packages) | The Required items, and the Recommended items that fit. Contract-first for the main seams. The cleanup stories can be merged into one per milestone |
| Large (many people and agents, long-lived) | The full checklist. Set up CI early. Implement every security requirement. Give the as-built docs and the consistency reviews a fixed maintainer and cadence |

Mark a Recommended item that does not fit as "n/a" with the reason. Required items apply to every project.

Size is one axis. The kind of project is another, and it decides which items fit:

| Kind of project | What changes |
|---|---|
| Frontend application | verify-as-user uses a browser tool; the last gate is often a hosting platform's checks or the pre-push hook |
| Backend service | verify-as-user calls the API; logs and traces matter most (agent-log-access) |
| Library or command-line tool | verify-as-user installs the package and runs one example; no running service, so logs mean check and CI results |
| No CI or hosting server | The last gate is the pre-push hook or the agent session gate. Write the gap down ([guardrails.md](./guardrails.md), section 1, rule 4) |

How much an agent may do alone is a third axis. It follows the autonomy levels in `scoring.autonomy` of [checklist.yaml](./checklist.yaml), not the score.
