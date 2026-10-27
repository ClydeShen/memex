# Document Map: Which Documents a Project Should Prepare

This file lists the standard documents of an agent-driven project. For each it gives the purpose, the main audience, who maintains it, when to create it, when to update it, and the writing standard. The paths are suggestions; adjust them to the project, then keep them fixed. Writing standards are in [writing-standards.md](./writing-standards.md); templates are in [templates/](./templates/).

**Maintained by**: the role that keeps the document correct. The roles are in [glossary.md](./glossary.md).

**Writing standard**:
- **STE**: procedural text, in ASD-STE100 or its principles for non-English docs (the ASD-STE100 section of the writing standards).
- **Explanatory**: explanatory text (the explanatory writing section of the writing standards).

---

## 1. Repository root

| File | Purpose | Main audience | Maintained by | Create | Update | Standard |
|---|---|---|---|---|---|---|
| `README.md` | Entry point: one-sentence definition, current status, document index, environment requirements | People | Planner | Phase 0 | When the status or the document structure changes | Explanatory |
| `VISION.md` | Purpose, first principles, scope, what is proven and what is to be tested | People, agents | Planner (owner confirms) | Phase 0 | When a principle or the direction changes (with an ADR) | Explanatory |
| `GLOSSARY.md` | The single source of terms | People, agents | Planner | Phase 0 | When a new concept appears or inconsistent wording is found | Explanatory (fixed entry format) |
| `HANDOFF.md` | Where a new session starts: what to read, do, watch out for, and not do | Agents | Planner | End of phase 1 | End of each milestone; after important decisions | Mixed: background explanatory; steps and prohibitions in STE |
| `AGENTS.md` | Entry point for implementing agents: commands, way of working, where to read first (about 60 lines at most) | Agents | Planner | Before the first story starts | When commands or the way of working change | STE |
| `.env.example` | Keys to fill in on each machine (no values) | People, agents | Planner | Phase 1 | When an environment requirement is added | — |
| `.gitattributes`, `.editorconfig`, `.gitignore` | Line endings, encoding, indentation, ignore rules | Tools | Planner | Phase 0 | Rarely | — |
| `LICENSE` | License | People | Owner | Before the repository goes public | Rarely | — |

## 2. Decisions and plans (`docs/`)

| File | Purpose | Main audience | Maintained by | Create | Update | Standard |
|---|---|---|---|---|---|---|
| `docs/adr/NNNN-*.md` | One file per important decision | People, agents | Planner (owner confirms) | Phase 1 | Never edited; revised by a new ADR, with a note on the old one | Explanatory |
| `docs/roadmap.md` | Global constraint table; milestones with entry and exit criteria | People, agents | Planner | Phase 1 | When a milestone completes or the plan changes | Explanatory; one constraint per row |
| `docs/open-questions.md` | Open questions, each with a decision date | People | Planner | Phase 1 | When a question is decided (moved into an ADR) or added | Explanatory |
| `docs/plans/<milestone>-integration.md` | Milestone integration design: components, seams, gates, stories | People, agents | Planner | At the start of each milestone | Reviewed once after the thinnest end-to-end path; when contracts change during implementation | Explanatory; the story table in STE |
| `docs/setup-checklist.yaml` | The project's copy of the playbook checklist, with status, dates, and the score | People, agents | Planner | Phase 0 | When an item is done; at the end of each milestone (score) | Structured data |
| `docs/team-agreements.md` | The agreements that the team selected from [social-contract.md](./social-contract.md), with their IDs | People | All members; the owner confirms changes | Phase 5 | When a member proposes a change; at the end of each milestone | ASD-STE100; one action for each agreement |
| `docs/feedback-log.md` | Lessons: symptom, root cause, fix, prevention, count ([feedback.md](./feedback.md)) | People, agents | Planner | When the first lesson is recorded | When a problem is seen again, or its prevention is in place | Explanatory; one entry per kind of problem |
| `docs/release.md` | Release runbook: trigger, what goes into a release, smoke test after release with the live checks, rollback, watch time, incident steps ([workflow.md](./workflow.md), section 6) | People, agents | Release role | Before the first release | When the release process changes | STE |
| `docs/postmortems/YYYY-MM-DD-*.md` | One postmortem per incident: impact, actions taken, root cause, actions with owner and date | People, agents | The on-call role; a planner verifies | After each incident | Actions are tracked as issues; the text is not edited later | Explanatory |
| `docs/research/*-YYYY-MM-DD.md` | Research notes with confidence markers and sources | People, agents | Planner (a background agent may draft) | When facts must be verified | Conclusions are not edited; when overturned, add a correction note at the top | Explanatory |

