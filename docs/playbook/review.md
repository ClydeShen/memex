# Review Standard

This standard gives the procedure for reviewers. A reviewer can be a person or an agent. The workflow states ("in review", "verifying") are in [workflow.md](./workflow.md). The format of findings and the order of sources in a conflict are in [feedback.md](./feedback.md).

## 1. Scope

1.1 This standard applies to each reviewer of a change.

1.2 A reviewer examines a change and reports findings. A reviewer does not change the work that it reviews. The implementer makes the changes.

1.3 A reviewer is not the implementer of the change. Review in a new session or with a fresh context.

1.4 The full check at the last gate ([glossary.md](./glossary.md)) is the gate. The review adds the parts that tools cannot check: design, behaviour against the requirement, security judgment, and the quality of the tests. A finding can send the work back only when it is confirmed (3.7).

> **CAUTION:** Do not change the code, the tests, or the check configuration of a change that you review. If you change them, the review is not independent.

## 2. Inputs

2.1 Get these inputs before you start:

- The issue: background, scope, acceptance, out of scope, files, decision log.
- The diff of the change.
- The results of the required checks.
- The project standards: the code style, the contracts, the dependency rules, the global constraint table, and the security and data requirements.

2.2 Do not use the notes or the reasoning of the implementer as evidence. Use the issue, the diff, the check results, and the standards.

## 3. Task: review a change

3.1 Do this task when an issue enters "in review".

3.2 Make sure that the required checks pass. If a check fails, stop the review. Move the issue back to "in progress" with the name of the failed check. Count one round.

3.3 Read the issue. Then read the diff.

3.4 Examine the change in this sequence:

1. **Design**: the change fits the architecture. It obeys the dependency rules and the constraint table. A change to the structure has an ADR. A change to a contract has the reason in the issue and an updated contract document (phase 6 of [framework.md](./framework.md)).
2. **Behaviour**: the change does what the acceptance asks. It does not change what "out of scope" names.
3. **Security and data**: the change obeys the security and data requirements. External content is treated as data. No secret or machine detail is committed.
4. **Tests**: the protected tests are not deleted or weakened (compare with the baseline, [testing.md](./testing.md)). Each new test can fail. The code that connects an acceptance scenario to the product does not make the scenario pass without the behaviour.
5. **Complexity**: the code is as simple as the problem allows.
6. **Names, comments, and documents**: the names are glossary terms. The documents that the issue names are updated.

3.5 Do not report what a tool checks (format, lint, types). If a tool must check something that it does not check now, write a suggestion for a new check in the feedback log.

3.6 Write each finding with a location, a problem, a failure scenario, a basis, and a severity ([feedback.md](./feedback.md), section 2.1).

3.7 Confirm each blocking finding. Reproduce the failure scenario, or show it in the code. Drop each finding that you cannot confirm, and write one line with the reason.

3.8 Select one decision:

- **Approve**: there is no confirmed blocking finding. Approve a change that makes the code better, also if it is not perfect. Write the suggestions as non-blocking. After the merge, the issue moves to "verifying". If the merge queue rejects the change, the issue moves back to "in progress" and counts one round.
- **Request changes**: there is a confirmed blocking finding. Move the issue back to "in progress". Count one round.
- **Blocked**: a finding conflicts with the spec, the order of sources cannot settle a conflict, or the issue reached the round limit. Mark the issue blocked. Write the reason, who decides (the owner, or the person that the owner named for the area), and the open findings.

3.9 Write the review result in the issue: the decision, the findings, and each part that you did not examine.

**Completion criterion:** The issue has one decision. Each finding has the five parts and is confirmed or dropped with a reason. "No findings" is written if there are none.

## 4. Task: settle a disagreement

4.1 Do this task when the implementer does not agree with a finding.

4.2 For a conflict between sources (spec, tests, checks, review), use the order in section 3 of [feedback.md](./feedback.md).

4.3 For a design point that no source settles, use this sequence. Stop at the first item that settles it:

1. Technical facts and measurements.
2. The code style and the project standards.
3. Established engineering principles. Do not use personal preference.
4. Consistency with the existing code, if it does not make the code worse.

4.4 If the disagreement is still open, mark the issue blocked and give it to the owner or the tech lead. Do not wait without an end.

**Completion criterion:** The disagreement is settled by a named rule, or the issue is blocked with the person who decides.

## 5. Task: review at the end of a milestone

5.1 Do this task in the cleanup story of each epic that produces code, and at the end of each milestone.

5.2 Do the architecture review of the cleanup story (phase 5 of [framework.md](./framework.md)). Classify each finding as severe or not severe with the written criteria.

5.3 Review the checks: the checks marked "not useful", the checks that never fire, and the rules that are often bypassed ([feedback.md](./feedback.md), section 4.3).

5.4 Read the feedback log. For each problem that occurred again, propose a prevention: a check if a tool can detect it, else a short guide.

5.5 Give the findings and the proposals to the planner. The planner makes the issues (Task 8 of [delivery-planning.md](./delivery-planning.md)).

**Completion criterion:** The architecture findings are classified. Each reviewed check has a decision. Each repeated problem has a proposal or a reason why there is none.

## Sources

All pages were opened on 2026-10-14.

- [Google engineering practices: code review](https://google.github.io/eng-practices/review/) and [what to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html): design first, then functionality, complexity, tests, naming, comments, style, and documentation; approve a change that improves the code, even if it is not perfect.
- The sources of [feedback.md](./feedback.md): the format of findings, confirmation before change, and the order of sources.
