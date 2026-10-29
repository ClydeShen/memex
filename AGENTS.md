Start every session by reading `factory/design/HANDOFF.md`.

Create or update an entry in `factory/records/implementation-notes.md` only when both conditions apply:

- The change involves a significant design decision, or deviates from the agreed design or expected behavior.
- The user needs to know the decision or deviation and its impact.

## Roles

| Role | Who | Does | Commits to |
|---|---|---|---|
| `planner` | Planning session | Writes and syncs issues and epics; edits design docs; merges task pull requests | `main`, docs only |
| `reviewer` | Codex session | Reviews pull requests; opens issues; sometimes opens fix pull requests | Own branch, pull request into the epic branch |
| `local-impl` | Claude on the local machine | Stories that need the local environment or the GPU | The epic branch, directly |
| `cloud-impl` | Claude in the cloud | Stories that need neither | Own branch, pull request into the epic branch |

- Each story has exactly one label: `role:local-impl` or `role:cloud-impl`. Take only stories with your label.
- End every issue, comment and pull request you write with a line `Role: <role>`.

## Branches

- `main` holds verified code. Only `planner` commits to it directly.
- `epic/<topic>` holds the epic in progress, for example `epic/v0-foundation`. At most one exists at a time.
- Task branches keep the default name their tool gives them (for example `claude/...` or `codex/...`). Each one holds one pull request into the epic branch. Each agent has at most one open.
- `planner` merges a task pull request into the epic branch, after `reviewer` approves it and `planner` has verified its acceptance. The author does not merge it.
- An epic merges into `main` through a pull request with a merge commit, after `reviewer` review and user approval.
- Merged branches are deleted automatically. An epic that fails is kept as a tag with the same name under `archive/` (for example `archive/epic/v0-foundation`), then its branch is deleted.
- Write `Refs #<issue>` in commit messages, not `Closes`. `planner` closes issues after verification.
- Do not push to `main` unless you are `planner`. Do not force-push.
- Dependabot pull requests target `main`. The user merges them after CI passes.
- Do not commit generated output: run results, logs, caches, or files with a timestamp in the name. Write it under an ignored directory such as `factory/validation/runs/`. If a tool creates a new kind of output, add a `.gitignore` rule in the same commit.
