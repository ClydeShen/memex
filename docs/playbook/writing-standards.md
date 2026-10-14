# Writing Standards

This file sets how project documents are written: a single glossary, which documents follow ASD-STE100 (Simplified Technical English), how non-English documents can borrow its principles, how to write explanatory documents, and conventions for dates, evidence, and references. It is language-agnostic and fits any project. Which documents to prepare is in [document-map.md](./document-map.md).

---

## 1. A single glossary

### Why

Agents and people both reach for synonyms. When a concept changes its name between documents, readers assume there are two things. When one word means different things in different places, it is worse. The glossary is the only source of vocabulary; code and docs use it without exception.

### How to write it

- **One file**: `GLOSSARY.md` at the repository root, in sections by domain.
- **Three parts per entry**:
  1. The canonical name (bold, matching the code identifier). If the canonical name is not in the documentation language, give the local name in the definition.
  2. The definition: one to three sentences on what it is and what it is not, citing an ADR where needed.
  3. `_Avoid_`: synonyms not to use, with a note in parentheses on what they mean instead (if anything).
- **Prefer industry-standard terms**, such as Projection from event sourcing, or Port and Adapter from ports and adapters. Do not coin a new word for an existing concept.
- **One word, one meaning**: a word cannot mean two things in two entries. Put each pair of confusable words in each other's `_Avoid_` line.

Entry format example:

```markdown
**Order**:
A customer's confirmed request to buy one or more products. An order exists only after payment is authorized; before that it is a Cart.
_Avoid_: purchase, booking (Booking is only a reserved time slot)
```

### When to add or change an entry

- Add an entry when a concept appears in two or more documents, or becomes a type or module name in code.
- When a concept has two names, or a word has two meanings, fix it at once: change the entry, then search all docs and code and replace each occurrence.
- When the meaning of an entry changes, write an ADR with the reason.
- Check term usage in each consistency review (phase 6 of [framework.md](./framework.md)). A small script can read each entry's `_Avoid_` list and report misused words in the docs.

---

## 2. ASD-STE100: which documents follow it

### What it is

ASD-STE100 (Simplified Technical English) is a controlled form of English that the aerospace industry created for maintenance documentation. It has writing rules and a dictionary of approved words, each with one meaning. The official text is free from asd-ste100.org. The rules that matter most here (rule numbers of Issue 9, from third-party summaries):

| Rule | Content |
|---|---|
| 1.1–1.3 | Use only approved words, only as their approved part of speech and with their approved meaning |
| 2.1 | Write noun clusters of no more than three nouns |
| 3.6 | Use the active voice (in descriptive text, use the passive only when the agent is unknown) |
| 5.1 | Write short sentences (no more than 20 words in procedural sentences) |
| 5.2 | Write only one instruction in each sentence, unless the actions occur at the same time |
| 5.3 | Write instructions in the imperative |
| 7.1–7.3 | Safety instructions: use a fixed word for the risk level (for example, WARNING, CAUTION); start with a clear command or condition; explain the risk or the result |

### Which documents use it

The principle: **procedural text** (it tells the reader what to do and in which order) follows STE; **explanatory text** (it explains why, or compares options) follows the explanatory standard ("Writing explanatory documents" below). If procedural text is misread, the reader does the wrong thing, and an agent follows text literally. STE's "one instruction per sentence" also makes every step checkable.

| Document | STE? | Reason |
|---|---|---|
| Agent operating procedures (skills, the operating standard of a planning or implementing agent) | **Yes** | An agent executes them sentence by sentence; ambiguity becomes a wrong action |
| The "way of working" and "rules" parts of `AGENTS.md` | **Yes** | Same reason |
| Runbooks (deploy, release, roll back, recover, rotate secrets) | **Yes** | Mistakes are expensive, and people read them under pressure |
| Checklists, the workflow, and team agreements | **Yes** | Each item is one checkable action |
| The "scope" and "acceptance" sections of a story | **Yes** | Each item is one change or one checkable condition |
| Safety warnings | **Yes** (rules in section 7 of STE) | State the risk first, and the result |
| ADRs, vision, research notes, architecture descriptions | No | They explain trade-offs and uncertainty; use the explanatory standard |
| The handoff document | Partly: background in explanatory style; "first steps" and "do not" lists in STE | Mixed content |

### How non-English documents can borrow it

ASD-STE100 covers English only. Its dictionary and word limits do not carry over to other languages. Procedural text in another language can borrow its **principles**. The list below is this playbook's proposal [inference]; there is no matching standard for other languages:

1. Write one action per sentence.
2. Start with an imperative verb ("Run…", "Check…", "Delete…"), not "You may want to consider…".
3. Name who does the action; avoid passive constructions.
4. Use one word for one concept, from the glossary.
5. Do not use metaphors, colloquialisms, or rhetorical questions.
6. Put the condition before the action: "If…, then…".
7. Put a warning before the step it applies to, and state what happens if it is ignored.
8. End each task with a done criterion.
9. Keep sentences short, ideally within one line.

Write English procedural documents in ASD-STE100.

---

## 3. Writing explanatory documents

For ADRs, the vision, architecture descriptions, research notes, the tech stack, and the background parts of the handoff document.

1. **Conclusion first, then reasons.** The first paragraph states the decision or conclusion.
2. **One topic per paragraph.** Use a table to compare options.
3. **Use the canonical glossary name** the first time a term appears; add a one-line explanation if needed.
4. **Separate facts from judgments.** Give facts a source; mark inferences as inferences. Research notes use the evidence markers ("Evidence and confidence" below).
5. **Do not overstate.** If it is uncertain, say so. If it is not verified, write "not verified". If nothing was found, write "not found".
6. **Do not write numbers that drift**, such as "26 ADRs in total" or "as section 3 says". If you must write one, make it searchable and update it when it changes.
7. **Reference with relative paths** to files in the repository. Do not cite changing code by line number (as-built docs use paths and symbol names).
8. **Draw diagrams in a text format** (for example, Mermaid), so that changes can be diffed and agents can edit them.
9. **Use UTF-8 and LF line endings for all files** (fix them in the repository with `.gitattributes`).

---

## 4. Dates and decision records

- **Record a decision at once.** As soon as something is decided, write it where it applies: an ADR, the decision log of the issue, the glossary, the roadmap, or the standard that it changes. Commit it before you move to the next topic. Then search the related documents and update each reference.
- **Use absolute dates only**, in the format `YYYY-MM-DD`. Do not write "yesterday", "last week", or "recently".
- **Record the date and who confirmed each decision**, for example "(confirmed by the owner, 2026-10-13)". When the planner decides for the owner, write "planner's recommendation; the owner can change it".
- **Revise without deleting**: add a "revised by …" note and a date to an overturned conclusion, and keep the original text.

---

## 5. Evidence and confidence

- **Mark each fact in research** with its confidence: [official], [official · summary only], [secondhand], [inference], [measured]. Template: [templates/research-note.md](./templates/research-note.md).
- **Look up version numbers, release dates, and tool capabilities** with a command or the official docs, and write the date. Never write them from memory.
- **Give each important judgment** a confidence level and the dimensions that support it (four-dimension confidence, section 1 of [practices.md](./practices.md)).
