# 全局计划

本文件是 Memex 唯一的执行计划。它汇总了全局约束、各阶段的里程碑，以及当前里程碑的任务分解。每个里程碑都有可以观察的进入条件和退出条件。约束的出处见各个 ADR；术语见 GLOSSARY.md。

状态说明：
- **已确认**：M0–M2 及 MVP 的约定（2026-10-10 已确认）。
- **草案**：M3 及之后的阶段（2026-10-11 起草，等待确认）。

---

## 一、全局约束

所有阶段、所有分支都必须遵守下面的约束。如果要违反其中任何一条，必须先写一份 ADR。

### 范围
| # | 约束 | 出处 |
|---|---|---|
| S1 | 这是个人研究和学习项目，不以追上云端大模型为目标；同一组对比中，所有方案使用同一个模型 | ADR 0001 |
| S2 | 不训练模型：不做微调、不用 LoRA、不更新任何权重；只允许调整配置参数，例如 Calibration | VISION 原则 3 |
| S3 | 自我进化不等于自我修改：Memex 可以提出改进，是否采纳由用户决定，并要经过实验验证 | ADR 0011 |
| S4 | 要能分发给他人使用：随 Memex 一起分发的组件必须允许再分发；第三方模型不打包进 Memex | ADR 0013 |

### 架构
| # | 约束 | 出处 |
|---|---|---|
| A1 | 唯一稳定的边界是 Cognitive Contract；其余组件都可以替换 | ADR 0008 |
| A2 | 依赖倒置：核心代码只依赖契约；只有 Composition Root 知道具体实现，而且只能实例化注册表里登记过的类型 | ADR 0008 |
| A3 | 每个依赖都要登记为硬依赖、可配依赖或可选依赖之一；能做成配置的，就不写死 | docs/dependencies.md |
| A4 | Provider 要声明自己具备哪些能力，启动时检查；不匹配就立即报错 | docs/dependencies.md |
| A5 | 知识以 Claim 的形式存储，并且从第一天起就记录溯源和双时态（Valid Time / Recorded Time） | ADR 0002 |
| A6 | Event Log 是唯一的事实来源（Event Sourcing），其余都是可以重建的 Projection | ADR 0005 |
| A7 | 所有改动都通过 Action 完成，记录执行者，并经过 Policy 检查 | ADR 0014 |
| A8 | 所有配置使用同一种资源格式（apiVersion / kind / metadata / spec） | ADR 0009 |
| A9 | 数据使用标准词汇（JSON-LD、PROV-O、OWL-Time、CloudEvents、OpenTelemetry、JSON Schema） | ADR 0007 |
| A10 | 对外扩展优先使用现成的标准（MCP、Agent Skills、A2A） | ADR 0006 |

### 工程
| # | 约束 | 出处 |
|---|---|---|
| E1 | 使用 TypeScript / Node.js；运行时核心不依赖原生扩展，必须能跨平台运行 | ADR 0013 |
| E2 | 每个 Experiment 运行在一个独立的进程里 | ADR 0004 |
| E3 | 复现依靠录制和回放，不依赖随机种子 | ADR 0005 |
| E4 | 流式记录使用 JSONL；运维日志遵循 OpenTelemetry 的日志数据模型 | ADR 0015 |
| E5 | 默认安全：只监听 localhost；对外开放时必须认证；真实能力只在沙箱中运行；遥测需要用户主动开启 | ADR 0013 |

### 过程
| # | 约束 | 出处 |
|---|---|---|
| P1 | 实验阶段：每个模块一个分支；分支通过事先写好的可观察标准后，才合并进 `main` | ADR 0012 |
| P2 | 正式阶段从 Q1–Q3 都有答案、并且契约冻结为 v1 时开始；从那时起所有改动走 PR 和 CI | ADR 0012 |
| P3 | 实验矩阵保持最小，按收敛规则推进，不随意增加对照组 | ADR 0010 |
| P4 | 认知组件和本体的改动由实验结果驱动；工程基础设施按工程需求决定 | VISION 原则 8 |
| P5 | 在最后负责任的时刻再做决定；默认值不等于承诺 | docs/dependencies.md |

---

## 二、阶段总览

```
 MVP（已确认）                               后 MVP（草案）
 M0 骨架 → M1 基线 → M2 双系统  ═[正式阶段关卡]═▶  M3 World 0 → M4 学习闭环 → M5 对外扩展 → M6 分发
```

