# Feedback Loops

This file is the feedback standard. It answers four questions: what feedback is useful to an agent, where it comes from, what to do when two pieces of feedback disagree, and how feedback goes back into the work and into the harness. The checks themselves are in [testing.md](./testing.md) and [guardrails.md](./guardrails.md).

---

## 1. What useful feedback is

**Feedback is useful when the receiver acts on it correctly.** A correct message that the receiver does not understand, misreads, or does not care about has the same effect as a false alarm. Measure feedback by what the agent or person does next, not only by whether the message is true.

A useful piece of feedback has these parts:

| Part | Example of good | Example of bad |
|---|---|---|
| Location | `src/orders/cart.ts:42`, a test name, a rule ID | "Something is wrong in the cart" |
| What is wrong | Expected value and actual value | A 500-line stack trace with no summary |
| What to do | "Import from the `orders` package, not from its internal files" | Only the name of the broken rule |
| Where to read more | A link to the rule, the contract, or the acceptance criterion | Nothing |
| Severity | Blocks the work, or is a suggestion | No difference between the two |
| Same result each time | The same input gives the same message | A flaky test; a review that says different things on each run |

Rules:
1. **Quiet when it passes, detailed when it fails.** Print only the failures. Pages of passing output hide the failure and use the agent's context.
2. **Write the messages of your own checks for the reader.** Each custom lint rule, structure test, or check script says what is wrong, what to do instead, and where to read more. A message that appears when the mistake happens works better than a rule written in a document that the agent read long before.
3. **Test a message by giving only the message to a fresh agent.** Give a new agent session the message and nothing else. If it does not propose the right next step, rewrite the message.
4. **Say whether the feedback blocks.** If the agent cannot tell what must be fixed from what is a suggestion, it changes too much or ignores everything.

---

## 2. Where feedback comes from

| Source | When | Kind | Can it block the work? |
|---|---|---|---|
| Agent session hooks: lint, types, related tests | After each edit; before the agent ends its turn | Computational | Yes |
| The one-command check, protected acceptance and gate tests | Before push; in CI | Computational | Yes |
| The agent's own check as a user (end-to-end command, browser) | During the session | Computational, with evidence | Yes, when it is an acceptance criterion |
| Review by a person or a second agent ([review.md](./review.md)) | Before integration | Inferential | Only a confirmed blocking finding (section 2.1) |
| Expensive checks: mutation testing, random order, scans | After integration, on a schedule | Computational | Reports first (testing.md) |
| Production logs, errors, user reports | Continuous | Mixed | No. They become issues |
| Signals about the harness itself (section 2.2) | Continuous | Mixed | No. They change the harness |

Two rules apply to all sources:
1. **Only evidence can stop the work.** Deterministic checks (tests, types, builds, lint) give the same answer each time, so they can block. A model or a person gives an opinion. An opinion can send work back only when it is confirmed: the failure scenario is reproduced or shown in the code (section 2.1). Opinions add to the gates; they do not replace them.
2. **The implementer does not judge its own work.** A different person or agent session, with a fresh context, judges whether the work is done ([workflow.md](./workflow.md)). A reviewer must not change the work that it reviews; it reports, and the implementer changes.

### 2.1 Review findings

A model that is asked to find problems finds some, also in correct code, and repeated fixing of correct code breaks more than it repairs. So review findings need a fixed format and a check before anyone acts on them.

Each finding has:
- **Location**: file and line, or the part of the design.
- **Problem**: one sentence.
- **Failure scenario**: a concrete input or state, and the wrong result it causes. A finding without a failure scenario is a question, not a defect.
- **Basis**: the rule, contract, or acceptance criterion it breaks, or "none" for a preference.
- **Severity**: blocks the work, or is a suggestion.

Rules:
1. **"No findings" is a valid result.** Do not ask a reviewer to find a minimum number of problems.
2. **Confirm a finding before changing code.** Reproduce the failure scenario, or show it in the code. Drop findings that cannot be confirmed, and write one line that says why.
3. **Findings with basis "none" do not block.** They can become a rule later (section 4).
4. **Agreement is not proof.** Several similar reviewers that agree can repeat the same mistake. Proof comes from outside the review: a test, a command, or a source.

### 2.2 Signals about the harness

