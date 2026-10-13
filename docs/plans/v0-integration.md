# V0 集成设计：组件、接缝、关卡与 Story

本文件是 V0 里程碑的集成设计（ADR 0025 第 1 步）。它列出 V0 的组件、组件之间的接缝和每条接缝的关卡，并把工作拆成可以执行、可以追踪的 story。契约的总体定义见 [architecture/contracts.md](../architecture/contracts.md)，里程碑和通过标准见 [roadmap.md](../roadmap.md)，术语见 GLOSSARY.md。

- **状态**：已用于交付规划（2026-10-13）；story 已同步为 GitHub Issue，见各 epic。V0-02 排在 V0-01 之前：骨架要用到这些工具，先实测排除风险。
- **V0 的完成定义**：三条通过标准（可复现、不泄漏、可替换）写成自动化测试并全部通过；分支合并进 `main`（roadmap 第三部分）。
- **字段级别**：本文件中的字段是设计意图，实现时以 `@memex/contracts` 中的 Zod schema 为准。实现中发现需要调整，就同时修改 schema、本文件和 contracts.md，并说明原因。

---

## 一、组件清单

"类别"沿用 ADR 0020：**产品核心**按产品标准认真做；**验证专用**够用即可。

| # | 组件 | 包 | 类别 | 职责 |
|---|---|---|---|---|
| K1 | 资源 schema | contracts | 产品核心 | 资源格式（apiVersion / kind / metadata / spec）和 V0 的各种 `kind` |
| K2 | 核心数据 schema | contracts | 产品核心 | Goal、Observation、Claim、ActionRequest、ActionDefinition、Event、StepResult 等 |
| K3 | 端口和一致性测试 | contracts | 产品核心 | 各 Provider 接口；每个端口一套一致性测试 |
| K4 | Event Log | runtime | 产品核心 | 追加、读取 JSONL 格式的 CloudEvents |
| K5 | Composition Root | runtime | 产品核心 | 加载配置、合并 overlay、校验、按 `type` 查注册表、实例化、能力检查、解析 `${env:NAME}` |
| K6 | Action Executor | runtime | 产品核心 | 记录执行者、检查不变量、调用 Policy、写入日志、执行（ADR 0022） |
| K7 | 认知循环 | runtime | 产品核心 | 重置 Environment，按步调用 Strategy，提交 Action，直到目标达成或达到步数上限 |
| K8 | Projector | runtime | 产品核心 | 从 Event Log 生成 Trace 和 Claim 的 Projection；重建结果与增量结果一致 |
| K9 | 录制层 | runtime | 产品核心 | 在不确定性进入系统的边缘录制和回放；内容存储；密钥过滤（ADR 0016、0024） |
| K10 | 运维日志 | runtime | 产品核心 | 按 OpenTelemetry 日志数据模型输出 JSONL（ADR 0015） |
| K11 | 最小 Micro World | fakes | 验证专用 | 按种子确定性生成的目标型世界（ADR 0021） |
| K12 | Fake Provider | fakes | 验证专用 | FakeIntuition、FakeReasoning、FakeKnowledge、全部放行的 Policy、Fake Strategy、假的 Model Backend |
| K13 | 污染 Provider | fakes | 验证专用 | 故意写全局状态，用来检验隔离 |
| K14 | Lab Runner 和 Worker | lab | 验证专用 | 每个 Experiment 一个子进程；JSONL 通信；Worker 的启动文件是装配入口 |
| K15 | 快照、报告和最小 Evaluator | lab | 验证专用 | Experiment 快照、JSON 报告、目标完成率、Trace 哈希 |
| K16 | 关卡测试 | lab | 验证专用 | 三条通过标准的自动化测试 |

---

## 二、接缝

每条接缝写明：谁产出、谁消费、交付什么、要点字段、关卡。关卡的三层含义见 ADR 0025：**[S]** schema 关卡，**[C]** 一致性关卡，**[I]** 集成关卡。

### I1 资源配置 → Composition Root
- **产出方**：用户或 Lab（`examples/*.yaml`）。**消费方**：K5。
- **交付**：多文档 YAML，KRM 格式（ADR 0009）。
- **要点字段**：`apiVersion: memex.dev/v0alpha1`；`kind` 为 `Experiment`、`Environment`、`Strategy`、`Provider`、`Model`、`Runtime`；`metadata.name`；`spec.type` 写成"类别.实现"，例如 `environment.micro-world`；`spec.config` 由该类型自己的 schema 校验；资源之间按 `metadata.name` 引用；密钥只能写 `${env:NAME}`；实验变体用 base 加 overlay 补丁。
- **关卡**：[S] 每种 `kind` 的 schema 测试；导出的 JSON Schema 能校验 `examples/` 中的全部文件。[C] 加载器拒绝自定义 YAML 标签、超出允许目录的路径、疑似明文密钥（security-and-data.md C2、C3）。

