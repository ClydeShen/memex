# 调研：通用数据标准与配置驱动的最佳实践

日期：2026-10-10。结论用于 ADR 0007（标准数据模型）和 ADR 0008（依赖倒置与配置驱动）。

可信度标记：
- **[官方]**：来自官方文档或规范。
- **[二手]**：来自二手资料，尚未与原始文档核对。
- **[推断]**：我的判断，没有直接来源。

## 一、可直接复用的数据标准

| 标准 | 现状 | 在 Memex 中的用途 | 可信度 |
|---|---|---|---|
| **JSON-LD** | W3C 推荐标准；schema.org 推荐的格式之一 | 契约使用 JSON 格式，通过 `@context` 映射到 RDF，开发上方便，又能和其他系统互通 | [二手] |
| **Wikidata statement 模型** | statement 由属性、值、限定符（qualifier）、引用（reference）和 rank（preferred / normal / deprecated）组成；在 RDF 中表示为重新具体化的 statement 节点 | Claim 的结构直接参照它：限定符承载时间和作用域，引用承载 Provenance，rank 对应 Epistemic Status 的一部分。Wikidata 的例子"冥王星是行星"后来被标为 deprecated 并加上结束时间，正是信念修正的现成例子 | [二手] |
| **Nanopublication** | 由四个命名图组成：head、assertion、provenance、pubinfo；已收录于 Dublin Core 的元数据标准目录 | 作为"Claim + Provenance"的对外交换格式。新近的扩展工作 PROV-K 针对的是多来源的断言 | [二手] |
| **PROV-O** | W3C 推荐标准（2013），轻量，设计上就允许按领域特化 | Observation、Evidence 对应 Entity；推理运行、Action 对应 Activity；用户、工具、其他 Agent 对应 Agent | [官方] |
| **OWL-Time** | W3C 与 OGC 联合制定；新修订版是 2022 年的候选推荐草案。区间的起止必须指向一个时刻（Instant），不能直接写字面量值 | 定义 validFrom、validUntil 的语义。存储时用 xsd:dateTime 作简写，导出时再展开 | [二手] |
| **SKOS / RDFS / SHACL** | W3C 标准 | 领域词表、类层次和约束 | [推断]（本次未单独查证） |
| **schema.org** | 被广泛使用的通用词汇 | Core Ontology 中的通用实体（Person、Place、Event 等）直接对齐 | [二手] |
| **CloudEvents 1.0.2** | 2024 年 1 月从 CNCF 毕业；正式定义了 JSON 等编码；核心属性包括 id、source、specversion、type、time，数据放在 data 字段 | 用作事件日志中每个事件的信封 | [二手] |
| **OpenTelemetry GenAI 语义约定** | 2026 年 6 月迁到独立仓库，**仍处于 Development 状态**。定义了 gen_ai.operation.name、模型名、token 用量，以及 invoke_agent、execute_tool、plan 等 Agent 操作。默认不记录输入输出内容 | 只在 Trace 导出层使用；认知步骤使用自定义的 `memex.*` 属性 | [二手] |
| **JSON Schema / MCP / Agent Skills / A2A** | 见 ADR 0006 | Capability 的输入输出、工具、程序性知识、Agent 间通信 | [二手] |

## 二、配置驱动的成熟做法

### 1. 组件统一写成 `{type, config}`
多个成熟系统各自独立采用了同一种写法：

- **Mem0**：`vector_store`、`llm`、`embedder`、`graph_store` 下都是 `{provider, config}`。图存储可以单独指定自己的 llm，覆盖全局设置。[官方]
- **Haystack**：每个组件写成 `{type, init_parameters}`，组件之间的连接另外用 `connections` 声明。每个组件自己负责序列化（`to_dict` / `from_dict`）。[官方]
- **OpenTelemetry Collector**：组件用 `type[/name]` 标识，同一类型可以有多个命名实例，例如 `otlp` 和 `otlp/2`。[官方]

**对 Memex 的建议**：每类 Provider 都按 `{type, config}` 来写。`config` 的校验规则由各个 Provider 自己定义，组合根只负责按 `type` 分派。需要同一类型的多个实例时（比如两个推理模型），用 `type/name` 区分。

### 2. 先声明组件，再单独接线
OpenTelemetry Collector 先在各自的分区声明 receivers、processors、exporters，然后只有在 `service.pipelines` 中被引用的组件才会启用；仅仅配置一个组件不会激活它。[官方]

**对 Memex 的建议**：先声明有哪些 Provider，再由 `strategy` 引用要用的那些。这样同一份 Provider 清单可以给不同的 Cognitive Strategy 复用。

