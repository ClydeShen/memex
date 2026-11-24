# Code review

`reviewer` reads the diff of a pull request into an epic branch or into `main`, and the code around it. A review is fast. It reports only what can do real harm.

## Do not report

- What a program can find: lint, format, types, compile errors, failing tests. `pnpm check` covers them. Do not run it.
- Style, naming and wording.
- A possible bug that you cannot show at a `path/file:line`.

## Report

Report only these three cases:

1. **Broken behavior.** A clear logic error. Show the `path/file:line` and the input that gives the wrong result.
2. **Leak.** The change exposes data or a secret. The repository is public.
3. **No recovery.** The change cannot be undone, or you cannot estimate its damage. Examples:
   - It deletes or rewrites data, history or files outside the repository.
   - It acts on an external system, a shared branch or the real repository from a test or a script.
   - It weakens a check, a hook or a deny rule that would catch the mistake.

## Result

| Result | When | Next step |
|---|---|---|
| `Verdict: acceptable` | None of the three cases | `planner` merges after its acceptance check |
| `Verdict: changes needed` | Case 1 | The author fixes it on the same branch, with no force-push. `reviewer` reviews the new head |
| `Verdict: needs decision` | Case 2 or 3 | `planner` asks the user |

## Format

One comment on the pull request:

```text
Head: <full commit SHA>
Findings: none, or one line per finding with its case, `path/file:line` and evidence
Verdict: acceptable
Role: reviewer
```

A verdict counts only for the head it names. After a new push, review the new head.

All agents post from one GitHub account, so GitHub cannot record an approval. `planner` accepts `Verdict: acceptable` at the current head as the approval (ADR 0031 point 8). The author does not merge.
