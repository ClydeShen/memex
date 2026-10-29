# Commit messages

People, agents and the editor's message generator all follow this rule. The commit-msg hook (`harness/sensors/commit-msg.ts`) rejects a message whose first line breaks it.

## First line

```text
type(scope)!: description
```

- `type` is one of:

  | Type | For |
  |---|---|
  | `feat` | A new feature |
  | `fix` | A bug fix |
  | `docs` | Documentation only |
  | `refactor` | A code change that neither fixes a bug nor adds a feature |
  | `perf` | A change that makes the code faster |
  | `test` | Tests only |
  | `build` | The build, the dependencies, the check scripts and hooks |
  | `ci` | The CI configuration |
  | `style` | Formatting only, with no change in meaning |
  | `chore` | Other maintenance |
  | `revert` | Undoing an earlier commit, written by hand |

- `(scope)` is optional: one word for the area, made of letters, digits, `.`, `/`, `_` or `-`. For example `feat(runtime): ...`, `docs(handoff): ...`.
- `!` is optional and marks a breaking change: `feat(runtime)!: ...`.
- After `: ` comes the description: lowercase imperative, no period at the end, for example `docs: fix a typo in the handoff`.

## Messages that git writes

These are accepted as git writes them, without the format above:

- Merge commits: a first line that starts with `Merge ` (for example `Merge branch 'side' into main`).
- Revert commits: a first line that starts with `Revert "` (for example `Revert "docs: fix a typo"`).

## Body

- Leave one empty line after the first line. Explain what changed and why, not how.
- When the commit finishes a task, list how you verified it: the commands you ran and their results.
- Refer to the issue with `Refs #<issue>`. Do not use closing keywords (`Closes`, `Fixes`, `Resolves`): the issue is closed after the work is verified, not by the commit.
- Lines that start with `#` are comments; git removes them.
