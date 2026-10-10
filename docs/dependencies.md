# 依赖分类

原则：能替换的不写死。每个依赖都必须归入下面三类之一。新增依赖时，先在本文件登记它属于哪一类。

- **硬依赖**：属于架构本身。替换它等于改架构，需要写 ADR。
- **可配依赖**：由 Cognitive Contract 定义接口，提供默认实现，换实现只改配置（ADR 0008、0009）。
- **可选依赖**：没有它，系统照样能运行，只是少了某些功能。

## 硬依赖

| 依赖 | 理由 |
|---|---|
| TypeScript / Node.js | 运行时、契约和实验平台都用这门语言（ADR 0013 要求核心不使用原生扩展） |
| Cognitive Contract | 唯一稳定的边界 |
| 统一资源配置格式（apiVersion / kind / metadata / spec） | ADR 0009 |
| 只追加的事件日志，以 CloudEvents 作为信封 | ADR 0005、0007 |
| 标准数据词汇（JSON-LD、PROV-O 等） | ADR 0007 |
| Claim 模型 | ADR 0002 |
| 每个 Experiment 一个独立进程 | ADR 0004 |
| 配置的校验库（默认用 Zod） | 只在契约包内部使用。对外暴露的是 JSON Schema 和 Standard Schema 接口，所以替换它的代价很小 |

## 可配依赖

| 接口（Provider 类别） | 默认实现 | 可替换为 | 何时需要确定默认值 |
|---|---|---|---|
| 模型后端 | 作者本机的 llama.cpp | vLLM、其他兼容 OpenAI 接口的服务、远程端点、云端 Provider | M1 |
| Reasoning | Qwen3.5-9B | 任意模型 | M1 |
| Intuition | Tev1 4B | 启发式规则、读取 Qwen 的选项概率、Kev、Laya 等 | M2 |
| Embedding | 一个本地嵌入模型 | 任意嵌入模型 | M1（B1 需要） |
| Knowledge 存储 | Oxigraph WASM（进程内） | Oxigraph 服务器模式、其他图存储 | M2 |
| Retrieval | BM25 加向量检索 | 只用图检索、加 reranker 等 | M1（B1 需要） |
| Attention | 基础实现 | 基于图的实现、基于 Intuition 的实现 | M2 |
| Cognitive Strategy | 快慢双系统 | LLM-only、RAG、SwiftSage 式、NeSyFS 式 | M0 用 Fake，M2 用真实实现 |
| Reasoning Strategy | 单次推理 | 先计划后执行、假设与证据交替 | M2 |
| Capability | Micro World 的模拟器动作 | 本地沙箱能力、MCP | M1 |
| Communication | CLI | HTTP / SSE、A2A | M1 |
| Trace 导出 | 写入本地文件 | OTLP | M0 |
| Policy（策略检查） | 全部允许 | 角色和权限、多用户、对象级访问控制（ADR 0014） | M0 |
| 运维遥测导出 | 结构化 JSON 输出到 stdout，并写入本地文件 | OTLP（Grafana、Jaeger、Prometheus 等）（ADR 0015） | M0 |
| 组合层 | 一个很薄的工厂函数 | Cordis、iii | M0 |
| Environment | Micro World 生成器 | World 0、其他 Domain Pack | M0 用最简单的世界 |

## 可选依赖

| 依赖 | 没有它时 |
|---|---|
| GPU | 用更小的模型，或者连接远程的模型后端 |
| Docker / Compose | 直接在本机运行 Node 和模型后端 |
| Web 界面、实验面板、监控面板 | 只用 CLI 和日志 |
| MCP 服务器、A2A | 只用本地的 Capability |

## 后端能力要按声明来匹配，不能默认假设

不同的后端，能力并不一样。例如，Intuition 适配器要求后端能返回 token 概率（ADR 0010）。所以每个 Provider 都要**声明自己支持哪些能力**，比如 `supportsLogprobs`、`supportsJsonSchema`。组合根和 `memex doctor` 在启动时检查这些能力是否与配置匹配；不匹配时，要立即给出明确的错误。不能等到运行时才失败，也不能在代码里假设"后端一定支持某项能力"。

## 决策时机

原则：**在最后负责任的时刻做决定。** 只有在某个里程碑确实需要一个具体值时，才定下默认值。默认值不是承诺，以后更换默认值只是改配置。能做成配置项的选择，就不当成"决策"。
