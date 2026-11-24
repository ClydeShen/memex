# Rule writing

Follow this procedure when you add, change or remove a rule for agents. A rule tells an agent what to do. All rules that agents follow are in `harness/rules/` (user decision, 2026-11-24). This file is written in ASD-STE100.

## 1. Before you write a rule

1. Search for the same rule. Look in `harness/rules/`, each `AGENTS.md`, the ADRs in `factory/records/decisions/` and the check configuration (`biome.json`, `.dependency-cruiser.cjs`, `knip.json`, `tsconfig.base.json`).
2. If the same rule exists, change that rule. Keep one rule for one behavior.
3. If the new rule overlaps another rule, merge them into one rule in one place.
4. If the new rule conflicts with another rule, stop. Write the two rules and the conflict in the issue, and ask `planner`. `planner` asks the user.
5. Find each term of the rule in `factory/design/GLOSSARY.md`. If a term is missing or has a different meaning, add or correct the glossary entry first. Then use the term exactly.
6. Make sure that the concept of the rule is in the domain model: the glossary, an ADR or a design document. If it is not, record the concept first.

## 2. Select the level

Put the rule at the highest level that can hold it (ADR 0032):

1. A program check: lint, type check, test, formatter, verification script.
2. A Claude Code hook or permission rule.
3. A prompt that loads on demand: a skill, or an `AGENTS.md` in a subdirectory.
4. A prompt that always loads: the root `AGENTS.md`.
5. A document.

- If a program can check the rule, add the check. The check replaces the text.
- Write the rule as text only when no program can check it.
- If an agent breaks a text rule two times, try again to move it to a program check.

## 3. Write a program check

1. Add the check to the tool that owns the concern (ADR 0032 point 4). Keep one tool for each concern.
2. Write a message that tells the agent what is wrong and how to fix it.
3. Add a test that fails when the check is removed.
4. Add one row to the "Checked by programs" table of the rule file for that concern. The row replaces the text rule.

## 4. Write a text rule

1. Put the rule in the file for its concern. Use the table below.
2. Write one rule in each list item.
3. Write each rule in this format:
   - **Rule:** one instruction in the imperative, 20 words or fewer.
   - **Why:** one sentence.
   - **Source:** the ADR, the issue or the user decision, with the date.
4. Use one instruction in each sentence. Use the active voice.
5. Write a long explanation only if the reader cannot follow the rule without it. Put it below the rule.
6. In other files, link to the rule. Keep the text in one place.

| Concern | File |
|---|---|
| How to write rules | `harness/rules/rule-writing.md` |
| How to write code | `harness/rules/coding.md` |
| Names of files, identifiers and concepts | `harness/rules/naming.md` |
| Where files go | `harness/rules/folders.md` |
| Commit messages, pull requests, review | `harness/rules/commit-messages.md`, `pull-requests.md`, `code-review.md` |
| Rules for one directory only | the `AGENTS.md` in that directory |

## 5. Use leading words

A **leading word** is a short concept that the model already knows from its training, for example "tracer bullet", "fog of war" or "tight loop". The agent thinks with it while it follows the document.

- Use a leading word in place of a phrase or a list that names one idea. Example: "fast, deterministic, low-overhead" becomes "tight". "A loop you believe in" becomes "red", a state that the agent can observe.
- Use the same leading word each time. Use it as a single term, not as a sentence. Each use adds to its meaning and points the agent to the same behavior.
- Use the same word in rules, documents and code. Then the agent connects them and finds the material more reliably.
- Use an existing word first. A new word has no meaning from training, so you must define it in full. If you make a new word, define it in the glossary.
- Put each leading word in `factory/design/GLOSSARY.md`.
- When you edit a document, look for a phrase or a list that is written at several places. Replace it with a leading word.

## 6. Write the positive target

A prohibition puts the prohibited behavior into the context of the agent, and the agent can then do it. So state the behavior that you want.

- Write what to do. Example: "Write one-line comments", in place of "Do not write long comments".
- Use a prohibition only for a hard limit that has no positive form. Then write the positive target in the same item, so that the agent knows what to do.
- When you edit a rule, change each prohibition that has a positive form.

## 7. Change or remove a rule

- When a program starts to check a text rule, delete the text. Add the row to the "Checked by programs" table.
- When a rule is no longer correct, delete it. Write the reason in the issue or the ADR that changes it.
- Keep each rule file at 300 lines or fewer.

## 8. Who approves

- An agent proposes a rule in its issue or pull request.
- The rule applies after the user approves it (`harness/README.md`, "Who can change it").