### 3. 给模型起别名，认知角色只绑定别名
- **Vercel AI SDK**：`createProviderRegistry` 用 `providerId:modelId` 的形式取模型。`customProvider` 可以预先设置参数、起别名、限制可用的模型。`createOpenAICompatible` 可以接任何兼容 OpenAI 接口的服务。社区维护的 llama.cpp 专用 Provider 已经停止维护，不建议使用。[官方，具体 API 名称随版本变化]
- **LiteLLM**：客户端请求的 `model_name` 只是一个别名，可以映射到不同 Provider 的模型部署，并支持负载均衡和降级。[二手]

**对 Memex 的建议**：`models:` 中登记别名，`roles:` 中把 reasoning、intuition、embedding 绑定到别名。这样换模型、换本地实现或换云端 Provider 都只需要改别名的定义。是否接入 AI SDK，只是 ReasoningProvider 某一个实现的内部细节。

### 4. 实验配置靠"组合 + 覆盖"
**Hydra**（Python 生态的事实标准）的做法：[官方]

- 用 defaults list 从多个配置组中组合出最终配置。
- 支持从命令行覆盖单个值，或切换某个配置组，例如 `model=tiny`。
- `--multirun` 用来批量扫描参数。
- 每次运行都在输出目录保存最终配置、所用的覆盖项和各配置组的选择（`hydra.runtime.choices`）。

一个常见的项目惯例是：根配置只负责组合；把值得保留的完整实验配置，作为有名字的基线放在 `experiment/` 目录下。[二手]

**对 Memex 的建议**：已被第五部分取代。组合机制改用 Kustomize 式的 overlay 补丁。仍然保留 Hydra 的一个做法：每次运行都把最终生效的配置和它的哈希值写进 Experiment 快照。

### 5. 配置带版本号
Kubernetes 的做法是：每份配置都显式声明 `apiVersion` 和 `kind`，不写就可能随着版本升级被套上不同的默认值。版本分为 alpha、beta、stable 三个成熟度。不同版本只是同一份数据的不同视图，靠转换函数相互迁移。[官方]

**对 Memex 的建议**：每份配置文件以 `apiVersion: memex/v0alpha1` 和 `kind: Experiment | Runtime | DomainPack` 开头，加载时如有需要就把旧版本转换成新版本。

### 6. 加载时校验，出错立即停止
- **Standard Schema** 是 Zod、Valibot、ArkType 的作者共同制定的一个约 60 行的 TypeScript 接口，让各种校验库可以互相替换使用。它不负责生成 JSON Schema。[二手]
- Zod 能否导出 JSON Schema（用于编辑器自动补全和文档）这次**没有查证**，需要在实现前确认。

**对 Memex 的建议**：每个 Provider 都随附一份配置 schema；组合根在实例化任何组件之前完成全部校验。

### 7. 覆盖的优先级和密钥
- **Twelve-Factor**：配置中随部署变化的部分（比如凭证、主机地址）放在环境变量里，每个变量独立管理，不按 staging、production 这样的环境分组打包。它也有批评者：环境变量只能存字符串，不适合复杂的结构化配置。[官方及批评]
- **Mem0** 的优先级是：显式配置 > 环境变量 > 代码中的默认值。[官方]

**对 Memex 的建议**：
- 优先级从低到高依次为：代码默认值 < 配置文件 < 环境变量 < 命令行覆盖。
- 结构化配置写在 YAML 文件里；只有密钥（比如云端 API key）用 `${env:NAME}` 从环境变量引用，**并且永远不写入 Experiment 快照**。

### 8. 只加载可信的配置
Haystack 明确警告：反序列化时可以执行回调，所以只应加载可信、经过审查的定义。[官方]

**对 Memex 的建议**：配置文件只能引用注册表里已有的 `type`，不能通过配置去 import 任意模块。

## 三、各大模块的配置建议

| 模块 | 可配置的内容 | 参照的做法 |
|---|---|---|
| 模型（models） | 别名 → `{type: openai-compatible \| ai-sdk \| llamacpp \| ..., config: {baseURL, model, params}}` | AI SDK 注册表、LiteLLM model_list |
| 认知角色（roles） | reasoning、intuition、embedding、reranker → 模型别名 + 角色参数 | Mem0 的组件级 llm 覆盖 |
| Intuition | `{type: laya \| jevos \| fake, config: {questions, calibration}}` | `{type, config}` |
| Knowledge | `{type: oxigraph-wasm \| oxigraph-server \| fake, config: {ontologyVersion, snapshot}}` | Mem0 graph_store |
| Retrieval / Memory | `{type: bm25 \| vector \| hybrid \| claim-graph, config: {topK, budget}}` | Mem0 vector_store、Haystack 组件 |
| Cognitive Strategy | `{type, config}`，并引用上面声明过的 Provider | OTel 的 service.pipelines |
| Cognitive Budget | maxActiveClaims、maxHypotheses、maxContextTokens、maxReasoningTokens | Experiment 配置的一部分 |
| Capability | MCP 服务器列表、本地 Capability 集合、权限与沙箱 | MCP 客户端常见的服务器列表配置 [推断] |
| Communication | http、sse、cli、a2a，各自的端口和认证 | `{type, config}` |
| Trace / 指标 | 导出器（文件、OTLP）、采样率、是否记录内容（默认关闭） | OTel Collector exporters、GenAI 约定 |
| Experiment（实验平台） | 世界生成器的版本、种子、Task Class、Baseline 矩阵、重复次数、扫描参数 | Hydra 的组合、覆盖、multirun |
| Domain Pack | 本体扩展、数据接入、Capability、评测集 | `kind: DomainPack` |

