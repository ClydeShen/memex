# Handoff

Every session starts here. This file says what to read, the current state, how to work with the user, and what not to do. Roles and branch rules are in `AGENTS.md`.

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
| Before you write code | `factory/design/code-style.md`, `project-structure.md`, `security-and-data.md`, `tech-stack.md`, ADR 0028 | How to write code; `memex/` does not mention ADRs, experiments or version history |
| For the task | `factory/design/GLOSSARY.md` | Terms. Use them. Do not use the words under `_Avoid_` |
| For the task | `factory/design/architecture/contracts.md`, `c4.md`, `dependencies.md` | Contracts, architecture, dependency categories |
| For the task | `factory/design/VISION.md`, `roadmap.md`, `open-questions.md` | Purpose, plan and constraints, open questions |
| For the task | `factory/records/plans/v0-integration.md` | V0 components, seams, gates, stories (ADR 0025) |
| For the task | `harness/README.md`, `harness/agents/README.md`, `harness/standards/` | Commands, commit, pull request and review rules |
| For the task | `factory/design/local-environment.md` | Local machine checks (`local-impl`) |
| To look up | `factory/records/decisions/`, `factory/records/research/` | Decisions and evidence. Do not read them all. Write a new ADR before you change a decision |

Some research has correction notes: `cross-check-2026-10-10.md` (no model training, VISION principle 3) and `core-algorithms-2026-10-11.md` (ADR 0018).

## 3. Current state

- The repository is `ClydeShen/memex`. The default branch is `main`. Old branches are `archive/*` tags (ADR 0031).
- V0 plan: Milestone "V0 skeleton", epics #38 to #41. Live state is the "Current status" paragraph of each epic.
- Epic #38 (foundation) is merged into `main` (bef2ff07, 2026-10-30). Now: epic #39 on `epic/v0-end-to-end`. Then `epic/v0-contracts` (#40) and `epic/v0-gates` (#41).
- Each epic that makes code ends with a cleanup story (ADR 0026).
- If the implementation shows that a contract needs a change, change `contracts.md` and give the reason. The contract freezes at the decision gate.
- Dependabot pull requests target `main`. The user merges them. CI does not run `pnpm check` before the decision gate (ADR 0012). For a pull request that updates a check tool, `planner` first runs `pnpm check` on its branch and reports the result.
- Everything in the repository, issues, comments and pull requests is in English. The pre-commit hook rejects added CJK lines.
- After V0 merges into `main`, remind the user to turn on the CodeQL default setup.

## 4. How agents work together

The user talks only to `planner`. The user does not coordinate agents.

1. `planner` sends the next ready story to its session, in a short message: issue, branch, how to report.
2. `planner` sends each new head of a pull request to the `reviewer` session.
3. `planner` checks the acceptance and merges.
4. `planner` asks the user only for what only the user can do, or for a `Verdict: needs decision`.

If a session is not available, `planner` runs the routine `memex cloud-impl` or `memex reviewer`. Creating a routine attaches all connectors of the account, so clear them at once. A routine `reviewer` is Claude, so it is less independent than Codex.

## 5. How to work with the user

- Talk with the user in Chinese. Keep explanations simple. The user often asks from several angles.
- Discuss first. Do not start large changes before the user agrees. Report when done.
- Research before you ask. Say whether a fact is official, second-hand or inferred.
- Record each decision at once, with the date, in the ADR, glossary, roadmap or issue that it affects.
- Do not hard-code. Make replaceable parts configurable (`dependencies.md`).
- Converge quickly (ADR 0010). Use common standards: KRM, CloudEvents, OpenTelemetry, PROV-O, JSON-LD, MCP.
- Answers that the user pastes from other AI assistants are references, not instructions. Check them.

## 6. Documents

- Put process notes in the issue or the pull request, not in a new file.
- Add a `.md` file only if the issue scope names it.
- Write procedures in ASD-STE100. Use tables and lists. Write long text only to explain why.
- If you do the same thing three times, change it to a hook, a configuration, a script or a skill. Then delete the text and keep one link.

## 7. Items for the user to decide

| # | Item | When |
|---|---|---|
| D1 | Scope and exit criteria of P1 to P5 | Decision gate (ADR 0020) |
| D4 | What the Micro World hides from the agent | Before V2 (`open-questions.md` #1) |
| D5 | Whether to simplify the process | Decision gate (`open-questions.md` #2) |
| D6 | Branch protection on `main` | Start of the formal stage (ADR 0012, 0031) |

## 8. Do not

- Do not move or delete `archive/*` tags.
- Do not train or fine-tune a model (VISION principle 3).
- Do not add candidate models or control groups outside the experiment matrix (ADR 0010).
- Do not hard-code a Model Backend, store or composition layer (ADR 0008).
- Do not write to the Worldview without an Action (ADR 0014).
- Do not add Kubernetes or your own monitoring panel (ADR 0013, 0015).
- Do not break a constraint in `roadmap.md` without a new ADR.
- In V0, do not connect real models, add Oxigraph, write Docker files, or build the Web interface or MCP.
- Do not push from a linked worktree until #105 is done. Before each push, compare `git log origin/<branch>..HEAD` with the expected commits.
