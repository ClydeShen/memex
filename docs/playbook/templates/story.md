Part of #<epic number>
Blocked by #<prerequisite issue>, #<prerequisite issue>

## Parent
#<epic number> (<epic title>). Branch: `<branch name>`.

## Background
- <A fact, with evidence: `path:line`, command output, or a section of a document.>
- <Why the work is needed; the root cause, if known.>

## Scope
- <One change per item.>
- <One change per item.>

## Acceptance
- [ ] <A condition with a command or a concrete value. Example: `<command>` exits with code 0.>
- [ ] <A condition. For a full set, use "each", "all", or "no".>

## Out of scope
- <What this story does not change, and the issue that owns it.>

## Decision log
- <YYYY-MM-DD: who confirmed or decided what, and why. When the planner decides for the user, say so and say that the user can change it.>

## How to finish
- Commit each story separately. Put the verification result in the commit message.
- Report the result of each acceptance condition in this issue (command and output).

<!--
How to use:
- Keep "Part of" on the first line and "Blocked by" on the second line. If the tracker has parent links and dependency links, set them too.
- A hard dependency exists only when B uses something that A makes. Put other ordering in the epic's suggested order.
- Add the "ready" mark only when the story meets the project's Definition of Ready: a clear Definition of Done, no open hard dependency, testable acceptance criteria, the decisions it needs recorded, and pointers to the existing patterns and files to follow.
- If the story needs a decision that only the user can make, ask the user before you add the "ready" mark.
- For user interface work, add a "Design rules" section: the design guideline source, the copy-language rule, and the component rules.
-->
