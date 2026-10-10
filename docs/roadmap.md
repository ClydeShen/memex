# MVP 路线图

MVP 的目标：建立一个受控的实验环境，用来客观、可复现地比较不同的认知架构，并借助这些对比把系统搭建成一个可用的系统（ADR 0010、VISION 原则 9）。

## 里程碑

| 里程碑 | 内容 | 合并进 `main` 的条件 |
|---|---|---|
| **M0** | 搭建骨架：契约、运行时、Fake Provider、Lab，以及最简单的 Micro World | 满足下面列出的 M0 通过标准 |
| **M1** | 接入 B0 和 B1 的真实基线：Model Backend、Reasoning、Embedding、Retrieval、Micro World Capability、CLI | B0 和 B1 能在 Micro World 上跑完一组任务，并产出可复现的报告 |
| **M2** | 接入 B3 和 B3-noI：Intuition（Tev1）、Knowledge 存储（Oxigraph）、Attention、快慢双策略、真实的世界生成器 | 能回答 ADR 0010 的 Q1–Q3（结论好坏不论，关键是可以测量） |

在 MVP 阶段，T5 只用来证明测试框架能跑通。M2 之后才开始积累有意义的学习曲线。

## M0 通过标准

1. **可复现**：同一份配置跑两次，规范化后的 Trace 哈希必须一致。
2. **不泄漏**：按 A → B → A 的顺序运行时，两次 A 的结果必须一致；故意写入全局状态的"污染 Provider"不能影响其他 Experiment。
3. **可替换**：只修改配置就能替换 Provider，不需要改代码。

## M0 的包结构

`@memex/contracts`、`@memex/runtime`、`@memex/fakes`、`@memex/lab`，共四个包。其他包等真正需要时再拆。

## 已确认的实验约定

- **上下文预算**：统一按"实际送入推理模型的 token 数"计算。
- **B1 和 B3 信息对等**：两者获得的信息内容相同，只是组织方式不同。B1 的文本块里同样写明来源和观测时间。
- **从 Observation 形成 Claim**：MVP 阶段由运行时以确定性方式完成，以后再拆成可替换的 Provider。
- **统计判定规则**：等世界生成器做出来之后再确定，并且必须在评测候选版本之前定好，不能看到结果后再定。
