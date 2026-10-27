---
status: accepted
---

# 更新默认模型组合，并规定模型只从官方来源获取

ADR 0010 的模型选择是在云端会话中做的，当时无法检测实际的运行环境。在本地实测之后，默认模型组合做如下修订。同时规定模型文件只能从可追溯的官方来源获取。

本 ADR 修订 ADR 0010 中"Reasoning：Qwen3.5-9B，固定"一行，ADR 0010 的其余内容不变。按 ADR 0008，模型只是配置；这里改的是实验矩阵中的**默认主选**，不涉及架构。

## 决定

### 一、默认模型组合

| 角色 | 主选 | 备选 | 理由 |
|---|---|---|---|
| Reasoning | **Qwen3.8-27B**（2026-08，Apache-2.0），Q4_K_M | **Qwen3.6-35B-A3B**（MoE，2026-04，Apache-2.0），Q4_K_M | Qwen3.8-27B 是能放进单块 32 GB 级消费显卡的模型中，能力评测分最高的（Artificial Analysis Intelligence Index v4.3.2：34；Qwen3.6-27B 为 21，Gemma 4 31B 为 15）。它的缺点是输出很长、速度较慢；Qwen3.6-35B-A3B 实测生成速度约为它的 3.5 倍，作为速度备选 |
| Intuition | **Tev1-4B-experimental**（不变），Q8_0 | 读取 Reasoning 模型的选项概率（收敛规则不变，ADR 0010）。启发式规则是同时运行的**对照**，不是备选（ADR 0018） | 仍然是唯一专门为快速选项判断训练的开源模型（2026-09 发布，基于 Qwen3.5-4B） |
| Embedding | **EmbeddingGemma-2**（2026-09，Apache-2.0），Q8_0 | — | 当前最新的开源嵌入模型；M1 的 B1 用它，到 M1 再确认 |

三者可以同时加载：Q4_K_M、Q8_0、Q8_0 三个模型合计约 24 GB。

### 二、模型来源

1. **只从官方来源获取**，按以下优先顺序：
   - llama.cpp 官方组织 `ggml-org` 发布的 GGUF；
   - 如果没有，就用 llama.cpp 自带的转换脚本，从模型作者发布的**原始权重**自己转换。原始权重要固定到某个提交版本，转换脚本的版本要和运行它的 llama.cpp 一致。
   - 不使用第三方重新量化的版本（例如 unsloth、bartowski）。原因：sha256 只能证明文件和它所在的仓库一致，不能证明仓库内容忠实于原始模型。
2. **每个 Model 资源记录**：来源仓库、提交版本、文件名、sha256，以及（如果是自己转换的）转换工具的版本（ADR 0013）。
3. **llama.cpp 的版本**记入 Experiment 快照。不同版本返回 logprobs 的格式可能不同（factory/records/research/llama-cpp-backend.md）。

## Considered Options

- **保持 Qwen3.5-9B**：能力明显弱于同代更大的模型，而且已经不是最新一代。不过它的好处是给"学习带来的提升"留出更大的测量空间（见下文"天花板效应"）。
- **Gemma 4 31B**：输出最省 token，但能力评测分低得多，而且 Q6 量化后显存余量很小。
- **更大的 MoE 模型**（Qwen3.8-Flash-Next 180B、GLM-5.3-Flash 321B、DeepSeek-V4.1-Flash 763B）：单块消费级显卡放不下。
- **第三方动态量化**（例如 unsloth 的 UD-Q5_K_M）：同样大小下质量可能更好，但来源不可追溯，不采用。

## Consequences

- **天花板效应要先检查。** 推理模型越强，Micro World 的题目越可能被它直接答对，Worldview 带来的改进就测不出来（VISION 原则 10）。M1 要先用 B-sym 和 B0 检查题目难度；如果 B0 已经接近满分，就加大题目难度，或者换用备选模型。
- **输出很长会拖慢实验。** Qwen3.8-27B 默认开启思考模式，输出很长。Lab 在需要时应该关闭思考模式（`chat_template_kwargs.enable_thinking: false`）或限制思考长度，并在 Experiment 快照中记录用了哪种设置。
- **Tev1 默认也会开启思考模式。** Intuition 适配器调用 Tev1 时必须显式关闭（实测结果见 factory/records/research/llama-cpp-backend.md）。
- **ADR 0010 的收敛规则不变**：如果 Tev1 不如启发式规则，就改为"读取 Reasoning 模型的选项概率"，这一条对 Qwen3.8 同样适用。
- **Tev1 微调权重的许可证尚未确定。** 模型卡写明：基础模型 Qwen3.5-4B 是 Apache-2.0，但微调权重的发布许可证"正在确定中"。因为模型不随 Memex 分发（ADR 0013），自己使用不受影响；不能分发我们自己转换的 GGUF，以后要分发任何包含它的内容，需要先确认许可证。
- **需要同步修改的文档**：ADR 0010（加上"Reasoning 主选已由 ADR 0017 修订"的说明）、factory/design/dependencies.md（Reasoning 和 Embedding 的默认值）、HANDOFF.md 第 4 节 L8、factory/records/research/llama-cpp-backend.md（补充 b11552 的实测结果）。
