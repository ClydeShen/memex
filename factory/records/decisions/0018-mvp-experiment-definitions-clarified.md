---
status: accepted
---

# 澄清 MVP 的实验口径：Q3 的任务、学习信号、成本指标、对照与备选

2026-10-11 对全部文档做了一次一致性审阅，发现 MVP 的几项实验定义互相矛盾或含义不清。本 ADR 统一澄清，修订 ADR 0001、0003、0010 中的相应表述，其余内容不变。

## 决定

### 一、Q3 用新的任务类别 T6，并在 M2 实现最小的 Pattern

此前的矛盾：GLOSSARY 中 T5 是"经验迁移"，ADR 0010 却用 T5 来测 Q3（学习曲线），同时又把跨领域迁移推迟；roadmap 写"MVP 阶段 T5 只用来证明测试框架能跑通"，而 M2 的退出条件要求 Q1–Q3 都给出答案；减少推理调用的关键机制 Pattern 学习排在 M4。

1. **新增 Task Class T6：长序列学习。** 同一个 Task Family 的任务按顺序依次给出，测量随着 Experience 增加，推理调用、token 和准确率的变化。**Q3 用 T6 测。** T5 只表示经验迁移，MVP 阶段不测。
2. **Pattern 定义为可以直接执行的计划模板**，而不是交给 Reasoning 参考的文字建议。Pattern 包括：按 Ontology 类型描述的适用条件、带参数的 Action 序列，以及证据记录（成功和失败计数、来自哪些 Experience）。使用时，由 Intuition 判断是否适用，经 Verification 检查后直接执行，不调用 Reasoning。依据见 factory/records/research/core-algorithms-2026-10-11.md 第 4 节（压缩成文字的经验经常被忽略；目前唯一直接证明能减少调用的是计划缓存）。
3. **M2 实现最小的 Pattern 形成与使用**，使 Q3 在 MVP 内有可测的机制；M4 再实现完整的 Consolidation 和 Decay 生命周期。

### 二、学习信号只来自 Environment 和 Verification，Oracle 只用于评分

此前的矛盾：ADR 0003 规定 Agent 永远不能访问 Oracle；调研建议"只有经 Oracle 确认的成功才能形成 Pattern"，这样做等于让 Agent 用标准答案学习，而 World 0 并没有标准答案。

- Pattern 的形成和降级、Claim 的修正，只能依据 **Environment 返回的 Observation**（例如"目标已达成"）和 **确定性的 Verification**。
- **Oracle 只给 Evaluator 用来打分**，它的结果不能以任何形式回流给 Agent。（**ADR 0023 澄清**："任何形式"包括 Calibration 的阈值等产品运行时需要的配置；Oracle 只能用于打分和诊断。）

### 三、"同一个模型"指同一个 Reasoning 模型

ADR 0001 和约束 S1 中"同一组对比中，所有方案使用同一个模型"，明确为**使用同一个 Reasoning 模型**。B3 在此基础上额外使用 Intuition 模型，这正是 Q1 要比较的差别。

### 四、成本指标分开记录

"推理调用"和"上下文预算"分别记录以下指标，不合并成一个数：

| 指标 | 说明 |
|---|---|
| Reasoning 调用次数 | Q1、Q3 的主要指标 |
| Reasoning 输入 token | 即"实际送入推理模型的 token 数"，也是 Cognitive Budget 的计量口径 |
| Reasoning 输出 token | 包括思考部分 |
| Intuition token | 输入和输出分开记录 |
| 延迟 | 用真实时钟（ADR 0005） |

**Reasoning 是否开启思考模式**是 Experiment 的配置项，写入 Experiment 快照。同一组对比中的所有方案使用相同的设置。

### 五、"对照"和"备选"是两回事

- **对照**：和主选在同一组实验中**同时运行**、用来比较的变体，例如 Intuition 的启发式规则、Baseline B3-noI。
- **备选**：主选未通过收敛规则时**才换上**的组件，不与主选同时运行，例如 Qwen3.6-35B-A3B（ADR 0017）。
- **Reasoning 的切换规则**：出现以下任一情况时，换用备选：
  - 天花板效应：B0 在 MVP 任务上的准确率已经接近满分，Worldview 带来的改进测不出来；
  - 实验太慢：单轮 Lab 的耗时超过配置的上限。

  两个阈值都作为配置项，在 M1 根据实测确定（P5）。

### 六、Intuition 的题型只有选择题

契约 v0 中的 `choice`、`noul`、`score` 三种题型，来源已无法核实；Tev1 官方模型卡给出的输入格式只有选择题（`state`、`question`，以及 2 到 24 个带字母编号的 `options`，模型只返回一个字母）。因此：

- Question 只有一种：**选择题**。
- 是非题是只有两个选项的选择题。
- 打分题是选项有顺序的选择题，Judgement 的数值取各选项概率的加权期望。

## Consequences

- GLOSSARY 新增 T6、对照、备选、Lab、Projector、Fake Provider、Experiment 快照等术语。
- roadmap 删除"MVP 阶段 T5 只用来证明测试框架能跑通"，补充成本指标，并调整 M2 和 M4 的目标。
- contracts.md 中 Intuition 端口的题型改为只有选择题。
- ADR 0001、0003、0010 加注"已由 ADR 0018 澄清"。
- open-questions 第 4 条（Pattern 的形式）由本 ADR 决定，从待决问题中删除。
