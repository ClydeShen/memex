# Memex

Memex is a framework for cognitive agents. After it connects to the data of a domain, the agent builds and keeps correcting its own Worldview of that domain, completes tasks with the reasoning ability of the model, and keeps learning from verified experience. When the Framework is assembled and running on a machine, it is an Instance.

## World and beliefs

**World**:
The objective environment the agent is in, with its real state and causal rules. The agent cannot access the World directly. It learns about it only through Observations.
_Avoid_: reality, ground truth (Ground Truth means only the World itself as the generator knows it during evaluation)

**Observation**:
One raw perception the agent gets from the World, or the result of one Action.
_Avoid_: input, message, event

**Evidence**:
A basis, drawn from one or more Observations, that can support or refute a Claim.
_Avoid_: proof, fact

**Claim**:
A structured proposition that the agent thinks may be true, with Provenance, a time range (Valid Time), an Epistemic Status and a Confidence. A Claim is not a fact.
_Avoid_: fact, triple, memory item, knowledge entry

**Proposition**:
What a Claim asserts, in the form "subject, relation, object or value".
_Avoid_: statement, triple

**Provenance**:
Where a Claim comes from: told by the user, observed directly, inferred by the agent, guessed by a model, an external tool or another agent. Different sources have different trust.
_Avoid_: source (source means only the specific source object inside the Provenance)

**Epistemic Status**:
How firmly the agent holds a Claim: known, believed, suspected, unknown, refuted, or contested.
_Avoid_: truth value, validity, cognitive state (easily confused with Cognitive State)

**Confidence**:
The confidence of a Claim: a number derived from the evidence, the trust of the sources and the relevance in time. It is used only for Claims.
_Avoid_: certainty (Certainty means only the degree of certainty that Intuition gives)

**Valid Time**:
The time range in which a Claim is true in the World (validFrom, validUntil). In the Micro World, it uses simulator time.
_Avoid_: timestamp

**Recorded Time**:
The time at which the agent learned or recorded something. It and Valid Time are two independent time axes: when the world changes, the Valid Time changes; when the agent changes its view, a new Recorded Time appears. Together the two axes are what databases call "bitemporal".
_Avoid_: created time, update time

**Hypothesis**:
A candidate Claim or causal explanation, proposed to explain Observations and not yet verified.
_Avoid_: guess, assumption

**Worldview**:
The correctable overall understanding of a domain that all of the agent's Claims, Ontology and Patterns for it make up.
_Avoid_: world model, knowledge base, memory

## Experience and learning

**Event Log**:
The append-only record of events, and the only source of truth of an Instance. The Worldview, Experiences and Traces are all Projections derived from it.
_Avoid_: database, history, memory

**Projection**:
A view derived from the Event Log, which can be thrown away and rebuilt at any time, for example the Worldview in the graph store. This is the standard Event Sourcing term.
_Avoid_: cache, copy

**Projector**:
The core component that reads the Event Log and builds and updates Projections. For the same log, the rebuilt result must be exactly the same. As the research suggests (factory/records/research/core-algorithms-2026-10-11.md section 2), it also computes the Confidence and Epistemic Status of Claims deterministically; the exact algorithm is a variable that experiments can compare (ADR 0002).
_Avoid_: indexer, materializer

**Experience**:
One complete episode: the goal, the Observations, the decisions made, the Actions taken and the results. It is a Projection derived from the Event Log. Experience is the raw material of learning, and is not knowledge itself.
_Avoid_: memory, log, trajectory

**Pattern**:
A verified, **directly executable plan template** generalized from several Experiences: applicability conditions described in Ontology types, a parameterized sequence of Actions, and an evidence record. Intuition judges whether it applies, and after a Verification check it runs directly, without calling Reasoning (ADR 0018).
_Avoid_: rule, workflow, template

**Consolidation**:
The process that compares, generalizes and verifies Experiences and promotes them to Claims or Patterns.
_Avoid_: summarisation, memorisation

**Decay**:
The process that lowers or retracts Claims and Patterns that have long had no support, are stale or are refuted. Forgetting is a normal cognitive operation.
_Avoid_: deletion, cleanup

## Cognitive process

**Goal**:
The target state the agent must bring the World to, or the question it must answer. "Give it a goal, and let it get there on its own" is the product definition of Memex. Tasks in the validation stage are also always given as Goals, and the goal completion rate is the shared primary metric (ADR 0021).
_Avoid_: task, prompt

**Cognitive State**:
The small part of the information that the agent is using now: the goal, the entities in focus, the active Claims and Hypotheses, the available Capabilities and the last few steps. It has a clear upper limit.
_Avoid_: context, prompt, session

