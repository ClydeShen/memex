# 集成契约 v0（草案）

本文件定义 Memex 各模块之间的集成契约。图示见 [c4.md](./c4.md)。

- **状态**：草案 v0。M0.2 会把它实现为 `@memex/contracts`，M0 的测试会验证它。到正式阶段关卡时冻结为 v1（ADR 0012）。冻结之后，破坏性修改必须提升 `apiVersion` 并提供转换函数。
- **写法**：下面用 TypeScript 风格的签名来表达设计意图，只说明形状，不是最终代码。所有数据类型都可以序列化为 JSON，并且能通过 JSON-LD `@context` 映射到标准词汇（ADR 0007）。

---

## 一、契约分三类

| 类别 | 边界 | 形式 |
|---|---|---|
| **进程内端口** | Runtime 内部，从 Strategy 和核心组件到各个 Provider | TypeScript 接口加上可序列化的数据类型 |
| **数据契约** | 落盘或跨进程传递的数据 | 资源 YAML、事件（CloudEvents，存为 JSONL）、Experiment 快照（JSON） |
| **外部协议** | Memex 与外部系统之间 | OpenAI 兼容 HTTP、MCP、A2A、OTLP、HTTP/SSE |

---

## 二、所有 Provider 共用的部分

```ts
interface Provider {
  readonly kind: ProviderKind;           // 例如 "intuition"、"reasoning"、"policy" 等
  readonly type: string;                 // 例如 "intuition.tev1"、"intuition.fake"
  readonly capabilities: Capabilities;   // 能力声明，例如 { supportsLogprobs: true }
  init(config: unknown, ctx: InitContext): Promise<void>;  // config 由该类型自己的 schema 校验
  dispose(): Promise<void>;
}
```

规则：
- Composition Root 在启动时把配置要求的能力和 Provider 声明的 `capabilities` 做比对。不匹配就立即报 `CapabilityMismatch` 错误，并说明缺少哪项能力。
- Provider 只依赖 `@memex/contracts`，不能 import 其他 Provider。
- 所有外部调用都必须经过录制和回放层（ADR 0005）：调用的输入和输出写入 Event Log，回放时直接读取，不再调用。

---

## 三、进程内端口

| 端口 | 调用方 | 签名（示意） | 说明 |
|---|---|---|---|
| **Environment** | Capability、Lab | `reset(seed) → Observation[]`；`step(action) → StepResult { observations, valid, cost }`；`describe() → EnvironmentInfo` | 统一的环境接口。Micro World 和 World 0 都实现这个端口。这是 Memex 自己定义的三个标准之一 |
| **CognitiveStrategy** | Runtime 循环 | `step(ctx: StepContext) → StepDecision` | `StepContext` 包含 Cognitive State、预算，以及可以调用的 `services`（其他端口）。返回值是这一步的决定：提交哪些 Action、要不要继续、要不要等待 |
| **Attention** | Strategy | `select(state, budget) → AttentionResult { focus, ignored, reason }` | 只能通过 `services` 调用 Knowledge 和 Retrieval |
| **Intuition** | Strategy | `judge(compactState, questions: Record<id, Question>) → Record<id, Judgement>` | Question 的类型是 `choice`、`noul` 或 `score`，沿用 Jev 的格式。`Judgement = { answer, distribution, certainty }`，其中 `certainty` 是经过 Calibration 之后的值 |
| **Reasoning** | Strategy | `reason(ctx: ReasoningContext) → ReasoningResult { conclusion, proposedActions, hypotheses, usage }` | 具体用哪种 Reasoning Strategy 由配置决定。`usage` 记录实际使用的 token 数，用来计算预算 |
| **Verification** | Strategy | `verify(candidate) → Verdict { ok, reasons }` | 能用确定性规则检查的，就不交给模型 |
| **Knowledge** | Attention、Strategy | `query(q: ClaimQuery) → Claim[]` | 只读。写入一律走 Action 和 Event Log，再由 Projector 更新 |
| **Retrieval** | Attention | `retrieve(query, budget) → RetrievedItem[]` | BM25 加向量检索；每一条结果都带上来源和观测时间（B1 和 B3 信息对等） |
| **Policy** | Action Executor | `authorize(action, actor) → Decision { allow, reason }` | 默认实现是全部放行。用户的审批也通过这个端口实现（ADR 0014） |
| **Capability** | Action Executor | `list() → CapabilityDescriptor[]`；`execute(request) → Observation[]` | 输入和输出用 JSON Schema 描述，与 MCP 兼容 |
| **Communication** | Runtime | `start(api: RuntimeApi)`；`stop()` | CLI、HTTP/SSE、A2A 都实现这个端口 |

