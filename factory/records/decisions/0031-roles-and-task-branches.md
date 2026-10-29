---
status: accepted
---

# Four agent roles, task branches into the epic branch, and automatic cleanup

This ADR amends ADR 0030. The `epic/<topic>` branches of ADR 0030 and their names stay.

ADR 0030 assumed one implementer that commits every story on the epic branch. The team is now four agents (user decision, 2026-10-28):

- `planner`: writes and syncs issues and epics; edits design docs on `main`.
- `reviewer`: an independent Codex session that reviews pull requests and opens issues.
- `local-impl`: Claude on the local machine, for stories that need the local environment or the GPU.
- `cloud-impl`: Claude in the cloud, for stories that need neither. Its tool names its own branches (`claude/...`).

Two implementers work at the same time, and all agents post from the same account. The user wants few branches, so that it is always clear where the latest code is, and wants to use the tools as they come.

## Decision

1. **Task branches.** `cloud-impl` and `reviewer` work on the branch their tool names by default (`claude/...`, `codex/...`) and open one pull request into the epic branch. Each agent has at most one open. `local-impl` commits to the epic branch directly. This replaces point 5 of ADR 0030.
2. **Merge into `main`.** The epic pull request into `main` is merged with a merge commit, after `reviewer` has reviewed it and the user approves. Only `planner` commits to `main` directly, and only docs.
3. **Cleanup.** The repository deletes merged branches automatically (setting turned on by the user, 2026-10-28). An epic that fails is kept as a tag with the same name under `archive/`, and its branch is deleted. This replaces point 6 of ADR 0030.
4. **Old branches.** The branches of the old system become tags under `archive/` and are then deleted, so that the remote shows only current work (user decision, 2026-10-28). The user deletes them. This replaces point 7 of ADR 0030.
5. **Assignment.** Each story has one label, `role:local-impl` or `role:cloud-impl`. Every issue, comment and pull request ends with `Role: <role>`.
6. **Issue closing.** Commit messages use `Refs #<issue>`, not closing keywords. `planner` closes issues after verification.
7. **CI.** The checks run on pull requests and on pushes to `main` and `epic/**`. Branch protection waits for the formal stage of ADR 0012.
8. **Merge of task pull requests** (user decision, 2026-10-29). `planner` merges a task pull request into the epic branch, after `reviewer` approves it and `planner` has verified the acceptance of its issue. The author does not merge it.

The rules for agents are in `AGENTS.md`, sections Roles and Branches.

## Considered Options

- **All implementers commit to the epic branch directly**: two agents push to one branch at the same time, and the reviewer has no review point for the cloud work. Not chosen.
- **A fixed name for task branches**: the cloud tool names its own branches. Using its default costs nothing. Not chosen.

## Consequences

- At most four remote branches exist at a time: `main`, one `epic/*` and one task branch for each of `cloud-impl` and `reviewer`. Merged branches disappear by themselves.
- Each epic is one merge commit on `main`, so one revert undoes it.
- Every merge into `main` waits for the user's approval.