**Cognitive Budget**:
The upper limit of the resources that the Cognitive State and reasoning can use, for example the number of active Claims and the number of tokens sent to the reasoning model.
_Avoid_: context window

**Attention**:
The judgment of which information is worth a place in the Cognitive Budget right now. Attention differs from retrieval: retrieval answers "what is there", Attention answers "what should I look at now".
_Avoid_: retrieval, search

**Intuition**:
Fast, cheap, probability-based judgment, that is, System 1. It judges familiarity, novelty and uncertainty, and whether deep reasoning is needed. Each of its judgments has a Certainty.
_Avoid_: classifier, router, heuristic (these can be ways to implement Intuition, but they are not its name)

**Reasoning**:
Slow, expensive, deliberate reasoning, that is, System 2. It plans, tests hypotheses, and handles contradictions and unfamiliar problems.
_Avoid_: thinking, LLM call

**Fast Path**:
The path that completes a decision without calling Reasoning. It does not mean using no language model at all.
_Avoid_: shortcut, cache hit

**Slow Path**:
The path that calls Reasoning to complete a decision.
_Avoid_: full path

**Certainty**:
The degree of certainty that Intuition gives for one judgment, obtained from the model output through Calibration.
_Avoid_: confidence (Confidence means only the confidence of a Claim)

**Calibration**:
Configuration parameters that adjust how Certainty maps to the actual accuracy, for example a threshold or a temperature. It does not change the model itself, so it is not training. Its labels can come only from signals that are also available in the product, mainly Shadow Escalation, never the Oracle (ADR 0023).
_Avoid_: training, fine-tuning

**Shadow Escalation**:
When Intuition is confident and the Fast Path could be taken, Reasoning is still called at a configured rate, and whether the two conclusions agree becomes a Calibration label. The Reasoning calls it makes count toward the cost (ADR 0023).
_Avoid_: double check, audit call

**Escalation**:
Intuition judges that the current situation does not suit the Fast Path and hands it to Reasoning.
_Avoid_: fallback, retry

**Counterfactual Probe**:
To test which conditions a judgment depends on, change one of the conditions at a time and ask Intuition again. Several probes can run in parallel. Which conditions can change, and what is expected after a change, are defined in advance by Ontology type. A candidate design; whether to adopt it is decided after the validation stage (open-questions item 5).
_Avoid_: mutation (Mutation is not used as a term, see the _Avoid_ of Action), perturbation test, ablation

**Surprise**:
A probe result or an actual Observation that does not fit the expected condition relation. There are two kinds: the condition does not hold but the conclusion does, which shows an **alternative cause**; the condition holds but the conclusion does not, which shows a **blocking condition**. Surprise is one of the triggers of Escalation.
_Avoid_: anomaly, error, conflict (two Claims that contradict each other are not a Surprise)

**Verification**:
The check of a candidate conclusion before acting on it or accepting it. If a deterministic method can check it, do not use a model.
_Avoid_: validation (validation means the validation stage, see ADR 0020)

**Action**:
A named change with a parameter structure, a recorded actor and a policy check. It can change the World (executed through a Capability), or the Worldview or the ontology. Every change must be an Action. An Observation is not an Action: an Observation is a record of "what happened" and is written directly to the Event Log; forming or changing a Claim from an Observation is an Action.
_Avoid_: step, tool call, direct write, mutation

**Risk Level**:
The risk level that each Action type declares in its definition: read-only, reversible, irreversible, sends externally, modifies itself. The Policy uses it and the configured level to allow, deny or wait for user approval. An Action with the "modifies itself" risk level can be executed only by the user, whatever the level (ADR 0022).
_Avoid_: severity, permission level

**Capability**:
An operation the agent can perform, with a description of its input and output.
_Avoid_: tool, function, skill (Skill means the external Agent Skills format)

**Self-Evolution**:
Memex gradually builds up Claims about what it is made of, its capabilities, its limits, how it runs and its upgrade history, and gives well-founded improvement plans from them. It does not include changing itself without authorization.
_Avoid_: self-modification, self-improvement

## Divergence and recombination

These terms describe System 3: a divergent process that runs offline when the agent is idle. They are all candidate designs; whether to adopt them is decided after the validation stage (open-questions item 6).

**Recombination**:
That is, System 3. In the Offline Phase, it recombines Experiences and Claims from different domains by their relational structure and produces Conjectures. The degree of randomness is a configuration parameter.
_Avoid_: dreaming, brainstorming, creativity (these are metaphors, not names)

