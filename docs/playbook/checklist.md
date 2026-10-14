# Setup Checklist

The items are grouped by phase. **[Required]** items are the minimum set; do them even in a small project. **[Recommended]** items are for medium and large projects. Each item has a done criterion. When an item is done, tick it and write the date at the end of the line. The phases and the reasons are in [framework.md](./framework.md).

How to use: copy this file into the new project (for example, `docs/setup-checklist.md`). Fill in the "Project" line. Work through the items in sequence.

Project: ＿＿＿＿＿＿　Language: ＿＿＿＿＿＿　Size (small/medium/large): ＿＿＿＿＿＿　Start date: ＿＿＿＿＿＿

---

## Phase 0: Define

- [ ] **[Required]** Write a one-sentence product definition. Done when: a person who does not know the project can say who it is for and what it does.
- [ ] **[Required]** Write the scope and the non-goals. Done when: the list has at least three things the project will not do.
- [ ] **[Recommended]** Write the vision and the numbered first principles. Give each principle a reason and a test. Mark each claim as proven or as a hypothesis.
- [ ] **[Required]** Write the glossary. Give each entry a canonical name, a definition, and an `_Avoid_` line (format: the glossary section of [writing-standards.md](./writing-standards.md)). Done when: each concept that occurs again and again in the docs has an entry.
- [ ] **[Recommended]** Use [document-map.md](./document-map.md) to decide which documents to prepare, where they go, and who maintains them. In the README index, say which documents come later and when.
- [ ] **[Recommended]** Decide which documents use ASD-STE100 (or its principles, for non-English docs) and which use the explanatory standard. Done when: AGENTS.md, checklists, runbooks, and the scope and acceptance sections of stories follow the procedural standard.

## Phase 1: Decide

- [ ] **[Required]** Create the ADR directory and the template. Done when: the first ADR states the decision, the reasons, the options considered, and the consequences.
- [ ] **[Required]** Create the global constraint table (ID, constraint, source). Done when: each constraint traces back to an ADR or a principle.
- [ ] **[Required]** Create the open-questions list. Give each question a decision date.
- [ ] **[Recommended]** Set the rules for research notes: confidence markers, a source list, and a "not verified" section.
- [ ] **[Recommended]** Do one consistency review (counts, IDs, terms, references, defaults). Done when: the review is recorded and the contradictions it found are fixed.

## Phase 2: Architect

- [ ] **[Required]** Draw the architecture diagrams: at least one context diagram and one component diagram.
- [ ] **[Required]** Write the contracts between the main components (interface and data types). Done when: each port has explicit inputs and outputs, and each data type is serializable.
- [ ] **[Recommended]** Classify the dependencies (hard, configurable, optional). Say when each default must be chosen.
- [ ] **[Required]** Write the directory structure and the "who may depend on whom" table. Done when: the rules can be written as an automatic check.
- [ ] **[Recommended]** Write the naming rules (directories, files, packages, tests, resource files).
- [ ] **[Required]** Write the tech stack document. For each tool, give its role, its class, and when it is introduced. List the tools you will not use.
- [ ] **[Recommended]** Define one configuration format. Version it. Validate it on load. Reference secrets only through environment variables.

## Phase 3: Guardrails

- [ ] **[Required]** Write the code style document. Mark each rule [auto] or [review]. Done when: each [auto] rule names a tool and a rule.
- [ ] **[Required]** Select the tools for the language: package manager, formatter and linter, type or null checking, test framework (see [language-profiles.md](./language-profiles.md)).
- [ ] **[Required]** Make one command check everything. Done when: after a clean clone, one command runs type checking, lint, and tests, and it passes.
- [ ] **[Required]** Add an architecture boundary check. Done when: an import that breaks a dependency rule makes the check fail.
- [ ] **[Recommended]** Write the test strategy: the list of critical points (contracts, milestone pass criteria, invariants, security gates). Write a failing test before each bug fix. Do not set a coverage threshold.
- [ ] **[Recommended]** Write a conformance suite for each port.
- [ ] **[Required]** Set the commit message format (for example, Conventional Commits). Done when: the header format, the body rule (why, not what), and the trailers (issue reference, breaking change, attribution) are written down.
- [ ] **[Recommended]** Enforce the commit message format on the server (a rule on the protected branch), and check pull request titles with a required status check if you squash merge.
- [ ] **[Required]** Add three tiers of git hooks: a light check before commit, a commit message check, and the full check before push. Done when: a bad commit message is rejected, and a deliberate check failure stops a push.
- [ ] **[Recommended]** Write down the layers of checks (agent session hooks, git hooks, CI, after integration): what each layer runs and which layer is the gate. Done when: each inner layer runs a subset of the next one, every check runs in the outermost gate, and all layers call the same commands and configuration.
- [ ] **[Recommended]** Protect the checks: deny agents edit access to the check configuration, the hook scripts, and the gate tests, and require an owner's review for these paths.
- [ ] **[Required]** Commit the dependency lock file. Install in the mode that only reads the lock file.
- [ ] **[Recommended]** Set the supply-chain controls: do not run install scripts by default, delay newly published versions, audit known vulnerabilities (see the language matrix for each language).
- [ ] **[Recommended]** Switch on code security scanning, dependency update alerts, secret scanning, and push protection.
- [ ] **[Recommended]** Write the security and data requirements. Give each requirement a source, a risk, a start time, and a check.
- [ ] **[Required]** Set the log format: the OpenTelemetry log data model with trace context on every record, the same field names in every service. Done when: a log record from any service can be joined to its trace by `trace_id`.
- [ ] **[Required]** Give agents read access to logs, traces, and errors (files, a command-line tool, or an MCP server), read-only. Done when: AGENTS.md says where and how to read them.
- [ ] **[Required]** Write the error-handling rules in the code style: exceptions as correlated log records, cause chains kept, stable error codes, one record per error where it is handled, and one style for expected failures.
- [ ] **[Recommended]** Write one wide event per request or job, and put the service version and commit in the resource attributes.
- [ ] **[Required]** Add `.env.example` and `.gitignore`. Do not commit machine details. Done when: a search of the staged diff for local paths and user names finds nothing.