## 五、统一的配置格式（补充调研）

问题：能不能像 AWS 用 YAML 配置基础设施那样，所有模块都用同一种配置格式？

**结论：可以。现成的通用解法是 Kubernetes Resource Model（KRM）这种资源格式，它在 Kubernetes 之外也被广泛使用。**

| 系统 | 做法 | 可信度 |
|---|---|---|
| **Kubernetes / KRM** | 每个资源都有 `apiVersion`、`kind`、`metadata`、`spec`；可以通过自定义资源类型（CRD）扩展。kpt 的 KRM 函数规范定义了"输入一组资源、输出一组资源"的通用变换方式 | [二手] |
| **Dapr** | 各类可替换组件（状态存储、消息、绑定、密钥等）全部使用同一个 `kind: Component`；`spec.type` 写成"类别.实现"，例如 `state.redis`；`spec.metadata` 是键值列表，可以用 `secretKeyRef` 引用密钥；`scopes` 限制哪些应用可以使用该组件 | [官方] |
| **Backstage** | 软件目录同样采用 `apiVersion: backstage.io/v1alpha1` 加 `kind`、`metadata`、`spec`；`spec` 的结构由 apiVersion 和 kind 决定；可以用 `$text`、`$json`、`$yaml` 引用外部文件 | [官方] |
| **AWS CloudFormation** | 一个模板里的 `Resources` 映射，每项有 `Type` 和 `Properties`；`Ref` 和 `Fn::GetAtt` 用来引用其他资源，并据此自动推断创建顺序；`Parameters` 带校验约束 | [官方] |
| **Kustomize** | 不用模板：base 加 overlay，用 strategic merge 或 JSON 6902 补丁修改资源，补丁本身也是同一种 YAML | [二手] |
| **CUE / Pkl / KCL** | 带类型、约束和抽象能力的配置语言，表达力强，但都需要另外学习，生态较小；都能输出 YAML | [二手] |

**对 Memex 的建议（ADR 0009）**：采用 KRM 格式，示例如下：

```yaml
apiVersion: memex.dev/v0alpha1
kind: Model
metadata: { name: local-qwen }
spec:
  type: openai-compatible          # 换成某个云端 Provider 只改这里
  config: { baseURL: http://localhost:8080/v1, model: qwen3.5-9b }
---
apiVersion: memex.dev/v0alpha1
kind: Provider
metadata: { name: reasoning-main }
spec:
  type: reasoning.llm              # 类别.实现，与 Dapr 的写法相同
  modelRef: local-qwen             # 按名字引用，相当于 CloudFormation 的 Ref
  config: { strategy: hypothesis-evidence }
---
apiVersion: memex.dev/v0alpha1
kind: Provider
metadata: { name: intuition-main }
spec:
  type: intuition.laya
  config: { calibration: dev-v1 }
---
apiVersion: memex.dev/v0alpha1
kind: Experiment
metadata: { name: poisoning-001 }
spec:
  strategy: { type: fast-slow, providers: [reasoning-main, intuition-main] }
  world: { generator: microworld/v1, seeds: { from: 1, count: 500 } }
  budget: { maxActiveClaims: 20, maxContextTokens: 4000 }
```

做实验变体时，只需要写一个 overlay，比如把 `intuition-main` 的 `spec.type` 改成 `intuition.jevos`，其余配置原样复用。

## 四、尚未查证的事项
- Zod 4 的 JSON Schema 导出能力。
- llama.cpp 服务端的 OpenAI 兼容接口具体支持哪些参数。
- SKOS、SHACL 规范本身（本次没有单独检索）。
- OWL-Time 2022 修订版是否已经成为正式推荐标准。

