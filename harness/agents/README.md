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
| `pnpm docs:check` | Checks the as-built pages: front matter, links, paths, symbols, line references, tests of the key invariants. Also reports words that the glossary says to avoid, without failing |
| `pnpm docs:stale` | Lists the as-built pages whose covered files changed since the page was checked. A gate in the cleanup stories only |
| `pnpm docs:generate` | Writes `factory/as-built/generated/`: the package list, the dependency graph and the exports of each package |

## How to work

- Take your task from a GitHub issue. The issue is the only channel between the agents.
- Report the result of each acceptance criterion in the issue, with the command and its output.
- Do not change `factory/records/`, except to append to `factory/records/implementation-notes.md`. Do not edit the epic issues; `planner` keeps them.
- When you change a contract (`factory/design/architecture/contracts.md`), say why in the issue.
- If a check fails in a file you may not edit, do not work around it and do not use `--no-verify`. Report the check, the file and the error in the issue, ask the user, and stop.
