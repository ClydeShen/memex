# Research: third-party validation of the agent-driven delivery playbook

Date: 2026-10-17. Subject: how practitioners and researchers understand and configure harness engineering, loop engineering, and graph engineering, and which parts of the playbook (`docs/playbook/`) this evidence confirms, contests, or misses. Context: the playbook was written from one project and is marked mostly "designed" or "researched". This note raises or lowers the confidence of its rules, and feeds a revision of `checklist.yaml` (weights, levels, the autonomy rule).

Confidence markers:
- **[official]**: the relevant part of official docs, a specification, a tool's README, or a paper page was read.
- **[official · summary only]**: only an abstract or overview was read, or the page does not cover the detail.
- **[secondhand]**: a third-party description, such as a search result summary; not traced to a primary source.
- **[inference]**: the author's judgment, with no direct evidence.
- **[measured]**: the result of a command run on the stated date.

Note on reading depth: pages were read through a summarizing fetch tool. Paper pages are abstracts unless stated. The OpenAI post returned HTTP 403, so its content comes only from secondhand coverage.

## Overview

| Question | Finding | Strength of evidence | Confidence |
|---|---|---|---|
| 1. Does the playbook's idea of a harness match practice? | Yes. Guides and sensors, computational and inferential checks, timing of checks, minimal context files, deterministic gates: all match the main practitioner sources. The playbook is broader (it includes the workflow and team agreements) | strong | [official · summary only] |
| 2. Do the loop cards match loop engineering? | Yes. The seven fields cover the building blocks that the literature agrees on. Missing: review by sampling, comprehension debt, and token cost as a first-class signal | medium (no impact data exists) | [official · summary only] |
| 3. Is graph engineering a practice to adopt? | Not yet. The term is new (one survey, 2026-08); single-threaded agents and narrow subagents are the cautious default for coding. The playbook's tracker-based task graph is the defensible form | weak to medium | [official · summary only] / [inference] |
| 4. Are the 14 core (weight 3) items supported? | 6 strongly, 5 with conditions, 3 are guides rather than core. Two rules are contested by a high-throughput practitioner (no retries; revert first) | mixed | see section 4 |
| 5. Is "agents work alone only when the core is complete" sound? | The principle is supported; the all-or-nothing form is not. Autonomy is treated as a graded design decision in the literature | medium | [official · summary only] |
| 6. What does practice emphasize that the playbook lacks? | Human attention and review sampling, comprehension debt, cost budgets, context hygiene, measuring own outcomes | medium | [official · summary only] |

## 1. The idea of a harness

### Evidence
- Böckeler (martinfowler.com, 2026-04-02) defines the outer harness that a coding-agent user builds: guides (feedforward) and sensors (feedback), computational and inferential controls, "keep quality left" timing (fast checks before integration, expensive checks after, continuous sensors outside the change). Using only one direction is weak. She states that there is no method yet to evaluate harness coverage, that functional correctness ("behaviour harness") is unsolved, and that AI-generated tests are "not good enough yet". [official · summary only]
- HumanLayer: keep the context file short (under 60 lines), few MCP tools, skills for progressive disclosure, subagents as context firewalls (not role personas), a Stop hook that is silent on success, back-pressure through checks; start minimal and add only after a real failure. [official · summary only]
- Claude Code best practices: "Give Claude a way to verify its work"; four gate strengths (in a prompt, `/goal`, a deterministic Stop hook, a second-opinion subagent); show evidence, not claims; keep CLAUDE.md short ("Would removing this cause Claude to make mistakes?"); hooks are deterministic, CLAUDE.md is advisory; reviewers prompted to find gaps will report some even when the work is sound. [official]
- Evaluating AGENTS.md (arXiv 2602.11988): context files generally do not improve task success and raise inference cost by over 20%; repository overviews do not help; instructions are followed. [official · summary only]
- Exploratory study of 2,853 repositories (arXiv 2602.14690): context files dominate and are often the only mechanism; skills and subagents are rare. [official · summary only]
- OpenAI harness engineering (2026-02-11): about 1M lines, about 1,500 pull requests, no human-written code; output sped up only after repository-local knowledge, executable rules, layered dependency rules checked by structural tests, per-worktree environments, observability for agents, agent review, and recurring cleanup existed. [secondhand]

