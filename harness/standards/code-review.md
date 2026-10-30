# Code review

`reviewer` follows this standard for every pull request into an epic branch or into `main`. It covers pull requests only, not design documents or issues.

## Checks

A review makes these five checks, in this sequence. Each one that fails is a finding.

1. **Acceptance.** Each acceptance condition of the linked issue (`Refs #<issue>`) is met, and the pull request or the issue report shows the evidence: the command and its output, or the manual step and its result. A condition without evidence is not met.
2. **Scope.** The pull request changes nothing outside the scope of the issue. Name each extra change: the path and why it is outside the scope.
3. **Repository rules.** The rules in `AGENTS.md`: the branch and its target, `Refs #<issue>` without closing keywords, English only, no generated output, the `Role:` line. And the standards in `harness/standards/`: [commit-messages.md](./commit-messages.md), [pull-requests.md](./pull-requests.md) and this file.
4. **Protected files.** Name each changed path that matches `permissions.deny` in `.claude/settings.json`. The change is allowed only if the issue records that the user lifted the rule for it. Otherwise it is a finding, also when it was made with a shell command: the deny rules stop the edit tools, not scripts.
5. **Tests.** New or changed logic has tests, and the tests fail when the logic is wrong. Accept as evidence a run in which a deliberately broken version fails the tests, or check it yourself by breaking the logic and running the tests.

## Severity

The levels are the P0–P3 scale of Codex code review. On GitHub, Codex reports only P0 and P1.

| Level | Meaning | Blocks the merge |
|---|---|---|
| P0 | The change breaks the target branch or `pnpm check`, loses data, opens a security hole, or changes a protected file without the user's permission (check 4) | Yes |
| P1 | An acceptance condition is not met or has no evidence; a repository rule is broken; logic is wrong, has no tests, or has tests that cannot fail | Yes |
| P2 | A harmless change outside the scope; a problem for later maintenance; a document that the change made out of date | No |
| P3 | Wording, naming or style that no check covers | No |

## Report

- **One finding per comment**, placed at the line it is about. The comment has, in this order:
  - the level and the check, for example `[P1] Acceptance`;
  - the location as `path/file:line`;
  - the evidence: the quoted line, or the command and its output;
  - what would fix it.
- **One summary**, as a review comment:
  - `Head: <full commit SHA>`: the head of the pull request that was reviewed;
  - the result of each of the five checks;
  - the findings, grouped by level;
  - as the last two lines, the verdict and the role:

    ```text
    Verdict: acceptable
    Role: reviewer
    ```

    or `Verdict: changes needed`, then `Role: reviewer`.

`Verdict: acceptable` means that no P0 or P1 finding is open. A verdict counts only for the head it names. After a new push, the pull request needs a new review of the new head.

All agents post from the same GitHub account, and GitHub does not let the author of a pull request approve it. So `planner` treats `Verdict: acceptable` at the current head as the approval that ADR 0031 point 8 requires, instead of a GitHub approval.

## Fixes

- The author fixes the findings on the same branch, with new commits and no force-push, and replies to each finding with the commit that fixes it, or with the reason why it stays.
- `reviewer` reviews the new head again and writes a new summary with a new `Head:` and verdict.
- The author does not merge. `planner` merges the pull request into the epic branch after `Verdict: acceptable` at the current head, and after checking the acceptance of the issue (ADR 0031 point 8).
