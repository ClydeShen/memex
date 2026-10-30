# Code review

`reviewer` reads the diff of a pull request into an epic branch or into `main`. A review is fast and looks at one thing: if this change is wrong, can we recover?

## Do not check

Do not report what a program can find: lint, format, types, compile errors, failing tests. `pnpm check` covers them. Do not run it. Do not report style or wording.

## Check

Read the diff and the scope of the linked issue. Answer two questions:

1. **Damage.** What can this change break, and is that inside the scope of the issue?
2. **Recovery.** If the change is wrong, can we undo it, for example with `git revert`?

A change cannot be undone, or its damage is outside the code, in these cases:

- It deletes or rewrites data, history or files outside the repository.
- It publishes a secret or private data. The repository is public.
- It acts on an external system, a shared branch or the real repository from a test or a script.
- It weakens a check, a hook or a deny rule that would catch the mistake.

## Result

| Result | When | Action |
|---|---|---|
| `Verdict: acceptable` | The damage is inside the scope and the change can be undone | Pass. Do not add other comments. |
| `Verdict: needs decision` | You cannot estimate the damage, or the change cannot be undone | Name the path and line, what can go wrong, and why it cannot be undone. `planner` asks the user. |

A correct-looking change that may have a bug still passes if the damage is small and it can be undone.

## Report

One comment on the pull request:

```text
Head: <full commit SHA>
Damage: <one sentence>
Recovery: <one sentence>
Verdict: acceptable
Role: reviewer
```

A verdict counts only for the head it names. After a new push, review the new head.

All agents post from one GitHub account, so GitHub cannot record an approval. `planner` accepts `Verdict: acceptable` at the current head as the approval (ADR 0031 point 8). The author does not merge.
