# 让 agent 自治 factory：格式、时机、治理和结构化

日期：2026-10-27。起因：ADR 0028 规定 factory 由按 harness 配置好的 agent 自治管理。负责人问了四个问题：有哪些方法可以执行机械检查或硬性限制；怎样让 agent 更好地自治 factory 的内容和格式；怎样让 Claude 在恰当的时机自动维护 harness 和 factory；哪些内容适合 Markdown，哪些适合结构化。负责人同意本记录的方向，并同意据此起草"harness 自动化"epic（2026-10-27）。

可信度标记沿用仓库约定：**[官方/原文]**、**[官方/原文·摘要]**、**[二手]**、**[推断]**。

---

## 一、现状中已经出现的问题 [官方/原文，本仓库]

- HANDOFF 曾写"还剩 4 个待决问题"，当时 open-questions 有 8 条；"31 条全局约束""28 份 ADR"也是手写的数字。已在提交 `ccc0cfaf` 中去掉。手写的汇总一定会过期。
- 调研记录没有 front matter，日期写在正文里。
- GLOSSARY 有 77 条 `_Avoid_`，目前只能靠人记。
- 每写一份 ADR，"后果"一节列出的文件要靠规划 agent 记得去改。

## 二、机械检查和硬性限制的五层 [官方/原文·摘要]

| 层 | 手段 | 强度和局限 |
|---|---|---|
| 1. agent 工具 | Claude Code：`permissions` 的 `allow`、`ask`、`deny`，路径用 gitignore 语法，例如 `Edit(/factory/records/**)`、`Read(...)`；`sandbox.filesystem.denyWrite` 挡住 shell 命令的写入；PreToolUse hook 以退出码 2 拦下工具调用。Codex：`sandbox_mode = "workspace-write"` 加权限配置，可以设只读或不可读的子路径；默认把 `.git`、`.codex`、`.agents` 设为只读 | 写入之前就拦住；但每个工具各配一份，只在本机生效，用户可以改掉。只靠 `Edit` 的 deny 挡不住 shell 写文件，要配合沙箱 |
| 2. 检查脚本 | dependency-cruiser、标记词扫描、front matter 校验、生成物比对、记录只增不改（`git diff --name-status`） | 规则只写一份，各层都调用它 |
| 3. git hooks | pre-commit 跑快的，pre-push 跑全部（#44） | 现阶段的最后一道关卡；`--no-verify` 可以绕过，约定不用 |
| 4. 服务器端 | GitHub 的必需检查、CODEOWNERS | 要走 PR 流程，按 ADR 0012 在决策关卡之后开始。按文件路径限制推送的规则只适用于付费方案的私有仓库，本仓库用不了 |
| 5. 物理隔离 | 不放在 agent 能读到的地方：单独的私有仓库，或者只有 CI 能读的密钥 | 最强；只用于"agent 不能看到"的东西，例如验收场景 |

**原则 [推断]**：判断逻辑只写在 `harness/sensors/` 的脚本里，各层只负责在不同的时机调用它（与 playbook "规则不能只放在 agent hooks 或本地 hooks 里"一致）。

## 三、让 agent 管好内容和格式的方法 [推断]

| 编号 | 方法 | 作用 |
|---|---|---|
| M1 | **列表和数字由脚本生成**：front matter 是唯一来源；ADR 状态表、有效记录索引、待决问题一览由脚本生成，放在标着"生成，勿改"的区块里；正文不写"共 N 条" | 消除第一节的漂移 |
| M2 | **每种文档有可检查的格式**：ADR、调研、计划、交接、as-built 各有模板和 schema（必需的 front matter 字段、必需的章节）；报错写出怎么修 | agent 照着写，写错有明确提示 |
| M3 | **术语检查由 GLOSSARY 生成**：每条 `_Avoid_` 自动变成一条检查规则 | 术语一致不靠记忆 |
| M4 | **新鲜度元数据推广到设计文档**：`covers`（覆盖哪些路径）和 `verified-at`（核对时的提交），和 as-built 相同（ADR 0026） | 用 `git diff` 机械地算出哪份文档过期 |
| M5 | **决策的影响范围写进 front matter**：ADR 的 `affects:` 列出要跟着改的文件；检查确认它们在同一次提交里改了，或者有后续 issue | 不再靠记忆处理"后果"一节 |
| M6 | **流程写成共享 skill**：写 ADR、关闭待决问题、写调研、交接、整理 | Codex 和 Claude Code 用同一套流程 |
| M7 | **新检查用基线逐步收紧**：已有的违规记进基线文件，只拦新增的；基线只能变少 | 不用一次改完旧文档 |
| M8 | **定期运行整理 agent**：跑 M1–M5 的报告，按类开小的修复提交（OpenAI 的 doc-gardening，见 code-factory-2026-10-27.md 的 F2） | factory 的"自治"落到定期巡检上 |
| M9 | **陌生人测试**：全新会话只读 `AGENTS.md`，回答固定问题或完成一个小任务；答不上的地方是缺口 | 检验 playbook 的 ready for stranger 原则 |
| M10 | **负责人的确认有记录**：需要负责人确认的事项在 front matter 写 `confirmed-by` 和日期；状态为"已接受"而没有确认记录的 ADR 被拒绝 | agent 自治，但批准过什么一查就清楚 |

