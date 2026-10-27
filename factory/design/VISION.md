# Memex vision and first principles

This file records what Memex wants to become, and the principles behind all design decisions that do not change. For specific decisions, see `factory/records/decisions/`. For terms, see `factory/design/GLOSSARY.md`. For open items, see `factory/design/open-questions.md`.

## Product definition

> **Give it a goal, and let it get there on its own.**

In more detail: Memex reaches the world through extensible tools, builds a Worldview through the Memex core, and in the end helps the user solve a problem or reach a goal. It can go deep in one domain, and it can turn the experience of a domain it masters into a reference for other domains. It is a system that learns and improves by itself. (Confirmed by the user, 2026-10-11)

## Purpose

Memex is an extensible, fairly general agent framework. After it connects to the data of a domain, the agent can build and keep correcting its own Worldview of that domain, and then solve problems together with the reasoning ability of the model. Its features can extend outward: different interaction modes, and tools such as MCP, Skills and A2A, let the agent connect to the outside world, learn by itself while it is used, and keep improving.

This is a personal research and learning project. Its purpose is to find out how such a system should be built. It is not for commercial use, and it does not aim to catch up with large cloud models.

## Central hypothesis

> For a long-running agent, the main way to become more effective is to improve what it attends to, what it believes, what it generalizes, and when it chooses to reason deeply, rather than to keep putting more information into the reasoning context.

This is a **hypothesis to be verified**, not an established fact. The point of the validation stage is to make it answerable with data, and to set the direction and core capabilities of the product from that answer (ADR 0020).

## First principles

1. **Intelligence is not the amount of memory.** Piling up memory brings noise, stale information and the spread of errors. Learning means turning experience into structure: select, organize, generalize, verify, and then form Patterns. Stored experience can grow without limit, but the information that each decision needs should get smaller and smaller.

2. **Store Claims, not facts.** Each piece of knowledge is a claim that can be overturned, with a source, a time range and a degree of certainty. Different sources have different trust. Forgetting and retracting are normal cognitive operations.

3. **Learning happens in the Worldview, not in the model weights.** Do not train models. Use off-the-shelf models directly. The model stays the same. What changes is the input given to it: the better the Worldview, the more accurate the same model's judgments. The boundary: any change to the model itself (fine-tuning, LoRA, any weight update) counts as training and is never done. Tuning only configuration parameters outside the model (for example the "how sure before taking the fast path" threshold, or the temperature of confidence) is not training. Training a separate small model for routing or scoring, without changing the weights of the cognitive model, is also not training (ADR 0027).

4. **Fast and slow thinking work together.** Intuition (System 1) is fast and cheap. It judges "have I seen this, am I sure, should I think harder". Reasoning (System 2) is slow and expensive, and is used only for cases that are really hard or uncertain. When unsure, think more rather than less.

5. **The ontology is the shared language.** By text similarity alone, an agent cannot recognize "the same kind of problem", and cannot see "this is actually different". Organizing experience by types and relations is what makes generalization possible. The ontology starts at the smallest size, and grows only when the agent cannot tell two things apart.

6. **The contracts are stable; everything else can be replaced.** High-level modules depend only on abstract interfaces. Changing the model, the Model Backend (including cloud model services), a Provider, the store or the strategy needs only a configuration change. Each dependency must belong to one of three categories: hard, configurable or optional (factory/design/dependencies.md). Do not hard-code what can be replaced. A choice that can be a configuration setting is not a one-time decision.

7. **One configuration format, one set of common data standards.** All configurable content uses the same resource format. Data uses common vocabularies such as JSON-LD and PROV-O, so that the system is not isolated. Where an existing standard fits, never invent your own.

8. **Experiment results drive cognitive components and the ontology.** Before you add a new cognitive component (retrieval, memory, a way of reasoning) or extend the ontology, answer two questions: which measured problem does it solve? Can the improvement be measured? If it cannot be measured, do not add it yet. Engineering infrastructure (deployment, permissions, observability, configuration) is outside this principle and follows engineering needs, see ADR 0013–0015.

9. **Experiments serve the build.** The purpose of experiments is to use a few quick comparisons to guide the architecture into shape and into a usable system quickly, not to do a full comparative study. Each dimension keeps only one main choice, and the convergence rules are set in advance (ADR 0010).

10. **Progress must be measurable, reproducible and guarded against illusions.** Always compare with a simpler system. The illusions to guard against: the model already knew it; memorizing the test instead of learning; test tasks that are too easy; and wrongly rejecting an architecture that actually works.

11. **Local-first, owned by the user, deployable anywhere.** It runs on your own machine. Knowledge belongs to the user and can be exported and audited. Target platforms include Linux servers, cloud hosts, Mac, Windows, and other people's computers. One-step start, one-step upgrade, and the same behavior on every platform (ADR 0013).

12. **Knowing itself is not freely changing itself.** Self-evolution means: Memex gradually knows what it is made of, what it can do, what its limits are and how it runs; it can give a well-founded improvement plan for a new feature; and after an upgrade it knows it was upgraded. It does not rebuild itself without authorization. The user decides on improvements, and experiments verify them.

## Core modules

| Layer | Modules | Notes |
|---|---|---|
| Stable core | Cognitive Contract, Environment interface, Domain Pack format, unified configuration format, standard data vocabularies, Action model | Almost never changes |
| Cognitive loop | Cognitive Strategy, Attention, Intuition, Reasoning, Verification, Cognitive State and Cognitive Budget | Runs at every step |
| Knowledge and learning | Ontology, Worldview (Claims, provenance, time, Patterns), Event Log (Experience and Trace are both its Projections), Consolidation and Decay | The source of progress |
| Interaction with the outside | Capability (MCP), Communication (CLI, Web, A2A) | Pluggable |
| Support | Composition Root, Policy, operational telemetry | Keeps it running |
| Validation tools (not part of the product, ADR 0020) | Lab (World Generator, Micro World, Oracle, Evaluator, experiment runner) | Prove the ideas in the validation stage; not shipped with the product |