### I2 Composition Root → Provider
- **产出方**：K5。**消费方**：每个 Provider（K11–K13，以后的 `providers/*`）。
- **交付**：注册表条目 `{ kind, type, configSchema, capabilities, create(config, ctx) → Promise<Provider> }`。
- **要点**：配置通过工厂函数的参数传入，**去掉契约 v0 中的 `init`**，保留 `dispose`。这样和 code-style.md 第一节的工厂函数风格一致，Provider 也不需要可变状态（contracts.md 第六节的待定项，在这里定下）。`ctx` 只包含核心提供的服务：时钟、运维日志、录制层、Instance 标识。启动时把配置要求的能力与 `capabilities` 比对，不匹配就报 `CapabilityMismatch`。
- **关卡**：[S] 注册表条目的类型检查。[C] 未登记的 `type` 被拒绝；能力不匹配时立即失败，并说明缺少哪项能力。

### I3 Environment → 认知循环
- **产出方**：K11（以后的 World 0）。**消费方**：K7、K6。
- **交付**：`reset(seed) → { goal, observations }`；`step(action) → StepResult { observations, valid, cost, goalReached }`；`describe() → { actions: ActionDefinition[] }`。
- **要点**：`Goal { id, description, params }`。Observation 的 `recordedAt` 在 Micro World 中使用模拟器时间（ADR 0005）。`goalReached` 是学习信号；Ground Truth 不经过这个端口，只交给 Evaluator（ADR 0021）。
- **关卡**：[C] Environment 一致性测试：同一种子生成同一个世界和同一个 Goal；非法动作返回 `valid: false`，并且不改变世界；达成目标后 `goalReached` 为真。

### I4 认知循环 → Cognitive Strategy
- **产出方**：K7。**消费方**：Fake Strategy（K12），以后的快慢双系统。
- **交付**：`step(ctx: StepContext) → StepDecision`。`StepContext { state, budget, services }`；`state` 是 Cognitive State：Goal、最近的 Observation、步数；`StepDecision { actions: ActionRequest[], done }`。
- **要点**：`services` 只暴露 Strategy 被授权调用的端口（V0 是 Intuition、Reasoning、Knowledge）。它的具体形状在最薄的端到端（第四节 B 阶段）中先用最小形式，在 V0-12 中定稿。
- **关卡**：[C] Strategy 一致性测试：只通过 `services` 调用其他端口；同样的输入得到同样的决定。

### I5 Strategy → Action Executor
- **产出方**：Strategy。**消费方**：K6。
- **交付**：`ActionRequest { name, params }`；执行者由 K6 根据来源记录（ADR 0022）。
- **要点**：K6 按 `name` 找到 `ActionDefinition { name, paramsSchema, risk }`（来自 Environment 的 `describe()`，以及核心自带的 Action，例如形成 Claim），校验 `params`，检查不变量，调用 Policy，写入日志，然后执行。返回 `ActionResult { status: "executed" | "denied" | "pending", observations }`。
- **关卡**：[S] ActionRequest 和 ActionDefinition 的 schema 测试。[C] 未知 Action 被拒绝；参数不合法被拒绝；风险等级为"修改自身"、执行者不是 `user` 的 Action，在调用 Policy 之前就被拒绝。

### I6 Action Executor ↔ Policy
- **交付**：`authorize(action, actor, definition) → Decision { outcome: "allow" | "deny" | "ask", reason }`。
- **要点**：`ask` 时写入 `memex.action.pending`，这个 Action 暂不执行（ADR 0022）。V0 只有全部放行的 Policy；`ask` 的处理路径用一个测试专用的 Policy 来检验。
- **关卡**：[C] Policy 一致性测试：每个决定都带原因；同样的输入得到同样的决定。

