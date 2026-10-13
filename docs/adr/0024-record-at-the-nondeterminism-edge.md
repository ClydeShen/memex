---
status: accepted
---

# 在不确定性进入系统的边缘录制；事件写进 Event Log，大内容按哈希存在外面

ADR 0005 规定复现依靠录制和回放，但没有规定录在哪一层、存到哪里。2026-10-11 的一致性审阅发现两处不一致：

- **哪一层**：contracts.md 要求"所有外部调用"都录制，却倾向只在 Model Backend 连接层录制。这样 World 0、MCP 这类 Capability 和 Environment 的外部调用会漏掉。
- **存到哪里**：contracts.md 说录制写进 Event Log；GLOSSARY 和 project-structure.md 说 Experiment 快照记录"录制文件的位置"。

参照 Temporal（用户确认，2026-10-13）：流程代码是确定的，回放时重新执行；有副作用、结果不确定的调用（Activity）不重新执行，直接使用记录在事件历史（Event History）中的结果；大的内容只在事件历史中放一个引用，原文存在外面（claim check 模式）。

## 决定

1. **在不确定性进入系统的边缘录制。** 所有对外的 I/O 都经过 Runtime 中统一的录制和回放层：
   - 调用 Model Backend；
   - Capability 对真实世界的执行，以及真实 Domain 的 Environment（World 0、以后的 MCP）；
   - 读取时钟。

   确定的部分不录制，回放时重新执行：Micro World 的 Environment 由种子重新生成；Provider 的内部逻辑（例如 Intuition 适配器合并 token 变体、做 Calibration）重新运行。所以改了 Calibration 之后，可以用旧的录制重新跑一遍，不必再调用模型。
2. **事件写进 Event Log，大内容按哈希存在外面。**
   - Event Log 中写一条 `memex.provider.call.recorded` 事件：调用的元数据，加上请求和响应的 sha256。Event Log 仍是唯一的事实来源（约束 A6）。
   - 提示词、模型响应、logprobs 等原文，按 sha256 存入 Instance 数据目录中的内容存储（例如 `.memex/.../blobs/`）。Experiment 快照中的"录制文件的位置"就是这里。哈希同时用来校验原文没有被改动。
3. **密钥过滤放在写入内容存储之前**，统一处理（ADR 0016）。

## Considered Options

- **只在 Model Backend 连接层录制**：实现最省事，验证阶段（只有模型调用不确定）也够用；但产品阶段 Capability 和真实 Domain 的调用会漏录。被否决。
- **在每个 Provider 的端口上录制**：覆盖全面，但回放时 Provider 的内部逻辑不会重新执行，改了 Calibration 就无法用旧录制重新评估。被否决。
- **原文全部直接写进 Event Log**：最简单，但带完整上下文的模型调用会让日志迅速变大（Temporal 文档也指出过这个问题），个人数据也会和日志绑在一起，无法删除。被否决。

## Consequences

- 风险：原文被删除，或者内容存储读不到时，回放会失败。快照、备份和升级（ADR 0013）都要把内容存储一起带上。
- 这和 open-questions.md 第 3 条中"个人数据放在日志之外、事件中只保存引用"（forgettable payload）是同一种做法，以后删除个人数据时不需要改架构。
- contracts.md 删除第六节中"录制和回放的边界"这一待定项；第二节的规则改为按本 ADR 录制。roadmap 和 HANDOFF 中"在 Model Backend 连接层统一处理"的说法相应更新。
- V0 中没有真实模型，录制层用一个假的 Model Backend 来测试（V0.3），V1 接入真实模型时直接复用。
