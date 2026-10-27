# Implementation notes

When the implementing agent meets a situation that neither the spec nor the ticket covers, makes its own decision, and the decision matters enough that the user should know, it appends an entry at the end of this file. By default, write nothing. A decision that only the user can make is not written here: stop and ask the user.

Format of each entry:

```markdown
## YYYY-MM-DD #<issue>
- Situation:
- Decision:
- Reason:
- How to revert:
```

Append only. Do not change existing entries.

---

## 2026-10-27 #42
- Situation: the V0 stories say to work on `exp/v0-skeleton` (ADR 0012). This cloud session can push only to its assigned branch, `claude/new-session-t41aib`.
- Decision: the V0 stories are committed to `claude/new-session-t41aib`. It takes the place of `exp/v0-skeleton` and merges into `main` after the V0 gate, as ADR 0012 says.
- Reason: the session cannot push to a different branch without the user's permission.
- How to revert: create `exp/v0-skeleton` from `claude/new-session-t41aib` and continue there.
