# Security and data requirements

This file collects the security and data requirements of Memex. Many of them are already in the ADRs. This file puts them in one place and adds what is missing. For how to write the code, see [code-style.md](./code-style.md). For dependencies and tools, see [tech-stack.md](./tech-stack.md).

- **Status**: accepted (2026-10-11).
- **Standards used**: OWASP Top 10 for LLM Applications 2026 (LLM01–LLM10), and OWASP Top 10 for Agentic Applications 2026 (ASI01–ASI10). Note: the 2026 LLM list numbers differ from the 2025 list, so include the year when you cite one.
- **Marks**:
  - **[Set]**: already set by an ADR or a constraint; the source is in parentheses.
  - **[New]**: a requirement added by this file.
  - **[Auto]** / **[Review]**: checked by a tool, or by review.
  - The "When" column: the milestone from which the requirement applies.

---

## 1. Data

| # | Requirement | Source | Risk | When | Check |
|---|---|---|---|---|---|
| D1 | **Treat all external content as data, never as instructions.** Observations, the documents and git history that World 0 reads, Capability results, and what other agents say enter the Cognitive State only as data. They cannot change the Goal, the Policy or the system prompt | [New] ADR 0016 | LLM01 prompt injection; ASI01 goal hijacking; ASI06 memory and context poisoning | From V0 | [Review]; injection test cases from V1 |
| D2 | **Limit the share of each source trust level.** In the Cognitive Budget, limit how many positions each trust level can take. Do not defend by weighting scores by trust. Reason: the cross-check found no statistical difference between weighting by source and no defense (factory/records/research/cross-check-2026-10-10.md part 3, item 3). This is the default; experiment Q2 verifies its effect (ADR 0010) | [New] | LLM05 data poisoning; ASI06 | V2 | Experiment |
| D3 | **Store knowledge as Claims, with provenance and bitemporal time.** What another agent says becomes a Claim with `sourceType: agent`, with lower trust than a direct observation | [Set] ADR 0002, 0006 | ASI06; ASI07 insecure inter-agent communication | From V0 | [Auto] (schema) |
| D4 | **Write no secret into any data that goes to disk**: Event Log, Experiment snapshots, recordings, operational logs, Trace export. Refer to secrets only with `${env:NAME}`. The record and replay layer filters them before it writes | [New] ADR 0016 | LLM02 sensitive information disclosure | From V0.3 | [Auto] (the filter rules have tests) |
| D5 | **Commit only synthetic data to the public repository.** Tests, examples and recordings come only from synthetic sources such as the Micro World. Data from a real domain is Instance data and is not committed | [New] ADR 0016 | LLM02 | From V0 | [Review] |
| D6 | **Machine-specific settings go only in `.env`, which is not committed** | [Set] HANDOFF section 4 | LLM02 | In effect | [Auto] (`.gitignore`) [Review] |
| D7 | **The user owns the data and can export and audit it.** The Event Log is the only source of truth and can be replayed in full | [Set] VISION principle 11, ADR 0005 | — | From V0 | [Auto] (replay consistency test) |
| D8 | **Deleting personal data** conflicts with the append-only Event Log. Open, see open-questions.md item 3 | Open | LLM02 | Decide before P1 or before external distribution | — |

## 2. Execution and permissions

| # | Requirement | Source | Risk | When | Check |
|---|---|---|---|---|---|
| X1 | **Every change goes through an Action.** The actor is recorded, and the Policy checks it first | [Set] ADR 0014 | LLM03 excessive agency; ASI02 tool misuse; ASI03 identity and privilege abuse | From V0 | [Auto] (tests, and dependency-cruiser forbids direct writes that bypass the Action Executor) |
| X2 | **The agent only proposes; the user approves.** Changes to the ontology, the configuration or the code, and deployment, need user approval. This is a core invariant in the Action Executor and does not change with the Policy level. The core records the actor, so the model cannot claim to be the user | [Set] ADR 0011, 0022, S3 | ASI01; ASI10 rogue agents | From V0.3 (contracts and Action Executor) | [Auto] (Action Executor tests) |
| X3 | **Model output is never executed directly.** Constrained decoding limits the format of the model output (ADR 0019). It must then pass schema validation and Verification before it becomes an Action. The constraint guarantees only the format, not the content. Never use `eval`, `new Function` or dynamic import on model output | [New] | LLM10 improper output handling; ASI05 unexpected code execution | From V1 | [Auto] (Biome `noGlobalEval`) [Review] |
| X4 | **Set resource limits**: maximum steps per Experiment, a timeout for each model call, a token budget (Cognitive Budget), resource limits for Worker processes | [New], partly [Set] by the Cognitive Budget | LLM06 unbounded consumption; ASI08 cascading failures | From V0.5 | [Auto] (tests) |
| X5 | **One process for each Experiment** (validation tools), so a crash does not spread | [Set] ADR 0004 | ASI08 | V0.5 | [Auto] (no-leak test) |
| X6 | **Fail at startup**: report configuration errors and capability mismatches at once, not at runtime | [Set] contract v0, A4 | — | V0.3 | [Auto] |