### I7 → Event Log
- **产出方**：K6、K7、K9。**消费方**：K4。
- **交付**：CloudEvents 1.0 结构化格式，每行一条：`specversion, id, source, type, time, datacontenttype, data`，加上扩展属性 `memexactor, memexinstance, memexparent`。
- **V0 的事件类型**：`memex.experiment.started`、`memex.goal.set`、`memex.observation.recorded`、`memex.action.executed`、`memex.action.denied`、`memex.action.pending`、`memex.claim.asserted`、`memex.provider.call.recorded`、`memex.experiment.finished`。
- **要点**：`id` 用 UUIDv7；Micro World 中 `time` 用模拟器时间；`memexparent` 指向前一条事件。
- **关卡**：[S] 事件 schema 测试。[C] 追加后读取顺序一致；文件最后一行损坏时，前面的事件仍然可以读取（ADR 0015）。

### I8 Event Log → Projector → Trace 和 Claim
- **交付**：Trace 的每一步：`{ step, decision, path: "fast" | "slow" | "none", providers, actions, outcome, durationMs }`；Claim Projection 按 contracts.md 第四节。
- **关卡**：[C] 性质测试（fast-check）：任意一段事件序列，重建得到的 Projection 与增量更新得到的完全一致。

### I9 Trace → Trace 哈希
- **产出方**：K8。**消费方**：K15、K16。
- **交付**：`traceHash = sha256(canonicalize(normalize(trace)))`。`normalize` 去掉或替换每次运行都会不同的字段：事件 `id`、真实时钟时间、`durationMs`。规范化 JSON 用 RFC 8785。
- **关卡**：[C] 同一个 Trace 在不同平台上得到相同的哈希（`.gitattributes` 已统一换行符）。

### I10 录制层
- **产出方**：K9。**消费方**：Provider（经由 `ctx`）、K4、内容存储。
- **交付**：`ctx.effects`：`now()`、`callModel(request)`，以后再加 Capability 的外部调用。录制模式下真实执行，写入 `memex.provider.call.recorded`（元数据加上请求、响应的 sha256），原文存入 `blobs/<sha256>`；回放模式下按顺序从录制中读取，不再调用。
- **要点**：写入内容存储之前先过滤密钥（ADR 0016）。回放时，如果请求的哈希与录制的不一致，立即失败，并指出是哪一次调用。
- **关卡**：[C] 用假的 Model Backend 录制再回放，结果一致；带密钥的请求写进内容存储之后，里面找不到这个密钥。

### I11 Lab Runner ↔ Worker
- **交付**：通过子进程的 stdin 和 stdout 逐行传 JSONL。Runner 发 `start { experimentPath, runDir, mode: "record" | "replay", snapshotPath? }`；Worker 返回 `progress { step }` 和 `result { status, snapshotPath, reportPath, traceHash }`。
- **要点**：Worker 的启动文件是装配入口：import Fake Provider 并登记到注册表（GLOSSARY：Composition Root）。Worker 退出后，它的全部状态随之销毁（ADR 0004）。
- **关卡**：[C] Worker 崩溃时，Runner 报告失败，其他 Experiment 照常运行。

### I12 Worker → Experiment 快照和报告
- **交付**：快照（JSON）的字段见 contracts.md 第四节；报告（JSON）：`{ goalCompletionRate, goalMismatchCount, steps, costs, traceHash }`。
- **关卡**：[S] 快照和报告的 schema 测试。[I] `pnpm lab replay <快照>` 得到相同的 `traceHash`。

### I13 Micro World → Evaluator（Ground Truth）
- **交付**：生成器把 Ground Truth 交给 Evaluator（K15），不经过 Environment 端口。
- **关卡**：[C] Agent 一侧的代码无法 import Ground Truth（dependency-cruiser 规则）。

---

## 三、V0 的三条通过标准（集成关卡）

| 标准 | 自动化测试 |
|---|---|
| **可复现** | 同一份配置运行两次，`traceHash` 相同；用快照回放，`traceHash` 仍然相同 |
| **不泄漏** | 按 A → B → A 的顺序运行，两次 A 的 `traceHash` 相同；B 使用污染 Provider |
| **可替换** | 只修改配置（换掉某个 Provider 的 `spec.type`），不改代码，Experiment 就能运行，并且 Trace 中记录的是新的 Provider |

---

## 四、执行顺序和 Story

分四个阶段。**B 阶段打通最薄的端到端，C、D 阶段契约先行**（ADR 0025）。

- 每个 story 完成后单独提交，提交信息附上验证结果（roadmap 第四部分）。
- 同一阶段中没有依赖关系的 story 可以并行。
- "对应"一列，是 roadmap 原来的 V0.1–V0.6。

