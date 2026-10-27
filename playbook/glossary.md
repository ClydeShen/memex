# Glossary

The terms of this playbook. Each term has one meaning in all files. A project keeps its own glossary of product terms ([writing-standards.md](./writing-standards.md), section 1).

## Roles

A role can be a person or an agent. One person or agent can hold several roles, but does not review or verify its own change.

| Term | Meaning |
|---|---|
| **Owner** | The person who decides scope, priorities, and rules, and confirms decisions. In a team, this can be a product owner or a lead. The owner can name a person who decides for one area; write the name and the area. In this playbook, the word "owner" alone means only this role. |
| **Planner** | Writes issues, epics, and plan documents; verifies results; syncs status ([delivery-planning.md](./delivery-planning.md)). Does not change the product, except for acceptance examples. |
| **Implementer** | Changes the product to complete an issue. There can be many. |
| **Reviewer** | Reviews a change and reports findings ([review.md](./review.md)). Does not change the work that it reviews. |
| **Business analyst** | Writes requirements and acceptance examples. Often the same role as a planner. |
| **Architect** | Keeps the architecture, the contracts, and the dependency rules. Maintains the conformance suites. |
| **Tech lead** | Clears technical dependencies and settles technical disagreements that the owner gives to them. |
| **QA** | Writes test criteria and gate tests. |
| **Release role** | Starts a release, runs the smoke test after release, and watches the result ([workflow.md](./workflow.md), section 6). |
| **On-call role** | Restores the service after an incident and writes the postmortem. |
| **User** | A person who uses the product. |

## Work items and tracker

| Term | Meaning |
|---|---|
| **Tracker** | The system that keeps the issues and the epics. |
| **Issue** | One work item in the tracker. |
| **Story** | An issue that describes one change. |
| **Epic** | An issue that groups the issues of one theme, with a status table, a suggested-order table, and a dependency diagram. |
| **Theme** | The leading word of an epic, with one sentence that gives the goal. A theme has an exit criterion. |
| **Leading word** | One short word that the team already uses, for example "isolation" or "feedback". It names the one quality that all issues of the epic make better. |
| **Exit criterion** | The condition that tells you that the theme is complete and the epic can close. |
| **Epic order** | The sequence of the open epics. Implementers take work from the epics in this sequence. |
| **Ready mark** | A label, a status, or a field that shows that an issue meets the Definition of Ready. |
| **Claim** | The act that gives an issue to one implementer (an assignment, or a move to "in progress"). An issue in progress has exactly one implementer. |
| **Hard dependency** | Issue B cannot start before issue A is closed, because B uses something that A makes. |
| **Dependency link** | The tracker function that records a hard dependency. Without it, write "Blocked by <issue>" in the issue. |
| **Parent link** | The tracker function that connects an issue to its epic. Without it, write "Part of <epic>" on the first line of the issue. |
| **Suggested order** | The order that the planner recommends. It is not a block. |
| **Conflict group** | Issues that change the same files or modules. They must not be in progress at the same time. |
| **WIP limit** | The maximum number of issues in progress at the same time, for the team or for one epic. |
| **Decision log** | The dated list of decisions in an issue: what was decided, who decided, and the confidence level. |
| **Evidence** | A fact that you can find again: a file and line, a command output, a query result, a change in version control. |
| **Sync** | The procedure that makes the epic agree with the real state of its issues. |

## Workflow

The states and the transitions are in [workflow.md](./workflow.md).

| Term | Meaning |
|---|---|
| **Definition of Ready** | The conditions that an issue meets before it can be claimed ([workflow.md](./workflow.md), section 2). |
| **Definition of Done** | The conditions that an issue meets before it can be closed. |
| **Definition of Blocked** | The conditions that make an issue blocked. |
| **State owner** | The role that moves an issue out of a state. |
| **Round** | One move of an issue back to "in progress" from "in review" or "verifying", or after a revert. |
| **Round limit** | The maximum number of rounds for one issue. At the limit, the issue is blocked. |
| **Logic-done** | Correct by tests alone: the result does not depend on the environment ([practices.md](./practices.md), section 4). |
| **Live-done** | Verified once against the real boundary (network, operating system, external service, deployment). |
| **Loop card** | A description of one feedback loop with seven fields ([workflow.md](./workflow.md), section 7). |
| **Comprehension debt** | The gap between the code that agents produced and the code that the team has read and can explain. It grows when people accept agent output without reading it ([social-contract.md](./social-contract.md), F8 and F9). |
| **Low-load proposal** | A plan or report that asks the least of the owner to read, decide, watch, and maintain ([practices.md](./practices.md), section 9). |

## Harness and tests

| Term | Meaning |
|---|---|
| **Harness** | Everything around the agent that guides it before it acts and checks its work after: instructions, tools, checks, tests, and the workflow. |
| **Guide** | A part of the harness that acts before the agent acts (an instruction, a template, a type). |
| **Sensor** | A part of the harness that checks the work after the agent acts (a test, a lint rule, a review). |
| **Gate** | A check that can stop the work. The **last gate** is the outermost layer that everyone passes: the required checks on the server where CI exists, or else the pre-push hook or the agent session gate. |
| **Protected tests** | Gate tests and acceptance tests. The implementer cannot change them ([testing.md](./testing.md), section 2). |
| **Acceptance example** | One example of a requirement: a starting state, an action, and the expected result. The planner owns it. |
| **Connecting code** | The code that connects an acceptance example to the product (for example, step definitions or fixtures). The implementer writes it. |
| **Shared agent context** | What the agents of all members read: AGENTS.md, shared skills, hooks, and check configuration. |
| **Local layer** | The settings of one person's tool that are not committed. |