## 四、Claude Code 在什么时机做什么 [官方/原文·摘要]

| 时机 | 机制 | 做什么 |
|---|---|---|
| 会话开始 | `SessionStart` hook，用 `additionalContext` 注入结果 | 状态报告：过期的设计文档、到期的待决问题、等负责人确认的事项、生成区块是否最新 |
| 碰到某个区的文件 | `.claude/rules/` 的规则文件，front matter 用 `paths:` 限定 | 只在需要时载入该区的写法规则 |
| 每次写完文件 | `PostToolUse` hook，匹配 Edit、Write | 对刚改的文件跑毫秒级检查，带修复说明 |
| 准备结束 | `Stop` hook，返回 `decision: "block"` 和 `reason` | 检查该跟着改的文件有没有改（M4、M5）；官方有循环保护，最多连续 8 次 |
| 子 agent 结束 | `SubagentStop` hook | 检查子 agent 的产出是否越界 |
| 上下文压缩前 | `PreCompact` hook | 把进度写成交接记录 |
| 固定操作 | 共享 skill（按描述自动选用，可以在分叉的子 agent 中运行） | M6 |
| 固定角色 | 自定义子 agent（`.claude/agents/`，可以限制工具） | 例如"factory 园丁"只改 `factory/`；"harness 管家"只提议 |
| 定期 | 定时运行的 agent（`/schedule`） | M8 |
| 仓库事件 | GitHub Actions 加 claude-code-action（走 PR 流程以后） | 推送后检查漂移，开 issue 或 PR |

### 4.1 治理：用权限模式实现 ADR 0028 的管理方式 [推断]

| 区 | 规则 | 效果 |
|---|---|---|
| `harness/` | `ask` | agent 提议，负责人批准 |
| `factory/` | `allow`；`factory/records/` 中已有文件的修改用检查拦截（新增允许） | agent 自治，旧记录不改 |
| `memex/` | 只在实现 agent 的配置中放行 | 规划 agent 和园丁不碰产品 |

### 4.2 维护 harness 本身：反馈闭环 [推断]

检查失败时写一条结构化日志（规则、文件、原因）。定期巡检读这份日志，同一原因出现两次以上，就起草一条 harness 修改提议，走 `ask` 由负责人批准。这是 playbook 反馈流程的自动化版本。

### 4.3 注意事项 [推断]

1. **保持跨工具。** 上面是 Claude Code 的机制。判断逻辑只放在 `harness/sensors/` 的脚本里；`.claude/` 下的 settings、rules、agents 都由 harness 生成；Codex 至少通过 `AGENTS.md` 和 pre-push 用上同样的脚本。Codex 是否有对应 PreToolUse 的 hook，没有核实。
2. **hook 要快**：`PostToolUse` 只放毫秒级检查，慢的放到 `Stop`、pre-push 或定期巡检。
3. **定期任务设预算**：限制每次修改的数量和成本，并记账。

## 五、Markdown 还是结构化

### 5.1 依据 [官方/原文]

Anthropic 的 *Effective harnesses for long-running agents*：功能清单用 JSON，原因是模型不太会不恰当地修改或覆盖 JSON 文件，Markdown 更容易被改；并要求 agent 只改每一项的 `passes` 字段，不删改测试。

**[推断]**：结构化本身不能防止篡改。起作用的是三件事：schema 校验拒绝不合格式的修改；按字段检查改动（"这次只允许改 `status`"）；展示用的 Markdown 由数据生成，agent 不改它。

