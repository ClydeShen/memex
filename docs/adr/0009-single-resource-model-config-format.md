---
status: accepted
---

# 所有配置使用同一种资源格式（apiVersion / kind / metadata / spec）

Memex 的所有可配置内容都用同一种 YAML 资源格式声明，没有任何模块拥有自己的配置格式或配置语言。这些内容包括：模型、各类 Provider、Cognitive Strategy、Capability（含 MCP 服务器）、Ontology、Domain Pack、Experiment 和运行时本身。

这种格式沿用 Kubernetes Resource Model：每个资源都有 `apiVersion`、`kind`、`metadata`、`spec` 四个字段，`spec` 的结构由 `apiVersion` 加 `kind` 决定。Kubernetes、Dapr、Backstage、Crossplane 和 Kustomize 都使用这种格式。其中 Dapr 和我们最相似：它用同一种 `kind: Component` 描述各类可替换组件，`spec.type` 写成"类别.实现"的形式，例如 `state.redis`。

其他规则：

- **资源引用**：资源之间按 `metadata.name` 互相引用，相当于 CloudFormation 的 `Ref`。
- **密钥**：从环境变量取值。（ADR 0016 统一写法为 `${env:NAME}`，不使用 Dapr 的 `secretKeyRef`。）
- **实验变体**：采用 Kustomize 式的 base + overlay 补丁。补丁本身也是同一种格式，因此不需要类似 Hydra 的第二种组合机制。
- **校验**：每种 `kind` 都附带一份 JSON Schema。加载时据此校验，编辑器也能据此自动补全。

## Considered Options

- **每个模块自定格式**：用户明确否决。这样会形成孤立的配置孤岛。
- **CloudFormation 式的单模板**：一个文件里的 `Resources` 映射，每项有 `Type` 和 `Properties`，用 `Ref` 和 `Fn::GetAtt` 引用其他资源。这种方式表达力相当，但没有版本字段，生态也只限于 AWS。我们借鉴了它的引用思路。
- **CUE / Pkl / KCL 等配置语言**：它们提供类型、约束和抽象，但都是需要另外学习的新语言，生态也较小。因为它们都能输出 YAML，以后如有需要，可以叠加在本格式之上，不必现在引入。
- **每个实验一份大 JSON**：没有版本号，也没有复用和覆盖的机制。

## Consequences

这取代了 ADR 0008 和调研报告中"自己写一个精简版 Hydra"的建议：组合机制统一采用 overlay 补丁。
