# Global plan

This file is the only execution plan of Memex. For the architecture diagrams, see [architecture/c4.md](./architecture/c4.md). For the integration contracts between modules, see [architecture/contracts.md](./architecture/contracts.md). This file collects the global constraints, the milestones of each stage, and the task breakdown of the current milestone. Each milestone has observable entry and exit criteria. The sources of the constraints are in the ADRs. For terms, see GLOSSARY.md.

The roadmap has two stages, **validation** and **product** (ADR 0020): first use experiments to set the direction and the core capabilities, then build the real product after validation. The experiment tools (Lab) are not the product.

Status:
- **Accepted**: validation stage V0–V2 and the decision gate (V0–V2 content accepted 2026-10-10, stage split accepted 2026-10-11).
- **Draft**: product stage P1–P5, to be set at the decision gate.

---

## 1. Global constraints

All stages and all branches must follow the constraints below. To break any of them, first write an ADR.

### Scope
| # | Constraint | Source |
|---|---|---|
| S1 | This is a personal research and learning project. It does not aim to catch up with large cloud models. In one comparison group, all variants use the same Reasoning model | ADR 0001, 0018 |
| S2 | No model training: no fine-tuning, no LoRA, no weight updates. Only configuration parameters can be tuned, for example Calibration | VISION principle 3 |
| S3 | Self-evolution is not self-modification: Memex can propose improvements; the user decides whether to adopt them, and they must be verified | ADR 0011 |
| S4 | It must be distributable to other people: components distributed with Memex must allow redistribution; third-party models are not packaged into Memex | ADR 0013 |

### Architecture
| # | Constraint | Source |
|---|---|---|
| A1 | The only stable boundary is the Cognitive Contract. All other components can be replaced | ADR 0008 |
| A2 | Dependency inversion: core code depends only on the contracts. Only the composition entry point knows the concrete implementations, and it can instantiate only types recorded in the registry | ADR 0008, 0018 |
| A3 | Each dependency is recorded as hard, configurable or optional. What can be configured is not hard-coded | factory/design/dependencies.md |
| A4 | A Provider declares its capabilities, and they are checked at startup. A mismatch is reported at once | factory/design/dependencies.md |
| A5 | Knowledge is stored as Claims, with provenance and bitemporal time (Valid Time / Recorded Time) from day one | ADR 0002 |
| A6 | The Event Log is the only source of truth (Event Sourcing). Everything else is a Projection that can be rebuilt | ADR 0005 |
| A7 | Every change is made through an Action, the actor is recorded, and the Policy checks it | ADR 0014 |
| A8 | All configuration uses the same resource format (apiVersion / kind / metadata / spec) | ADR 0009 |
| A9 | Data uses standard vocabularies (JSON-LD, PROV-O, OWL-Time, CloudEvents, OpenTelemetry, JSON Schema) | ADR 0007 |
| A10 | External extension uses existing standards first (MCP, Agent Skills, A2A) | ADR 0006 |
| A11 | All model output uses constrained decoding. Certainty is renormalized over the option letters | ADR 0019 |
| A12 | The experiment tools (Lab) are not part of the product and are not shipped with it. What is validated is the product components themselves | ADR 0020 |
| A13 | Validation tasks are always goal tasks. The goal completion rate is the shared primary metric of all comparisons | ADR 0021 |
| A14 | Each Action type has a risk level. The Policy result is allow / deny / ask. The core records the actor; the request does not fill it in. "Self-modification needs user approval" is a core invariant and does not change with the Policy level | ADR 0022 |
| A15 | The Oracle is used only for scoring and diagnosis. Configuration that the product needs at runtime (including Calibration thresholds) can come only from signals that are also available in the product | ADR 0023 |

### Engineering
| # | Constraint | Source |
|---|---|---|
| E1 | Use TypeScript / Node.js. The runtime core does not depend on native extensions and must run on all platforms | ADR 0013 |
| E2 | In the validation stage, each Experiment runs in a separate process | ADR 0004, 0020 |
| E3 | Reproduction relies on record and replay, not on random seeds | ADR 0005 |
| E4 | Streaming records use JSONL. Operational logs follow the OpenTelemetry log data model | ADR 0015 |
| E5 | Secure by default: listen only on localhost; authentication is required when opened to the outside; real capabilities run only in a sandbox; telemetry must be turned on by the user | ADR 0013 |