Some feedback is about the harness, not about the code. Collect it, because it shows where the harness fails:
- The same check fails many times in a row for the same agent task.
- A check never fires.
- A check is skipped, bypassed, or disabled, or a test is deleted.
- A finding is marked "not useful" (section 4.3).
- Issues are sent back as ambiguous, or marked blocked (delivery health signals in [workflow.md](./workflow.md), section 8).
- A person finds a problem at verification that every check missed.

### 2.3 Three loops: where a problem is stuck

When work does not converge, find out which loop is stuck. Each needs a different fix.

| Loop | Signs | Fix |
|---|---|---|
| Tool loop, inside one turn | The same tool call repeats with similar arguments | Check the tool's definition and permissions; limit the repeats |
| Verification loop, across turns, with a check | The check stays red; the edits cycle between a few versions | Make the signal clearer: a smaller test, the full error, a better message |
| Convergence loop, across turns, with no check | The changes go back and forth; the scope grows; no version is closer to done | Stop editing. Go back to the plan or the spec. A person decides |

A problem in one loop can come from another. For example, a stuck verification loop can come from an unclear spec.

---

## 3. When feedback conflicts

Use this order. A higher source wins over a lower one:

1. The owner's decision (a decision in the issue, an ADR).
2. The spec: the story's acceptance criteria and the contracts.
3. Protected tests that agree with the spec.
4. Other deterministic checks (lint, types, architecture rules).
5. Review findings.
6. The implementer's own judgment.

Rules:
1. **Name the conflict and the rule that settles it.** Write in the issue which two sources disagree and which one wins, and why. Do not choose silently.
2. **Never settle a conflict by weakening a check.** Do not delete or skip a test, add an ignore comment, or lower a threshold to make a conflict go away.
3. **A test can be wrong.** Check a test against the spec before you treat it as the truth. If a protected test and the spec disagree, follow the rule for wrong protected tests in [testing.md](./testing.md): stop and mark the issue blocked.
4. **If the spec seems wrong, stop.** Mark the issue blocked. Write the spec clause, the feedback that contradicts it, and the evidence. The owner decides.
5. **Two checks that contradict each other are a configuration error** (for example, a formatter and a lint rule that want different things). Fix the configuration at its one source. Do not work around it in the code.
6. **Limit the attempts, and stop on oscillation.** Set a limit on attempts for the same failure. Stop and report when an edit undoes an earlier edit, or the same test goes from red to green to red. Report the attempts, the feedback, and the spec clause. Do not try again with a small variation.
7. **Limit the rounds between review and fix.** Each move back from review or verification to the implementer is one round. At the project's round limit, the issue becomes blocked and the owner decides ([workflow.md](./workflow.md), section 4.1).

---

## 4. Where feedback goes

### 4.1 Now: back to the agent that is working

- Session hooks return their output in the same turn, and a failing check stops the agent from ending its turn.
- Confirmed review findings go into the issue as a list of fixes, with their severity.
- A conflict that the order in section 3 cannot settle makes the issue blocked.

### 4.2 Later: into the harness

One fix repairs one mistake. A change to the harness stops the same kind of mistake in every later task. When a kind of problem repeats, move it up this ladder:

| Step | When | What |
|---|---|---|
| 1. Fix and record | The first time | Fix the code. Add an entry to the feedback log (section 4.4) |
| 2. Make it a check | It repeats, and a tool can detect it | A lint rule, a structure test, an architecture rule, or a test. Give it a message by section 1 |
| 3. Make it a guide | It repeats, and no tool can detect it | One short rule, as close as possible to where it applies: in the folder's instructions, in a template, or in the review checklist |
| 4. Make it a global rule | Only if it applies to every task | One line in AGENTS.md |

Rules:
1. **Prefer a check to a guide.** A check runs every time. A guide works only when the agent reads it and follows it.
2. **Keep AGENTS.md to the minimum.** Agents follow each line, and every session reads every line. Extra requirements make tasks harder and cost more. Add only what every task needs.
3. **When you change the harness because of an incident, add a test for the change.** For example, a new lint rule gets a test case that the old code fails.

### 4.3 Feedback on the checks

The checks get feedback too. A noisy check teaches people and agents to ignore it, and then they also ignore its true findings.

1. **Anyone can mark a check result "not useful"** and give one reason. Use the simplest channel that the team has (an issue label, a line in the feedback log).
2. **Review the checks at least once per milestone.** Look at the checks that are often marked "not useful", the checks that never fire, and the rules that are often bypassed. For each, rewrite the message, change the rule, or remove the check. Often a better message is enough.
3. **A check that never fires** is either a sign of good code or a blind spot. Find out which, for example with mutation testing or a deliberate mistake.