### A 阶段：工程地基

| ID | Story | 依赖 | 验收标准 | 对应 |
|---|---|---|---|---|
| V0-01 | 建立 Monorepo 骨架 | V0-02 | 四个包加上根目录配置；`pnpm check` 一条命令跑完类型检查、lint、架构检查和测试，结果为通过 | V0.1 |
| V0-02 | 实测 tech-stack 中"尚未核实"的几项 | — | TS 7 下 dependency-cruiser 和 knip 能否工作（不能就启用 TS 6 退路）；pnpm 12 的安全设置名；Vitest 5 的变化；结论写回 tech-stack.md | V0.1 |
| V0-03 | Git hooks | V0-01 | pre-commit 运行 `biome check --staged`；commit-msg 拒绝不符合 Conventional Commits 的提交信息；pre-push 运行 `pnpm check`；在 Windows 上实测通过 | V0.1 |

### B 阶段：最薄的端到端

目标：一个房间、一步就能达成目标的 Micro World，从 `pnpm lab run` 一路跑到 `traceHash`。每个组件只做这条路径需要的最少部分。

| ID | Story | 依赖 | 验收标准 | 对应 |
|---|---|---|---|---|
| V0-04 | 最小契约子集 | V0-01 | I1、I3、I4、I5、I6、I7 的最小字段写成 Zod schema；schema 测试通过 | V0.2 |
| V0-05 | 最小 Event Log | V0-04 | 追加和读取 JSONL；读取顺序与追加顺序一致 | V0.3 |
| V0-06 | 最小 Composition Root | V0-04 | 读取单个 YAML 文件；按 `type` 从注册表实例化；未登记的 `type` 被拒绝 | V0.3 |
| V0-07 | 最小 Action Executor | V0-05 | 记录执行者为 `agent`；调用全部放行的 Policy；写入日志；执行 `env.step` | V0.3 |
| V0-08 | 一个房间的世界和按脚本行动的 Strategy | V0-04 | Environment 和 Strategy 都按种子确定；一步之后 `goalReached` 为真 | V0.4 |
| V0-09 | 最小认知循环、Trace Projector 和哈希 | V0-05、V0-07、V0-08 | 循环跑到目标达成为止；从日志生成 Trace；算出 `traceHash` | V0.3 |
| V0-10 | 最小 Lab 和第一条关卡测试 | V0-06、V0-09 | `pnpm lab run examples/smoke.experiment.yaml` 在子进程中运行；"运行两次 `traceHash` 相同"的测试通过 | V0.5、V0.6 |

**B 阶段结束时回顾一次**：接缝设计中有哪些要修改，修改本文件和 contracts.md 之后，再进入 C 阶段。

### C 阶段：契约定稿

| ID | Story | 依赖 | 验收标准 | 对应 |
|---|---|---|---|---|
| V0-11 | 契约 v0 完整版 | V0-10 | 第二节中全部接缝的 schema；Claim（溯源、双时态、确信状态、置信度）；ActionDefinition 的风险等级；Decision 的 `ask`；导出 JSON Schema，并能校验 `examples/` | V0.2 |
| V0-12 | 各端口的一致性测试 | V0-11 | Environment、Strategy、Intuition、Reasoning、Knowledge、Policy 各一套；`StepContext.services` 的形状定稿；Fake 实现全部通过 | V0.2 |

### D 阶段：组件并行实现

依赖都是 C 阶段，彼此之间互不依赖的可以并行。