### Recommendation for the playbook
- Keep the definition, the guide/sensor/gate terms, and the layers of checks. They match the main sources.
- State in `framework.md` that the playbook covers the **delivery harness** (the outer harness plus the workflow and team agreements). Most sources use "harness" for the outer harness only.
- Add to `testing.md` section 1 that functional correctness is the least solved part, with Böckeler as the source. This supports test ownership and verify-as-user.

### Relation to existing constraints
Core ideas 3, 13, 14 and `feedback.md` section 4.2 are confirmed.

## 2. Loop engineering

### Evidence
- Loop Engineering: Building Blocks, Adoption, and Impact (arXiv 2608.21884, under review): the gray literature agrees on triggered runs bounded by machine-checkable stop conditions, persistent state files, verifier sub-agents, token budgets, and defined escalation points. Mining 36,710 repositories found 217 with confirmed agent loops; they commit the loop configuration, but "almost none commits the state files". No measured effect on outcomes yet. [official · summary only]
- Osmani, "Loop Engineering" (2026-06): automations, worktrees, skills, connectors, subagents (maker and checker), memory outside the conversation. Warnings: "still early; I'm skeptical", token cost, comprehension debt, intent debt, "'done' is a claim and not a proof", review bandwidth caps the number of agents. [official · summary only]
- Osmani, "Own the Outer Loop" (O'Reilly Radar, 2026-09-09): agents run the inner loop; people own the verdict, scope, accountability, and the production boundary; review by sampling; stop conditions and back-pressure; accountability records. It cites an Anthropic randomized trial (comprehension quiz 50% with AI against 67% by hand) and an "orchestration tax". [official · summary only]; the cited trial was not opened [secondhand].
- Sonar, "Loop engineering without verification is just automation": an LLM verifier is advisory; the deterministic gate is the stop condition; "two optimists agreeing". Vendor content with little data. [official · summary only]
- Anthropic, "Effective harnesses for long-running agents": an initializer session, a JSON feature list where agents only flip `passes`, a progress file plus git, `init.sh` and an end-to-end check at session start, browser automation. Observed failures: one-shotting, declaring victory early, marking features done after unit tests only. Qualitative evidence, no benchmark numbers. [official · summary only]

### Recommendation for the playbook
- Keep the loop cards and the closure rules. Map of fields: trigger = triggered run; done when = machine-checkable stop condition; verifier and evidence = verifier sub-agent; limit = token budget and rounds; escalation = escalation point; record = persistent state.
- Add to `workflow.md` section 8 (delivery health): token or cost spend per closed issue, and the share of agent output that a person actually read (review sampling). Both sources name human attention and cost as the binding limits.
- Add to `social-contract.md` section F an agreement against comprehension debt, for example "read a sample of the code that your agents produced, at least the changes to contracts and core logic" (Good to know).
- Note in `framework.md` that loop state files are rarely committed in practice (arXiv 2608.21884), so "the repository is the single source of truth" is a deliberate deviation from common practice and must be enforced by the workflow, not assumed.

### Relation to existing constraints
`workflow.md` section 7 is confirmed. `feedback.md` section 2.3 (three loops) has no independent primary source beyond agentpatterns.ai; it stays [secondhand].

## 3. Graph engineering

### Evidence
- Graph Engineering in the Era of LLM Agents (arXiv 2608.21156, 2026-08): the sequence prompt → context → harness → loop → graph; three pillars (task organization, agent coordination, runtime state management); warnings against more agents without organization, for independent verification, and for explicit limits. A survey, not an evaluation. [official · summary only]
- Cognition, "Don't Build Multi-Agents" (2025-06-12): share full context; actions carry implicit decisions; default to single-threaded agents; parallel collaboration is not yet reliable; narrow read-only subagents are fine. [official · summary only]
- Anthropic, "How we built our multi-agent research system": multi-agent uses about 15 times the tokens of chat; most coding tasks have fewer truly parallel parts than research. [official · summary only]
- Anthropic, "Building effective agents": start with the simplest pattern; workflows before agents; orchestrator-workers when subtasks cannot be predicted. [official · summary only]
- MAST (arXiv 2503.13657): 14 failure modes of multi-agent systems in three groups (system design, inter-agent misalignment, task verification), from 1,600+ traces; points to design and verification. [official · summary only]
- Claude Code: agent teams are "experimental and disabled by default". [official]

### Recommendation for the playbook
- Do not add a runtime graph framework. Keep the graph in the tracker: hard dependencies, suggested order, conflict groups, WIP limit, the epic diagram. This is the "task organization" and "runtime state" pillars, persisted across sessions.
- Add to `delivery-planning.md` section 5 a default: one implementer per conflict group; parallel implementers only for issues with disjoint files and no shared undecided decision (Cognition's "implicit decisions"). Read-only subagents for search are always allowed.
- Do not use the term "graph engineering" in the playbook yet. Evidence is one survey [inference].

### Relation to existing constraints
`guardrails.md` section 5 and `delivery-planning.md` section 5 are confirmed in direction.

## 4. The 14 core (weight 3) items

| Item | Third-party support | Verdict |
|---|---|---|
| one-command-check | Claude Code (a check that returns pass or fail); HumanLayer; OpenAI mechanical enforcement [secondhand] | **Keep W3.** Strong |
| agent-session-hooks | Claude Code Stop hook as the deterministic gate; HumanLayer silent Stop hook; Sonar per-edit checks | **Keep W3.** Strong |
| protect-checks | ImpossibleBench (arXiv 2510.20270): agents pass impossible tasks by shortcuts "from simple test modification to complex operator overloading"; prompting, test access, and the feedback loop change the cheating rate [official · summary only]. Rates and follow-up benchmarks [secondhand] | **Keep W3 and make it Required** (now Recommended). Strong |
| test-ownership | Same evidence. EvilGenie (arXiv 2511.21654) notes that some test edits correct a wrong test [secondhand]; the playbook already routes that case to "blocked" | **Keep W3.** Strong |
| required-check-on-server | General CI practice; OpenAI keeps structural tests blocking [secondhand] | **Keep W3 and make it Required**; the pre-push fallback for projects without CI stays. Medium-strong |
| verify-as-user | Anthropic long-running harness: end-to-end check at session start, browser automation "dramatically improved performance"; Claude Code screenshot verification | **Keep W3** for unattended or long sessions. Make the per-session smoke test conditional: required when the session changes runtime behaviour. Strong for the principle |
| deterministic-tests | No retries in gates is **contested**: OpenAI handles flakes with follow-up runs, and says this "would be irresponsible in a low-throughput environment" [secondhand]. Injecting clock, random, network: no third-party source found | **Keep W3 for the lint ban on focused/skipped tests and no retries in gates**, with the throughput condition written down. Move parameter injection to a W2 guide |
| verification-flow | Maker/checker separation is consensus (Osmani, Claude Code writer/reviewer, Sonar). A planner after merge is heavier than common practice (OpenAI: agent reviewers, no human code review [secondhand]; Claude Code: pre-merge subagent) | **Keep W3** for "the verifier is not the implementer and runs the acceptance commands". Allow a fresh-context agent session as the verifier, and allow pre-merge verification for small projects |
| story-spec | Claude Code: self-contained specs with files, out of scope, and an end-to-end verification step; Osmani intent debt. Böckeler on spec-driven tools: excessive review overhead and poor scaling (a small bug fix became 4 stories and 16 acceptance criteria) | **Move to W2**, scale by size. It is a guide |
| ready-done-blocked | Supported in spirit (stop conditions, escalation); no source measures it | **Move to W2.** It is a guide; keep it Required for projects with a tracker |
| contracts | OpenAI layered dependency rules with structural tests [secondhand] | **W3 only for medium and large projects** (the framework already says contract-first for medium) |
| boundary-check | Same | **W3 only for multi-package projects** |
| agents-md | Strong evidence for "short and minimal" (arXiv 2602.11988, Claude Code, HumanLayer), but it is a guide, and the same study shows no success gain | **Move to W2.** Keep the 60-line rule |
| agent-log-access | OpenAI observability for agents [secondhand]; DORA 2025 "AI-accessible internal data" amplifies AI's benefit [secondhand]. Its done-condition is a line in AGENTS.md: a guide | **Move to W2** |

Two workflow rules outside the core are also contested:
- **Revert first, do not fix forward** (`workflow.md` 4.2): OpenAI, at high agent throughput, prefers minimal blocking gates and follow-up fixes: "corrections are cheap, and waiting is expensive" [secondhand]. Keep the rule, and write its condition: it is for throughput where people review the work; a project at OpenAI-like throughput revisits it with an ADR.
- **Review findings must be confirmed** (`feedback.md` 2.1): confirmed. CodeRabbit study, 31,073 review/feedback pairs: 56.3% rejected, mainly invalid suggestions (arXiv 2607.03316); repeated LLM fixing damages correct programs more than it repairs buggy ones (arXiv 2609.10123); Claude Code warns that a reviewer asked to find gaps will report some. [official · summary only]

## 5. The autonomy rule

### Evidence
- Levels of Autonomy for AI Agents (Feng, McDonald, Zhang; arXiv 2506.12469): autonomy is a design decision separate from capability; five levels (operator, collaborator, consultant, approver, observer). Later frameworks (TrustX ARC, arXiv 2607.09586) say higher levels need more rigorous controls. [official · summary only]
- Claude Code: gate strength is chosen per need; "Each step trades setup for attention." [official]

### Recommendation for the playbook
Replace "agents can work on their own when the core is complete" with graded levels in `checklist.yaml` `scoring`:

| Level | What the agent may do | Items that must be done |
|---|---|---|
| Supervised | A person watches the session | none |
| Unattended task | One task to the end without a person watching | one-command-check, agent-session-hooks, protect-checks, test-ownership, deterministic-tests (lint ban, no retries) |
| Unattended backlog | Takes issues from the tracker one after another | plus required-check-on-server, verify-as-user, verification-flow, story-spec, ready-done-blocked |
| Parallel | Several implementers at the same time | plus contracts, boundary-check, conflict groups and WIP limit, merge queue |

Confidence: the graded form is supported; the exact item sets are [inference].

## 6. What practice emphasizes that the playbook lacks

- **Human attention as a measured limit**: review sampling and an accountability record per accepted change (Osmani). The playbook names attention in delivery health but has no sampling rule.
- **Comprehension debt**: see section 2.
- **Cost**: multi-agent token cost (Anthropic, about 15×), context files +20% (arXiv 2602.11988), Osmani's warnings. Add cost per closed issue to delivery health.
- **Context hygiene**: clear between unrelated tasks; after two failed corrections, start a fresh session with a better prompt (Claude Code). This fits next to the attempt limit in the AGENTS.md template.
- **Measure your own outcomes**: productivity evidence is weak and contested. METR found 19% slower in early 2025, then said those results no longer hold and that its 2026 follow-up is unreliable (task selection) [secondhand for the follow-up numbers]. DORA 2025: AI amplifies existing strengths and weaknesses; small batches, strong version control, and AI-accessible data amplify benefit [secondhand]. The playbook's checklist score measures setup, not outcomes; add one outcome signal (for example, false-ready rate and escaped defects per milestone).
- **Harness evaluation**: Böckeler states that no method exists. The checklist weights are a first proposal; label them as such until a project measures them.

## 7. Low-load proposals (added by the owner, 2026-10-18)

### Evidence
- Osmani, "Own the Outer Loop": human attention does not scale like agents ("orchestration tax"); review bandwidth caps the number of agents; cognitive surrender, citing a Wharton study in which most people accepted wrong AI output with more confidence. [official · summary only]; the Wharton study was not opened [secondhand].
- Claude Code best practices: plan mode "adds overhead"; "If you could describe the diff in one sentence, skip the plan"; a reviewer that is asked to find gaps causes over-engineering if every finding is chased. [official]
- Anthropic, "Building effective agents": use the simplest solution that works; add complexity only when it clearly improves results. [official · summary only]
- Anthropic, multi-agent research system: about 15 times the tokens of chat. [official · summary only]
- HumanLayer: start minimal; add configuration only after a real failure; remove what does not help. [official · summary only]
- That unclear status raises owner anxiety, and that anxiety leads to re-checking: no source was found. [inference]

### Recommendation for the playbook
Practice 9 in `practices.md`: one recommendation first, at most three questions each with a default, the option with the lowest lasting cost and its maintenance cost stated, the plan scaled to the task, the fewest agents, reports split into done / not done / owner actions, and reversible decisions in the agent's role made without asking. Pointers in `delivery-planning.md` 9.7 and the AGENTS.md template (way of working, item 11). The limit of three is a working value [inference].

## Not verified
- The OpenAI post itself (HTTP 403). All OpenAI details are secondhand.
- Full texts of the arXiv papers; only abstracts were read. Adoption percentages for hooks and MCP in arXiv 2602.14690 were not available.
- The Anthropic randomized trial on comprehension (cited by O'Reilly) was not opened.
- METR follow-up numbers come from secondary write-ups.
- ImpossibleBench cheating rates per model and the EvilGenie comparison come from search summaries.
- `feedback.md` section 2.3 (three loops) has no primary source beyond agentpatterns.ai.
- No source measured the effect of Definitions of Ready, conflict groups, or WIP limits for agent work.

## Decisions for the owner
- Accepted (owner, 2026-10-18): the graded autonomy levels (section 5) replace the all-or-nothing rule.
- Accepted (owner, 2026-10-18): the weight changes in section 4. Condition from the owner: not every project has a server. Projects range from frontend-only and backend-only to non-code work; engineering projects come first. So "required-check-on-server" means the last gate that exists, and a project without CI writes the gap down.
- Accepted (owner, 2026-10-18): a throughput condition for flaky tests and fix forward. Projects differ, and most are tolerant now, so "tolerant" is the default and "strict" is a project choice.
- Accepted (owner, 2026-10-18): the comprehension-debt agreements (F8, F9), the review-sampling and cost signals, and the `review-sampling` checklist item.
- Added by the owner (2026-10-18): when an agent plans, orchestrates, or reports, it gives low-load proposals: low mental load for the owner, less anxiety, low maintenance cost. Written as practice 9 in `practices.md` (section 7 of this note).

## Sources
- https://martinfowler.com/articles/harness-engineering.html: Böckeler, guides and sensors, timing, open problems.
- https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents: practitioner configuration (context file, MCP, skills, subagents, hooks, back-pressure).
- https://code.claude.com/docs/en/best-practices: verification, gates, CLAUDE.md, writer/reviewer, adversarial review.
- https://arxiv.org/abs/2602.11988: context files and task success and cost.
- https://arxiv.org/abs/2602.14690: harness mechanisms in 2,853 repositories.
- https://www.infoq.com/news/2026/02/openai-harness-engineering-codex/: secondhand report of OpenAI's harness engineering post.
- https://www.zenml.io/llmops-database/zero-human-written-code-harness-engineering-for-autonomous-ai-agents-at-scale: secondhand case study of the OpenAI team.
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents: long-running harness and its failure modes.
- https://arxiv.org/abs/2608.21884: loop engineering building blocks and repository mining.
- https://oreillyradar.substack.com/p/loop-engineering: Osmani, loop components and debts.
- https://www.oreilly.com/radar/own-the-outer-loop/: Osmani, inner and outer loop, human role.
- https://www.sonarsource.com/blog/loop-engineering-without-verification-is-just-automation/: deterministic gate as stop condition (vendor).
- https://arxiv.org/html/2608.21156v1: graph engineering survey.
- https://cognition.com/blog/dont-build-multi-agents: single-threaded agents, shared context.
- https://www.anthropic.com/engineering/multi-agent-research-system: multi-agent token cost, fit for coding.
- https://www.anthropic.com/engineering/building-effective-agents: simple patterns first.
- https://arxiv.org/abs/2503.13657: MAST multi-agent failure taxonomy.
- https://arxiv.org/abs/2510.20270: ImpossibleBench, test exploitation by coding models (abstract).
- https://arxiv.org/html/2511.21654v2: EvilGenie (read through search summaries only).
- https://arxiv.org/abs/2607.03316: acceptance of agentic code review comments.
- https://arxiv.org/abs/2609.10123: LLM bug reports in correct programs and repeated fixing.
- https://arxiv.org/abs/2506.12469: levels of autonomy for AI agents.
- https://dora.dev/dora-report-2025/: DORA 2025 (read through search summaries only).
- https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/: METR study and its later notice (read through search summaries only).