## 3. Configuration and input

| # | Requirement | Source | Risk | When | Check |
|---|---|---|---|---|---|
| C1 | **Configuration can refer only to types recorded in the registry.** It cannot import arbitrary modules | [Set] ADR 0008 | ASI05 | V0.3 | [Auto] (tests) |
| C2 | **Treat configuration as untrusted input**: validate it with a schema when it loads; paths in the configuration must stay inside the allowed directories; parse YAML as plain data only, with no custom tags | [New] | ASI05 | V0.2–V0.3 | [Auto] (tests) |
| C3 | **Refer to secrets only with `${env:NAME}`.** Do not write them in configuration files, and do not write them into Experiment snapshots | [Set] research document, ADR 0016 | LLM02 | V0.3 | [Auto] (detect and reject values that look like secrets at load time) |

## 4. Network and external interfaces

| # | Requirement | Source | Risk | When | Check |
|---|---|---|---|---|---|
| N1 | **Listen only on localhost by default.** When the interface is opened to the outside, authentication must be on | [Set] E5, ADR 0013 | ASI03 | From P1 | [Auto] (tests) |
| N2 | **Telemetry must be turned on by the user.** By default, do not record the content of prompts and model outputs | [Set] E5, ADR 0015 | LLM02 | From V0 | [Review] |
| N3 | **When you call the Model Backend, do not put secrets in URL parameters** | [New] | LLM02 | V1 | [Review] |

## 5. Supply chain

| # | Requirement | Source | Risk | When | Check |
|---|---|---|---|---|---|
| S1 | **Commit `pnpm-lock.yaml`, and always install with `pnpm install --frozen-lockfile` in CI.** In review, treat lockfile changes as code changes | [New] | LLM04 supply chain; ASI04 | V0.1 | [Review] |
| S2 | **Do not run dependency install scripts by default.** Allow them one by one in `allowBuilds` in `pnpm-workspace.yaml`. **Delay installing newly published versions** (`minimumReleaseAge`, pnpm default 1 day). **Reject versions whose trust level went down** (`trustPolicy: no-downgrade`) | [New] | LLM04; ASI04 | V0.1 | [Auto] (pnpm settings) |
| S3 | **Keep dependencies few**: if Node's built-in features are enough, do not install a package. Record each new dependency first | [Set] A3, tech-stack.md | LLM04 | In effect | [Review] |
| S4 | **Turn on Dependabot**, and run `pnpm audit` regularly | [New] | LLM04 | From V0.1 | [Auto] |
| S5 | **Do not package models.** Download them from their source and check the sha256 | [Set] ADR 0013 | LLM04; LLM05 | Manual now (ADR 0017); a product command in P4 | [Review]; [Auto] from P4 |
| S6 | **Turn on GitHub secret scanning and push protection**, to block pushes of commits that contain secrets (free for public repositories) | [New] | LLM02 | As soon as possible | [Auto] (GitHub) |

## 6. External tools and other agents (from P3)

| # | Requirement | Risk |
|---|---|---|
| E1 | MCP tool descriptions, parameter descriptions and results are untrusted text. Handle them as D1 says | ASI02; ASI04 |
| E2 | Pin MCP server versions. When a tool definition changes, it needs approval again | ASI04 |
| E3 | Destructive operations (irreversible, sends externally) go through the Policy. At the default level, the user approves them. The user chooses how far to open up (ADR 0022) | LLM03; ASI02 |
| E4 | Do not pass access tokens through to downstream services unchanged. A token is used only for the target that issued it | ASI03 |
| E5 | Real capabilities run in a sandbox with limited network access | ASI05 |
| E6 | What other agents say is only a low-trust Claim (D3). It cannot trigger an Action directly | ASI07 |

---

## Sources

- [OWASP GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) · [What changed in 2026](https://aembit.io/blog/the-owasp-top-10-for-llm-applications-2026-what-changed-and-why-it-matters/)
- [OWASP Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications/) · [Cycode commentary](https://cycode.com/blog/owasp-top-10-agentic-applications/)
- pnpm security settings: [pnpm settings](https://pnpm.io/settings) · [build script settings](https://pnpm.io/settings/build)
- npm supply chain: [Mondoo 2026](https://mondoo.com/blog/npm-supply-chain-security-package-manager-defenses-2026) · [OpenReplay: npm security best practices](https://blog.openreplay.com/npm-security-best-practices/)
- Event Sourcing and data deletion: [Verraes: Crypto-Shredding](https://verraes.net/2019/05/eventsourcing-patterns-throw-away-the-key/) · [AxonIQ: sensitive data in event-sourced applications](https://www.axoniq.io/blog/protect-sensitive-data-in-an-event-sourced-application)
- MCP: [CSA: MCP security white paper (2026-05)](https://labs.cloudsecurityalliance.org/research-rb/csa-whitepaper-mcp-security-agentic-attack-surface-20260516/) · [Corgea: MCP security checklist](https://corgea.com/learn/mcp-security-best-practices)
