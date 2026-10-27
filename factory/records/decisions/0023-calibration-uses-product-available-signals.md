---
status: accepted
---

# Oracle 只用于评分和诊断；产品运行时需要的配置只能来自产品中也能拿到的信号

2026-10-11 的一致性审阅发现一处冲突：ADR 0019 要求 Intuition 的 Certainty 按 factory/records/research/core-algorithms-2026-10-11.md 第 1 节做 Calibration，其中走 Fast Path 的阈值要在"带 Oracle 标签"的校准集上选定；而 ADR 0018 规定 Oracle 的结果"不能以任何形式回流给 Agent"。

真正的问题是结论能否迁移到产品。用标准答案定阈值，相当于对着答案卷调整及格线：验证阶段得到的 Q1 结论，会建立在产品里做不到的步骤上，因为 World 0 没有 Oracle。ADR 0020 规定"被验证的是产品组件本身"，Calibration 的做法也是产品组件的一部分（用户确认，2026-10-13）。

## 决定

1. **界线**：Oracle 只能用于 Evaluator 打分和诊断。凡是产品运行时需要的东西，包括 Worldview、Pattern，以及 Calibration 的阈值、温度系数、先验向量等配置，都只能来自产品中也能拿到的信号。这就是 ADR 0018 中"不能以任何形式回流"的具体含义。
2. **Calibration 的标签来源**：
   - **影子升级（Shadow Escalation）为主**：Intuition 有把握、本可以走 Fast Path 时，按配置的比例照样调用 Reasoning，比较两边的结论是否一致，用一致率来定阈值。参照 C3PO 和 Online Cascade Learning：以"是否与更强的模型一致"代替"是否答对"，不需要标签。
   - **Environment 和 Verification 的结果为辅**：目标是否达成、动作是否合法（ADR 0018 允许的学习信号）。
3. **影子升级的成本照实计入。** 影子升级产生的 Reasoning 调用和 token 单独记录，并计入 B3 的成本指标（ADR 0018），不能藏起来。抽样比例是 Calibration 配置项。
4. **Oracle 校准只作为诊断上限。** Evaluator 可以另外用 Oracle 标签算一个"理想校准"，在报告中和实际做法并列，说明"如果有标准答案，还能好多少"。它的结果不进入 Agent 的任何配置。

## Considered Options

- **保持 Oracle 标签校准，只注明"校准集与评测集分开"**：符合机器学习中留出验证集的惯例，但产品中拿不到这些标签，Q1 的结论无法迁移。被否决。
- **只用 Environment 返回的目标达成结果**：信号滞后，而且一个目标包含很多步，难以分清是哪一步判断错了。只作为辅助信号。

## Consequences

- **局限**：一致率衡量的是"和 Reasoning 一致"，不是"答对"；Reasoning 本身错了时，Fast Path 跟着错也会被算作没有问题。这正好就是 Q1 要问的事："用 Intuition 代替 Reasoning，结果会不会变差"，比较对象本来就是 B3-noI。core-algorithms 第 1 节的 Learn-then-Test 形式化保证，因此是对"与 Reasoning 一致"而言，不是对"答对"而言。
- 修订 ADR 0019 第二节第 5 条和 core-algorithms 第 1.3 节中"在带 Oracle 标签的校准集上定阈值"的做法。
- GLOSSARY 新增"影子升级"；roadmap 新增约束 A15，实验约定补充影子升级的成本口径。
- core-algorithms 第 3.2 节中由 Oracle 判断的 answer-in-context 诊断指标不受影响：它只用于诊断，不进入配置。
