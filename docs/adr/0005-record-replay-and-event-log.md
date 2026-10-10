---
status: accepted
---

# 用录制和回放实现复现，以追加写入的事件日志作为持久化基础

本地模型在 GPU 上运行时，即使 temperature 为 0、seed 固定，批处理也会改变浮点运算的累加顺序，所以不保证每次输出相同。llama.cpp 服务端的 README 明确写道：不同批大小下，logits 不保证逐位一致；开启 prompt cache 复用也会导致结果不确定。Issue #7052 报告，在多个并发槽位下，同一个提示词会得到多种不同的输出。因此复现不能依赖 seed：每次调用 Provider 的输入和输出都录制下来，回放时直接使用录制的结果。

持久化的基础是一个只追加写入的本地事件日志（Event Log）。这就是标准的 Event Sourcing 模式：图存储、Worldview、Experience 和 Trace 都是从日志推导出来的 Projection，可以随时丢弃并重放重建；快照只是为了加速重放的优化手段。快照、回放、崩溃恢复、升级（ADR 0013）和后台整合，都建立在同一个机制上。

时间分为三种，分开记录：
- Claim 的 Valid Time：在 Micro World 中使用模拟器时间。
- Recorded Time：事件写入日志的时间。在 Micro World 中同样使用模拟器时间，以便复现。
- 延迟指标：使用真实的系统时钟。

每条事件都带有以下字段：
- 执行者（ADR 0014）。
- 所属 Instance 的标识：为将来的多用户和共享部署留余地。
- 前一条事件的标识：让日志天然能够分叉，类似 jj 的操作日志，为将来的分支和合并留余地。

事件的存储格式为 JSONL，信封采用 CloudEvents（ADR 0015）。