### Process
| # | Constraint | Source |
|---|---|---|
| P1 | Validation stage: one branch for each experiment or module (V0 as a whole is one experiment). A branch merges into `main` only after it passes observable criteria written in advance | ADR 0012 |
| P2 | The product stage starts at the decision gate: Q1–Q3 all have answers, and the contract is frozen as v1. From then on, all changes go through PRs and CI | ADR 0012, 0020 |
| P3 | Keep the experiment matrix minimal, advance by the convergence rules, and do not add control groups at will | ADR 0010 |
| P4 | Experiment results drive changes to cognitive components and the ontology. Engineering infrastructure follows engineering needs | VISION principle 8 |
| P5 | Decide at the last responsible moment. A default value is not a commitment | factory/design/dependencies.md |
| P6 | Each milestone first writes an integration design (components, seams, gates, stories), first connects the thinnest end-to-end path, then implements the components in parallel, contract first | ADR 0025 |
| P7 | Each epic that produces code ends with a cleanup story: architecture review, fix serious problems, re-index, update the as-built documents. Cleanup only refactors and adds no features | ADR 0026 |

---

## 2. Stage overview

```
 Validation stage (accepted)                         Product stage (draft)
 V0 skeleton → V1 baseline → V2 dual system ═[decision gate]═▶ P1 first usable version → P2 learning loop → P3 external extension → P4 distribution
                                                                        ↘ P5 cross-domain transfer (after P2, can run in parallel with P3 and P4)
```

| Milestone | Goal | Entry criterion | Exit criterion (observable) | Status |
|---|---|---|---|---|
| **V0 skeleton** | The product core (contracts, Event Log, Action, Composition Root, Projector, record and replay) and the validation tools (Lab, Fake Provider, the simplest Micro World) | None | The three V0 pass criteria below are met | Accepted |
| **V1 baseline** | Run B0 and B1 with real models | V0 merged | B0 and B1 complete a set of tasks on the Micro World and produce a reproducible report; B-sym and B0 check the task difficulty to rule out a ceiling effect (ADR 0017) | Accepted |
| **V2 dual system** | Implement B3 and B3-noI, minimal Pattern formation and use (ADR 0018), and the real World Generator | V1 merged | Q1–Q3 can all be measured and have answers (good or bad); an Oxigraph load test with 100,000 Claims is done | Accepted |
| **Decision gate** | Move from validation to the product | V2 complete | An ADR: which hypotheses hold, which core capabilities the product has, the scope of P1 and the product commands; the Cognitive Contract is frozen as v1; PRs and CI are set up | Accepted (ADR 0012, 0020) |
| **P1 first usable version** | A Memex that can really be used | Decision gate passed | The scope is set at the decision gate. Candidates: conversation in the World 0 domain (the ADRs, documents and git history of Memex itself); view and question the Worldview; a set of product commands (centered on "goals": give a goal, view progress, approve); long-running goals that run in the background, continue after an interruption, and show progress at any time (state is recovered from the Event Log and replay); the autonomy levels of actions (open-questions.md item 4); Domain Pack format v0; answer "what was X as of a given commit"; T0 and T4 can be measured on real material | Draft |
| **P2 learning loop** | Make learning happen in real use | P1 complete | Candidates: the full Consolidation and Decay lifecycle; Pattern learning works on longer sequences and more Task Families; operational data as a second data source of World 0; the agent proposes ontology extensions, approved through an Action and the Policy | Draft |
| **P3 external extension** | Connect to the outside world | P2 complete | Candidates: MCP capabilities run in a sandbox; import and export Agent Skills; an HTTP/SSE interface and a minimal Web interface | Draft |
| **P4 distribution** | Let other people use it | P3 complete (can run in parallel with P3) | Candidates: multi-architecture images; install, upgrade, backup and rollback; detect the hardware and select a configuration level; download and verify models; one-step start on Mac, Linux and Windows | Draft |
| **P5 cross-domain transfer** | Turn the experience of a mastered domain into a reference for other domains (part of the product definition, VISION "Cross-domain transfer") | P2 complete, and a second domain (unrelated to Memex) connected | Candidates: on domain pairs with the same structure and different names, measure the gain from transfer (fewer reasoning calls and observations or not) and the negative transfer rate; borrowed content enters the new domain as a "Hypothesis to be verified", with its source recorded | Draft |

**Ideas not scheduled yet**: jj-style Worldview branches, A2A, multi-user Policy, a resource budget for background consolidation, rewriting hot code in Rust. These are scheduled after earlier milestones give evidence.

---

## 3. Conventions of the validation stage (accepted)

### V0 pass criteria
1. **Reproducible**: two runs of the same configuration give the same normalized Trace hash.
2. **No leaks**: in the order A → B → A, the two A results must be the same; a "polluting Provider" that deliberately writes global state must not affect other Experiments.
3. **Replaceable**: a Provider can be replaced by changing only the configuration, with no code change.

