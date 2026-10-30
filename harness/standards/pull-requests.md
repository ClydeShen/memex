# Pull requests

People, agents and the editor's description generator all follow this rule.

## Title

The title follows the first line of [commit-messages.md](./commit-messages.md): `type(scope)!: description`, with the same types.

## Body

1. What changed and why, in a few sentences.
2. How it was verified: the commands and their results, or the manual steps.
3. Anything the reviewer must know: decisions, deviations, open points.
4. `Refs #<issue>` for each issue the pull request belongs to. Do not use closing keywords (`Closes`, `Fixes`, `Resolves`): the issue is closed after the work is verified.
5. The last line is `Role: <role>`, the role of the author (`planner`, `reviewer`, `local-impl` or `cloud-impl`).
