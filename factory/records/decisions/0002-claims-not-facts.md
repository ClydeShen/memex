---
status: accepted
---

# 知识以 Claim 的形式存储，溯源和时间从第一天起记录

Agent 不直接存储"事实"，只存储 Claim：一条带有溯源、时间范围、确信状态（Epistemic Status）和置信度（Confidence）的结构化命题。来源可以是用户、直接观测、推断、模型猜测、外部工具或其他 Agent，可信度各不相同。溯源和时间信息（observedAt、validFrom、validUntil、derivedFrom 等）必须从 MVP 第一天就记录：利用这些信息进行推理的能力可以以后再补，但当初没记录下来的溯源永远无法补回。

时间采用双时态：Valid Time 记录 Claim 在世界中何时为真（validFrom / validUntil），Recorded Time 记录 Agent 何时得知或记录这条 Claim（observedAt、recordedAt）。这对应数据库领域的 valid time 和 transaction time。"世界变了"和"Agent 改变看法"由此可以区分开。

## Considered Options

- **普通 RDF 三元组**：每条陈述没有地方挂元数据，被否决。
- **RDF-star / RDF 1.2 三元组项**：写法最简洁，但依赖存储系统的扩展支持，而且 Oxigraph 对 RDF 1.2 还只是初步支持。留作以后可选的一种 KnowledgeProvider 实现。
- **命名图（Named Graph）**：每条断言一个图，查询会很别扭。命名图留给另一个用途：实验隔离、数据集上下文、快照和 Ontology 版本。
- **Claim 节点（选定）**：每条断言是一个一等节点。它不依赖特定存储的扩展，可以直接用 SHACL 约束，认知状态、溯源和证据也都能自然挂在这个节点上。

## Consequences

Cognitive Contract 把 Claim 作为一等对象暴露出来，不依赖任何 RDF 实现细节。Observation、Evidence、Experience 和 Claim 是四种不同的对象，不能合并。Claim 的置信度可以由证据推导出来，具体算法是一个可以做实验比较的变量。

互相矛盾的 Claim 允许同时存在，用确信状态"有争议"来标记，不强制当场裁决（借鉴 jj 的"冲突是一等对象"）。这为将来按分支管理 Worldview 留出了余地（VISION"跨领域迁移"一节）。