**Conjecture**:
The output of Recombination: a structural correspondence or combination between two domains. It is not yet a Claim. It stays in the Sandbox, and only after Verification can it become a low-Confidence Claim or a new Pattern, with its source marked. It differs from a Hypothesis: a Hypothesis is proposed to explain an Observation; a Conjecture is not.
_Avoid_: idea, insight, hypothesis

**Sandbox**:
The isolated area that holds Conjectures. Its content is not part of the Worldview, cannot be used as Claims, and cannot trigger Actions.
_Avoid_: virtual memory, scratchpad

**Offline Phase**:
The period when Recombination runs: when the agent is idle, so it does not compete with Reasoning for resources. Its cost counts toward the Cognitive Budget.
_Avoid_: sleep, idle time

**Open Puzzle**:
A Surprise that Reasoning could not explain, left for Recombination.
_Avoid_: backlog, unsolved problem

## Semantic structure

**Domain**:
A bounded subject area in which the agent builds a Worldview, for example insurance, AWS operations, or Memex itself (World 0).
_Avoid_: world (World means the environment the agent is in and can observe and act on)

**Ontology**:
The set of concepts and relations the agent uses to describe the World and its own cognition.
_Avoid_: schema, taxonomy

**Core Ontology**:
The minimal Ontology shared by all domains. It describes only the cognitive process itself and the most basic world concepts.
_Avoid_: upper ontology, base schema

**Domain Ontology**:
The concepts and relations that a specific domain adds on top of the Core Ontology.
_Avoid_: domain schema

**Domain Pack**:
The full set of content needed to connect a new Domain: the Domain Ontology, how to ingest the data, the Capabilities of that Domain, the Environment and the evaluation set.
_Avoid_: plugin, adapter, dataset

## Architecture

**Framework**:
The code and contracts of Memex itself, not bound to any specific model, service or runtime environment. The Lab of the validation stage is in the same repository, but it is not part of the Framework and is not shipped with the product (ADR 0020).
_Avoid_: platform, product

**Instance**:
Memex actually running on a machine: the Framework plus a configuration, the models and services available on that machine, and data. By default, each user runs their own Instance.
_Avoid_: deployment, server, system

**Cognitive Contract**:
The only stable interface agreement between components. Everything else can be replaced.
_Avoid_: API, interface spec

**Provider**:
A replaceable component that implements one function by the Cognitive Contract, for example an Intuition Provider, a Reasoning Provider, a Policy Provider. In the ports and adapters architecture, the Cognitive Contract is the port and the Provider is the adapter.
_Avoid_: plugin, module; also do not use it for a model vendor (write "model vendor" or Model Backend)

**Model Backend**:
The service that actually runs model inference, for example llama.cpp, vLLM, a cloud API. A Provider connects to a Model Backend through a Model resource. Changing the Backend only needs a configuration change.
_Avoid_: model provider, engine

**Environment**:
The interface of the World through which the agent interacts with Observations and Actions, for example the simulator of the Micro World, or the repository and runtime of World 0. It is one of the three standards that Memex defines itself.
_Avoid_: simulator, sandbox

**Composition Root**:
Where the components are assembled. It has two parts. One is the registry and assembly logic in `@memex/runtime` (read configuration, validate, look up `type` in the registry, instantiate, check capabilities), which itself refers to no concrete implementation. The other is the **composition entry point** (the Lab Worker startup file in validation stage V0–V2, `apps/*` from P1), which alone imports concrete Providers and records them in the registry. Core code never refers to a concrete Provider directly.
_Avoid_: container, bootstrap

**Cognitive Strategy**:
The replaceable strategy that decides how the whole cognitive loop runs: what to look at first, when to Escalate, when to Verify.
_Avoid_: architecture, pipeline, workflow

**Reasoning Strategy**:
The replaceable strategy for how Reasoning reasons inside, for example single-pass reasoning, plan then execute, alternating hypothesis and evidence. It is part of the Cognitive Strategy.
_Avoid_: prompting technique

## Evaluation

**Experiment**:
One complete, isolated evaluation run, fully determined by its configuration. Experience can build up inside an Experiment, but no state can leak between Experiments.
_Avoid_: run, test, trial

**Experiment Snapshot**:
A JSON file that records all inputs of one Experiment: the effective configuration and its hash, the type and version of each Provider, the model source and sha256, the World Generator version and seed, the ontology version, the Model Backend version, the thinking mode settings, hardware information, and the location of the recorded content store (ADR 0024). With it, the Experiment can be replayed.
_Avoid_: snapshot (alone, easily confused with the acceleration snapshots of the Event Log)