The three most central modules: **Cognitive Contract, Worldview, Cognitive Strategy.** The intuition model and the reasoning model are replaceable components and are not part of the core. The Lab is a tool of the validation stage that proves these modules work. It is not the product itself (ADR 0020).

## After validation: the direction of the product

1. **Make learning really happen**: the full memory lifecycle, Pattern learning, ontology extensions that the agent proposes and that are verified, and learning curves under long-running use.
2. **Enter real domains**: the first domain is World 0, that is, Memex itself and related knowledge, for self-learning and evolution (ADR 0011). After that, an external domain unrelated to Memex, to test whether the method generalizes. Each domain is packaged as a Domain Pack.
3. **Connect to the outside world**: connect tools through MCP; export and import Patterns with Agent Skills; exchange Claims with other agents through A2A; all real local capabilities run in a sandbox.
4. **Many interaction forms**: CLI, Web, chat and voice are all just Communication Providers.
5. **Long-running use and performance**: background consolidation within a resource budget, cleaning out stale knowledge; measure first, then optimize the hot spots.

## The ideal state (vision, not verified)

Following the precedents of OpenAI Gym (unified the environment interface), MCP (unified tool access) and the Kubernetes resource format (unified configuration):

1. **Domains are pluggable.** One Domain Pack lets an agent start building a Worldview in a new domain. Domain Packs can be shared and reused.
2. **Components are comparable.** Intuition, reasoning, memory and strategy can come from different people and be compared fairly on the same experiment platform.
3. **Knowledge is portable.** The Worldview is saved in common standards, and can be traced, audited, exported and migrated.
4. **Progress is quantifiable.** Each agent has its own learning curve: with more experience, fewer reasoning calls, less latency and less context, without lower accuracy.
5. **Local-first, interoperable with the ecosystem.** Connect to the outside world through MCP, Skills and A2A, and keep the source and trust of each piece of knowledge.

To be realistic: whether a standard forms depends on adoption, not on how good the design is. At this stage, "standard" first means internal discipline: stable interfaces, unified configuration, data that can interoperate with the outside.

## Cross-domain transfer (product goal, to be verified; roadmap P5)

When people learn a new domain, they often compare it with a domain they know well. For example, an AWS expert who takes over Azure thinks: "this service is really xxx in AWS, so it should have a similar feature; let me check." Memex wants the agent to do the same: a Worldview built up in one vertical domain can be selectively borrowed into another domain.

**Process**: map → predict → verify → correct. This matches the cognitive loop exactly: mapping uses the ontology, predicting is proposing a Hypothesis, verifying is executing an Action and getting an Observation, and correcting is updating Claims.

**How to borrow (inspired by jj / git)**:
- By default, like a cherry-pick, select only abstract content: concept mappings, Patterns, expectations, and "which questions to ask".
- Do not carry over specific facts.
- Borrowed content enters the new domain as a "hypothesis to be verified", with its source recorded.

**Worldview diff**: align first, then compare. The result has four classes:
- Shared by both sides and verified on both → a **pillar**, promoted to the abstract layer of the core ontology.
- Aligned on both sides but behaving differently → **learning material**, stored as a "difference Claim" with a scope. As in jj, the conflict itself is a first-class object and does not have to be resolved at once.
- Only in the source domain, only in the new domain → marked separately.

A failed transfer is not waste. It is data.

**Use graph and vector to judge distance**: vector measures surface similarity (does it look alike); graph measures structural similarity (does it play the same role).

| | Structurally near | Structurally far |
|---|---|---|
| Surface near | Near transfer (AWS ↔ Azure): borrow boldly, verify item by item | False friends: look the same, different structure. Highest risk |
| Surface far | Deep analogy (insurance ↔ investing, programming ↔ cooking): highest value | Unrelated |

When the two signals contradict each other, they carry the most information. The farther the transfer, the lower the starting confidence of borrowed content, and the more it needs verification. The success or failure of each verification in turn calibrates the distance estimate: the agent learns from experience "which experience can move, and which cannot".

**Division of work**:
- Graph and vector compute the alignment and the differences. This is deterministic computation.
- Intuition quickly judges "is this difference odd, does it matter".
- Reasoning thinks through the causes and effects of the difference.
- Verification tests the conclusions.
- The composition layer (candidates: Cordis, iii, or a very thin factory, see ADR 0004, 0008) connects the modules as the configuration says.

**Risks**:
- Names can match while functional boundaries differ.
- The mapping itself can be wrong, so mappings should also be stored as Claims that can be overturned.
- Existing research shows that LLMs are weaker than humans at structural transfer and are easily misled by surface similarity.
- There is little direct research on "negative transfer in LLM agents".

**Measurable**: the world generator can build domain pairs that have "the same structure, different names, and some relations deliberately changed". On such pairs, compare "entering with experience" and "starting from zero": measure the gain from transfer (fewer reasoning calls and observations or not), and the negative transfer rate.

## Not proven yet

- Whether an agent can keep getting better in a domain by organizing experience rather than piling up information (the central hypothesis).
- Whether an untrained intuition model can reliably judge "should I reason deeply".
- Whether an ontology plus a graph selects information better than vector similarity.
- Whether Patterns distilled from experience can reduce reasoning without lowering accuracy.
- Whether a small model can accurately extract Claims from unstructured material.
- Whether the gain from cross-domain transfer can exceed the loss from negative transfer.