### 5.2 判断规则 [推断]

1. 程序要读、要数、要检查它：结构化。
2. 由很多字段相同的条目组成：结构化。
3. 价值在推理、解释和取舍：Markdown。

两者都有的，用 Markdown 正文加结构化 front matter，或者 YAML 数据加生成的 Markdown 视图。

### 5.3 本仓库的分法 [推断]

**结构化（YAML 加 JSON Schema，Markdown 视图由脚本生成）**：

| 内容 | 现在 | 原因 | 批次 |
|---|---|---|---|
| GLOSSARY | 一份 md | 固定字段：术语、定义、`_Avoid_`、类别；生成后驱动 M3 | 第一批 |
| 全局约束（S/A/E/P） | roadmap 中的表格 | 有编号、来源、检查方式，会被引用 | 第一批 |
| open-questions | md 列表 | 编号、何时决定、调研链接、状态；关闭时只改状态 | 第一批 |
| 目录属性表（ADR 0028 的四个属性） | 还没有 | 检查脚本直接读它 | 第一批 |
| tech-stack 的工具表 | md 表格 | 版本和核实日期要能机械比对 | 第二批 |
| 安全与数据要求（D1…） | md 表格 | 编号、风险来源、开始时间、检查方式 | 第二批 |
| 当前状态（里程碑、下一个 story、等确认的事项） | HANDOFF 中的散文 | 相当于 Anthropic 的进度文件，会话开始的 hook 读它 | 第二批 |
| 反馈记录 | 还没有 | 症状、根因、修复、预防、次数 | 第一条出现时 |

**Markdown 正文加结构化 front matter**：ADR（编号、状态、日期、`confirmed-by`、取代关系、`affects`）；调研（日期、调研时的提交、状态）；计划（里程碑、状态）；as-built（`covers`、`verified-at`）；skill（Agent Skills 标准的 front matter）。

**纯 Markdown**：VISION；架构说明；harness 的 agent 指令；README；HANDOFF 的叙述部分。

**要注意 [推断]**：不要把大段推理放进 YAML 字符串；生成的视图标"生成，勿改"并检查与数据一致；配一条"只允许改这些字段"的检查。

## 六、落地顺序

建议作为一个新 epic"harness 自动化"，排在 V0 之后（理由：V0 是关键路径；这里的脚本和 #69 共用 front matter 的读取代码）。

1. 目录属性表和三区检查；记录的 front matter、schema 和生成的索引（M1、M2、M7、M10）。
2. 设计文档的新鲜度和 ADR 的影响范围（M4、M5）。
3. 第一批结构化迁移，术语检查改为读结构化的 GLOSSARY（M3）。
4. 从 harness 生成各工具的配置：权限、规则、skill（4.1）。
5. Claude Code 的 hooks（第四节）。
6. 共享 skill 和子 agent 角色（M6）。
7. 第二批结构化迁移。
8. 定期整理和反馈闭环（M8、4.2）。
9. 陌生人测试（M9）。
10. 整理 story（ADR 0026）。

## 七、待核实

- Codex 是否有和 Claude Code 的 PreToolUse、Stop 对应的 hook。
- Codex 权限配置在 Windows 上对"仓库内只读子路径"的支持程度（源码显示 Windows 沙箱用 ACL 实现，没有实测）。
- `/schedule` 定时运行的 agent 能否在本仓库的环境中运行 `pnpm check`（需要 Node 26 和 pnpm 12）。
- GitHub 按路径限制推送的规则对公开仓库是否可用，文档说法不一致。

## 来源

- [Anthropic：Effective harnesses for long-running agents](https://anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Claude Code：hooks](https://code.claude.com/docs/en/hooks)、[hooks 指南](https://code.claude.com/docs/en/hooks-guide)
- [Claude Code：权限规则](https://code.claude.com/docs/en/permissions)、[settings 参考](https://code.claude.com/docs/en/settings-reference)
- [Claude Code：memory 与 `.claude/rules/`](https://code.claude.com/docs/en/memory)、[子 agent](https://code.claude.com/docs/en/sub-agents)、[skills](https://code.claude.com/docs/en/skills)
- [Codex 源码（沙箱与受保护路径）](https://github.com/openai/codex)
- [GitHub：About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- 本仓库：factory/records/research/code-factory-2026-10-27.md（F2、F3）