## 来源
- [Dapr component secrets](https://docs.dapr.io/operations/components/component-secrets/) · [Dapr component spec format](https://oneuptime.com/blog/post/2026-03-31-dapr-understand-component-specification-format/markdown)
- [Backstage descriptor format](https://backstage.io/docs/features/software-catalog/descriptor-format) · [Backstage ADR-002](https://backstage.io/docs/architecture-decisions/adrs-adr002)
- [CloudFormation Resources syntax](https://docs.amazonaws.cn/en_us/AWSCloudFormation/latest/UserGuide/resources-section-structure.html) · [CloudFormation templates overview](https://docs.amazonaws.cn/en_us/AWSCloudFormation/latest/UserGuide/gettingstarted.templatebasics.html)
- [KRM functions and Kustomize](https://innoq.com/en/blog/kustomize-enhancement-with-krm-functions) · [kpt-kcl](https://github.com/kcl-lang/kpt-kcl)
- [Kustomize guide (Plural)](https://www.plural.sh/blog/what-is-kustomize-guide/) · [Kustomize patterns](https://docs.opencenter.cloud/docs/reference/ref-kustomize)
- [Pkl comparison](https://pkl-lang.org/main/0.26.3/introduction/comparison.html) · [GOV.UK: use Pkl](https://docs.publishing.service.gov.uk/repos/govuk-infrastructure/architecture/decisions/0022-use-pkl-for-configuration.html) · [VSHN: KCL vs CUE](https://kb.vshn.ch/app-catalog/adr/0044-configuration-language-kcl-vs-cue.html)
- [Wikidata 数据模型（UMBC 课程讲义）](https://courses.cs.umbc.edu/graduate/691/fall22/kg/notes/24_wikidata/wikibase.pdf) · [Discovering Implicational Knowledge in Wikidata](https://arxiv.org/pdf/1902.00916) · [qwikidata.claim](https://qwikidata.readthedocs.io/en/stable/qwikidata.claim.html)
- [Nanopublication（Dublin Core）](https://msi.dublincore.org/standards/nanopublication) · [Nanopublications: provenance-centric linked data](https://ar5iv.labs.arxiv.org/html/1809.06532) · [Knowledge provenance 扩展](https://link.springer.com/article/10.1007/s00799-025-00431-x)
- [W3C PROV-O](https://w3.org/TR/prov-o/) · [OWL-Time（Dublin Core）](https://msi.dublincore.org/standards/w3c-time) · [OWL-Time 区间讨论](https://lists.w3.org/Archives/Public/public-sdwig/2018Jan/0010.html)
- [Schema.org and JSON-LD](https://blog.schema.org/2013/06/03/schema-org-and-json-ld/) · [JSON-LD 在数据空间中的应用](https://semantic.internationaldataspaces.org/wp-content/uploads/2023/10/POSITI2.pdf)
- [cloudevents.io](https://cloudevents.io/) · [CloudEvents 毕业（InfoQ）](https://www.infoq.com/news/2024/04/cncf-cloudevents-graduation) · [CloudEvents JSON（Google）](https://docs.cloud.google.com/eventarc/docs/cloudevents-json)
- [OTel GenAI 约定（Greptime）](https://www.greptime.com/blogs/2026-05-09-opentelemetry-genai-semantic-conventions) · [OTel GenAI 约定（TrueFoundry）](https://www.truefoundry.com/blog/opentelemetry-genai-semantic-conventions)
- [OTel Collector configuration](https://opentelemetry.io/docs/collector/configuration)
- [AI SDK provider management](https://sdk.vercel.ai/docs/ai-sdk-core/provider-management) · [OpenAI compatible providers](https://sdk.vercel.ai/providers/openai-compatible-providers) · [llama.cpp community provider](https://v5.ai-sdk.dev/providers/community-providers/llama-cpp)
- [LiteLLM config](https://www.mintlify.com/BerriAI/litellm/proxy/configs) · [LiteLLM router config](https://www.mintlify.com/BerriAI/litellm/api/router-config)
- [Mem0 configuration](https://docs.mem0.ai/open-source/configuration) · [Mem0 graph memory](https://docs.mem0.ai/open-source/features/graph-memory)
- [Haystack serialization](https://docs.haystack.deepset.ai/docs/serialization)
- [Hydra defaults list](https://hydra.cc/docs/advanced/defaults_list) · [Configuring Hydra](https://hydra.cc/docs/configure_hydra/intro/) · [Hydra experiment configs（项目实践）](https://github.com/KirillHit/spiking_rl_lab/wiki/Configuration-and-Experiments)
- [Kubernetes CRD versioning](https://www.kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/) · [Kustomize apiVersion/kind](https://notes.kodekloud.com/docs/Kustomize/Kustomize-Basics/Kustomize-ApiVersion-Kind) · [Flux API versioning](https://oneuptime.com/blog/post/2026-03-05-flux-cd-api-versioning-compatibility/view)
- [Standard Schema 解读](https://blog.openreplay.com/standard-schema-explained-flexible-validation)
- [Twelve-Factor: Config](https://12factor.net/config) · [对 Twelve-Factor 的批评](https://what.thedailywtf.com/post/671055)
- [Inspect AI](https://inspect.aisi.org.uk)