### 4.4 The feedback log

Keep one log of the lessons. It is the input to the ladder in section 4.2.

Each entry has:
- **Symptom**: what was seen.
- **Root cause**: why it happened.
- **Fix**: what changed in the code.
- **Prevention**: the step on the ladder, and where it is now (the rule, test, or guide), or "none yet".
- **Count**: how many times this kind of problem has been seen.

Rules:
1. **Add to the log and merge entries. Do not rewrite it.** When a log or a guide is summarized again and again, its details are lost. Research reports cases where an agent then did worse than with no log at all. Add new entries, merge duplicates, and remove entries only when their prevention is in place.
2. **Put each lesson where it lives longest.** A lesson about one feature stays in that feature's issue. A lesson about a piece of code goes into a comment next to the code. A lesson that prevents a repeat becomes a test or a check. Only a lesson for every task goes into AGENTS.md.

---

## 5. Copyable lines

For a review:

- [ ] Each finding has a location, a problem, a failure scenario, a basis, and a severity. Each finding is confirmed or dropped with a reason. "No findings" is written when there are none.

For a story that changes the harness after an incident:

- [ ] The feedback log entry names the symptom, the root cause, and the prevention. The new check fails on the old code and passes on the fixed code, and its message says what is wrong, what to do, and where to read more.

For the milestone review of the checks:

- [ ] The checks marked "not useful", the checks that never fired, and the rules that were bypassed in this milestone are listed. Each has a decision: rewrite the message, change the rule, remove it, or keep it with a reason.

---

## 6. Common mistakes

- Every review finding is fixed without confirmation, so correct code is changed and the history fills with churn.
- A reviewer is told to "find problems", so it always finds some.
- A conflict is settled by deleting or skipping a test.
- The agent tries small variations of the same fix many times, with no limit.
- Every lesson goes into AGENTS.md, until the file is long, expensive, and ignored.
- A log or guide is "cleaned up" by summarizing it again, and its details are lost.
- Noisy checks stay, and people and agents learn to ignore all check results.
- Only rules are added to the harness, and none is ever removed.

---

## Sources

All pages were opened on 2026-10-14. The research note behind this file also lists sources that were read but not used here.

- [Harness engineering for coding agent users (Birgitta Böckeler, martinfowler.com)](https://martinfowler.com/articles/harness-engineering.html): guides and sensors; sensor messages written for LLMs, with instructions to fix.
- [Lessons from Building Static Analysis Tools at Google (CACM, 2018)](https://cacm.acm.org/magazines/2018/4/226371-lessons-from-building-static-analysis-tools-at-google/pdf) and [Software Engineering at Google, chapter 20](https://abseil.io/resources/swe-book/html/ch20.html): "effective false positives" measured by whether developers act, a "not useful" button, removing checks that do not improve.
- [Writing effective tools for agents (Anthropic Engineering)](https://www.anthropic.com/engineering/writing-tools-for-agents): error messages that steer the next call; improve them by watching agents use them.
- [If It's Not Buggy, Don't Fix It (arXiv 2609.10123)](https://arxiv.org/abs/2609.10123): LLMs report bugs in correct programs, and repeated fixing breaks more than it repairs.
- [Is Agentic Code Review Helpful? (arXiv 2607.03316)](https://arxiv.org/pdf/2607.03316): most automated review comments in real repositories are rejected, mostly as false positives or out of scope.
- [The Three Loops of Agentic Coding (agentpatterns.ai)](https://agentpatterns.ai/loop-engineering/three-loops-agentic-coding/): tool, verification, and convergence loops, and their fixes.
- [Loop engineering without verification is just automation (Sonar)](https://www.sonarsource.com/blog/loop-engineering-without-verification-is-just-automation/): checks that can fail the work versus opinions; a separate judge over self-critique.
- [Evaluating AGENTS.md (arXiv 2602.11988)](https://arxiv.org/pdf/2602.11988): context files did not raise task success and raised cost; write only the minimum requirements.
- [Agentic Context Engineering (arXiv 2510.04618)](https://arxiv.org/html/2510.04618v2): itemized, incremental updates; repeated rewriting loses detail.
