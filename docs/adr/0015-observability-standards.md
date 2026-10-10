---
status: accepted
---

# 可观测性只约定标准格式，监控面板是可选项

日志、指标和监控面板不属于核心，但它们的格式必须使用最常见的标准，以便接入绝大多数现有系统。

- **两种记录必须分开**：
  - **认知 Trace**：Agent 的每一个认知步骤。它是学习和实验所用的**数据**，以 CloudEvents 的形式写入事件日志（ADR 0005、0007）。
  - **运维遥测**：系统本身的运行状况。它用于排错和监控。
  
  需要时，认知 Trace 可以导出为 OpenTelemetry span，但两者的存储和用途不同。
- **运维日志**：输出结构化 JSON 到 stdout，字段命名遵循 OpenTelemetry 的日志数据模型（时间戳、严重级别、正文、属性、`trace_id`、`span_id`）。几乎所有日志收集器都能直接读取这种格式。用哪个日志库属于实现细节。
- **Trace 和指标**：使用 OpenTelemetry。与模型和工具相关的属性，使用 GenAI 语义约定（目前仍处于 Development 状态）。
- **导出**：默认写入本地文件。OTLP 导出是可配置项，可以接入 Grafana、Jaeger、Prometheus 等任何兼容 OTLP 的后端。
- **监控面板**：可选依赖，不自行开发通用监控面板。实验结果面板属于 Lab 的范畴，需要单独规划。

## 为什么不直接使用 OpenTelemetry JS 的日志 SDK

截至 2026 年 10 月，各方关于 OpenTelemetry JS 日志 SDK 是否已经稳定的说法互相矛盾：仓库的特性表标注为 Development，而一些二手资料称已经稳定。在 stdout 上输出结构化 JSON，不依赖这个 SDK 的成熟度。
