# Integration contracts v0 (draft)

This file defines the integration contracts between the modules of Memex. For diagrams, see [c4.md](./c4.md).

- **Status**: draft v0. V0.2 implements it as `@memex/contracts`, and the V0 tests verify it. At the decision gate it is frozen as v1 (ADR 0012). After the freeze, a breaking change must raise `apiVersion` and provide a conversion function.
- **Notation**: the signatures below are in TypeScript style. They express the design intent and show only the shape. They are not final code. All data types can be serialized as JSON and can be mapped to standard vocabularies with a JSON-LD `@context` (ADR 0007).

---

## 1. Three kinds of contracts

| Kind | Boundary | Form |
|---|---|---|
| **In-process ports** | Inside the Runtime, from the Strategy and the core components to each Provider | TypeScript interfaces with serializable data types |
| **Data contracts** | Data written to disk or passed between processes | Resource YAML, events (CloudEvents, stored as JSONL), Experiment snapshots (JSON) |
| **External protocols** | Between Memex and external systems | OpenAI-compatible HTTP, MCP, A2A, OTLP, HTTP/SSE |

---

## 2. What all Providers share

```ts
interface Provider {
  readonly kind: ProviderKind;           // for example "intuition", "reasoning", "policy"
  readonly type: string;                 // for example "intuition.tev1", "intuition.fake"
  readonly capabilities: Capabilities;   // capability declaration, for example { supportsLogprobs, supportsGrammar, supportsJsonSchema } (ADR 0019)
  init(config: unknown, ctx: InitContext): Promise<void>;  // config is validated by the schema of that type
  dispose(): Promise<void>;
}
```

Rules:
- At startup, the Composition Root compares the capabilities that the configuration needs with the `capabilities` that the Provider declares. If they do not match, it reports a `CapabilityMismatch` error at once and names the missing capability.
- A Provider depends only on `@memex/contracts`. It cannot import another Provider.
- All external calls go through the record and replay layer (ADR 0005, 0024): the Model Backend, Capabilities and Environments of the real world, and the clock. The Event Log stores the call metadata and the sha256 of the request and the response. The full text is stored in the content store by hash. On replay it is read directly, without a new call. The deterministic parts (Micro World, the internal logic of Providers) run again on replay.

---

## 3. In-process ports

| Port | Caller | Signature (sketch) | Notes |
|---|---|---|---|
| **Environment** | Capability, Lab | `reset(seed) → { goal, observations }`; `step(action) → StepResult { observations, valid, cost, goalReached }`; `describe() → EnvironmentInfo` (includes the definitions of the available Actions) | The common environment interface. Both the Micro World and World 0 implement this port. It is one of the three standards that Memex defines itself. `goalReached` is the learning signal for the agent. The Evaluator scores independently from the Ground Truth (ADR 0021) |
| **CognitiveStrategy** | Runtime loop | `step(ctx: StepContext) → StepDecision` | `StepContext` contains the Cognitive State, the budget, and the `services` it can call (the other ports). The return value is the decision for this step: which Actions to submit, whether to continue, whether to wait |
| **Attention** | Strategy | `select(state, budget) → AttentionResult { focus, ignored, reason }` | Can call Knowledge and Retrieval only through `services` |
| **Intuition** | Strategy | `judge(compactState, questions: Record<id, Question>) → Record<id, Judgement>` | A Question is always multiple choice (ADR 0018): `{ state, question, options: 2–24 options labeled with letters }`, the same input format as the Tev1 model card. A yes/no question is a two-option multiple choice question, and a rating question is a multiple choice question with ordered options. `Judgement = { answer, distribution, certainty, offOptionMass }`: a grammar constrains the output to the option letters; `distribution` is renormalized over the option letters; `offOptionMass` is the raw probability that falls outside all options; `certainty` is the value after Calibration (ADR 0019) |
| **Reasoning** | Strategy | `reason(ctx: ReasoningContext) → ReasoningResult { conclusion, proposedActions, hypotheses, usage }` | The configuration selects the Reasoning Strategy. The final output is constrained with `json_schema`, exported from the Zod schema in the contracts (ADR 0019). `usage` records the tokens actually used (input, output and thinking separately, ADR 0018), for the budget |
| **Verification** | Strategy | `verify(candidate) → Verdict { ok, reasons }` | If deterministic rules can check it, do not give it to a model |
| **Knowledge** | Attention, Strategy | `query(q: ClaimQuery) → Claim[]` | Read-only. All writes go through an Action and the Event Log, and the Projector then updates the state |
| **Retrieval** | Attention | `retrieve(query, budget) → RetrievedItem[]` | BM25 plus vector retrieval. Each result has its source and observation time (B1 and B3 get the same information) |
| **Policy** | Action Executor | `authorize(action, actor) → Decision { outcome: "allow" \| "deny" \| "ask", reason }` | Decides by the risk level of the Action and the configured level (ADR 0022). `ask` means waiting for user approval: the Action Executor writes a `memex.action.pending` event, and after the approval it executes or abandons the Action. The validation stage allows everything by default; the product stage defaults to a cautious level |
| **Capability** | Action Executor | `list() → CapabilityDescriptor[]`; `execute(request) → Observation[]` | Input and output are described with JSON Schema, compatible with MCP |
| **Communication** | Runtime | `start(api: RuntimeApi)`; `stop()` | The CLI, HTTP/SSE and A2A all implement this port |

