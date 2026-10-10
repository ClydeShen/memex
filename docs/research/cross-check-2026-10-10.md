# 交叉核对：之前不确定、推断或被默认为真的内容

日期：2026-10-10。核对对象有两类：一是之前标为"二手"或"推断"的技术事实，二是我们双方都默认成立的几个核心假设。核对方法是查找公开资料，并尽量用第三方来源相互印证。

结论分四种：
- **确认**：有多个来源支持。
- **修正**：原来的说法需要改。
- **推翻**：原来的说法不成立。
- **证据不足**：目前找不到足够的证据下结论。

## 一、技术事实

| # | 原来的说法 | 结论 | 依据 |
|---|---|---|---|
| 1 | Laya 零样本接近随机，需要校准 | **修正：仅做校准不够** | 基础英文模型在 typed-decisions 基准上得 0.362，随机基线是 0.318。0.766 是在该基准自己的训练集上微调后的成绩，属于同分布测试；模型卡还警告，超出那四类工作流后，表现可能回到基础模型的水平，甚至更差。Convai 的 README 原话是"a fast base to specialise, not a zero-shot decision engine"（一个用来专门化的快速底座，不是零样本决策引擎）。 |
| 2 | jevos 的基础模型不明 | **确认（二手）** | 来自多个二手来源：MiniCPM5-1B，Apache-2.0，2026 年 5 月发布。按 ADR 0001，许可证已不构成问题。 |
| 3 | llama.cpp 不保证输出确定 | **确认** | 服务端 README 说明：不同批大小下，logits 不保证逐位一致；开启 prompt cache 复用也会导致结果不确定。Issue #7052 报告：8 个 slot 在 temperature 为 0 时，同一个 prompt 产生了 5 到 8 种不同的输出。ADR 0005 的前提成立。 |
| 4 | llama.cpp 有 OpenAI 兼容接口 | **确认** | 支持 `/v1/chat/completions`、`seed`、`json_schema`（基于语法约束的采样），`response_format` 会映射到 json_schema。 |
| 5 | Cordis 的 API 不稳定 | **确认，并有补充** | Cordis 是 Koishi 的底层框架。2026 年 8 月，DeepSeek 基于它构建了一个 agent harness，随后 Cordis 登上 GitHub Trending，但当时仍是不稳定的候选版本。各来源给出的 star 数互相矛盾（1.1k、4.7k、9.1k），不可作为依据。 |
| 6 | Oxigraph JS 版只在内存中运行，RDF 1.2 只是初步支持 | **确认，并有补充** | Rust 版的最新版本是 0.5.9，RDF 1.2 和 SPARQL 1.2 要显式开启 `rdf-12` 功能开关。官方说明自己"仍在密集开发中，SPARQL 查询求值尚未优化"，**这对 10 万条记忆规模的扩展测试是一个性能风险**。 |
| 7 | OWL-Time 2022 年版是候选推荐草案 | **修正** | 2017 年版已经是正式的 W3C 推荐标准，2022 年版是新的候选推荐草案。我们应以 2017 年的推荐标准为准。 |
| 8 | Zod 能否导出 JSON Schema（之前没核实） | **确认** | Zod 4 内置 `z.toJSONSchema()`，默认输出 Draft 2020-12；旧的 zod-to-json-schema 包已经停止维护。 |
| 9 | "TypeScript 没有类似 Hydra 的成熟工具" | **推翻（部分）** | unjs/c12 支持 `extends` 分层、按环境覆盖和固定的合并优先级。不过 ADR 0009 已经改用 overlay 补丁，c12 可以作为加载工具，不影响原来的决定。 |
| 10 | Wikidata 把 statement 存成节点 | **确认** | `p:` 指向具体化后的 statement 节点；值、限定符、rank 分别用 `ps:`、`pq:`、`wikibase:rank` 表示；**引用直接使用 `prov:wasDerivedFrom`**，与 ADR 0007 采用 PROV-O 的做法吻合。 |
| 11 | A2A 1.0 | **确认（二手）** | 多个来源一致：2026 年 3 月前后发布 1.0，由 Linux Foundation 托管；8 月转入 Agentic AI Foundation。 |
| 12 | KRM 格式可以脱离 Kubernetes 使用 | **确认** | Dapr 在自托管模式下直接从目录读取 apiVersion / kind / metadata / spec 格式的 YAML，不需要 Kubernetes。 |
| 13 | ONNX 推理（Laya 的 Node 移植版）能否用 GPU | **证据不足** | onnxruntime-node 只在 Linux x64 上支持 CUDA，Windows 只能用 CPU、DirectML 或 WebGPU。主力开发机是 Windows + WSL2；WSL2 属于 Linux x64，理论上可以用 CUDA，但**这是推断，没有实测**。 |
| 14 | OpenTelemetry GenAI 语义约定的状态 | **确认** | 2026 年 6 月迁到独立仓库，目前仍是 Development 状态，没有给出稳定时间表。 |

