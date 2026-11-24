# Agent instructions

Shared by Codex and Claude Code. The root `AGENTS.md` points here. It also holds the roles, the branch rules and the rule for implementation notes.

## Read first

1. `factory/design/HANDOFF.md`: what to read, the current state, what to watch out for.
2. `factory/as-built/index.md`: what the code is now, one page per package.

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Installs the dependencies; on a fresh clone it also turns on the git hooks in `.githooks/` |
| `pnpm check` | The full check of all packages: lint, architecture, marker words, types, unused code, tests, and the as-built documents. Must pass before you push |
| `pnpm test` | The tests only |
| `pnpm docs:check` | Checks the as-built pages: front matter, links, paths, symbols, line references, tests of the key invariants. Also checks the size and place of every Markdown document: `AGENTS.md` 60 lines, `HANDOFF.md` 100, other documents in `factory/design`, `factory/as-built`, `harness/rules` and `harness/agents` 300, no limit in `factory/records`, no other directory. Also reports words that the glossary says to avoid, without failing |
| `pnpm code-rules` | No comment in `.ts`, `.mjs` and `.cjs` files except a tool directive with a reason and an issue number (`biome-ignore`, `@ts-expect-error`, `@ts-ignore`); one main runtime export for each file in `memex/` and `factory/validation/`, named for it; the deep-module lists, entry files and ports (`factory/design/project-structure.md`). The pre-commit hook runs the comment check on staged files, and fails a commit that changes more than 400 lines (not counting `pnpm-lock.yaml`, generated files and merge commits) |
| `pnpm plan:order <epic number>` | Orders the stories of an epic from the dependency links on GitHub and reports where the epic body disagrees. Needs an authenticated GitHub CLI. Read only. Exit code 0 when there is no cycle and no mismatch, 1 when there is, 2 on a usage or request error |
| `node harness/sensors/commit-msg.ts <file>` | The commit-msg hook: fails when the first line is not Conventional Commits. Merge and revert messages that git writes are accepted |
| `node harness/sensors/no-cjk.mjs --staged` or `<base> <head>` | Fails when added lines or new paths contain CJK text; `--staged` checks the staged changes (pre-commit), two commits check the range (CI) |
| `node harness/sensors/marker-words.mjs <directory>...` | Fails when a file contains a marker word that tells the history of a decision or points to development records; `pnpm markers` runs it on `memex` |
| `pnpm docs:stale` | Lists the as-built pages whose covered files changed since the page was checked. A gate in the cleanup stories only |
| `pnpm docs:generate` | Writes `factory/as-built/generated/`: the package list, the dependency graph and the exports of each package |

## Claude Code hooks

The logic is in `harness/sensors/agent-hooks/`; the scripts in `.claude/hooks/` only call it.

| Hook | What it does |
|---|---|
| PostToolUse on Edit and Write | Runs Biome on the edited TypeScript file inside the project. A failure goes back to the agent as exit code 2, in the same turn |
| Stop | Runs Biome, the type check and the tests related to the files changed since the last commit, except the files that `permissions.deny` forbids the agent to edit. A failure blocks the stop; a failure in a protected file tells the agent to report it in the issue, ask the user and stop. A second stop right after a block passes, so the hook cannot loop. `pnpm check` runs in the pre-push hook |

## How to work

- Take your task from a GitHub issue. The issue is the only channel between the agents.
- Report the result of each acceptance criterion in the issue, with the command and its output.
- Do not change `factory/records/`, except to append to `factory/records/implementation-notes.md`. Do not edit the epic issues; `planner` keeps them.
- When you change a contract (`factory/design/architecture/contracts.md`), say why in the issue.
- If a check fails in a file you may not edit, do not work around it and do not use `--no-verify`. Report the check, the file and the error in the issue, ask the user, and stop.
