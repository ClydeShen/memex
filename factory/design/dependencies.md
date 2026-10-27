# Dependency categories

Principle: do not hard-code what can be replaced. Each dependency must belong to one of the three categories below. When you add a dependency, first record its category in this file.

The engineering toolchain (testing, lint, architecture checks and other development tools) and the specific npm packages are recorded in [tech-stack.md](./tech-stack.md), which gives the category of each item and when it is introduced.

- **Hard dependency**: part of the architecture itself. Replacing it means changing the architecture and needs an ADR.
- **Configurable dependency**: a Cognitive Contract defines the interface and a default implementation is provided. Changing the implementation only changes the configuration (ADR 0008, 0009).
- **Optional dependency**: the system still runs without it, with some features missing.

## Hard dependencies

| Dependency | Reason |
|---|---|
| TypeScript / Node.js | The runtime, the contracts and the experiment platform all use this language (ADR 0013 requires that the core uses no native extensions) |
| Cognitive Contract | The only stable boundary |
| Unified resource configuration format (apiVersion / kind / metadata / spec) | ADR 0009 |
| Append-only event log (Event Sourcing), with CloudEvents as the envelope, stored as JSONL | ADR 0005, 0007, 0015 |
| Action model: every change goes through an Action, and the actor is recorded | ADR 0014 |
| Standard data vocabularies (JSON-LD, PROV-O and others) | ADR 0007 |
| Claim model | ADR 0002 |
| Configuration validation library (Zod by default) | Used only inside the contracts package. The public surface is JSON Schema and the Standard Schema interface, so replacing it costs little |

The requirements of the validation tools (Lab) are not product dependencies. They are listed separately at the end of this file (ADR 0020).

## Configurable dependencies

| Interface (Provider category) | Default implementation | Can be replaced by | When the default must be set |
|---|---|---|---|
| Model Backend | llama.cpp on the author's machine | vLLM, other OpenAI-compatible services, remote endpoints, cloud model services | V1 |
| Reasoning | Qwen3.8-27B (ADR 0017) | Qwen3.6-35B-A3B (speed alternative), any model | V1 |
| Intuition | Tev1 4B (ADR 0017: converted from the official weights) | Heuristic rules, option probabilities read from the Reasoning model, Kev, Laya and others | V2 |
| Embedding | EmbeddingGemma-2 (ADR 0017) | Any embedding model | V1 (needed by B1) |
| Knowledge store | Oxigraph WASM (in process) | Oxigraph server mode, other graph stores | V2 |
| Retrieval | BM25 plus vector retrieval | Graph retrieval only, adding a reranker, and others | V1 (needed by B1) |
| Attention | Basic implementation | Graph-based implementation, Intuition-based implementation | V2 |
| Cognitive Strategy | Fast and slow dual system | LLM-only, RAG, SwiftSage-style, NeSyFS-style | Fake in V0, real implementation in V2 |
| Verification | Deterministic rules: is the action legal, is the goal reached, does the conclusion conflict with the evidence | Model review, cross-source checks, SHACL constraints | Rule checks in V0 |
| Reasoning Strategy | Single-pass reasoning | Plan then execute, alternate hypothesis and evidence | V2 |
| Capability | Simulator actions of the Micro World | Local sandbox capabilities, MCP | V1 |
| Communication | CLI | HTTP / SSE, A2A | P1 (product commands are designed after the decision gate) |
| Trace export | Write to local files | OTLP | V0 |
| Policy (policy check) | Allow everything in the validation stage; a cautious default level in the product stage (ADR 0022) | Other levels, a fast classification model, roles and permissions, multiple users, object-level access control (ADR 0014) | V0 (the product default level is set at the decision gate) |
| Operational telemetry export | JSONL to stdout, and to local files | OTLP (Grafana, Jaeger, Prometheus and others) (ADR 0015) | V0 |
| Composition layer | A very thin factory function | Cordis, iii | V0 |
| Environment | Micro World generator | World 0, other Domain Packs | The simplest world in V0 |

## Optional dependencies

| Dependency | Without it |
|---|---|
| GPU | Use a smaller model, or connect to a remote model backend |
| Docker / Compose | Run Node and the model backend directly on the machine |
| Web interface, experiment panel, monitoring panel | Use only the CLI and the logs |
| MCP servers, A2A | Use only local Capabilities |

## Match backend capabilities by declaration, do not assume them

Different backends have different capabilities. For example, the Intuition adapter needs a backend that returns token probabilities (ADR 0010). So each Provider must **declare the capabilities it supports**, for example `supportsLogprobs`, `supportsGrammar`, `supportsJsonSchema` (constrained decoding, ADR 0019). At startup, the composition root and the product self-check command (for example `memex doctor`; the name is set after the decision gate, ADR 0020) check that these capabilities match the configuration. When they do not match, give a clear error at once. Do not wait to fail at runtime, and do not assume in code that "the backend always supports this capability".

## When to decide

Principle: **decide at the last responsible moment** (from Lean software development: if you wait past this moment, you lose an important option). Set a default value only when a milestone really needs a specific value. A default value is not a commitment. Changing it later is only a configuration change. A choice that can be made a configuration setting is not treated as a "decision".

## Requirements of the validation tools (not part of the product)

| Requirement | Reason |
|---|---|
| One separate process for each Experiment | ADR 0004; used only in the validation stage (ADR 0020) |
| Micro World, World Generator, Oracle, Evaluator, Fake Provider | Used only in the validation stage, not shipped with the product (ADR 0020) |
