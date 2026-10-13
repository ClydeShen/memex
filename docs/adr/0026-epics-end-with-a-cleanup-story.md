---
status: accepted
---

# 每个产出代码的 epic 以一个"整理"story 结束：架构审查、修复严重问题、重新索引、更新 as-built 文档

健康的仓库需要定期整理结构、清理技术债，同时 as-built 文档（描述代码**现在**是什么样）要和代码保持一致。现有文档都是设计文档，写的是"打算怎么做"。两件事都放在 epic 的边界上做：epic 是一个完整主题，做完之后停下来整理一次，代价最小，也不会让下一个 epic 建在没整理过的结构上（用户确认，2026-10-13）。调研依据见 docs/research/as-built-docs-2026-10-13.md。

## 决定

### 一、整理 story

每个产出代码的 epic，最后一个 story 是"整理"，按下面的顺序做：

1. **记录基线**：整理开始时的提交；`pnpm check` 全绿；运行同一份 smoke 配置，记下 `traceHash`。
2. **架构审查**：运行 `/mattpocock-skills:improve-codebase-architecture`。如果 coding agent 不能调用这个 skill（它可能只允许用户启动），由用户在该 session 中运行，coding agent 按结果继续。
3. **分类**：把发现分成"严重"和"不严重"，写在整理 issue 的评论里，每条附路径。
4. **修复严重问题**，只做重构，不加功能。每个问题单独提交。
5. **不严重的问题放宽**：每条一行，记在整理 issue 的"待整理"评论和 as-built 页面的"已知缺口"一节，下一个 epic 的整理 story 再看一遍。
6. **验证**：`pnpm check` 全绿；同一份 smoke 配置的 `traceHash` 与基线相同（重构不改变行为）；改变了行为要写明原因。
7. **重新索引**：用项目或环境支持的代码索引工具重新索引代码库（例如 codebase-memory-mcp 的 `index_repository`），并确认索引对应当前提交。环境里没有这类工具时跳过，并在 issue 里注明。
8. **更新 as-built 文档**（见第三节）。
9. **最终检查**：第 8 步之后 `pnpm check` 再次全绿。

### 二、严重和不严重的分界

| | 判断标准 |
|---|---|
| **严重** | 违反依赖规则（A1、A2）而 dependency-cruiser 没有拦住；代码与 docs/architecture/contracts.md 或 schema 不一致；会让**下一个 epic 返工**的结构问题；让核心逻辑无法单独测试的耦合；重复实现了同一个接缝 |
| **不严重** | 命名、文件偏长、少量重复、可以更精简但不影响下一步的地方 |

范围按 ADR 0020 分级：`contracts`、`runtime` 这类**产品核心**包认真整理；`fakes`、`lab` 这类**验证专用**包只修严重问题。薄骨架阶段（端到端 epic）的"功能不全"和"模块较浅"不算严重，只有"会让下一个 epic 返工"才算。

### 三、as-built 文档

- **是什么**：只描述代码现状：职责、公开入口、内部构成、依赖、关键不变量（每条有测试）、与设计的偏差、已知缺口。字段细节不重复（在 schema 的 `.describe()` 和导出的 JSON Schema 里）；"为什么"链接 ADR。
- **放哪里**：`docs/as-built/`，每个包一页，加 `index.md`；机器生成的内容放 `docs/as-built/generated/`，页首标"生成，勿改"，**提交进仓库**。
- **怎么写**：固定模板（调研文件第九节）；用路径和符号名链接代码，不用行号；页首 front matter 写 `covers`（页面覆盖的路径）和 `verified-at`（核对时的提交哈希）。
- **怎么保持更新**：事件驱动，每个 epic 的整理 story 更新一次。过期用 `git diff --name-only <verified-at>..HEAD -- <covers>` 机械地检测。
- **检查**：结构类检查（front matter、路径和链接存在、符号存在）放进 `pnpm check`；新鲜度检查（`docs:stale`）是**整理 story 的硬关卡**，不放进 `pnpm check`，否则每次功能提交都会失败。
- **责任人**：整理 story 里的 coding agent 写；规划 agent 在同步时运行检查命令核对，不采信自述。
- **根目录 `AGENTS.md`**：很薄，只写命令、规则和"先读 `docs/as-built/index.md`"的指针，不放现状描述。

## Considered Options

- **每个 story 都更新文档和整理**：粒度太细，story 之间的结构经常处于中间状态，整理没有意义。被否决。
- **定时整理（例如每周）**：和 epic 的边界脱节，可能整理到一半的结构。被否决。
- **只在 V0 结束时整理一次**：#40 会建在没整理过的 #39 上，返工的代价更高。被否决。
- **用 TypeDoc、madge 生成文档**：它们声明的 TypeScript 依赖都不含 TS 7（2026-10-13 `npm view` 实测）。被否决。

## Consequences

- 新增三个 story：V0-28（as-built 文档脚本、模板、`AGENTS.md`，放在 #38 地基，因为它是检查工具链；依赖 V0-01）、V0-29（整理：端到端，#39）、V0-30（整理：契约，#40）。#40 的第一个 story V0-11 和 #41 的第一个 story V0-24 分别以它们为硬依赖。
- 约束新增 P7；GLOSSARY 新增"As-built 文档"；tech-stack.md 新增 markdownlint-cli2；project-structure.md 新增 `docs/as-built/`、`scripts/` 和根目录 `AGENTS.md`。
- 依据强度：调研没有找到"agent 顺手更新文档"的一手失败案例，它引用的一篇论文（arXiv 2602.11988，结论是仓库概览类的上下文文件对 agent 没有帮助）只读到摘要，任务是 Python。本 ADR 的做法是合理的设计，还没有被实践验证；第一次整理（V0-29）之后回顾一次，必要时修订本 ADR。
- 未核实：`detect_changes` 的确切语义；dependency-cruiser、knip 在 TypeScript 7 下能否工作（V0-02 实测）。