### Experiment conventions
- The context budget is always counted as "tokens actually sent to the reasoning model". Cost metrics are recorded separately: Reasoning calls, Reasoning input tokens, Reasoning output tokens (including thinking), Intuition tokens, latency. Whether Reasoning has thinking mode on is an Experiment setting, and one comparison group uses the same setting (ADR 0018).
- Learning signals come only from the Environment and Verification. The Oracle is used only for Evaluator scoring and diagnosis, and configuration that the product needs at runtime, such as Calibration, cannot use it either (ADR 0018, 0023).
- Calibration sets its threshold with shadow escalation: when confident, still call Reasoning at a configured rate and compare whether they agree. The Reasoning calls and tokens of shadow escalation are recorded separately and count toward the cost of B3 (ADR 0023).
- B1 and B3 get the same information, organized differently: the text chunks of B1 also state the source and the observation time.
- In the validation stage, the runtime forms Claims from Observations deterministically.
- The statistical decision rules are set after the World Generator is complete and before the candidate versions are evaluated.
- Q1 uses T2, Q2 uses T4, Q3 uses T6 (long-sequence learning). T5 (experience transfer) is not tested in the validation stage (ADR 0018).
- T2, T4 and T6 are all designed as goal tasks: the agent gets a Goal, and the Environment judges whether it is reached. The **goal completion rate** is the shared primary metric of all comparisons, and "accuracy" in Q1–Q3 always means it. Cost is counted as "reasoning calls and tokens per goal reached" (ADR 0021).

### Commands (ADR 0020)
- **Engineering commands**: `pnpm check` (type check, lint, architecture check, tests), `pnpm test` and others, in the root `package.json`.
- **Validation commands**: `pnpm lab run <experiment.yaml>`, `pnpm lab replay <snapshot>`, and later `report` and `compare` as needed. They do not go into the product.
- **Product commands**: `memex ...`, designed after the decision gate.

---

## 4. V0 task breakdown (current milestone)

**The executable story-level breakdown is in [plans/v0-integration.md](../records/plans/v0-integration.md)** (ADR 0025): the component list, the seams and gates, and 27 stories in five phases A–E, plus the 3 cleanup stories of ADR 0026 (V0-28 to V0-30). The table below is the milestone-level overview. The "maps to" column in the story table points to the numbers here.

The working branch starts from `main` (for example `exp/v0-skeleton`). V0 as a whole is one experiment with one branch, as ADR 0012 says: "one branch for each experiment or module". Commit after each item, with its verification result.

The "Category" column: **product core** is built to product standard and goes directly into the product after validation; **validation only** needs to be good enough and can be thrown away after validation (ADR 0020).

| # | Task | Category | Output | Verification |
|---|---|---|---|---|
| V0.1 | Monorepo skeleton | Engineering | pnpm workspaces, TypeScript, test framework, lint, architecture checks; five packages: `@memex/contracts`, `runtime` and `fakes` under `memex/packages/`, and `@memex/lab` and `worlds` under `factory/validation/` (ADR 0028) | One command, `pnpm check`, runs the type check, lint, architecture check and tests of all packages, and passes (no build step, see tech-stack.md) |
| V0.2 | Contracts package (implements architecture/contracts.md) | Product core | The schema of the resource format (apiVersion / kind / metadata / spec), exportable as JSON Schema; the core types Observation, Claim (with provenance, bitemporal time, epistemic status, confidence), Action, Event (CloudEvents fields, plus actor, Instance id, id of the previous event); the Provider interfaces (Environment, Intuition, Reasoning, Knowledge, Policy, Cognitive Strategy) and capability declarations | Schema unit tests; the generated JSON Schema validates the example configuration |
| V0.3 | Runtime | Product core | JSONL Event Log with append and replay; Composition Root, with the registry, configuration loading, overlay merge and capability checks; the cognitive loop, which runs the Strategy and sends every Action through the Policy and into the log; a Trace Projection built from the log; JSONL operational logs; record and replay (record at the edges where nondeterminism enters the system, store large content outside by hash, ADR 0024; tested in V0 with a fake Model Backend; used in the product for audit and debugging) | Unit tests; after the log is replayed, the Projection must be exactly the same as before |
| V0.4 | Fake Providers | Validation only | FakeIntuition, FakeReasoning and FakeKnowledge with configurable accuracy, an allow-all Policy, a minimal Micro World generated deterministically from a seed, and a "polluting Provider" | The same seed gives the same result |
| V0.5 | Lab | Validation only | Each Experiment runs in its own process; outputs an Experiment snapshot and a report as JSON; `pnpm lab run <experiment.yaml>` and `pnpm lab replay <snapshot>` | One example Experiment runs end to end |
| V0.6 | Gate | Validation only | The three V0 pass criteria as automated tests | After all three pass, merge into `main` |

Defaults to set when V0 starts: Node.js uses the version fixed in `.nvmrc` (Node 26, Active LTS from 2026-10-28); the test framework and lint tools follow the mainstream choice at the time. These are all engineering choices that can change at any time. The accepted recommendations are in [tech-stack.md](./tech-stack.md) (Node 26, TypeScript 7, pnpm 12, Biome, Vitest, dependency-cruiser, knip).
