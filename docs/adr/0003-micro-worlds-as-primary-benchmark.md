---
status: accepted
---

# 主要评测环境是由生成器确定性生成的 Micro World

MVP 不在开放的真实世界里评测认知能力，而是在 World Generator 按配置和随机种子生成的合成 Micro World 里评测。生成器掌握 Ground Truth，所以评分是客观、可复现的，不依赖用 LLM 来判卷，样本量也不受限制。Agent 只能通过 Observation 了解世界，看不到 Ground Truth。Oracle 的结果只用于 Evaluator 打分，不能以任何形式回流给 Agent；Agent 的学习信号只来自 Environment 和 Verification（ADR 0018）。评测按认知能力划分 Task Class（T0–T5），不按业务领域划分。

## Considered Options

- **人工编写任务**：样本量太小，标注成本高，被否决。
- **用 LLM 当评判**：如果评判者就是被测的同一个本地模型，结论就是循环论证，被否决。
- **公开基准（ALFWorld、ScienceWorld 等）**：可以和已发表的结果直接比较，但可控性差，而且大多是 Python 生态。以后可以作为外部验证，不作为主要评测。

## Consequences

- 增加一个 T0"世界观构建"轨道：生成器把 Ground Truth 渲染成文档、日志或表格，让 Agent 去摄取，再逐条比对 Agent 得到的 Claim 和真实情况。
- 增加 B-sym 参考基线（掌握完整规则的符号求解器），用来检查生成的世界是否太简单。
- 生成器在生成任务时就要标好"是否需要 Escalation"等标签。
- 对 Agent 隐藏哪些信息尚未决定，见 docs/open-questions.md。