**Lab**:
The tool that runs and evaluates Experiments in the validation stage: the Runner starts a separate Worker process for each Experiment, reproduces results with the record and replay of the Runtime, collects the Evaluator results and outputs a report. The Worker and the Runtime run the same code, so what is validated is the product components themselves. The Lab is not part of the product and is not shipped with it. It is used in the repository through `pnpm lab ...` (ADR 0020).
_Avoid_: test harness, benchmark runner

**Conformance Suite**:
A set of conformance tests for a port: every Provider that implements the port must pass them, whatever its internal implementation. For example, the Environment conformance tests check that "the same seed generates the same world" (ADR 0025).
_Avoid_: contract test, TCK

**As-built Document**:
A document that describes what the code **actually is now**: responsibilities, public entry points, internal structure, dependencies, key invariants, deviations from the design, known gaps. It differs from design documents (ADRs, factory/records/plans/ and contracts.md describe what is planned). It lives in `factory/as-built/`, one page per package. The `covers` and `verified-at` fields at the top of each page detect when it is out of date. The cleanup story of each epic updates it (ADR 0026).
_Avoid_: implementation document, technical document

**Fake Provider**:
A fake component that implements the Cognitive Contract, with behavior determined by a seed and configuration, for example a FakeIntuition with configurable accuracy. It verifies the runtime and the Lab without connecting real models.
_Avoid_: mock, stub

**Control**:
A variant that **runs at the same time** as the main choice in the same experiment group, for comparison, for example the heuristic rules for Intuition, or B3-noI (ADR 0018).
_Avoid_: alternate

**Alternate**:
A component that is **swapped in only** when the main choice fails the convergence rules. It does not run at the same time as the main choice, for example Qwen3.6-35B-A3B for Reasoning (ADR 0017, 0018).
_Avoid_: control, fallback

**Micro World**:
A synthetic World generated deterministically by the generator from a configuration and a random seed, to evaluate the agent when the true answer is known.
_Avoid_: simulation, sandbox, toy environment

**World 0**:
The first real domain: Memex itself and related knowledge, including development knowledge and operational data. Its purpose is to let Memex know itself and learn from its own history.
_Avoid_: self domain, meta world

**World Generator**:
The component that generates a Micro World from a versioned configuration and a random seed. The same version, configuration and seed always generate the same Micro World.
_Avoid_: dataset, fixture

**Ground Truth**:
The real state and causal rules of the Micro World, as the World Generator knows them. Only the Oracle and the Evaluator can see it.
_Avoid_: label, answer key

**Oracle**:
The component that can access the Ground Truth and gives the reference answers and labels for evaluation. The agent can never access the Oracle. Its results are used only for scoring and diagnosis, and never enter the agent's Worldview, Patterns or any configuration (ADR 0018, 0023).
_Avoid_: judge, grader

**Evaluator**:
The component that scores the agent's performance against the Oracle and computes the metrics.
_Avoid_: judge, scorer

**Baseline**:
A simplified architecture for comparison, which uses the same Reasoning model as Memex in the same comparison group (ADR 0018). B0: Reasoning only. B1: traditional RAG plus Reasoning. B2: Intuition plus Reasoning, with no Worldview. B3: the full Memex. B3-noI: B3 without Intuition, always on the Slow Path. B-sym: a symbolic solver that knows all the rules, used only to check task difficulty and not part of the comparison. The validation stage uses only B0, B1, B3 and B3-noI (ADR 0010).
_Avoid_: control group

**Task Class**:
A task category by cognitive ability: T0 worldview building, T1 state discovery, T2 diagnosis, T3 goal-directed action, T4 belief revision, T5 experience transfer, T6 long-sequence learning (tasks of the same Task Family are given in order, and the change as Experience grows is measured; ADR 0018). The validation stage uses only T2 (Q1), T4 (Q2) and T6 (Q3). Since ADR 0021, T2, T4 and T6 are also given as Goals. Task Classes differ by the cognitive ability they test, not by the form of the task; T3 tests multi-step planning and execution itself.
_Avoid_: domain, category

**Task Family**:
A set of tasks that share the same underlying structure and differ only in surface details.
_Avoid_: task set, template

**Deceptive Task**:
A task that looks like part of a Task Family but differs in one key structure, to test whether the agent wrongly applies a Pattern.
_Avoid_: trick question, adversarial example

**Trace**:
The complete record of each cognitive step in one Experiment: input, output, time taken, the Providers used, the decisions made and the results. It is a Projection derived from the Event Log, and is the data for learning and evaluation. The logs and metrics of how the system runs are "operational telemetry", not Trace (ADR 0015).
_Avoid_: log, transcript, telemetry

**Learning Curve**:
The curves of accuracy, reasoning call rate, context size and latency as Experience grows. It is the main evidence that the agent is learning.
_Avoid_: progress chart
