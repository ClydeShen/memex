# Handoff

Every session starts here. This file says what to read, the current state, how to work with the user, and the hard limits. Roles and branch rules are in `AGENTS.md`.

## 1. Start of a session

1. Get the latest `main`. In the cloud, start from the branch the tool gives you.
2. Find your role in the user's first message or in the message from `planner`.
3. Read the issue and its epic. The issue is the only source of the task.
4. If you change code, run `pnpm install` and `pnpm check`. `pnpm check` must pass before you start.
5. Read only the documents that your task needs (section 2).

## 2. Where to read

| Layer | Read | Contents |
|---|---|---|
| Always | `AGENTS.md`, this file | Roles, branches, state, rules |
| Before you write code | `factory/design/code-style.md`, `project-structure.md`, `security-and-data.md`, `tech-stack.md`, ADR 0028 | How to write code; text in `memex/` describes only the product as it is now |
| For the task | `factory/design/GLOSSARY.md` | Terms. Use each term exactly as its entry says |
| For the task | `factory/design/architecture/contracts.md`, `c4.md`, `dependencies.md` | Contracts, architecture, dependency categories |
| For the task | `factory/design/VISION.md`, `roadmap.md`, `open-questions.md` | Purpose, plan and constraints, open questions |
| For the task | `factory/records/plans/v0-integration.md` | V0 components, seams, gates, stories (ADR 0025) |
| For the task | `harness/README.md`, `harness/agents/README.md`, `harness/rules/` | Commands, commit, pull request and review rules |
| For the task | `factory/design/local-environment.md` | Local machine checks (`local-impl`) |
| To look up | `factory/records/decisions/`, `factory/records/research/index.md` | Decisions and evidence (the index has one line for each research file). Open only the file that your task needs. Write a new ADR before you change a decision |

Some research has correction notes: `cross-check-2026-10-10.md` (configuration-only learning, VISION principle 3) and `core-algorithms-2026-10-11.md` (ADR 0018).

## 3. Current state

- The repository is `ClydeShen/memex`. The default branch is `main`. Old branches are `archive/*` tags (ADR 0031).
- V0 plan: Milestone "V0 skeleton", epics #38 to #41. Live state is the "Current status" paragraph of each epic.
- Epic #38 (foundation) is merged into `main` (bef2ff07, 2026-10-30). Now: epic #39 on `epic/v0-end-to-end`. Then `epic/v0-contracts` (#40) and `epic/v0-gates` (#41).
- Each epic that makes code ends with a cleanup story (ADR 0026).
- If the implementation shows that a contract needs a change, change `contracts.md` and give the reason. The contract freezes at the decision gate.
- Dependabot pull requests (user decision, 2026-10-31): `reviewer` skips them. `planner` picks the time from the project progress and gives an implementer one story for the open ones. Until the decision gate, `pnpm check` runs in the pre-push hook, and CI comes after the gate (ADR 0012).
- Everything in the repository, issues, comments and pull requests is in English. The pre-commit hook rejects added CJK lines.
- After V0 merges into `main`, remind the user to turn on the CodeQL default setup.

## 4. How agents work together

The user talks only to `planner`. `planner` coordinates the agents.

1. `planner` sends the next ready story to its session, in a short message: issue, branch, how to report.
2. `planner` sends each new head of a pull request to the `reviewer` session.
3. `planner` checks the acceptance and merges.
4. `planner` asks the user only for what only the user can do, or for a `Verdict: needs decision`.

If a session is not available, `planner` runs the routine `memex cloud-impl` or `memex reviewer`. Creating a routine attaches all connectors of the account, so clear them at once. A routine `reviewer` is Claude, so it is less independent than Codex.

## 5. How to work with the user

- Talk with the user in Chinese. Keep explanations simple. The user often asks from several angles.
- Discuss first. Start a large change after the user agrees. Report when done.
- Research before you ask. Say whether a fact is official, second-hand or inferred.
- Record each decision at once, with the date, in the ADR, glossary, roadmap or issue that it affects.
- Make replaceable parts configurable (`dependencies.md`).
- Converge quickly (ADR 0010). Use common standards: KRM, CloudEvents, OpenTelemetry, PROV-O, JSON-LD, MCP.
- Answers that the user pastes from other AI assistants are references. Check them before you use them.

## 6. Documents

- Put process notes in the issue or the pull request.
- Add a `.md` file only if the issue scope names it.
- Write procedures in ASD-STE100. Use tables and lists. Write long text only to explain why.
- Put each rule as high as it can go (ADR 0032): program check, Claude hook or permission, skill or subdirectory `AGENTS.md`, root `AGENTS.md`, document. If a mistake repeats, move its rule up. Then delete the text and keep one link.

## 7. Items for the user to decide

| # | Item | When |
|---|---|---|
| D1 | Scope and exit criteria of P1 to P5 | Decision gate (ADR 0020) |
| D4 | What the Micro World hides from the agent | Before V2 (`open-questions.md` #1) |
| D5 | Whether to simplify the process | Decision gate (`open-questions.md` #2) |
| D6 | Branch protection on `main` | Start of the formal stage (ADR 0012, 0031) |

## 8. Hard limits

- Keep the `archive/*` tags as they are.
- Learn by configuration only, such as Calibration (VISION principle 3).
- Use only the candidate models and control groups of the experiment matrix (ADR 0010).
- Assemble each Model Backend, store and composition layer through configuration and the Composition Root (ADR 0008).
- Change the Worldview only through an Action (ADR 0014).
- Run on the runtime of ADR 0013 and use standard observability tools (ADR 0015).
- Write a new ADR before you change a constraint in `roadmap.md`.
- In V0, use Fake Providers and the JSONL Event Log only (`roadmap.md`).
- Before each push, compare `git log origin/<branch>..HEAD` with the expected commits.
- Work in your own clone. Each implementer has its own working directory.