## 二、核心假设

| # | 假设 | 结论 | 依据与影响 |
|---|---|---|---|
| A | 小模型加知识图谱或检索，可以追上大模型 | **证据不足，偏向否定** | 一项 KGQA 研究发现，小模型（0.5B–8B）加上检索后提升很大，但瓶颈在探索质量，模型规模依然重要。另一项比较 13 个开源模型的 RAG 研究发现，大模型始终更好。**这说明 ADR 0001 把目标定为"同一个模型越来越好"，而不是"追上大模型"，是对的。** |
| B | 记忆越积越多会伤害性能 | **确认** | arXiv 2505.16067 发现了"经验跟随"现象：检索到的记忆和当前任务越像，Agent 的输出就越会照搬当时的输出，导致错误传播；有选择地增删记忆效果更好。这是我们核心论点的直接证据。 |
| C | 上下文越长、干扰越多，表现越差 | **确认** | Chroma 的 Context Rot 报告测了 18 个模型（包括 Qwen3），输入越长越不可靠；**与正确答案相似但错误的干扰信息伤害最大**，一条就有明显影响。这支持 Attention 和 Cognitive Budget 的设计。 |
| D | 让模型自己判断要不要推理 | **推翻** | RACER（arXiv 2605.10805）发现，让 LLM 自己决定时，它几乎把所有输入都送去推理，学不会选择。只有**单独训练的路由器**有效。这支持单独设置 Intuition，但前提是要训练。 |
| E | Claim 加溯源比 RAG 更能抵抗投毒 | **修正：已有人研究过，而且结论有条件** | Nous（arXiv 2606.22030）：基于信念的记忆，只在证据互相矛盾、且可信度不同时才明显有效；在普通对话基准上几乎没有提升。按溯源给信任设上限，能抵抗投毒，但要付出实用性上的代价。arXiv 2608.21230 的发现：①内容筛查对 360 条虚假陈述的拒绝数为 0；②**"按溯源加权排序"和完全不防御没有统计差异（p=0.80）**，加大权重又会误伤可信度低但内容正确的证据；③作者建议改为**在检索时限制不可信内容所占的比例**。 |
| F | 从经验中提炼 Pattern 能减少推理 | **证据不足** | ExpeL（AAAI 2024）证明，不改权重、只积累经验，也能持续提升表现；但"减少推理调用"这一点没有找到直接证据。这仍是本项目要验证的开放假设。 |
| G | 符号求解器可能完胜 Micro World | **确认存在风险** | PlanBench 显示 LLM 的规划能力很弱；把 Blocksworld 的名字打乱后（Mystery Blocksworld），没有一个非推理模型的成功率超过 5%。这说明 **LLM 很依赖预训练里见过的名称和常识**。 |
| H | 快慢双系统是新思路 | **推翻** | SwiftSage（NeurIPS 2023）已经在 ScienceWorld 上用"小模型负责快、大模型负责慢、启发式规则切换"的结构超过了 ReAct 和 Reflexion；它的快模块是**在 oracle 轨迹上微调过的**。2026 年还有 NeSyFS。本项目的新意不在双系统本身。 |
| I | LLM 能从经验中扩展本体 | **证据不足，已知有困难** | LLMs4OL 2025 挑战赛中，效果最好的是"商用 LLM + 领域嵌入 + 微调"的混合方案。已知问题包括逻辑不一致、语义漂移、难以生成多层次的层级结构。"先提议、再验证、再采纳"的关卡是必要的；对小模型的期望应当放低。 |

## 三、对设计的影响

1. **System 1 必须训练，这是本次核对中最重要的发现。** 证据来自三个方向：Laya 的官方定位（一个要专门化的底座）、SwiftSage 的快模块（微调过）、RACER（自我路由无效）。"MVP 只用现成模型、不训练"这个前提很可能站不住。好在 Micro World 的生成器可以自动产生带 oracle 标签的训练数据，代价不高。但训练用的任务族必须与评测用的严格分开。
2. **Micro World 中的名称要打乱。** 参照 Mystery Blocksworld，实体和关系使用无意义的名字，避免模型靠预训练里的常识作答。这也解决了"小模型本来就知道"的问题。
3. **溯源的用法改为"占用比例"而不是"加权"。** 不对低溯源的内容做加权惩罚，而是在 Cognitive Budget 中限制每个信任等级最多能占多少位置。投毒基准中必须包含"能回答问题的证据恰好来自低可信来源"的情况，否则溯源的好处会被高估。
4. **重新定位本项目的新意。** 双系统（SwiftSage、NeSyFS）、信念式记忆（Nous）、经验学习（ExpeL）都已经有人做过。本项目的价值在于**把它们放进同一个可替换、可复现的实验平台里，在 Micro World 中做受控的对照和消融实验**，以及在一个领域里长期积累 Worldview。
5. **Oxigraph 的性能需要尽早验证。** 在 M2 之前，先用 10 万条 Claim 做一次压力测试。

