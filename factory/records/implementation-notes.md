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

## 2026-10-27 #43
- Situation: ADR 0028 section 3, rule 6 gives example marker words for the scan of `memex/`, and "experiment" is one of them. contracts.md lists `Experiment` as a resource `kind` that V0 needs, and it is not settled yet whether that schema lives in `@memex/contracts`.
- Decision: `harness/sensors/marker-words.mjs` scans for "legacy", "previously", "formerly", "deprecated", "baseline", ADR numbers and `factory/` or `harness/` paths, but not "experiment".
- Reason: if the `Experiment` schema goes into `@memex/contracts` (V0-04 or V0-11), the word would fail every check there. "Baseline" is also a GLOSSARY term, but ADR 0028 section 3, rule 3 already says that `memex/` does not mention Baselines, so it stays in the list.
- How to revert: add `/\bexperiments?\b/i` to `MARKERS` in `harness/sensors/marker-words.mjs` once it is clear that `memex/` does not name Experiments.
