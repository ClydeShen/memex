# 全局计划

本文件是 Memex 唯一的执行计划。架构图见 [architecture/c4.md](./architecture/c4.md)，模块间的集成契约见 [architecture/contracts.md](./architecture/contracts.md)。它汇总了全局约束、各阶段的里程碑，以及当前里程碑的任务分解。每个里程碑都有可以观察的进入条件和退出条件。约束的出处见各个 ADR；术语见 GLOSSARY.md。

路线分为**验证**和**产品**两个阶段（ADR 0020）：先用实验确定方向和核心能力，验证完成后再做真正的产品。实验工具（Lab）不是产品。

状态说明：
- **已确认**：验证阶段 V0–V2 和决策关卡（V0–V2 的内容 2026-10-10 确认，阶段划分 2026-10-11 确认）。
- **草案**：产品阶段 P1–P5，在决策关卡确定。

---

## 一、全局约束

所有阶段、所有分支都必须遵守下面的约束。如果要违反其中任何一条，必须先写一份 ADR。

### 范围
| # | 约束 | 出处 |
|---|---|---|
| S1 | 这是个人研究和学习项目，不以追上云端大模型为目标；同一组对比中，所有方案使用同一个 Reasoning 模型 | ADR 0001、0018 |
| S2 | 不训练模型：不做微调、不用 LoRA、不更新任何权重；只允许调整配置参数，例如 Calibration | VISION 原则 3 |
| S3 | 自我进化不等于自我修改：Memex 可以提出改进，是否采纳由用户决定，并要经过验证 | ADR 0011 |
| S4 | 要能分发给他人使用：随 Memex 一起分发的组件必须允许再分发；第三方模型不打包进 Memex | ADR 0013 |

### 架构
| # | 约束 | 出处 |
|---|---|---|
| A1 | 唯一稳定的边界是 Cognitive Contract；其余组件都可以替换 | ADR 0008 |
| A2 | 依赖倒置：核心代码只依赖契约；只有装配入口知道具体实现，而且只能实例化注册表里登记过的类型 | ADR 0008、0018 |
| A3 | 每个依赖都要登记为硬依赖、可配依赖或可选依赖之一；能做成配置的，就不写死 | docs/dependencies.md |
| A4 | Provider 要声明自己具备哪些能力，启动时检查；不匹配就立即报错 | docs/dependencies.md |
| A5 | 知识以 Claim 的形式存储，并且从第一天起就记录溯源和双时态（Valid Time / Recorded Time） | ADR 0002 |
| A6 | Event Log 是唯一的事实来源（Event Sourcing），其余都是可以重建的 Projection | ADR 0005 |
| A7 | 所有改动都通过 Action 完成，记录执行者，并经过 Policy 检查 | ADR 0014 |
| A8 | 所有配置使用同一种资源格式（apiVersion / kind / metadata / spec） | ADR 0009 |
| A9 | 数据使用标准词汇（JSON-LD、PROV-O、OWL-Time、CloudEvents、OpenTelemetry、JSON Schema） | ADR 0007 |
| A10 | 对外扩展优先使用现成的标准（MCP、Agent Skills、A2A） | ADR 0006 |
| A11 | 模型输出一律使用约束解码；Certainty 在选项字母范围内重新归一化 | ADR 0019 |
| A12 | 实验工具（Lab）不属于产品，不随产品发布；被验证的是产品组件本身 | ADR 0020 |
| A13 | 验证任务一律是目标型任务；目标完成率是所有对比的共同主指标 | ADR 0021 |
| A14 | 每种 Action 带风险等级，Policy 的结果为 allow / deny / ask；执行者由核心记录，不由请求填写；"修改自身须用户批准"是核心不变量，不随 Policy 档位变化 | ADR 0022 |
| A15 | Oracle 只用于评分和诊断；产品运行时需要的配置（含 Calibration 阈值）只能来自产品中也能拿到的信号 | ADR 0023 |

### 工程
| # | 约束 | 出处 |
|---|---|---|
| E1 | 使用 TypeScript / Node.js；运行时核心不依赖原生扩展，必须能跨平台运行 | ADR 0013 |
| E2 | 验证阶段，每个 Experiment 运行在一个独立的进程里 | ADR 0004、0020 |
| E3 | 复现依靠录制和回放，不依赖随机种子 | ADR 0005 |
| E4 | 流式记录使用 JSONL；运维日志遵循 OpenTelemetry 的日志数据模型 | ADR 0015 |
| E5 | 默认安全：只监听 localhost；对外开放时必须认证；真实能力只在沙箱中运行；遥测需要用户主动开启 | ADR 0013 |