Core components (not ports, cannot be replaced):

| Component | Interface (sketch) |
|---|---|
| Event Log | `append(event) → EventId`; `read(from?) → AsyncIterable<Event>` |
| Action Executor | `submit(actionRequest, origin) → ActionResult`: the core records the actor from `origin` (Strategy, an authenticated user entry point, A2A); the request does not fill it in. It first checks the invariants (an Action with the "self-modify" risk level is allowed only for `user`), then goes through the Policy, then writes the log and executes (ADR 0022) |
| Projector | `apply(event)`; `rebuild(fromLog)`: the rebuilt result must be exactly the same as the original |

---

## 4. Data contracts

### Core data types (only the main fields)

```ts
Observation { id, source, recordedAt, payload }                 // records "what happened"; it is not an Action
Claim {
  id, proposition: { subject, predicate, object },
  epistemicStatus: "known"|"believed"|"suspected"|"unknown"|"refuted"|"contested",
  confidence,                                                    // derived from the evidence
  provenance: { sourceType: "user"|"observation"|"inference"|"model"|"tool"|"agent", source, derivedFrom[] },
  validTime: { from, until? }, recordedAt,                       // bitemporal (ADR 0002)
  evidence[]
}
ActionRequest { name, params }                                   // params are validated by the schema of that Action; the core records the actor (ADR 0022)
ActionDefinition { name, paramsSchema, risk: "read-only"|"reversible"|"irreversible"|"external-send"|"self-modify" }  // risk level (ADR 0022)
Event {                                                          // CloudEvents 1.0 structured format, one per line
  specversion: "1.0", id, source, type, time, datacontenttype, data,
  memexactor, memexinstance, memexparent                         // extension attributes: actor, owning Instance, previous event
}
```

Event types are named `memex.<domain>.<action>`, for example `memex.observation.recorded`, `memex.claim.asserted`, `memex.action.executed`, `memex.provider.call.recorded` (a recorded external call; the full text is stored in the content store by sha256, ADR 0024). CloudEvents allows only lowercase letters and digits in extension attribute names, so they are written as `memexactor`, without dots or underscores.

### Resource configuration (ADR 0009)

`apiVersion` is `memex.dev/v0alpha1` everywhere (until the v1 freeze). V0 needs these `kind`s: `Model`, `Provider`, `Strategy`, `Environment`, `Experiment`, `Runtime`. Each `kind` has a JSON Schema. For examples, see factory/records/research/standards-and-config.md part 4.

### Experiment snapshot (JSON)

A snapshot records all inputs of one Experiment: the effective configuration and its hash, the `type` and version of each Provider, the model source and sha256, the World Generator version and seed, the ontology version, the Model Backend version (ADR 0017), the thinking mode settings (ADR 0018), hardware information, and the location of the recorded content store (ADR 0024). With this snapshot, the Experiment can be replayed. A snapshot is Instance data. Snapshots from a real Domain are not committed (ADR 0016).

---

## 5. Cross-process and external protocols

| Boundary | Protocol | Main points |
|---|---|---|
| Lab Runner ↔ Experiment Worker | Child process IPC, messages sent line by line as JSONL | The Runner sends `start { experiment, snapshotPath }`. The Worker returns the event stream and then `result { reportPath, status }`. When the Worker exits, all its state is destroyed (ADR 0004) |
| Runtime ↔ Model Backend | OpenAI-compatible HTTP | Reasoning needs text generation. The Intuition adapter also needs `logprobs` (ADR 0010) and grammar-constrained decoding (ADR 0019), and must be able to turn thinking mode off. Reasoning needs `json_schema`-constrained decoding. The Provider declares all of these in `capabilities` (section 2) |
| Runtime ↔ user | CLI, HTTP/SSE | Listen only on localhost by default; authentication is required when opened to the outside (ADR 0013) |
| Runtime ↔ external tools | MCP | Each MCP tool is mapped to a Capability and runs in a sandbox (P3) |
| Runtime ↔ other agents | A2A | What the other side says is recorded as a Claim with `sourceType` `agent` (not scheduled yet) |
| Runtime → observability backend | OTLP, optional | Operational telemetry (ADR 0015) |

---

## 6. Not decided yet, to be verified in V0

- The exact shape of `StepContext.services`: Providers must call each other only through interfaces that the Strategy grants, without too much ceremony.
- How to serialize the compact state (the state given to Intuition). The Tev1 model supports a very long context (262,144), but Intuition is a single, low-latency judgment, so the state should stay compact. The exact limit is a configuration setting.
- How a Provider gets its configuration: through the arguments of the factory function in the registry (the example in code-style.md section 1), or through `init(config, ctx)`. Keep only one. The V0 integration design recommends factory function arguments and removing `init` (plans/v0-integration.md I2).
