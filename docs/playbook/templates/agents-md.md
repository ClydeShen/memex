# AGENTS.md (template)

Put this file at the repository root for the implementing agent. **Keep it to about 60 lines. Write only commands, rules, and pointers. Do not describe the current state of the codebase** (that belongs in the as-built docs, and it goes stale).

---

```markdown
# <Project name>

## Read first
- `HANDOFF.md`: current status, next steps, working habits, what not to do.
- `docs/as-built/index.md`: the current state of each package (if it exists).
- Work comes from issues. Read the "Background", "Scope", and "Acceptance" sections of the issue first.

## Commands
- `<one command that checks everything>`: type checking, lint, architecture checks, tests. It must pass before each commit.
- `<run the tests>`
- `<format the code>`
- `<check the as-built docs>`

## Way of working
1. Take work from an issue. Do one issue at a time.
2. Commit each issue separately. Use `<commit message format>`. Put the verification result in the commit message.
3. In the issue, report the result of each acceptance condition. Paste the command and its output. Do not write only "done".
4. Do not change the plan documents, the ADRs, or the epics. If the plan is wrong, write it in the issue.
5. If you must change a contract (`<path of the contracts>`), give the reason in the issue and update the contract document.
6. In a cleanup story, refactor only. Do not add features.

## Rules
- Use the terms in `GLOSSARY.md`. Do not use the words in its `_Avoid_` lines.
- `<architecture check tool>` checks the dependency direction. Do not add an exception to make the check pass. If an exception is necessary, write the reason.
- Do not put machine details or secrets in the repository.
```

---

## Notes

- Replace the commands and paths for your project. The agent must be able to run or follow each line directly.
- If a rule can become an automatic check, make it one and remove it from this file.
- If the file grows beyond about 60 lines, move the extra content to `HANDOFF.md` or a dedicated document, and keep only a pointer here.
- Official guidance on context files like this one: write only what the agent cannot learn by reading the code; do not write file-by-file descriptions.