### 过程
| # | 约束 | 出处 |
|---|---|---|
| P1 | 验证阶段：每个实验或模块一个分支（V0 整体算一个实验）；分支通过事先写好的可观察标准后，才合并进 `main` | ADR 0012 |
| P2 | 产品阶段从决策关卡开始：Q1–Q3 都有答案、契约冻结为 v1；从那时起所有改动走 PR 和 CI | ADR 0012、0020 |
| P3 | 实验矩阵保持最小，按收敛规则推进，不随意增加对照组 | ADR 0010 |
| P4 | 认知组件和本体的改动由实验结果驱动；工程基础设施按工程需求决定 | VISION 原则 8 |
| P5 | 在最后负责任的时刻再做决定；默认值不等于承诺 | docs/dependencies.md |
| P6 | 每个里程碑先写集成设计（组件、接缝、关卡、story），先打通最薄的端到端，再契约先行、并行实现各组件 | ADR 0025 |

---

## 二、阶段总览

```
 验证阶段（已确认）                                产品阶段（草案）
 V0 骨架 → V1 基线 → V2 双系统  ═[决策关卡]═▶  P1 第一个可用版本 → P2 学习闭环 → P3 对外扩展 → P4 分发
                                                                       ↘ P5 跨领域迁移（P2 之后，可与 P3、P4 并行）
```

| 里程碑 | 目标 | 进入条件 | 退出条件（可观察） | 状态 |
|---|---|---|---|---|
| **V0 骨架** | 产品核心（契约、Event Log、Action、Composition Root、Projector、录制与回放）加上验证工具（Lab、Fake Provider、最简单的 Micro World） | 无 | 满足下文列出的 V0 三条通过标准 | 已确认 |
| **V1 基线** | 用真实模型跑通 B0 和 B1 | V0 已合并 | B0 和 B1 在 Micro World 上跑完一组任务，产出可复现的报告；用 B-sym 和 B0 检查题目难度，排除天花板效应（ADR 0017） | 已确认 |
| **V2 双系统** | 实现 B3 和 B3-noI、最小的 Pattern 形成与使用（ADR 0018），并完成真实的 World Generator | V1 已合并 | Q1–Q3 都能被测量，并给出答案（不论答案好坏）；用 10 万条 Claim 完成 Oxigraph 的压测 | 已确认 |
| **决策关卡** | 从验证转入产品 | V2 已完成 | 一份 ADR：哪些假设成立、产品包含哪些核心能力、P1 的范围和产品命令；Cognitive Contract 冻结为 v1；建立 PR 和 CI | 已确认（ADR 0012、0020） |
| **P1 第一个可用版本** | 一个真正可以使用的 Memex | 决策关卡已通过 | 范围在决策关卡确定。候选：在 World 0 领域（Memex 自己的 ADR、文档和 git 历史）上对话；查看和追问 Worldview；一组产品命令（以"目标"为中心：下达目标、查看进度、审批）；长时间运行的目标可以在后台执行、中断后接着做、随时查看进度（依靠 Event Log 和回放恢复状态）；行动的自主程度（open-questions.md 第 4 条）；Domain Pack 格式 v0；能回答"截至某次提交，X 是什么"；T0 和 T4 在真实资料上可以测量 | 草案 |
| **P2 学习闭环** | 让学习在真实使用中发生 | P1 已完成 | 候选：完整的 Consolidation 和 Decay 生命周期；Pattern 学习在更长的序列和更多 Task Family 上有效；接入运行数据作为 World 0 的第二个数据来源；Agent 提出本体扩展，经 Action 和 Policy 审批 | 草案 |
| **P3 对外扩展** | 连接外部世界 | P2 已完成 | 候选：MCP 能力在沙箱中运行；导入和导出 Agent Skills；HTTP/SSE 接口和最小的 Web 界面 | 草案 |
| **P4 分发** | 让别人也能用起来 | P3 已完成（可以与 P3 并行） | 候选：多架构镜像；安装、升级、备份和回滚；检测硬件并选择配置档位；下载和校验模型；Mac、Linux、Windows 一键启动 | 草案 |
| **P5 跨领域迁移** | 把精通领域的经验转换成其他领域的参考（产品定义的一部分，VISION"跨领域迁移"） | P2 已完成，并接入第二个领域（与 Memex 无关的领域） | 候选：在结构相同、名字不同的领域对上，测量迁移带来的收益（推理和观察次数是否减少）和负迁移率；借来的内容以"待验证的 Hypothesis"进入新领域并记录来源 | 草案 |

**尚未排期的设想**：jj 式的 Worldview 分支、A2A、多用户 Policy、后台整合的资源预算、热点代码改用 Rust。这些等前面的里程碑给出证据之后再排期。

---

## 三、验证阶段的约定（已确认）

### V0 通过标准
1. **可复现**：同一份配置运行两次，规范化之后的 Trace 哈希必须一致。
2. **不泄漏**：按 A → B → A 的顺序运行时，两次 A 的结果必须一致；一个故意写全局状态的"污染 Provider"，不能影响其他 Experiment。
3. **可替换**：只修改配置就能替换 Provider，不需要改代码。