## 来源
- Laya：[HF 模型卡](https://huggingface.co/convaiinnovations/laya) · [systemonemodels.org](https://systemonemodels.org/models/laya/) · [Flowtivity 评测](https://flowtivity.ai/blog/laya-open-source-jev-alternative/) · [eesel](https://www.eesel.ai/blog/laya-ai)
- MiniCPM5-1B：[Gigazine](https://gigazine.net/gsc_news/en/20260526-minicpm5-1b-openbmb-ai/) · [Artificial Analysis](https://www.artificialanalysis.ai/articles/minicpm5-1b-the-leading-1b-open-weights-model) · [bestllmfor](https://bestllmfor.com/catalog/minicpm5-1b/)
- llama.cpp：[server README](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md) · [Issue #7052](https://github.com/ggml-org/llama.cpp/issues/7052) · [Issue #11847](https://github.com/ggml-org/llama.cpp/issues/11847)
- Cordis：[Koishi docs issue](https://github.com/koishijs/docs/issues/185) · [Cordis 与 DeepSeek Harness](https://redreamality.com/ja/blog/cordis-spatiotemporal-composability-deepseek-harness/) · [remio](https://www.remio.ai/ko/post/cordiverse-cordis-hit-github-trending-but-deepseek-is-the-real-story-ko)
- Oxigraph：[docs.rs 0.5.9](https://docs.rs/crate/oxigraph/latest) · [LinuxLinks](https://www.linuxlinks.com/oxigraph-graph-database/)
- OWL-Time：[W3C TR](https://www.w3.org/TR/owl-time/) · [CR 2020（引用 2017 REC）](https://www.w3.org/TR/2020/CR-owl-time-20200326)
- Zod：[zod.dev/json-schema](https://zod.dev/json-schema)
- c12：[unjs.io](https://unjs.io/packages/c12) · [npm](https://www.npmjs.com/package/c12)
- Wikidata RDF：[Wikibase RDF binding](https://doc.wikimedia.org/Wikibase/master/js/topics/rdf-binding.md) · [Malyshev et al. ISWC 2018](https://ddll.inf.tu-dresden.de/w/images/5/5a/Malyshev-et-al-Wikidata-SPARQL-ISWC-2018.pdf)
- A2A：[Linux Foundation](https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year?hsLang=en) · [Quarkus A2A SDK 1.0](https://quarkus.io/blog/a2a-java-sdk-1-0-0-final-released/) · [Pebblous](https://blog.pebblous.ai/blog/a2a-mcp-agentic-ai-foundation-authorization/en/)
- Dapr 自托管：[oneuptime](https://oneuptime.com/blog/post/2026-03-31-dapr-understand-component-specification-format/markdown)
- onnxruntime-node：[npm](https://npmjs.com/package/onnxruntime-node) · [socket.dev](https://socket.dev/npm/package/onnxruntime-node/overview/1.24.3)
- 假设 A：[SLM 的 KGQA 探索](https://arxiv.org/html/2509.07399) · [13 个开源 LLM 的 RAG 研究](https://arxiv.org/pdf/2503.16581)
- 假设 B：[arXiv 2505.16067](https://arxiv.org/abs/2505.16067)
- 假设 C：[Chroma Context Rot](https://trychroma.com/research/context-rot)
- 假设 D：[RACER arXiv 2605.10805](https://arxiv.org/pdf/2605.10805) · [Route to Reason](https://arxiv.org/abs/2505.19435) · [路由综述](https://arxiv.org/pdf/2603.04445)
- 假设 E：[Nous arXiv 2606.22030](https://arxiv.org/abs/2606.22030) · [arXiv 2608.21230](https://arxiv.org/abs/2608.21230) · [Provenance laundering arXiv 2607.29167](https://arxiv.org/pdf/2607.29167) · [MINJA](https://arxiv.org/html/2503.03704v2)
- 假设 F：[ExpeL](https://arxiv.org/abs/2308.10144)
- 假设 G：[LLMs Still Can't Plan](https://arxiv.org/html/2409.13373v1) · [PlanBench repo](https://github.com/karthikv792/LLMs-Planning)
- 假设 H：[SwiftSage](https://arxiv.org/abs/2305.17390) · [NeSyFS](https://arxiv.org/abs/2607.28942)
- 假设 I：[LLMs4OL 2025](https://vivo.tib.eu/fis/display/n91428) · [OntoLearner](https://arxiv.org/pdf/2607.01977)
