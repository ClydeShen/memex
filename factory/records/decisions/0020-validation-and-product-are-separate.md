---
status: accepted
---

# 验证和产品分开：实验用来确定方向，实验工具不是产品

（**ADR 0028 修订**：Lab 和 Micro World 放在 `factory/validation/`，实验输出放在 `factory/validation/runs/`，产品只包含 `memex/`。）

此前的文档把"做实验"当成了产品本身：roadmap 把 MVP 定义为 M0–M2，内容全是实验平台、Micro World 和对照组；VISION 把 Lab 列为四个核心模块之一；C4 图把 Lab Runner 和 Experiment Worker 画在 Memex Instance 里面；`memex lab run` 和 `doctor`、`up` 等命令放在一起。

实际上，实验是**验证想法的过程**：它用对比实验和数据，确定产品方向和核心能力。实验场景和真实需求不同，验证完成后，才开始做真正的产品。这与 VISION 原则 9（"实验服务于搭建……目的是引导架构尽快成形、成为可用的系统"）和 ADR 0012（Q1–Q3 有答案后进入正式阶段）一致，只是之前在 roadmap、C4 和核心模块表中没有落实。

## 决定

### 一、路线分成验证和产品两个阶段，中间是决策关卡

```
验证阶段  V0 骨架 → V1 基线 → V2 双系统
            ═[决策关卡]═▶
产品阶段  P1 第一个可用版本 → P2 学习闭环 → P3 对外扩展 → P4 分发
```

- **验证阶段的产出是"决定"和"经过验证的组件"**，不是产品。
- **决策关卡**：Q1–Q3 都有了答案之后，写一份 ADR，说明哪些假设成立、哪些不成立，产品要包含哪些核心能力；同时 Cognitive Contract 冻结为 v1，开始走 PR 和 CI（与 ADR 0012 的"正式阶段关卡"合并为同一个关卡）。
- **P1 是产品的第一个可用版本**：可以对话、有 Worldview、有一组产品命令。具体范围在决策关卡确定。P1–P4 的内容目前都是草案。

### 二、实验工具不属于产品

- **Lab**（World Generator、Oracle、Evaluator、实验运行器、Micro World、Baseline）是**验证工具**，放在仓库中，不随产品发布。
- 实验命令用 `pnpm lab ...` 在仓库中调用，**不进入产品的 `memex` 命令**。决策关卡之后，Lab 可以删除；也可以只保留一小部分，作为产品改进的回归评测（对应 ADR 0011 中"改进要经过验证"）。
- **被验证的是产品组件本身**：Experiment Worker 运行的就是产品的 Runtime 代码（C4）。验证结束后，实验工具丢掉，经过验证的组件（契约、Runtime、Provider）直接进入产品。

### 三、命令分三类

| 类别 | 形式 | 是否随产品发布 |
|---|---|---|
| 工程命令（检查、测试、构建、发布） | 仓库根目录 `package.json` 中的 `pnpm` 脚本 | 否 |
| 验证命令（运行、回放、比较实验） | `pnpm lab ...` | 否 |
| 产品命令 | `memex ...`，参考 OpenClaw、Hermes 等产品 | 是 |

产品命令在决策关卡之后、P1 开始时再设计。ADR 0013 中列出的 `init`、`doctor`、`up`、`models pull`、`upgrade`、`backup` 等，作为产品命令的候选，届时重新确定。

### 四、区分"产品核心"和"验证专用"

V0 的任务按这两类标记：

- **产品核心**（按产品标准认真做，验证后直接进入产品）：Cognitive Contract、Event Log、Claim、Action 与 Policy、Composition Root、Projector、录制与回放（在产品中用于审计和排错）。
- **验证专用**（够用即可，验证后可以丢掉）：Lab 的 Runner 和 Worker、每个 Experiment 一个进程、Fake Provider、污染 Provider、Micro World、实验统计。

### 五、名称对照

此前文档中的名称，按下表理解。ADR 0001–0019 和 factory/records/research/ 中的文字保留原样，不逐一修改。

| 原名称 | 新名称 |
|---|---|
| MVP（M0–M2） | 验证阶段（V0–V2） |
| M0 骨架、M1 基线、M2 双系统 | V0、V1、V2 |
| 正式阶段关卡 | 决策关卡 |
| M3 World 0 | P1 的候选内容 |
| M4 学习闭环、M5 对外扩展、M6 分发 | P2、P3、P4 |

## Consequences

- VISION 的核心模块表：Lab 移出产品，列为验证工具；最核心的模块改为 Cognitive Contract、Worldview、Cognitive Strategy。
- roadmap 按两个阶段重写；V1 的退出条件不再包括 Compose、`memex up`、`doctor` 和 `models pull`，它们属于产品阶段。
- C4 图把 Lab 画在 Memex Instance 外面。
- dependencies.md："每个 Experiment 一个独立进程"从产品的硬依赖改为验证工具的要求。
- 其余文档中的里程碑编号按上表更新。
