# Memex

Memex 是一个认知 Agent 的 Framework。接入某个领域的数据后，Agent 会在该领域中建立并不断修正自己的 Worldview（由带溯源和时间的 Claim 组成），用快慢两种思考（Intuition 和 Reasoning）配合现成的模型解决问题，并从经过验证的经验中持续学习。

这是一个个人研究和学习项目，不用于商业目的。

> **中心假设**：一个长期运行的 Agent，变得更有效的主要途径，是改进它关注什么、相信什么、归纳出什么，以及什么时候选择深入推理；而不是不断往推理上下文里塞更多信息。

这是一个待验证的假设。MVP 的目的就是用数据回答它。

## 现状

- **设计阶段已完成，还没有代码。** 下一个里程碑是 M0：契约、运行时、Fake Provider、Lab，以及最简单的 Micro World。
- 路线：M0 骨架 → M1 基线 → M2 双系统 → 正式阶段 → M3 World 0 → M4 学习闭环 → M5 对外扩展 → M6 分发。详见 [docs/roadmap.md](docs/roadmap.md)。

## 文档

| 文档 | 内容 |
|---|---|
| [VISION.md](VISION.md) | 目的、中心假设、第一性原则、核心模块 |
| [GLOSSARY.md](GLOSSARY.md) | 领域术语（写代码和文档时统一使用） |
| [docs/roadmap.md](docs/roadmap.md) | 全局约束、里程碑和当前任务分解 |
| [docs/architecture/](docs/architecture/) | C4 架构图和集成契约 |
| [docs/adr/](docs/adr/) | 已确认的架构决策 |
| [docs/tech-stack.md](docs/tech-stack.md) | 技术栈：作用、分类、引入时机 |
| [docs/code-style.md](docs/code-style.md) | 统一的代码风格与约束 |
| [docs/project-structure.md](docs/project-structure.md) | 目录结构与命名规范 |
| [docs/security-and-data.md](docs/security-and-data.md) | 安全与数据要求 |
| [docs/dependencies.md](docs/dependencies.md) | 依赖分类 |
| [docs/open-questions.md](docs/open-questions.md) | 待决问题 |
| [docs/research/](docs/research/) | 调研与核对的依据（选型、标准、算法、实测） |
| [HANDOFF.md](HANDOFF.md) | 新的开发会话从这里开始 |

## 环境要求

- Node.js 26（见 `.nvmrc`）
- pnpm 12
- 本机的环境信息写在 `.env` 中，不提交；需要填写的键见 `.env.example`。

## 许可证

尚未确定。
