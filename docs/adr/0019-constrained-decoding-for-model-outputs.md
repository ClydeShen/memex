---
status: accepted
---

# 模型输出一律使用约束解码；Certainty 在选项字母范围内重新归一化

关闭思考模式、在提示词里要求格式，都不能保证模型按格式输出。2026-10-11 在本地实测（llama.cpp b11552，Tev1-4B 和 Qwen3.8-27B，每个模型 6 道题，其中 2 道是注入题）：

- **不加约束**：两个模型各有 1 道题不合格式。Tev1 在注入题上输出了一段英文；Qwen3.8 在状态要求"用 JSON 回答"时真的输出了 JSON。
- **加语法约束**：两个模型都是 6/6 合格。

详细数据见 docs/research/llama-cpp-backend.md。

## 决定

### 一、所有模型输出都使用约束解码

约束解码是指：在生成每个 token 之前，把不符合语法的 token 的概率置零，让模型从物理上无法输出格式之外的内容。

| 角色 | 约束方式 | 说明 |
|---|---|---|
| Intuition | llama.cpp 的 `grammar`，只允许输出本题的选项字母 | 例如 `root ::= [ABCD]` |
| Reasoning | `response_format: json_schema`，schema 由契约中对应的 Zod schema 导出 | 开启思考模式时同样有效：模型先自由思考，最终答案再被约束（实测有效） |

- Provider 在能力声明中写明 `supportsGrammar` 和 `supportsJsonSchema`。Composition Root 和 `doctor` 在启动时检查，后端不支持就立即报错（约束 A4）。
- **约束只保证格式，不保证内容。** 实测中，注入文字要求选 C，两个模型在约束下都选了 C；Reasoning 输出的 JSON 格式合法，但文字内容受到了注入的影响。所以：
  - 输出仍然要用 Zod 再校验一遍（security-and-data.md X3）；
  - ADR 0016 的"外部内容当作数据"、Verification、Policy 都不能省略。

### 二、Intuition 的 Certainty 由适配器自己计算

llama.cpp 返回的 `top_logprobs` 是**约束之前**的原始分布。因此：

1. **请求的 `top_logprobs` 至少为 20**，并且不少于选项数的两倍。同一个字母可能有 `B` 和 ` B` 等多个 token 变体；设为 5 时，12 个选项中只能看到 A 到 E。
2. **把同一个字母的各个 token 变体合并**（概率相加）。
3. **在本题的选项字母范围内重新归一化**，得到每个选项的分布 `distribution`。归一化后概率最高的字母，就是约束下输出的字母（temperature 为 0 时），两者一致。
4. **记录"不属于任何选项的概率"**（off-option mass）：所有选项字母的原始概率之和与 1 的差。它高，说明输入不正常、或者模型没把它当成选择题（实测：注入题上 Tev1 的选项字母概率之和接近 0）。它是 Escalation 的触发条件之一，阈值作为 Calibration 配置项。
5. Certainty 再按 docs/research/core-algorithms-2026-10-11.md 第 1 节的流程做 Calibration（去除选项先验偏差、温度缩放、在校准集上定阈值）。（**ADR 0023 修订**：阈值的标签来自影子升级，即与 Reasoning 的结论是否一致，不用 Oracle 标签。）

## Considered Options

- **只在提示词里要求格式**：实测不可靠，被否决。
- **生成后用正则解析，解析失败就重试**：增加调用次数和延迟，失败时的处理也会影响复现，被否决。
- **只用约束解码、直接采用输出的字母**：会丢掉原始概率中的信息。注入题上，约束仍然输出了一个看似正常的字母，只有原始概率能暴露问题。所以两者要一起用。

## Consequences

- contracts.md：Capabilities 增加 `supportsGrammar`、`supportsJsonSchema`；`Judgement` 增加 `offOptionMass`。
- docs/dependencies.md 的能力声明一节，补充这两项能力。
- 不提供约束解码的后端（例如部分云端 API），不能用于 Intuition；用于 Reasoning 时，必须在能力声明中写明，并由 Composition Root 决定是否允许。
- 有研究认为强制格式会降低推理质量（**未核实**）。本 ADR 的做法是让 Reasoning 先自由思考、最后再约束格式，以避开这个问题；效果在 M1 实测。