## Phase 4: Plan

- [ ] **[Required]** Write the roadmap. Give each milestone observable entry and exit criteria.
- [ ] **[Required]** Write the integration design of the first milestone: the component list, the seams (who produces, what is handed over, who consumes), and the gates of each seam.
- [ ] **[Recommended]** Put the "thinnest end-to-end path" stories first. Plan one review of the seams after them.
- [ ] **[Required]** Write each story with: parent epic, background (with evidence), scope, acceptance (with a command or a value), out of scope, decision log. Done when: the implementer can read only the story and know what to do and when it is done.
- [ ] **[Recommended]** Write each epic with: leading word, one-sentence goal, exit criterion, epic order, issue table, suggested-order table, dependency diagram.
- [ ] **[Required]** Record hard dependencies with the tracker's dependency link. Put all other ordering in the suggested order only.
- [ ] **[Recommended]** Adopt [delivery-planning.md](./delivery-planning.md) as the planners' procedure. Done when: each issue lists the files it changes, conflict groups are written, and each epic has a WIP limit.
- [ ] **[Recommended]** End each epic that produces code with a cleanup story.
- [ ] **[Required]** Write the Definition of Ready (ready for agent), the Definition of Done, and the Definition of Blocked for the project (see phase 4 of [framework.md](./framework.md)). Done when: the "ready" mark is added only to tickets that meet the Definition of Ready.
- [ ] **[Recommended]** Track the delivery health signals: the ready queue, the false-ready rate, and the reasons for "not ready" and "blocked" by owner.

## Phase 5: Operate

- [ ] **[Required]** Write `AGENTS.md`: commands, way of working, where to read first. Do not describe the current state of the codebase. Done when: the file has about 60 lines or fewer.
- [ ] **[Recommended]** Write the handoff document: what to read, what to do, what to verify, what to watch out for, what not to do.
- [ ] **[Required]** Write down the roles: who plans, who implements (people or agents, how many), and the channel between them. Done when: each ticket in progress has exactly one implementer.
- [ ] **[Recommended]** Set the rules for parallel work: tickets in progress at the same time do not change the same files; a limit on tickets in progress; one working copy per task; small pull requests.
- [ ] **[Recommended]** Switch on a merge queue that runs the checks on the combined result before each merge.
- [ ] **[Recommended]** Remove hotspot files: one file per change instead of a shared changelog, self-registering modules, regenerated lock files.
- [ ] **[Recommended]** Set the verification flow: a planner who is not the implementer runs the acceptance commands, closes the issue only when they pass, and then syncs the epic.
- [ ] **[Recommended]** Set up the as-built docs: a template, one page per package, `covers` and `verified-at`, and a check script. Done when: the check commands report no stale page.
- [ ] **[Recommended]** If the environment has a code indexing tool, re-index in each cleanup story.
- [ ] **[Recommended]** Record the way of working and the roles in the agent's persistent memory, so that each session does not need them again.
- [ ] **[Recommended]** Adopt the practices in [practices.md](./practices.md). At minimum: give each important judgment a confidence level and its supporting dimensions; agree on a plan before you change code; mark work that is only logic-done as "not live-verified".

## Phase 6: Maintain

- [ ] **[Recommended]** Do a consistency review at the end of each milestone.
- [ ] **[Required]** Set the change process: write an ADR before you break a constraint.
- [ ] **[Recommended]** Set a cadence for checking tools and versions (every quarter, or before use). Write the date of each check.
- [ ] **[Recommended]** Write practices that the project has validated back into this playbook.

---

## Final check before work starts

- [ ] A new agent that reads only `AGENTS.md` and the first story can say what to do and how to verify it.
- [ ] After a clean clone, the one-command check passes.
- [ ] The repository contains no machine details and no secrets.
- [ ] The exit criterion of the first milestone is a command or a test that can run.
