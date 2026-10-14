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

## Files
- <The files and modules this story changes. Planners use this list to find conflict groups.>
- Patterns to follow: <the existing files or patterns that show how to do it>
- Conflict group: <none, or the issues that change the same files. Do not claim this issue while another issue of the group is in progress.>

## Decision log
- <YYYY-MM-DD: who confirmed or decided what, why, and the confidence level. When the planner decides for the owner, say so and say that the owner can change it.>

## How to finish
- Meet the project's Definition of Done: <link or summary>. This story also needs: <for example, a document to update, a live smoke test>.
- Commit each story separately. Put the verification result in the commit message.
- Report the result of each acceptance condition in this issue (command and output). Then move the issue to "in review".
- If you cannot continue by your own actions, stop. Mark the issue blocked with the reason, the role that can remove the cause, and the condition to continue.
- Refer to this issue with `Refs: #<n>`. Do not use keywords that close it on merge; a planner closes it after verification.

<!--
How to use:
- The full procedure is in ../delivery-planning.md. The states are in ../workflow.md.
- Keep "Part of" on the first line and "Blocked by" on the second line. If the tracker has parent links and dependency links, set them too.
- A hard dependency exists only when B uses something that A makes. Put other ordering in the epic's suggested order.
- Add the "ready" mark only when the story meets the project's Definition of Ready: a clear Definition of Done, no open hard dependency, testable acceptance criteria, the decisions it needs recorded, and pointers to the existing patterns and files to follow.
- If the story needs a decision that only the owner can make, ask the owner before you add the "ready" mark.
- For user interface work, add a "Design rules" section: the design guideline source, the copy-language rule, and the component rules.
-->
