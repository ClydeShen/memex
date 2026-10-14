# A Framework for Starting Agent-Driven Projects

This file organizes what a project should prepare before the first line of product code into a language-agnostic framework. It comes from the preparation of a real project, and it stands on its own. Three companion files cover the non-technical side: which documents to prepare ([document-map.md](./document-map.md)), how to write them ([writing-standards.md](./writing-standards.md)), and how people and agents judge and collaborate ([practices.md](./practices.md)). How to use and maintain the playbook is in [README.md](./README.md). The checklist is [checklist.yaml](./checklist.yaml) (structured data, with a harness weight for each item), tools per language are in [language-profiles.md](./language-profiles.md), and templates are in [templates/](./templates/).

**Assume the complex case.** This playbook is a team standard. Do not assume one person or one agent: assume several people and several agents working in parallel, with many pull requests open at once. A project with one person and one agent working in sequence is the simple case; drop what it does not need.

**Status markers** (the "status" column of each practice):
- **Used**: applied in a real project, where it produced real artifacts (documents, issues, and so on).
- **Designed**: specified in a real project's documents, but not yet implemented. Not validated.
- **Researched**: only researched. Not yet adopted in a real project.

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
| 9 | **Separate planning from implementation.** Planners (people or agents) read code, write plans and docs, and verify results. Implementers (people or agents, one or many) write code from stories. They communicate only through the tracker | Clean context, clear responsibility, and the plan cannot be changed quietly mid-implementation | Used (just started) |
| 10 | **Clean up at milestone boundaries.** Every epic that produces code ends with a cleanup story: architecture review, fix severe issues, re-index, update the as-built docs | Technical debt does not pile up; the next epic builds on a tidy structure | Designed |
| 11 | **Decide at the last responsible moment.** A default is not a commitment. A choice that can be configuration is not a one-time decision | Keeps options open and avoids locking in early | Used |
| 12 | **Machine details stay out of the repository.** Machines, paths, and secrets go only in files that are not committed. The repository holds requirements and check methods | The repository may be public; docs do not break when you change machines | Used |
| 13 | **Configure a trusted work environment first; writing code comes late.** Unlike a traditional project, the main early work is to set the limits and conditions before implementation: what the agent may do, what it may not do, and how each rule is checked. Code structure, uniform code patterns, and as-built docs matter more than in a traditional project | Trust and reliability come from narrowing what the agent can produce. This applies most fully to new projects; retrofitting it onto an inconsistent existing codebase can cost more than it returns | Used |
| 14 | **Review moves; it does not disappear.** Line-by-line review of style becomes less important, because tools enforce style. Review moves **left** to the plan (stories, contracts, acceptance criteria), moves **up** to the guardrails (are the rules and tests strong enough?), and **stays** on behavior and security (run the acceptance commands; security scanning) | Tools cannot tell whether code does the right thing or is secure, and a weak test passes broken code | Used (acceptance in stories); Designed (verification flow, scanning) |
| 15 | **"Ready for agent" is a strong signal, and a health check of the delivery system.** A ticket is ready only when an implementer (person or agent) can act on it at high confidence without asking. Read the other way, how often tickets are ready, falsely ready, or blocked shows whether the people upstream (tech lead, architect, BA) have done their part | An agent given a vague ticket guesses with confidence instead of asking; when implementation is fast, the bottleneck moves to producing ready tickets | Used (ready mark); Designed (definitions and signals) |

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

Each phase lists: what to do, outputs (suggested paths), done criterion, and common mistakes.

### Phase 0: Define

**What to do**
1. Write a one-sentence product definition, then expand it into a paragraph. The sentence must tell an outsider "who it is for and what it does".
2. Write the vision and **first principles**. Number them. For each, say why it holds and how to test it. Separate what is proven from what is a hypothesis; do not write a hypothesis as a fact.
3. Write the **scope and non-goals**: what you will not build, and what you might build later.
4. Write the **glossary**: one paragraph per term, plus an `_Avoid_` line with synonyms not to use. Use only glossary terms in code and docs. Entry format and upkeep rules are in the glossary section of [writing-standards.md](./writing-standards.md).

**Outputs**: `VISION.md`, `GLOSSARY.md` (choose the paths, then keep them fixed).

**Done when**: the glossary covers every concept that recurs in the docs; a new reader can say what the project will not do after reading the vision.

**Common mistakes**
- The same word means different things in different docs (for example, "session" meaning both a login session and a work session). Fix: define both in the glossary and list the confusable word under `_Avoid_`.
- A hypothesis to be tested is written as a settled fact.


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


