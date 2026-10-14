# Setup Checklist

The items are grouped by phase. **[Required]** items are the minimum set; do them even in a small project. **[Recommended]** items are for medium and large projects. Each item has a done criterion and a weight (see "Score" below). When an item is done, tick it and write the date at the end of the line. The phases and the reasons are in [framework.md](./framework.md).

How to use: copy this file into the new project (for example, `docs/setup-checklist.md`). Fill in the "Project" line. Work through the items in sequence.

## Score

Each item has a weight, **W3**, **W2**, or **W1**, that says how much the item adds to the harness. The harness is everything around the agent that guides it before it acts and checks its work after it acts. "Required" and "Recommended" say which project sizes need the item. The weight is a different scale: it says how much the item matters to agents. For example, an architecture diagram is required but has weight 1, because no agent is stopped or corrected by it.

| Weight | Meaning | Examples |
|---|---|---|
| **W3**: core harness | An automatic check or a hard limit that the agent meets every time, or a protection of the tests and checks that decide whether work is done. Without it, wrong work can pass and nobody sees it | One-command check, agent session hooks, boundary check, protected tests, deterministic tests, Definition of Ready, AGENTS.md |
| **W2**: strengthens the harness | Makes the guidance clearer or the checks more complete, but the agent can work without it | Code style, git hooks, the layers of checks, log format, roles |
| **W1**: nice to have | Helps at scale, makes work faster, or keeps the docs up to date over time | Mutation testing, merge queue, as-built docs, health signals |

How to score:
1. Mark an item that does not apply to the project as `- [-]` and write the reason at the end of the line. Only a Recommended item can be marked "does not apply"; a Required item is done or not done.
2. **Score** = the sum of the weights of the done items ÷ the sum of the weights of the items that apply × 100.
3. **Core** = the number of done W3 items ÷ the number of W3 items that apply.
4. Read the two numbers together. Agents can work on their own when the core is complete, whatever the score. If a W3 item is not done, a person watches the agents' work closely, even if the score is high.
5. Write the score, the core, and the date in the "Project" line. Score again at the end of each milestone.

Count from the command line (any POSIX shell):

```bash
awk '/^- \[[ xX]\] \*\*\[(Required|Recommended), W[123]\]/ { w = substr($0, index($0, ", W") + 3, 1); t += w; if (w == 3) ct++; if ($0 ~ /^- \[[xX]\]/) { d += w; if (w == 3) cd++ } } END { printf "score %d/%d = %.0f%%, core %d/%d\n", d, t, 100 * d / t, cd, ct }' checklist.md
```

Project: ＿＿＿＿＿＿　Language: ＿＿＿＿＿＿　Size (small/medium/large): ＿＿＿＿＿＿　Start date: ＿＿＿＿＿＿
Score: ＿＿＿＿＿＿　Core: ＿＿＿＿＿＿　Scored on: ＿＿＿＿＿＿

---

## Phase 0: Define

- [ ] **[Required, W2]** Write a one-sentence product definition. Done when: a person who does not know the project can say who it is for and what it does.
- [ ] **[Required, W2]** Write the scope and the non-goals. Done when: the list has at least three things the project will not do.
- [ ] **[Recommended, W1]** Write the vision and the numbered first principles. Give each principle a reason and a test. Mark each claim as proven or as a hypothesis.
- [ ] **[Required, W2]** Write the glossary. Give each entry a canonical name, a definition, and an `_Avoid_` line (format: the glossary section of [writing-standards.md](./writing-standards.md)). Done when: each concept that occurs again and again in the docs has an entry.
- [ ] **[Recommended, W1]** Use [document-map.md](./document-map.md) to decide which documents to prepare, where they go, and who maintains them. In the README index, say which documents come later and when.
- [ ] **[Recommended, W1]** Decide which documents use ASD-STE100 (or its principles, for non-English docs) and which use the explanatory standard. Done when: AGENTS.md, checklists, runbooks, and the scope and acceptance sections of stories follow the procedural standard.

## Phase 1: Decide

- [ ] **[Required, W2]** Create the ADR directory and the template. Done when: the first ADR states the decision, the reasons, the options considered, and the consequences.
- [ ] **[Required, W2]** Create the global constraint table (ID, constraint, source). Done when: each constraint traces back to an ADR or a principle.
- [ ] **[Required, W1]** Create the open-questions list. Give each question a decision date.
- [ ] **[Recommended, W1]** Set the rules for research notes: confidence markers, a source list, and a "not verified" section.
- [ ] **[Recommended, W1]** Do one consistency review (counts, IDs, terms, references, defaults). Done when: the review is recorded and the contradictions it found are fixed.

## Phase 2: Architect