| 里程碑 | 目标 | 进入条件 | 退出条件（可观察） | 状态 |
|---|---|---|---|---|
| **M0 骨架** | 契约、运行时、Fake Provider、Lab，以及最简单的 Micro World | 无 | 满足下文列出的 M0 三条通过标准 | 已确认 |
| **M1 基线** | 用真实模型跑通 B0 和 B1 | M0 已合并 | B0 和 B1 在 Micro World 上跑完一组任务，产出可复现的报告；同时有 Compose、`memex up`、`memex doctor`、`memex models pull` | 已确认 |
| **M2 双系统** | 实现 B3 和 B3-noI，并完成真实的 World Generator | M1 已合并 | Q1–Q3 都能被测量，并给出答案（不论答案好坏）；用 10 万条 Claim 完成 Oxigraph 的压测 | 已确认 |
| **正式阶段关卡** | 从实验阶段转入正式阶段 | M2 已完成 | Cognitive Contract 冻结为 v1；建立 PR 和 CI 流程 | 已确认（ADR 0012） |
| **M3 World 0** | Memex 开始认识自己：接入开发知识，包括 ADR、文档和 git 历史 | 正式阶段关卡已通过 | 定义 Domain Pack 格式 v0；T0（从资料中抽取 Claim 的准确率）和 T4（真实的信念修正）可以测量；能自动回答"截至某次提交，X 是什么"这类问题 | 草案 |
| **M4 学习闭环** | 让学习真正发生 | M3 已完成 | 实现 Consolidation 和 Decay；Pattern 学习有效，B3 在长序列任务上出现学习曲线；接入运行数据，作为 World 0 的第二个数据来源；Agent 能提出本体扩展，并经过 Action 和 Policy 的审批流程 | 草案 |
| **M5 对外扩展** | 连接外部世界 | M4 已完成 | MCP 能力在沙箱中运行；可以导入和导出 Agent Skills；提供 HTTP/SSE 接口和一个最小的 Web 界面 | 草案 |
| **M6 分发** | 让别人也能用起来 | M5 已完成（可与 M5 并行） | 发布多架构镜像；`memex upgrade`、`backup` 和回滚可用；检测硬件并选择配置档位；Mac、Linux、Windows 三个平台都能一键启动 | 草案 |

**尚未排期的设想**：跨领域迁移、jj 式的 Worldview 分支、一个与 Memex 无关的第二领域、A2A、多用户 Policy、后台整合的资源预算、热点代码改用 Rust。这些等前面的里程碑给出证据之后再排期。

---

## 三、MVP 阶段的约定（已确认）

### M0 通过标准
1. **可复现**：同一份配置运行两次，规范化之后的 Trace 哈希必须一致。
2. **不泄漏**：按 A → B → A 的顺序运行时，两次 A 的结果必须一致；一个故意写全局状态的"污染 Provider"，不能影响其他 Experiment。
3. **可替换**：只修改配置就能替换 Provider，不需要改代码。

### 实验约定
- 上下文预算统一按"实际送入推理模型的 token 数"计算。
- B1 和 B3 获得的信息内容相同，只是组织方式不同：B1 的文本块里也写明来源和观测时间。
- MVP 阶段，从 Observation 形成 Claim 由运行时以确定性方式完成。
- 统计判定规则在 World Generator 完成之后、评测候选版本之前确定。
- 在 MVP 阶段，T5 只用来证明测试框架能跑通。

---

## 四、M0 任务分解（当前里程碑）

工作分支从 `main` 开出。每完成一项就提交一次，并附上验证结果。

| # | 任务 | 产出 | 验证方式 |
|---|---|---|---|
| M0.1 | Monorepo 骨架 | npm workspaces、TypeScript、测试框架、lint；建立四个包 `@memex/contracts`、`runtime`、`fakes`、`lab` | 一条命令就能跑完所有包的构建和测试，结果为通过 |
| M0.2 | 契约包 | 资源格式（apiVersion / kind / metadata / spec）的 schema，并能导出为 JSON Schema；核心类型 Observation、Claim（含溯源、双时态、确信状态、置信度）、Action、Event（CloudEvents 字段，加上执行者、Instance 标识、前一条事件的标识）；各 Provider 接口（Environment、Intuition、Reasoning、Knowledge、Policy、Cognitive Strategy），以及能力声明 | schema 的单元测试；生成的 JSON Schema 能校验示例配置 |
| M0.3 | 运行时 | JSONL Event Log，支持追加和重放；Composition Root，负责注册表、配置加载、overlay 合并和能力检查；认知循环，执行 Strategy，并让每个 Action 都经过 Policy 并写入日志；从日志生成 Trace Projection；输出 JSONL 运维日志 | 单元测试；把日志重放后，得到的 Projection 必须与原来完全一致 |
| M0.4 | Fake Provider | 可以设定准确率的 FakeIntuition、FakeReasoning、FakeKnowledge、全部放行的 Policy、按种子确定性生成的最小 Micro World，以及一个"污染 Provider" | 同一个种子必须产生同样的结果 |
| M0.5 | Lab | 每个 Experiment 启动一个独立进程来运行；录制和回放；输出 JSON 格式的 Experiment 快照和报告；提供命令 `memex lab run <experiment.yaml>` | 用一份示例 Experiment 端到端跑通 |
| M0.6 | 关卡 | 把 M0 的三条通过标准写成自动化测试 | 三条标准全部通过之后，合并进 `main` |

M0 开工时需要确定的默认值：Node.js 使用开工时的 Active LTS 版本；测试框架和 lint 工具按当时的主流选择。这些都是可以随时更换的工程选择。