## 3. Architecture and standards (`docs/`)

| File | Purpose | Main audience | Maintained by | Create | Update | Standard |
|---|---|---|---|---|---|---|
| `docs/architecture/c4.md` | Context, container, and component diagrams; sequence diagram of the key flow | People, agents | Planner | Phase 2 | When the architecture changes | Explanatory; diagrams in Mermaid |
| `docs/architecture/contracts.md` | Contracts between components (design intent; the schemas in code are authoritative) | People, agents | Planner; implementers propose changes | Phase 2 | When a contract changes; after freezing, only by a version bump | Explanatory |
| `docs/dependencies.md` | Dependency classes (hard, configurable, optional) and when defaults are chosen | People, agents | Planner | Phase 2 | When a dependency is added | Explanatory |
| `docs/tech-stack.md` | Tool choices: role, class, when introduced; tools not used; items not yet verified | People, agents | Planner | Phase 2 | When a tool is introduced, verified, or rejected | Explanatory |
| `docs/project-structure.md` | Directory structure, dependency-direction table, naming rules | People, agents | Planner | Phase 2 | When a top-level directory is added or a rule changes | Explanatory |
| `docs/code-style.md` | Code style; each rule marked [auto] or [review] | People, agents | Planner | Phase 3 | When a tool rule lands or a rule changes | Explanatory; one rule per sentence |
| `docs/security-and-data.md` | Security and data requirements: source, risk, start time, check | People, agents | Planner | Phase 3 | For new risks or new phases | Explanatory; one requirement per row |

## 4. As-built (`docs/as-built/`)

| File | Purpose | Main audience | Maintained by | Create | Update | Standard |
|---|---|---|---|---|---|---|
| `docs/as-built/index.md` | Package list and entry points | Agents, people | Implementer (cleanup story) | First cleanup story | Each epic's cleanup story | Explanatory |
| `docs/as-built/<package>.md` | Current state of one package: responsibility, public entry, internal structure, dependencies, invariants, deviations from the design, known gaps | Agents, people | Implementer (cleanup story); a planner verifies | First cleanup story | Each epic's cleanup story; staleness detected with `covers` and `verified-at` | Explanatory; fixed template |
| `docs/as-built/generated/` | Content generated from code (package list, dependency graph, export list, schemas) | Agents, tools | Scripts | First cleanup story | Each run of the generator script | Generated, do not edit |

## 5. Documents in the tracker

| Object | Purpose | Maintained by | Standard |
|---|---|---|---|
| Epic | One theme: leading word, goal, exit criterion, order, dependency diagram | Planner | Explanatory; fixed structure (template) |
| Story | One executable task: background, scope, acceptance, out of scope, decision log | Planner writes; implementer reports | Background explanatory; scope and acceptance in STE |
| Report in a story | The result of each acceptance criterion: command and output | Implementer | Factual statements with command output |

---

## 6. Order of creation

1. Phase 0: README, VISION, GLOSSARY, `.gitattributes`, and so on.
2. Phase 1: ADR directory, roadmap (constraint table), open-questions, `.env.example`, a first draft of HANDOFF.
3. Phase 2: architecture, dependencies, tech stack, project structure.
4. Phase 3: code style, security and data, and the tool configuration files.
5. Phase 4: integration design of the first milestone; epics and stories.
6. Before the first story starts: AGENTS.md.
7. First cleanup story: `docs/as-built/`.

Do not create empty files "in case we need them later". Instead, say in the README document index which documents will appear and when.