### 实验约定
- 上下文预算统一按"实际送入推理模型的 token 数"计算。成本指标分开记录：Reasoning 调用次数、Reasoning 输入 token、Reasoning 输出 token（含思考）、Intuition token、延迟。Reasoning 是否开启思考模式是 Experiment 的配置项，同一组对比使用相同设置（ADR 0018）。
- 学习信号只来自 Environment 和 Verification；Oracle 只用于 Evaluator 打分和诊断，Calibration 等产品运行时需要的配置也不能用它（ADR 0018、0023）。
- Calibration 用影子升级定阈值：有把握时按配置的比例照样调用 Reasoning，比较是否一致；影子升级产生的 Reasoning 调用和 token 单独记录，并计入 B3 的成本（ADR 0023）。
- B1 和 B3 获得的信息内容相同，只是组织方式不同：B1 的文本块里也写明来源和观测时间。
- 验证阶段，从 Observation 形成 Claim 由运行时以确定性方式完成。
- 统计判定规则在 World Generator 完成之后、评测候选版本之前确定。
- Q1 用 T2，Q2 用 T4，Q3 用 T6（长序列学习）。T5（经验迁移）在验证阶段不测（ADR 0018）。
- T2、T4、T6 都设计成目标型任务：给 Agent 一个 Goal，由 Environment 判断是否达成。**目标完成率**是所有对比的共同主指标，Q1–Q3 中的"准确率"一律指它；成本按"每个达成的目标所用的推理调用和 token"计算（ADR 0021）。

### 命令（ADR 0020）
- **工程命令**：`pnpm check`（类型检查、lint、架构检查、测试）、`pnpm test` 等，写在根目录 `package.json`。
- **验证命令**：`pnpm lab run <experiment.yaml>`、`pnpm lab replay <快照>`，以后按需要再加 `report`、`compare`。不进入产品。
- **产品命令**：`memex ...`，在决策关卡之后设计。

---

## 四、V0 任务分解（当前里程碑）

**可执行的 story 级分解见 [plans/v0-integration.md](./plans/v0-integration.md)**（ADR 0025）：组件清单、接缝和关卡，以及 A–E 五个阶段的 27 个 story。下表是里程碑级的概览，story 表中的"对应"一列指向这里的编号。

工作分支从 `main` 开出（例如 `exp/v0-skeleton`）。V0 整体是一个实验，用一个分支，符合 ADR 0012 的"每个实验或模块一个分支"。每完成一项就提交一次，并附上验证结果。

"类别"一列：**产品核心**按产品标准认真做，验证后直接进入产品；**验证专用**够用即可，验证后可以丢掉（ADR 0020）。

| # | 任务 | 类别 | 产出 | 验证方式 |
|---|---|---|---|---|
| V0.1 | Monorepo 骨架 | 工程 | pnpm workspaces、TypeScript、测试框架、lint、架构检查；建立四个包 `@memex/contracts`、`runtime`、`fakes`、`lab` | `pnpm check` 一条命令跑完所有包的类型检查、lint、架构检查和测试，结果为通过（没有构建步骤，见 tech-stack.md） |
| V0.2 | 契约包（按 architecture/contracts.md 实现） | 产品核心 | 资源格式（apiVersion / kind / metadata / spec）的 schema，并能导出为 JSON Schema；核心类型 Observation、Claim（含溯源、双时态、确信状态、置信度）、Action、Event（CloudEvents 字段，加上执行者、Instance 标识、前一条事件的标识）；各 Provider 接口（Environment、Intuition、Reasoning、Knowledge、Policy、Cognitive Strategy），以及能力声明 | schema 的单元测试；生成的 JSON Schema 能校验示例配置 |
| V0.3 | 运行时 | 产品核心 | JSONL Event Log，支持追加和重放；Composition Root，负责注册表、配置加载、overlay 合并和能力检查；认知循环，执行 Strategy，并让每个 Action 都经过 Policy 并写入日志；从日志生成 Trace Projection；输出 JSONL 运维日志；录制与回放（在不确定性进入系统的边缘录制，大内容按哈希存在外面，ADR 0024；V0 用假的 Model Backend 测试；产品中用于审计和排错） | 单元测试；把日志重放后，得到的 Projection 必须与原来完全一致 |
| V0.4 | Fake Provider | 验证专用 | 可以设定准确率的 FakeIntuition、FakeReasoning、FakeKnowledge、全部放行的 Policy、按种子确定性生成的最小 Micro World，以及一个"污染 Provider" | 同一个种子必须产生同样的结果 |
| V0.5 | Lab | 验证专用 | 每个 Experiment 启动一个独立进程来运行；输出 JSON 格式的 Experiment 快照和报告；`pnpm lab run <experiment.yaml>` 和 `pnpm lab replay <快照>` | 用一份示例 Experiment 端到端跑通 |
| V0.6 | 关卡 | 验证专用 | 把 V0 的三条通过标准写成自动化测试 | 三条标准全部通过之后，合并进 `main` |

V0 开工时需要确定的默认值：Node.js 使用 `.nvmrc` 固定的版本（Node 26，2026-10-28 进入 Active LTS）；测试框架和 lint 工具按当时的主流选择。这些都是可以随时更换的工程选择，已确定的推荐见 [tech-stack.md](./tech-stack.md)（Node 26、TypeScript 7、pnpm 12、Biome、Vitest、dependency-cruiser、knip）。