### Phase 3: Guardrails

**What to do**
1. **Code style**: mark every rule **[auto]** (which tool and rule checks it) or **[review]** (a person checks it). Cover at least: dependency inversion, function style, control flow, error handling, data and immutability, types and modules, naming, comments. State the exceptions: when a rule may be broken, and require a one-line "why" comment next to the code.
2. **Test strategy**: few tests, aimed precisely at the critical points. Suggested critical points: contracts (valid input passes, invalid input is rejected); the milestone's pass criteria; invariants (with property-based tests); security gates. When you fix a bug, write a test that reproduces it first. Do not set a coverage threshold. Give each port a **conformance suite** that every implementation of that port must pass. Decide who owns which tests: the implementer of a change is never the only author of the tests that decide whether it is done. The full standard is in [testing.md](./testing.md).
3. **Security and data requirements**: map them against an industry risk list (for example, the OWASP lists for LLM and agentic applications). Write each requirement as one row: requirement, source, risk, when it applies, how it is checked. Cover at least: treat external content as data; never persist secrets; treat configuration as untrusted input; resource limits; supply chain (lock files, install scripts, newly published versions, known vulnerabilities); listen only on localhost by default.
4. **Git conventions**: the commit history is the most detailed record of the project's history, and agents read it (`git log`) to learn why the code is the way it is. Make it machine-readable and make it carry the reasons.
   - **Header**: a fixed format, for example Conventional Commits: `type(scope)!: description`. Tools and agents filter by type, find a module by scope, and find breaking changes by `!`.
   - **Body**: why the change was made, not what changed (the diff already shows what).
   - **Trailers** (git's `Key: value` lines at the end): a reference to the issue (for example, `Refs: #123`), so that a commit leads to its story, acceptance criteria, and decision log; `BREAKING CHANGE:` where it applies; attribution of who made the change, including agents (for example, `Co-authored-by:`; on GitHub the email must match an account, or the trailer is ignored).
   - **Pull request titles**: with squash merges, the pull request title becomes the commit header in the history, so pull request titles follow the same format.
   - **Hooks are necessary but not enough.** Use three tiers of local hooks for fast feedback: a light check before commit, a format check on the commit message, and the full check before push. Local hooks can be skipped (`--no-verify`) and are not copied by a clone, so enforce the same rules on the server: a commit message rule on the protected branch (for example, a regular-expression rule in GitHub rulesets, or a `pre-receive` hook on a self-hosted server), and a required status check for pull request titles.
   - **Agents do not skip hooks.** An agent must not use `--no-verify` unless a person asks for it; an agent that skips a hook usually does it to make a check pass.
5. **CI and scanning**: decide when to set up CI (it can wait until the architecture settles). Code security scanning, dependency update alerts, secret scanning, and push protection can be switched on now.
6. **One command checks everything**: provide a single entry point at the root that runs type checking, lint, architecture checks, and tests.
7. **Layers of checks**: the same checks run at several points, from the agent's session to the server. The checks overlap; the layers do not. Each layer answers a different question, so a layer is not a duplicate of another layer.

   | Layer | When it runs | What it runs | Who passes through it | Can it be skipped? | Its job |
   |---|---|---|---|---|---|
   | Agent session hooks | After each edit, and before the agent ends its turn | The checks for the changed files: format and lint after an edit; types, lint, and related tests at the end of the turn | Only the agent that has the hooks configured | Yes: people and other tools do not pass through it | Fast feedback: the agent fixes a mistake in the same turn, and cannot report "done" while checks fail |
   | Pre-commit hook | Each commit | Light checks only (format, lint of staged files) | Everyone who has the hooks installed | Yes (`--no-verify`, or hooks not installed after a clone) | Keep obvious problems out of commits |
   | Commit message hook | Each commit | The commit message format | Same as above | Yes | Keep the history machine-readable |
   | Pre-push hook | Each push | The one command that checks everything | Same as above | Yes | Only code that passes leaves the machine; saves a round trip to CI |
   | CI and server rules | Each pull request, and in the merge queue before each merge | Everything, from a clean install; commit message and pull request title rules on the protected branch | Everyone, people and agents | No, when the checks are required on the protected branch | The only gate that can be trusted: a clean environment and no way around it |
   | After integration, or on a schedule | In cleanup stories, nightly, or weekly | Expensive checks: mutation testing, tests in random order, full end-to-end runs, security scans | The main branch | Not applicable | Test the tests, and find what the fast layers cannot see |

   The rules for the layers:
   1. **An inner layer runs a subset of the next layer out.** An inner layer that runs everything makes every turn or commit slow, and people and agents start to avoid it. The session hooks run only what the changed files touch; the full check runs at push and in CI.
   2. **The outermost gate runs everything.** Never put a check only in an inner layer. A rule that exists only in the agent's hooks does not apply to people or to other tools; a rule that exists only in local git hooks can be skipped. The inner layers only make a check run earlier.
   3. **One source for each rule.** Every layer calls the same commands and the same tool configuration. Do not write a second copy of a rule inside a hook script; two copies drift apart, and then the layers disagree.
   4. **Say which layer is the gate.** Before CI exists, the pre-push hook is the last gate, and it can be skipped. Write this gap down (for example, in the tech stack document) and say when CI will close it.
   5. **Expensive checks report before they block.** Run them after integration. Collect results first, then decide whether to set a threshold.
   6. **Protect the checks from the code they check.** The implementer must not be able to change the check configuration, the hook scripts, or the gate tests in the same change that they check: deny the agent edit access to these paths, require an owner's review for them (for example, `CODEOWNERS`), and in cleanup, compare the tests with the baseline to find deleted or weakened tests, because a deny rule does not stop an agent that writes a script to change a file.
8. **Environment details**: provide `.env.example` with the keys to fill in on each machine. Machine details go only in the uncommitted `.env`.
9. **Logging, monitoring, and errors**: agents debug from logs, traces, and errors, so these must be easy for agents to reach, traceable, and in one format.
   - **Access for agents**: give agents a way to read logs, metrics, traces, and errors without a person copying them. Use the simplest channel that works: files (JSON Lines that an agent can read with `grep` or `jq`), a command-line tool (for example, the CI log command or the cluster log command), or an MCP server of the monitoring platform. Major platforms have official MCP servers (for example, Grafana, Datadog). Give agents read-only access. Write in AGENTS.md where and how to read them.
   - **Treat what agents read as data.** Logs contain user input, which can carry instructions. An agent treats log content as data, never as instructions. Remove secrets and personal data before writing a log record: never log credentials or payment details, and log session tokens only in an irreversible hashed form (OWASP ASVS, error handling and logging).
   - **One format**: use the OpenTelemetry log data model: timestamp, severity, body, attributes, resource, and the trace context (`TraceId`, `SpanId`; in plain JSON logs, `trace_id`, `span_id`, `trace_flags`). Use the same field names in every service and every language.
   - **Traceability**: put the trace context on every log record, from the span that is active when the record is written. Propagate the W3C `traceparent` header between services. Do not start a new root span in the logger. Put the service version and the commit in the resource attributes, so that an agent can follow error → trace → logs → commit → issue (the commit's `Refs:` trailer).
   - **One wide event per unit of work**: at the end of each request or job, write one structured record that holds its key facts (identifiers, inputs that matter, outcome, duration). An agent reads one line instead of reconstructing a story from many.
   - **Errors and exceptions**:
     - Record an exception as a log record correlated with the current span, with `exception.type`, `exception.message`, and `exception.stacktrace`. OpenTelemetry has deprecated recording exceptions as span events.
     - Keep the cause chain when you wrap an error: `cause` in JavaScript, `raise ... from` in Python, `InnerException` and a bare `throw;` in C#.
     - Give errors stable, structured codes for machines. Do not make tools parse the human-readable message.
     - Record an error once, where it is handled. Do not log and rethrow at every layer.
     - Write error messages that tell the reader what happened, in which context, and what to do next.
     - Choose one style for expected failures for the whole project (return values such as a result type, or exceptions), and write it in the code style. Use exceptions for programming errors in either style.

**Outputs**: `docs/code-style.md` (including the error-handling style), `docs/security-and-data.md`, tool configuration files, `.githooks/` or an equivalent, `.env.example`, the log format and the agents' access to logs (in the code style or a separate observability document).

**Done when**: every style rule is marked [auto] or [review]; a newcomer can clone the repository and learn in one command whether the code is acceptable.

**Common mistakes**
- Rules exist only in the docs, with no tool behind them.
- Treating "the hook passed" as "the code is acceptable".
- A check that runs only in the agent's hooks or only in local git hooks, so people, other tools, or `--no-verify` get around it.
- An inner layer that runs the full check on every edit or commit, so it becomes too slow to keep.
- Tests chase count and coverage but miss the contracts and invariants.


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
7. **Ready, done, blocked**: define three states for the project and write them down.
   - **Definition of Ready (ready for agent)**: the ticket has a clear Definition of Done; every hard (physical) dependency is resolved; it has testable acceptance criteria (a command or a value for each); when the acceptance needs a new test, that test is committed and fails for the right reason ([testing.md](./testing.md)); the decisions it needs are recorded; it points to the existing patterns and files to follow. In terms of four-dimension confidence (practices.md): the ticket gives an implementer (person or agent) enough to act at "high" without asking. Hold agents to a stricter bar than people: a person asks about a vague ticket, an agent guesses.
   - **Definition of Done**: every acceptance criterion is verified by running its command (by the planner, not by self-report); the one-command check passes; the docs the ticket names are updated.
   - **Definition of Blocked**: the work cannot move forward even if someone with capacity picked it up now (an open dependency, a decision only the user can make, a requirement that is still undecided or changing, an unavailable environment or external system, an acceptance criterion that cannot be verified). When blocked, the agent stops, marks the ticket blocked with the reason, the owner, and what would unblock it, and does not guess its way around it. Blocked tickets stay visible, and the time blocked is recorded.
   - **Not everything that stops is "blocked".** Ask three questions in sequence:

     | # | Question | If "no", the state is | Owner | What to do |
     |---|---|---|---|---|
     | 1 | Does the business still want this now? | **On hold** (the business decided "not now") | User or product owner | Remove the ready mark; move it back before the commitment point (the backlog); write the reason and when to revisit. Not blocked |
     | 2 | Could it move forward if someone with capacity picked it up now? | **Blocked** | The owner of the cause | Stop, mark blocked, write reason, owner, and unblock condition |
     | 3 | Is someone (or some resource) available to pick it up now? | **Waiting** (for capacity) | Whoever allocates capacity | Leave it in the queue. It shows a capacity problem, not a block |

     A requirement that is undecided or changing is **blocked** (a decision is missing). A requirement that is decided but deferred is **on hold**. A gap found **before** work starts means the ticket was **not ready**; a gap found **after** work starts makes it **blocked**.
   - **Capacity in an agent-driven project** is often not the agent's coding speed but: the attention of whoever verifies and approves (the planner or the user), environment slots (one GPU, rate limits, token budgets), and file conflicts between people and agents working at the same time. A queue of ready work is normal; a growing queue of work waiting for human verification or approval is the signal.
8. **Delivery health signals**: treat the ticket states as a trim tab for the whole delivery system.
   - **Ready queue**: the number of ready tickets against how fast the implementers consume them. A queue that keeps running dry means producing ready tickets is the bottleneck.
   - **False-ready rate**: tickets marked ready that an implementer sends back as blocked or ambiguous. This tests the Definition of Ready itself.
   - **Reasons by owner**: classify every "not ready" and every "blocked" by the role that can fix it: technical dependency not cleared (tech lead), architecture gap (architect), unclear story or acceptance criteria (BA), missing test criteria (QA or BA), missing decision (user). Look for causes that recur, and fix the system, not just the ticket.
   - **Keep the states apart in the numbers**: count blocked, waiting, and on hold separately. Counting waiting as blocked inflates the block signal and hides a capacity problem; leaving on-hold work in progress distorts cycle time and work in progress. Do not stop the clock while a ticket is blocked. Whether the cycle time of an on-hold ticket restarts or continues when it comes back is a project choice; write it down.

The full procedure for writing issues and epics, setting dependencies and parallel work, verifying results, and syncing status is in [delivery-planning.md](./delivery-planning.md).

**Outputs**: `docs/roadmap.md`, `docs/plans/<milestone>-integration.md`, epics and stories in the issue tracker.

**Done when**: an implementer can read any one story and know what to do and when it is done; anyone can say when any epic may close.

**Common mistakes**
- Slicing by layer (finish all of layer A, then layer B), which pushes integration to the end.
- Acceptance criteria such as "implement feature X", with nothing to run.
- An epic that becomes a bucket, with no theme and no exit criterion.
- Using dependency links to express "do this first", which blocks work for no reason.


### Phase 5: Operate

**What to do**
1. **Roles**: planners (people or agents) read code, write plans and docs, verify results, and sync status. Implementers (people or agents, any number) write code from stories and report results in the issue. They communicate only through the tracker; decisions go into the issue, not into direct messages. Each ticket has exactly one implementer at a time: claim it before starting (assign it, or move it to "in progress"), so that two implementers never work on the same ticket.
2. **AGENTS.md**: a thin entry point for implementing agents, about 60 lines at most: common commands, the way of working (take work from issues; report against the acceptance criteria with commands and output; do not change plans or ADRs; give the reason when you change a contract), and where to read first. **Do not describe the current state of the codebase here** (that belongs in the as-built docs, and it goes stale). Template: [templates/agents-md.md](./templates/agents-md.md).
3. **Handoff document**: where a new session starts. Cover: what to read, what to do, what to verify, what to watch out for, working habits, and what not to do.
4. **Verification flow**: when an implementer reports a story done, a planner who is not that implementer checks each acceptance criterion and **runs the commands itself**. Only then does the planner close the issue and sync the epic's table, order table, diagram, and status paragraph.
5. **Cleanup story**: every epic that produces code ends with one. Steps: record a baseline (commit, check result, and a hash or output that represents behavior) → architecture review → classify findings (severe or not) → fix severe ones (refactor only) → re-index the codebase → update the as-built docs → run all checks again. Write the severity criteria so they can be checked: breaking a dependency rule, code that disagrees with the contract, anything that would force rework in the next epic, and coupling that prevents testing core logic on its own are severe.
6. **As-built docs**: describe what the code **is now**, as opposed to design docs (what we intend). One page per package, from a fixed template. Link to code by path and symbol name, never by line number. Record in the front matter the paths the page covers and the commit it was verified against. Put generated content (package list, dependency graph, export list) in a separate directory marked "generated, do not edit". Check pages with a script: complete front matter, paths and symbols exist, no line-number references. Detect stale pages with `git diff --name-only <verified commit>..HEAD -- <covered paths>`.
7. **Parallel work, pull requests, and merge conflicts**: a person opens one or two pull requests at a time, and that pace was a built-in throttle. Agents remove it and can open dozens in a short time, so the throttle must be designed. The number of conflicts depends mostly on how much concurrent changes overlap and how big they are, not on the number of pull requests: in a study of over 100,000 agent pull requests on GitHub, about 28% had merge conflicts, and small pull requests conflicted far less often. Act in this order, from the most leverage to the least:
   1. **Plan**: partition the work so that tickets in progress at the same time change different files and modules. Tickets that change the same file or module do not run in parallel, even without a hard dependency; order them to cause the least rework. Set a limit on how many tickets are in progress at once.
   2. **Architecture**: remove hotspot files. Write one file per change instead of appending to a shared file (for example, changelog entries). Let each module register itself in its own file instead of a central list. Do not use files that only re-export other files. Regenerate generated files (lock files, generated docs) instead of merging them by hand. Use one formatter everywhere, so that whitespace and style never cause conflicts.
   3. **Execution**: keep pull requests small and branches short-lived. Give each implementer and each task its own working copy (for example, one git worktree per agent session), and isolate shared resources too (databases, ports).
   4. **Merge**: use a merge queue. It merges pull requests one at a time onto the latest main branch and runs the checks on the combined result. This turns pairwise conflicts into one integration per pull request, and it catches semantic conflicts that Git does not report (two changes that pass alone and fail together).
   5. **Resolution**: an implementer rebases and resolves its own conflicts, with the tests as the judge, and regenerates generated files. If a conflict touches a contract or core logic, so that the resolution changes behavior, escalate it to a person.

**Outputs**: `AGENTS.md`, `HANDOFF.md`, `docs/as-built/`, check scripts, merge queue configuration.

**Done when**: a new agent with no background can start work by reading `AGENTS.md` and a story; every close by a planner rests on command output; no two tickets in progress change the same file.

**Common mistakes**
- An implementer's own report is taken as fact.
- Many agents work in parallel on overlapping files, and the team spends its time resolving merge conflicts.
- As-built docs that restate the code, or cite line numbers, and go stale quickly.
- Adding features during cleanup, which breaks the "refactor only" boundary.
- An AGENTS.md that keeps growing until it becomes another design document.


### Phase 6: Maintain

**What to do**
1. **Consistency review**: at the end of every milestone, and whenever the docs grow noticeably. Check counts (constraints, ADRs), IDs, terms, cross-references, and differences between defaults and reality.
2. **Change process**: breaking a constraint requires a new ADR first. Changing a contract requires the reason in the issue and an update to the contract doc. Only planners change the plan.
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
13. **Designing for the simple case.** A rule that works for one person and one agent working in sequence can fail for a team with many agents in parallel. Write the standard for the complex case, and let simple projects drop what they do not need.

---

## 6. Where this framework comes from

This framework comes from the preparation work on one real project in October 2026, and the discussions along the way. That project had no product code yet, so most practices are "used (produced documents)" or "designed", and their effect has not been tested in practice. The framework will be updated under the maintenance rules in the README as practices are tested in real projects.
