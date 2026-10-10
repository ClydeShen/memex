---
status: proposed
---

# 对外扩展优先采用现有开放标准，不自创协议

能力扩展通过 MCP 实现，作为 CapabilityProvider 的适配器。程序性知识的导入和导出采用 Agent Skills（SKILL.md）格式：Memex 学到的 Pattern 可以导出为 Skill，外部的 Skill 也可以导入作为初始的程序性知识。与其他 Agent 的通信采用 A2A，作为 CommunicationProvider 接入。其他 Agent 说的话被当作一条带溯源的 Claim，可信度低于直接观测。

Memex 自己定义的标准只有三样：Cognitive Contract、Domain Pack 和 Environment 接口。

## Consequences

Capability 的输入输出从一开始就用 JSON Schema 描述，以便以后映射到 MCP。Provenance 的来源类型从一开始就包含"其他 Agent"和"外部工具"。
