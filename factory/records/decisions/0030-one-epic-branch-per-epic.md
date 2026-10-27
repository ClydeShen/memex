---
status: accepted
---

Amended by ADR 0031 (task branches, cleanup, old branches).

# Each epic is developed on its own `epic/*` branch and merged into `main` through a pull request

ADR 0012 let the validation stage work on experiment branches (`exp/*`) that merge into `main` without a pull request after they pass their criteria. On 2026-10-27 a cloud session opened a branch whose name said nothing about its content. The owner wants one branch per epic, with a fixed prefix and a name that says what the epic is, and a pull request for each epic (confirmed by the owner, 2026-10-27). This revises the branch part of ADR 0012 for the validation stage. The rest of ADR 0012 stays.

## Decision

1. Each epic is developed on one branch, created from `main` when the work on the epic starts, not earlier.
2. The branch name is `epic/<topic>`, where the topic says what the epic is, in English kebab-case. The V0 epics use:

   | Epic | Branch |
   |---|---|
   | #38 Foundation | `epic/v0-foundation` |
   | #39 End-to-end | `epic/v0-end-to-end` |
   | #40 Contracts | `epic/v0-contracts` |
   | #41 Gates | `epic/v0-gates` |

3. Each story is one commit on its epic branch, with its verification result in the commit message (roadmap section 4).
4. When all stories of the epic are done, the epic branch merges into `main` through a pull request.
5. No other branches are opened for epic work: no branch per story, and no branch whose name does not say what it holds.
6. The agent does not delete branches. The owner deletes the remote branch after the pull request is merged.
7. The branches of the old system stay as they are (`master`, `archive/memex-v1` and the other old `exp/*`, `feat/*` and `eval/*` branches).

## Considered Options

- **Keep one experiment branch for all of V0 (ADR 0012)**: one long-lived branch for 30 stories makes the merge point late and large, and the branch name does not say which part of V0 is on it. Not chosen.
- **The `feat/*` prefix**: the old system already has `feat/*` branches, so the new epic branches could not be told apart from them by name. Not chosen.
- **One branch per story**: many short branches, which the owner wants to avoid. Not chosen.

## Consequences

- ADR 0012: the validation stage now uses pull requests at the end of each epic. The rule that all changes go through pull requests and CI from the decision gate on is unchanged.
- #42 (V0-02) and #43 (V0-01) of epic #38 were pushed to `main` directly on the owner's instruction (2026-10-27), before this decision. The remaining stories of #38 (#44, #69) go on `epic/v0-foundation`.
- The V0 story issues still say "branch: `exp/v0-skeleton`". This ADR takes precedence over that line.
- Updated: factory/design/HANDOFF.md section 2 and section 5, factory/design/roadmap.md constraint P1 and section 4.