- [ ] **[Required, W1]** Draw the architecture diagrams: at least one context diagram and one component diagram.
- [ ] **[Required, W3]** Write the contracts between the main components (interface and data types). Done when: each port has explicit inputs and outputs, and each data type is serializable.
- [ ] **[Recommended, W1]** Classify the dependencies (hard, configurable, optional). Say when each default must be chosen.
- [ ] **[Required, W2]** Write the directory structure and the "who may depend on whom" table. Done when: the rules can be written as an automatic check.
- [ ] **[Recommended, W1]** Write the naming rules (directories, files, packages, tests, resource files).
- [ ] **[Required, W2]** Write the tech stack document. For each tool, give its role, its class, and when it is introduced. List the tools you will not use.
- [ ] **[Recommended, W1]** Define one configuration format. Version it. Validate it on load. Reference secrets only through environment variables.

## Phase 3: Guardrails

- [ ] **[Required, W2]** Write the code style document. Mark each rule [auto] or [review]. Done when: each [auto] rule names a tool and a rule.
- [ ] **[Required, W2]** Select the tools for the language: package manager, formatter and linter, type or null checking, test framework (see [language-profiles.md](./language-profiles.md)).
- [ ] **[Required, W3]** Make one command check everything. Done when: after a clean clone, one command runs type checking, lint, and tests, and it passes.
- [ ] **[Required, W2]** Make the check output short and machine-readable. Done when: a failing run prints only the failures and their errors (the test runner's agent-oriented output, or an equivalent), and a tool can read the result (the exit code, plus JUnit XML or JSON where a tool needs it).
- [ ] **[Required, W3]** Add agent session hooks. Done when: after each edit, the agent gets lint feedback for the changed files in the same turn; the agent cannot end its turn while types, lint, or the related tests fail; a guard stops an endless loop.
- [ ] **[Required, W3]** Add an architecture boundary check. Done when: an import that breaks a dependency rule makes the check fail.
- [ ] **[Recommended, W2]** Write the test strategy: the list of critical points (contracts, milestone pass criteria, invariants, security gates). Write a failing test before each bug fix. Do not set a coverage threshold.
- [ ] **[Recommended, W2]** Write a conformance suite for each port. Give each suite a negative case: a deliberately wrong implementation must fail it.
- [ ] **[Required, W3]** Write who owns which tests ([testing.md](./testing.md)). Done when: gate tests and acceptance tests are written by someone other than the implementer, are protected after they are committed, and an implementer who thinks a protected test is wrong marks the issue blocked.
- [ ] **[Required, W3]** Give agents a way to verify behaviour as a user does, and require evidence. Done when: each session starts with one end-to-end smoke test; a product with a user interface has a browser command-line tool that the agent can use; AGENTS.md says that the agent pastes command output or screenshots, not claims.
- [ ] **[Required, W3]** Make tests deterministic and keep retries out of gates. Done when: the clock, random numbers, and the network are passed in as parameters; a lint rule rejects focused and skipped tests; no gate retries a failing test.
- [ ] **[Recommended, W1]** Run the expensive test checks after integration (mutation testing report only, tests in random order with recorded seeds).
- [ ] **[Required, W2]** Set the commit message format (for example, Conventional Commits). Done when: the header format, the body rule (why, not what), and the trailers (issue reference, breaking change, attribution) are written down.
- [ ] **[Recommended, W1]** Enforce the commit message format on the server (a rule on the protected branch), and check pull request titles with a required status check if you squash merge.
- [ ] **[Required, W2]** Add three tiers of git hooks: a light check before commit, a commit message check, and the full check before push. Done when: a bad commit message is rejected, and a deliberate check failure stops a push.
- [ ] **[Recommended, W2]** Write down the layers of checks (agent session hooks, git hooks, CI, after integration): what each layer runs and which layer is the gate. Done when: each inner layer runs a subset of the next one, every check runs in the outermost gate, and all layers call the same commands and configuration.
- [ ] **[Recommended, W3]** Protect the checks: deny agents edit access to the check configuration, the hook scripts, and the gate tests, and require an owner's review for these paths.
- [ ] **[Recommended, W3]** Make the full check required on the server. Done when: the protected branch requires the full check to pass in CI before each merge, and nobody (person or agent) can merge without it. Until CI exists, write down that the pre-push hook is the last gate, and when CI will close the gap.
- [ ] **[Required, W2]** Commit the dependency lock file. Install in the mode that only reads the lock file.
- [ ] **[Recommended, W1]** Set the supply-chain controls: do not run install scripts by default, delay newly published versions, audit known vulnerabilities (see the language matrix for each language).
- [ ] **[Recommended, W1]** Switch on code security scanning, dependency update alerts, secret scanning, and push protection.
- [ ] **[Recommended, W2]** Write the security and data requirements. Give each requirement a source, a risk, a start time, and a check.
- [ ] **[Required, W2]** Set the log format: the OpenTelemetry log data model with trace context on every record, the same field names in every service. Done when: a log record from any service can be joined to its trace by `trace_id`.
- [ ] **[Required, W3]** Give agents read access to logs, traces, and errors (files, a command-line tool, or an MCP server), read-only. Done when: AGENTS.md says where and how to read them.
- [ ] **[Required, W2]** Write the error-handling rules in the code style: exceptions as correlated log records, cause chains kept, stable error codes, one record per error where it is handled, and one style for expected failures.
- [ ] **[Recommended, W1]** Write one wide event per request or job, and put the service version and commit in the resource attributes.
- [ ] **[Required, W2]** Add `.env.example` and `.gitignore`. Do not commit machine details. Done when: a search of the staged diff for local paths and user names finds nothing.

## Phase 4: Plan

- [ ] **[Required, W2]** Write the roadmap. Give each milestone observable entry and exit criteria.
- [ ] **[Required, W2]** Write the integration design of the first milestone: the component list, the seams (who produces, what is handed over, who consumes), and the gates of each seam.
- [ ] **[Recommended, W2]** Put the "thinnest end-to-end path" stories first. Plan one review of the seams after them.
- [ ] **[Required, W3]** Write each story with: parent epic, background (with evidence), scope, acceptance (with a command or a value), out of scope, decision log. Done when: the implementer can read only the story and know what to do and when it is done.
- [ ] **[Recommended, W1]** Write each epic with: leading word, one-sentence goal, exit criterion, epic order, issue table, suggested-order table, dependency diagram.
- [ ] **[Required, W1]** Record hard dependencies with the tracker's dependency link. Put all other ordering in the suggested order only.
- [ ] **[Recommended, W1]** Adopt [delivery-planning.md](./delivery-planning.md) as the planners' procedure. Done when: each issue lists the files it changes, conflict groups are written, and each epic has a WIP limit.
- [ ] **[Recommended, W2]** End each epic that produces code with a cleanup story.
- [ ] **[Required, W3]** Write the Definition of Ready (ready for agent), the Definition of Done, and the Definition of Blocked for the project (see phase 4 of [framework.md](./framework.md)). Done when: the "ready" mark is added only to tickets that meet the Definition of Ready.
- [ ] **[Recommended, W1]** Track the delivery health signals: the ready queue, the false-ready rate, and the reasons for "not ready" and "blocked" by owner.

## Phase 5: Operate

- [ ] **[Required, W3]** Write `AGENTS.md`: commands, way of working, where to read first. Do not describe the current state of the codebase. Done when: the file has about 60 lines or fewer.
- [ ] **[Recommended, W1]** Write the handoff document: what to read, what to do, what to verify, what to watch out for, what not to do.
- [ ] **[Required, W2]** Write down the roles: who plans, who implements (people or agents, how many), and the channel between them. Done when: each ticket in progress has exactly one implementer.
- [ ] **[Recommended, W2]** Set the rules for parallel work: tickets in progress at the same time do not change the same files; a limit on tickets in progress; one working copy per task; small pull requests.
- [ ] **[Recommended, W1]** Switch on a merge queue that runs the checks on the combined result before each merge.
- [ ] **[Recommended, W1]** Remove hotspot files: one file per change instead of a shared changelog, self-registering modules, regenerated lock files.
- [ ] **[Recommended, W3]** Set the verification flow: a planner who is not the implementer runs the acceptance commands, closes the issue only when they pass, and then syncs the epic.
- [ ] **[Recommended, W1]** Set up the as-built docs: a template, one page per package, `covers` and `verified-at`, and a check script. Done when: the check commands report no stale page.
- [ ] **[Recommended, W1]** If the environment has a code indexing tool, re-index in each cleanup story.
- [ ] **[Recommended, W1]** Record the way of working and the roles in the agent's persistent memory, so that each session does not need them again.
- [ ] **[Recommended, W2]** Adopt the practices in [practices.md](./practices.md). At minimum: give each important judgment a confidence level and its supporting dimensions; agree on a plan before you change code; mark work that is only logic-done as "not live-verified".

## Phase 6: Maintain

- [ ] **[Recommended, W1]** Do a consistency review at the end of each milestone.
- [ ] **[Required, W2]** Set the change process: write an ADR before you break a constraint.
- [ ] **[Recommended, W1]** Set a cadence for checking tools and versions (every quarter, or before use). Write the date of each check.
- [ ] **[Recommended, W1]** Write practices that the project has validated back into this playbook.

---

## Final check before work starts

- [ ] A new agent that reads only `AGENTS.md` and the first story can say what to do and how to verify it.
- [ ] After a clean clone, the one-command check passes.
- [ ] The repository contains no machine details and no secrets.
- [ ] The exit criterion of the first milestone is a command or a test that can run.