核心组件（不是端口，不可替换）：

| 组件 | 接口（示意） |
|---|---|
| Event Log | `append(event) → EventId`；`read(from?) → AsyncIterable<Event>` |
| Action Executor | `submit(actionRequest, actor) → ActionResult`：先经过 Policy 检查，再写入日志，然后执行 |
| Projector | `apply(event)`；`rebuild(fromLog)`：重建出来的结果必须和原来一模一样 |

---

## 四、数据契约

### 核心数据类型（字段只列出要点）

```ts
Observation { id, source, recordedAt, payload }                 // 记录"发生了什么"，不是 Action
Claim {
  id, proposition: { subject, predicate, object },
  epistemicStatus: "known"|"believed"|"suspected"|"unknown"|"refuted"|"contested",
  confidence,                                                    // 由证据推导出来的值
  provenance: { sourceType: "user"|"observation"|"inference"|"model"|"tool"|"agent", source, derivedFrom[] },
  validTime: { from, until? }, recordedAt,                       // 双时态（ADR 0002）
  evidence[]
}
ActionRequest { name, params, actor }                            // params 由该 Action 的 schema 校验
Event {                                                          // CloudEvents 1.0 结构化格式，每行一个
  specversion: "1.0", id, source, type, time, datacontenttype, data,
  memexactor, memexinstance, memexparent                         // 扩展属性：执行者、所属 Instance、前一条事件
}
```

事件类型命名为 `memex.<领域>.<动作>`，例如 `memex.observation.recorded`、`memex.claim.asserted`、`memex.action.executed`、`memex.provider.call.recorded`（录制下来的模型调用）。CloudEvents 规定扩展属性名只能由小写字母和数字组成，所以写成 `memexactor` 这样的形式，不用点号或下划线。

### 资源配置（ADR 0009）

M0 需要的 `kind` 有：`Model`、`Provider`、`Strategy`、`Environment`、`Experiment`、`Runtime`。每种 `kind` 都附带一份 JSON Schema。示例见 docs/research/standards-and-config.md 第四部分。

### Experiment 快照（JSON）

快照记录一次 Experiment 的全部输入：最终生效的配置及其哈希、每个 Provider 的 `type` 和版本、模型的 sha256、World Generator 的版本和种子、本体版本、硬件信息，以及录制文件的位置。只要有这份快照，就能回放这次 Experiment。

---

## 五、跨进程与外部协议

| 边界 | 协议 | 契约要点 |
|---|---|---|
| Lab Runner ↔ Experiment Worker | 子进程 IPC，消息按 JSONL 格式逐行传输 | Runner 发出 `start { experiment, snapshotPath }`；Worker 依次返回事件流和 `result { reportPath, status }`。Worker 退出后，它的全部状态随之销毁（ADR 0004） |
| Runtime ↔ Model Backend | OpenAI 兼容的 HTTP 接口 | Reasoning 需要文本生成。Intuition 适配器还需要 `logprobs`（ADR 0010），并且必须能关闭思考模式。这些都在 Model 资源中声明为能力 |
| Runtime ↔ 用户 | CLI、HTTP/SSE | 默认只监听 localhost；对外开放时必须认证（ADR 0013） |
| Runtime ↔ 外部工具 | MCP | 每个 MCP 工具会被映射成一个 Capability，并在沙箱中执行（M5） |
| Runtime ↔ 其他 Agent | A2A | 对方说的话记为一条 Claim，`sourceType` 为 `agent`（尚未排期） |
| Runtime → 可观测性后端 | OTLP，可选 | 运维遥测（ADR 0015） |

---

## 六、尚未确定、将在 M0 中验证的内容

- `StepContext.services` 的具体形状：要让 Provider 之间只能通过 Strategy 授权的接口互相调用，又不至于太繁琐。
- 精简状态（交给 Intuition 的状态）怎么序列化。Tev1 的上下文只有约 2,000 个 token。
- 录制和回放的边界放在哪一层：是在每个 Provider 内部，还是在 Model Backend 的连接层统一处理。目前倾向后者，因为最省事。