| ID | Story | 依赖 | 验收标准 | 对应 |
|---|---|---|---|---|
| V0-13 | 配置加载完整版 | V0-11 | 多文档 YAML、overlay 合并、`${env:NAME}` 解析、能力检查和 `CapabilityMismatch`；I1、I2 的一致性关卡通过 | V0.3 |
| V0-14 | Event Log 完整版 | V0-11 | `memexparent` 和 `memexinstance`；最后一行损坏时能容错；性质测试通过 | V0.3 |
| V0-15 | Action Executor 完整版 | V0-11、V0-12 | 参数校验；"修改自身"不变量；`deny` 和 `ask` 两条路径以及对应的事件；I5、I6 的关卡通过 | V0.3 |
| V0-16 | 形成 Claim 的 Action 和 Claim Projection | V0-14、V0-15 | 运行时从 Observation 确定性地形成 Claim（roadmap 第三部分）；双时态和溯源都有记录；重建结果一致 | V0.3 |
| V0-17 | Fake Provider 完整版 | V0-12 | FakeIntuition、FakeReasoning、FakeKnowledge 可以设定准确率和种子；通过各自的一致性测试 | V0.4 |
| V0-18 | 污染 Provider | V0-12 | 故意写模块级全局状态；进程内运行时能检测到污染，换成独立进程运行时检测不到 | V0.4 |
| V0-19 | 目标型的最小 Micro World | V0-12 | 按种子生成多个房间和多个 Goal；Ground Truth 只交给 Evaluator；通过 Environment 一致性测试 | V0.4 |
| V0-20 | 快慢路径的 Fake Strategy | V0-17 | 先问 FakeIntuition，Certainty 低于配置的阈值时调用 FakeReasoning；Trace 中记录走的是哪条路径 | V0.4 |
| V0-21 | 录制层和内容存储 | V0-14 | 用假的 Model Backend 录制和回放；回放时请求哈希不一致就立即失败；密钥过滤的测试通过（ADR 0016、0024） | V0.3 |
| V0-22 | 运维日志 | V0-11 | 输出 OpenTelemetry 日志数据模型的 JSONL；默认不记录提示词和模型输出的内容 | V0.3 |
| V0-23 | 快照、报告、最小 Evaluator 和 `pnpm lab replay` | V0-19、V0-21 | 快照和报告的 schema 测试通过；报告中有目标完成率和 `goalMismatchCount`；用快照回放，`traceHash` 不变 | V0.5 |

### E 阶段：集成关卡和合并

| ID | Story | 依赖 | 验收标准 | 对应 |
|---|---|---|---|---|
| V0-24 | "可复现"关卡 | D 阶段全部 | 第三节的测试通过（运行两次，加上回放） | V0.6 |
| V0-25 | "不泄漏"关卡 | V0-18、V0-24 | A → B → A 的测试通过 | V0.6 |
| V0-26 | "可替换"关卡 | V0-24 | 只改配置就换掉 Provider 的测试通过 | V0.6 |
| V0-27 | 合并和收尾 | V0-24–26 | 合并进 `main`；回写实现中对 contracts.md 的修改；提醒用户开启 CodeQL 的默认设置（tech-stack.md）；更新 HANDOFF | V0.6 |

---

## 五、风险和尚未确定的事

| # | 内容 | 什么时候处理 |
|---|---|---|
| R1 | TS 7 与 dependency-cruiser、knip 的兼容性 | V0-02，有退路 |
| R2 | `StepContext.services` 的形状 | B 阶段先用最小形式，V0-12 定稿 |
| R3 | 交给 Intuition 的精简状态怎样序列化 | V0-17（Fake）先定接口，V1 接入真实模型时再确认 |
| R4 | 一致性测试放在哪里、怎样不依赖测试框架 | V0-12。倾向：在 `@memex/contracts` 中导出一组不依赖测试框架的检查函数，由各包的测试调用 |
| R5 | 是否把 story 同步到 GitHub Issue | 已决定并完成（2026-10-13），见第六节 |

---

## 六、交付跟踪（GitHub，2026-10-13）

Milestone：**V0 骨架**。按 plan-delivery 的标准，每个 story 是一个 issue，父子关系用 sub-issue，硬依赖用 issue 的 blocked-by 关系；每个 epic 的表格、顺序和依赖图以 GitHub 上的 epic 为准。

| Epic | 主题词 | Story（按建议顺序） |
|---|---|---|
| #38 | 地基 | V0-02 #42 → V0-01 #43 → V0-03 #44 |
| #39 | 端到端 | V0-04 #45 → V0-05 #46 → V0-06 #47 → V0-07 #48 → V0-08 #49 → V0-09 #50 → V0-10 #51 |
| #40 | 契约 | V0-11 #52 → V0-12 #53 → V0-13 #54 → V0-14 #55 → V0-15 #56 → V0-16 #57 → V0-17 #58 → V0-20 #59 → V0-19 #60 → V0-18 #61 → V0-21 #62 → V0-22 #63 → V0-23 #64 |
| #41 | 关卡 | V0-24 #65 → V0-25 #66 → V0-26 #67 → V0-27 #68 |

epic 之间依次是硬依赖：#38 → #39 → #40 → #41。第四节中的建议顺序以此为准：V0-02 排在 V0-01 之前，V0-20 排在 V0-19 之前（Fake Strategy 先于世界的完整版，二者互不依赖）。
