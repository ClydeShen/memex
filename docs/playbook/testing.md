# Testing at Scale

This file is the testing standard: why tests matter more when agents write the code, who owns which tests, where to put tests, the minimum practices, and the practices worth adding as the project grows. Where the checks run is in [guardrails.md](./guardrails.md), section 1. How feedback goes back into the harness is in [feedback.md](./feedback.md).

---

## 1. Why testing changes when agents write the code

- **Tests are the oracle.** The planner verifies by running commands, not by reading the code line by line. So the tests must be correct, protected, and able to fail.
- **Agents work toward the signal.** An agent that must make the checks pass takes the cheapest way, sometimes by weakening or deleting a test. A test that the implementer can change is a weak guardrail.
- **Fast feedback guides; only the outermost gate decides.** Feedback after each edit stops an agent from building on a mistake. Only the gate that runs everything in a clean environment can be trusted.

---

## 2. Who owns which tests

The implementer of a change must not be the only author of the tests that decide whether the change is done.

| Kind of test | Written by | When | Protected? |
|---|---|---|---|
| Milestone gate tests (the milestone's pass criteria) | A planner or a test author, not the implementer of the milestone's stories | Before the stories that they verify start, or in a story of their own | Yes, after they are committed |
| Acceptance tests of a story (when the acceptance needs a new test, not only a command) | A planner or a test author (person or agent), not the story's implementer. The implementer writes only the code that connects the test to the product (rule 6) | Before the story is marked ready | Yes, after they are committed |
| Conformance suites of a port (every implementation of the port must pass) | The architect | With the contract | Yes |
| Unit tests and property-based tests | The implementer | Test first: a failing test, then the code | No, but deleted or weakened tests are listed at verification |

Rules:
1. **An acceptance test is committed before the story is marked ready, and it fails for the right reason.** "The right reason" means it fails because the behaviour is missing, not because of a syntax error or a missing import. If the test needs connecting code that does not exist yet, mark it pending; the implementer writes the connecting code first and shows that the test then fails for the right reason ([workflow.md](./workflow.md), section 2.1).
2. **Protect the protected tests with tools, not with instructions.** Deny the agent edit access to their paths in the agent tool's configuration. Where a hosting platform exists, require a review by the owner for these paths on the server (for example, `CODEOWNERS` with a required review); without one, rule 4 is the only protection after the deny rule. A deny rule stops the agent's file tools but not a script that the agent writes, so also compare the tests with the baseline at verification (rule 4).
3. **If the implementer thinks a protected test is wrong, the implementer stops.** Do not change the test. Mark the issue **blocked**. Write which test, why it seems wrong, and the evidence (for example, the requirement it contradicts). The planner decides with the owner: fix the test in a separate change, or clarify the requirement. This follows the Definition of Blocked: a missing decision is a block, and the agent does not guess its way around it.
4. **At verification, list the test changes.** Run `git diff --name-status --diff-filter=D <baseline>..HEAD -- <test paths>` to find deleted test files, and read `git diff <baseline>..HEAD -- <test paths>` for changed assertions. Every deleted test and every changed assertion has a written reason in the issue. A cleanup or refactoring change deletes no tests and changes no assertions.
5. **When a requirement changes, the planner changes the test first**, after the owner confirms the requirement. The new test fails, then the implementer changes the code. The test never follows the code.
6. **Write acceptance tests as examples of the requirement** (Specification by Example). Each example gives a starting state, an action, and the expected result, in words that the owner can read. A business-readable format such as Gherkin (Given / When / Then) is one way; a plain test with clear names is another. The planner owns the examples. The implementer writes the code that connects them to the product (for example, step definitions or fixtures) and the product code. The reviewer checks that this connecting code does not make an example pass without the behaviour.

---

## 3. Where to put tests

Write few tests, aimed at the critical points. A critical point is a place where a failure hits what matters most in this project. Name the critical failures for the project. Typical ones are:

- A wrong result that the product exists to get right (for example, a wrong money value in a payment product).
- Lost data.
- A security gap.
- A repeat of a past incident.

Typical technical critical points: the contracts (valid input passes, invalid input is rejected), the milestone pass criteria, the invariants (with property-based tests), and the security gates. Give each port a conformance suite that every implementation must pass. Before a bug fix, write a test that reproduces the bug.

---

## 4. Minimum practices

Every project does these. They cost little.

| # | Practice | Where it runs | Why |
|---|---|---|---|
| M1 | **One command checks everything, with short, machine-readable output.** Type checks, lint, architecture rules, tests. Use an output mode that prints only failures (some test runners have one for agents). Write JUnit XML or JSON as well when a tool needs it | Pre-push, CI | Agents read every line of output. Pages of passing tests waste context and hide the failure |
| M2 | **Agent session hooks run a subset.** After each edit: lint and format the changed files. Before the agent ends its turn: types, lint, and the tests related to the changed files; block the end of the turn if they fail, with a guard against an endless loop. Use the test runner's own selection (by file or by coverage) | Agent session | The agent fixes a mistake in the same turn, and cannot report "done" while checks fail |
| M3 | **Tests are deterministic.** Ban focused and skipped tests (`.only`, `.skip`, and their equivalents) with a lint rule set to error. Where you can, pass the clock, random numbers, and network access in as parameters (a guide, not a check: an existing codebase can adopt it module by module) | Every layer | An agent cannot tell a flaky failure from a real one. It "fixes" code that was not broken, or learns to run again until it passes |
| M4 | **Write the throughput policy, and never hide a flaky test.** Set `project.throughput` in the checklist. **Tolerant** (the default for most projects): the gate can run a failing test again once; a pass on the second run is recorded as a flaky test, with an issue that has an assignee and a date. **Strict** (critical paths, or when agents work unattended on a backlog): the gate never runs a failing test again; a flaky test is quarantined: it still runs and reports, but does not block, and it has an issue. In both policies, quarantine is not deletion, and the agent does not run the suite again until it passes | CI, pre-push | Retries without a record teach agents a wrong signal and hide shared state and order dependencies. At high agent throughput, a team can prefer a follow-up run to a blocked queue; OpenAI reports this trade-off and calls it wrong for low throughput [secondhand]. The policy makes the choice explicit for each project |
| M5 | **Verify behaviour as a user does.** At the start of each session that changes run-time behaviour, run one end-to-end smoke test, so the agent knows the system works before it changes it. For a library, install the package and run one example. For a product with a user interface, give the agent a browser command-line tool that reads the accessibility tree, so it can use the product. The agent pastes evidence (command output, screenshots), not claims | Agent session | Unit tests pass while the product does not work. Evidence can be checked; a claim cannot |
| M6 | **Tests are not owned by the implementer.** Section 2 | Agent session, verification | The oracle must not be changed by the code it judges |
| M7 | **Enforce at the last gate.** Where CI exists, the same checks are required status checks on the protected branch, and protected test paths need a review by the owner. Where no CI exists, the last gate is the pre-push hook or the agent session gate; write down that it can be skipped ([guardrails.md](./guardrails.md), section 1, rule 4) | CI, or the last local layer | Local hooks can be skipped and are not copied by a clone |
| M8 | **Every new test proves it can fail.** Write the failing test first, then the code. Before a bug fix, write a test that reproduces the bug. Each conformance suite has a negative case: a deliberately wrong implementation must fail it | Agent session | A test that passes before the code exists tests nothing |
| M9 | **No coverage threshold.** Aim tests at the critical points (section 3) | — | A coverage target rewards tests that run code without checking it, which agents produce easily |

---

## 5. Nice to have

Medium and large projects add these when the need is real. Write the reason in the issue that adds one.

| # | Practice | Where it runs | Notes |
|---|---|---|---|
| N1 | **Mutation testing, incremental or by diff, report only.** The tool changes the code on purpose (for example, flips a condition) and checks that a test fails. Handle each surviving mutant: add a test that kills it, or write why it is equivalent or does not matter | After integration (cleanup stories, milestones) | It answers "does this test suite see anything?". Collect scores first; set a threshold only after the data shows a stable level. Tools: role 14 in [language-profiles.md](./language-profiles.md) |
| N2 | **Tests in random order, with a recorded seed.** Run the suite with several seeds; record the seeds so that a failure can be repeated | After integration, on a schedule | Finds tests that depend on another test's state. Do not put it in the everyday check; it adds randomness to the gate |
| N3 | **Test impact analysis for large suites.** Run only the tests that a change can affect, by project graph or by coverage | CI | The full suite still runs at least once before merge or on a schedule |
| N4 | **A flaky-test platform.** Detect and quarantine flaky tests from JUnit results, and open issues automatically | CI | Only for large suites and many contributors. Check that a build error still fails the run after quarantine is switched on |
| N5 | **Hermetic integration tests.** Disposable containers for databases and similar dependencies; network-level mocks for HTTP. Where a dependency can be a port, prefer a fake that passes the port's conformance suite | Pre-push, CI | Tests that need a shared environment fail for reasons the agent cannot see |
| N6 | **Contract and schema tests.** Property-based tests generated from an API schema; consumer-driven contracts between internal services | CI | Consumer-driven contracts do not fit public APIs with unknown consumers |
| N7 | **Visual regression.** Screenshot baselines in the repository. Only a person or a dedicated process updates a baseline; an agent never runs the update command itself | CI | An agent that updates the baseline makes every visual test pass |
| N8 | **Evaluations for LLM features.** Prefer deterministic assertions. When a model grades the output, pin the grading model and its version. Sample production output and grade it as an ongoing check | After integration, continuous | Treat the model's output as untrusted data in the test, as in production |
| N9 | **Review the harness itself on a cadence.** Which checks never fire? Which rules are bypassed again and again? Which results are marked "not useful"? Make a check stronger, rewrite its message, or remove it. The procedure is in [feedback.md](./feedback.md), section 4.3 | Continuous | A check that never fires is either a sign of quality or a blind spot; find out which |

---

## 6. Copyable acceptance lines

For an issue that verifies tests were not weakened:

- [ ] `git diff --name-status --diff-filter=D <baseline>..HEAD -- <test paths>` has no output. Each changed assertion in `git diff <baseline>..HEAD -- <test paths>` has a reason in this issue (write "none" if there are no changes).

For an issue that checks order dependence:

- [ ] The test suite passes in random order with 3 different seeds. The seeds are written in this issue.

For an issue that adds mutation testing:

- [ ] Mutation testing runs on `<packages>` in incremental mode, with no failure threshold. The score and the list of surviving mutants are in this issue. Each surviving mutant in `<core components>` is killed by a new test or has a written reason. If the tool cannot run, the error is in this issue and the item is marked "skipped".

---

## 7. Common mistakes

- The implementer writes the test and the code from the same misunderstanding, so both are wrong together and the test passes.
- A gate retries failing tests until they pass, or a re-run that passes is not recorded.
- A test is deleted or skipped "for now", with no issue and no assignee.
- A coverage threshold, met with tests that assert nothing.
- Expensive checks (mutation testing, random order, full end-to-end runs) in the everyday check, so the check becomes too slow and people and agents start to avoid it.
- A deny rule treated as complete protection, with no comparison against the baseline at verification.

---

## Sources

All pages were opened on 2026-10-14.

- [Harness engineering for coding agent users (Birgitta Böckeler, martinfowler.com)](https://martinfowler.com/articles/harness-engineering.html): guides and sensors, computational and inferential checks, the timing of checks, mutation testing, evaluating the harness.
- [Effective harnesses for long-running agents (Anthropic Engineering)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): a feature list where the agent changes only the pass status, no removing or editing tests, a smoke test at session start, browser automation to verify.
- [Claude Code best practices](https://code.claude.com/docs/en/best-practices): give the agent a way to verify its work, hooks as deterministic gates, write a failing test that reproduces a bug first.
- [Meta engineering: mutation-guided LLM test generation (ACH)](https://engineering.fb.com/2025/02/05/security/revolutionizing-software-testing-llm-powered-bug-catchers-meta-ach/).
- [StrykerJS incremental mode](https://stryker-mutator.io/docs/stryker-js/incremental/), [Stryker.NET configuration](https://stryker-mutator.io/docs/stryker-net/configuration/), [mutmut](https://github.com/boxed/mutmut), [cosmic-ray](https://cosmic-ray.readthedocs.io/en/latest/), [cargo-mutants --in-diff](https://mutants.rs/in-diff.html).
- [Vitest CLI](https://vitest.dev/guide/cli) (related tests, random order, seeds), [Vitest reporters](https://vitest.dev/guide/reporters) (the agent reporter), [pytest-testmon](https://testmon.org/), [Nx affected](https://nx.dev/docs/features/ci-features/affected).
- [Trunk flaky tests: quarantining](https://docs.trunk.io/flaky-tests/quarantining).
- [Testcontainers](https://testcontainers.com/), [MSW](https://mswjs.io/docs/), [WireMock](https://wiremock.org/docs/), [Pact: what it is good for](https://docs.pact.io/getting_started/what_is_pact_good_for), [Schemathesis](https://schemathesis.readthedocs.io/en/stable/).
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots), [Vitest visual regression](https://vitest.dev/guide/browser/visual-regression-testing).
