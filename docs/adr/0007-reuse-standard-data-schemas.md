---
status: accepted
---

# 数据模型建立在通用标准词汇之上，避免成为孤立系统

Memex 不发明能被现有标准表达的结构。内部的 Cognitive Contract 使用 JSON 格式；通过 JSON-LD 的 `@context`，每个字段都映射到标准词汇的 IRI，因此同一份数据既是普通 JSON，也是 RDF。标准的选择如下：

| 内容 | 采用的标准 |
|---|---|
| 序列化和 API 边界 | JSON-LD（JSON 与 RDF 的桥梁） |
| Claim 的结构 | 参照 Wikidata 的 statement 模型（值、限定符、引用、rank），存储为重新具体化的 statement 节点；对外交换时可导出为 nanopublication（assertion / provenance / pubinfo） |
| Provenance | W3C PROV-O（Entity / Activity / Agent，wasDerivedFrom、wasGeneratedBy、wasAttributedTo） |
| 时间范围 | OWL-Time 的语义；存储时用 xsd:dateTime 属性作为简写，并保留到 time:Interval 的映射 |
| 概念和分类 | RDFS（类）、SKOS（领域词表）、SHACL（约束） |
| 通用实体 | Core Ontology 中能对齐 schema.org 的概念（Person、Place、Event 等）就直接对齐 |
| 事件日志的信封 | CloudEvents 1.0（CNCF 毕业项目，JSON 格式） |
| Trace | OpenTelemetry；与模型和工具相关的部分使用 GenAI 语义约定，认知步骤使用自定义的 `memex.*` 属性 |
| Capability 的输入输出 | JSON Schema（与 MCP 兼容） |
| 程序性知识 / 对外协议 | Agent Skills、MCP、A2A（见 ADR 0006） |

## Consequences

- OpenTelemetry 的 GenAI 语义约定目前仍处于 Development 状态，属性名可能变化，所以只在 Trace 导出层使用它，不渗入 Cognitive Contract。
- OWL-Time 不允许直接给区间的起止赋字面量值，写法比较冗长，所以存储时用简写，只在导出时展开。
- 内部采用 Claim 节点（ADR 0002），与 Wikidata 的 RDF 做法一致；nanopublication 基于命名图，只作为对外交换格式。
