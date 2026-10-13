# 让 Agent 自动维护 as-built 文档（现状文档）的调研

日期：2026-10-13。对象：怎样让规划 agent 和 coding agent 持续维护"描述代码实际是什么样"的文档（as-built 文档），包括放哪里、怎么写、什么时候更新、怎样检测过期、哪些部分可以从代码生成、codebase-memory-mcp 能帮上什么忙。背景是 ADR 0026 草案：每个产出代码的 epic 末尾有一个"整理" story，其中一步是"更新 as-built 文档"。仓库里目前没有找到 ADR 0026 的文件，下文按任务描述中的流程理解。调研时仓库提交为 `78e47825`，`packages/` 下还没有代码。

可信度标记（沿用仓库约定）：
- **[官方/原文]**：读过官方文档、规范、工具 README 或论文页面的相关部分。
- **[官方/原文·摘要]**：只读到摘要、概述页，或该页对某个细节没有写。
- **[二手]**：来自搜索结果摘要等第三方描述，没有追到一手来源。
- **[推断]**：本文作者的判断，没有直接证据。
- **[实测]**：2026-10-13 在命令行执行 `npm view` 得到的结果。

**范围提醒**：下面的"证据"只写读到的内容。业界对"agent 顺手更新文档"的失败案例，我没有找到一手来源，第八节如实说明。

---

## 总览

| 问题 | 推荐做法 | 依据强度 | 可信度 |
|---|---|---|---|
| 1. 是什么 | as-built 文档按 Diátaxis 属于"参考（reference）"，结构镜像代码结构；按 arc42 属于"构件视图（building block view）"的文字版。它只描述"现在是什么"，"为什么"链接到 ADR，"打算怎样"留在设计文档 | 中：框架本身说得清楚，但没有框架专门定义 as-built | [官方/原文] + [推断] |
| 2. 放哪里 | 集中放在 `docs/as-built/`：每个包一页，加一个 `index.md`；机器生成的内容单独放 `docs/as-built/generated/`，页首标明"生成，勿改"。包内只放很薄的 `AGENTS.md`（指针加命令），不放现状描述 | 中：集中 vs 就近两种做法都有一手依据，选择是权衡 | [官方/原文] + [推断] |
| 3. 怎么写 | 只写读代码看不出来的东西：职责、边界、不变量、与设计的偏差、已知缺口；每页用固定模板，用文件路径和符号名链接代码，不用行号；页首 front matter 记录 `verified-at`（被核对的代码提交）和 `covers`（页面覆盖的路径） | 中：多个一手来源一致反对"复述代码"和"文件逐个说明"；模板字段是本文提议 | [官方/原文] + [推断] |
| 4. 频率和触发 | 事件驱动：每个 epic 的整理 story 必须更新；story 内不强制。用 `git diff --name-only <verified-at>..HEAD -- <covers>` 机械地找出过期页面；"结构类"检查（路径存在、链接有效）放进 `pnpm check`，"新鲜度"检查只在整理 story 作为关卡 | 中：Swimm、Google 的做法支持"自动检测加人工处理"；触发时机是针对本仓库的设计 | [官方/原文] + [推断] |
| 5. 保持统一 | 模板加 GLOSSARY.md 加 markdownlint-cli2 加一个很小的术语检查脚本；单一责任人：整理 story 里的 coding agent 写，规划 agent 核对。Vale 对中文是否可用没有查到，先不引入 | 中偏弱：Google 的"文档要有负责人"有一手依据；中文术语检查工具未核实 | [官方/原文] + [推断] |
| 6. 自动生成 | 包清单、依赖图、JSON Schema 可以生成，工具都已在栈内或是 Node 自带：`pnpm ls -r --depth -1 --json`、`depcruise -T mermaid`、`z.toJSONSchema()`。TypeDoc、madge 的声明依赖都不含 TypeScript 7，不建议用；api-extractor 需要 `.d.ts`，与"不构建"的栈不合 | 中：命令来自官方文档；TS 7 兼容性只是版本声明，没有实测 | [官方/原文] + [实测] |
| 7. 索引工具 | codebase-memory-mcp 适合做"整理 story 里的审查输入"：`get_architecture` 的聚类可以对照文档里的构件划分，`detect_changes` 把改动映射到符号。它不会指出"哪页文档过期"，这一步要靠我们自己的 `covers` 字段。重新索引在整理 story 的第一步 | 中偏弱：README 和工具定义读过，没有实际运行；基准是作者自评 | [官方/原文] + [推断] |
| 8. 分工 | 把"更新 as-built"写成可用命令检查的验收标准（第十节）；规划 agent 在同步 issue 时运行这些命令，不读 coding agent 的自述。另外在新的上下文里让一个 reviewer 对照代码核对文档 | 中：Anthropic 的最佳实践明确建议"给出验证方式"和"独立审查" | [官方/原文] |

---

## 一、是什么：as-built 文档和其他文档的区别

### 证据

- **Diátaxis** 把文档分成四类：教程、操作指南、参考、解释。[官方/原文·摘要]（首页只列出四类名称）。其中"参考"的原则是：只描述、不教学；"文档的结构应当镜像产品的结构"；读者能在预期的位置找到信息；用简短的例子说明用法。[官方/原文]（reference 页）。as-built 文档的内容就是"参考"这一类，再加一小部分"解释"（为什么这样划分）。Diátaxis 没有专门定义"as-built"这个词。
- **arc42 第 5 节"构件视图"**：描述系统静态分解成的构件及依赖，是每份架构文档必备的一节。分层：第一层是整个系统的白盒、各构件的黑盒；之后对重要的构件继续往下拆。黑盒描述"职责和用法"，可以只用一张表（名称、职责，可选接口和代码位置）。建议"重要性优先于完整性"，"省略普通、简单、无聊或标准化的部分"，"隐藏黑盒的内部实现"；要写明源代码怎样对应到构件，映射要与目录和文件结构一致，保证每段代码都能在视图里找到位置。[官方/原文]
- **C4 模型**：四层抽象（软件系统、容器、组件、代码）和对应的四种图，与记法和工具无关。[官方/原文]（首页）。首页没有写怎样保持图与代码同步。
- **docs-as-code**（Write the Docs）：用写代码的工具写文档，包括 issue 跟踪、版本控制、纯文本标记、代码评审、自动化测试；团队可以"禁止不带文档的新功能合并"。[官方/原文]。页面没有细讲 CI 检查。
- **Google 的《Software Engineering at Google》第 10 章**：把文档类型分开（参考文档、设计文档、教程、概念文档、落地页），警告不要混在一起；设计的理由和实现细节属于设计文档，不属于 API 文档。[官方/原文]
- **Living Documentation**（Martraire）：书的出版社简介说，文档应当与软件设计"以同样的速度变化"，并通过自动化生成文档和图。[二手]。我没有打开书或出版社页面，只看到搜索结果里的摘要，因此不据此下结论。
- **AGENTS.md**：官网的定位是"给 agent 的 README"；README 面向人类（快速开始、项目介绍、贡献指南），AGENTS.md 放构建步骤、测试、约定等会让 README 变乱的细节。[官方/原文]

### 区别（按 Memex 的文件）

| 类型 | 回答的问题 | 时态 | Memex 里的例子 | 谁会让它过期 |
|---|---|---|---|---|
| ADR | 为什么这样决定 | 决策时的快照，之后只增补 | `docs/adr/0008-…` | 不过期，被新 ADR 取代 |
| 设计文档 | 打算怎么做 | 将来时 | `docs/architecture/contracts.md`、`docs/architecture/c4.md`、`docs/plans/v0-integration.md` | 实现偏离设计时 |
| **as-built 文档** | **代码现在是什么样** | **现在时** | **（新）`docs/as-built/`** | **代码改动时** |
| API 参考 | 每个导出符号的签名和字段 | 现在时，逐符号 | 由 Zod schema 导出的 JSON Schema | 应当随代码生成，不会独立过期 |
| README | 这是什么、怎么上手 | 现在时，面向新读者 | `README.md` | 缓慢 |
| AGENTS.md / CLAUDE.md | agent 做事要遵守什么、用什么命令 | 规则 | （目前仓库没有） | 约定变化时 |

### 对 Memex 的建议

1. as-built 文档定位为"参考"：描述现状，不教学，不辩护。"为什么"只写一句并链接 ADR。[推断]
2. **与设计文档的关系**：`docs/plans/v0-integration.md` 第 7 行已经规定"字段以 `@memex/contracts` 中的 Zod schema 为准"，所以 as-built 不重复字段，只链接生成的 JSON Schema。当实现偏离设计文档时，as-built 页的"与设计的偏差"一节列出偏差；V0-27 已有"回写实现中对 contracts.md 的修改"一步，那一步以这一节为输入。[推断]
3. `docs/architecture/c4.md` 是设计层的 C4（状态：草案 v0）。as-built 文档不另画 C4 图，只在"依赖"一节放由 dependency-cruiser 生成的图（第六节），避免两套手画图。[推断]

### 与现有约束的关系

- code-style.md 第十节第 7 条：契约的说明写在 schema 的 `.describe()` 里。as-built 文档因此**不重复字段说明**，只链接导出的 JSON Schema。Zod 文档说 `.describe()` 是 `.meta({ description })` 的简写，两者等价，`.meta()` 是推荐写法，`.describe()` 仍可用。[官方/原文]，不冲突。
- 文档用中文；术语用 GLOSSARY.md（见第五节）。

---

## 二、放哪里：集中还是就近，生成还是手写

### 证据

- Google：文档"应放进版本控制，并放在源代码旁边"；C++ 的 API 参考文档应当写在头文件里；每个 API 通常有自己的 g3doc 目录，里面是 Markdown；跨 API 的主题（例如开发者指南）放不进某一个代码目录，所以单独放在按主题组织的文档库里。代码与文档可以在同一个变更里修改，但作者承认这种做法"仍需推广"。[官方/原文]
- AGENTS.md：monorepo 中每个子项目可以有自己的 AGENTS.md，agent 读最近的一个，离被编辑文件最近的优先，用户的聊天指令优先于一切。[官方/原文]
- Claude Code：默认情况下，只有在工作目录及以上没有 `CLAUDE.md` 时才读取 `AGENTS.md`；子目录里的 `AGENTS.md` 会在 agent 打开该目录下的文件时按需加载；`CLAUDE.md` 里可以用 `@path` 导入文件，但导入的内容同样在启动时加载，不会减少上下文占用。[官方/原文]
- Claude Code 官方的建议：每个 `CLAUDE.md` 控制在 200 行以内；"可以通过读代码得出的内容"、"逐个文件的说明"、"经常变化的信息"不要写进去；详细的 API 文档应当链接而不是复制。[官方/原文]
- 论文 *Evaluating AGENTS.md*（arXiv 2602.11988，最新版 v3，2026-09-29）：在 SWE-bench 任务和一组带开发者自己写的上下文文件的仓库上比较，上下文文件总体上没有提高任务成功率，推理成本平均增加 20% 以上；agent 会认真遵守文件里的指令；"仓库概览"虽然流行也受厂商推荐，但没有帮助；上下文文件适合写"非标准的写法"。[官方/原文·摘要]（只读了摘要页；任务集是 Python，对 TypeScript 项目是否同样成立没有直接证据。）
- api-extractor 的 API 报告（`.api.md`）应当提交到 Git，"这样 API 签名的变化会在 pull request 里以 diff 出现"；rushstack 用 CODEOWNERS 要求 API 变化必须有指定的人批准。[官方/原文]

### 利弊

| 做法 | 好处 | 坏处 |
|---|---|---|
| 集中在 `docs/as-built/` | 与现有的 `docs/` 结构一致；人类和 agent 都只看一个地方；整理 story 一次处理；不用在每个包里加规则 | 离代码远，改代码时不会碰到它；靠 `covers` 字段和检查脚本来弥补 |
| 就近放在包里（包内 README、AGENTS.md） | 改代码时顺手看到（Google 的 g3doc 做法） | 现有的 `project-structure.md` 第二节没有给包内文档留位置；AGENTS.md 会在每次会话加载，放现状描述会占用上下文，并且上面的论文说概览类内容没有帮助 |
| 生成内容提交进仓库 | PR 里能看到 diff（api-extractor 的做法）；agent 不必运行工具就能读 | diff 噪声；可能有人手改 |
| 生成内容不提交，用时再生成 | 没有噪声，也没有"手改生成物"的可能 | 读的人要先运行命令；无法在评审里看到变化 |

### 对 Memex 的建议

```
docs/as-built/
├─ index.md                  包清单、阅读顺序、"与设计文档的关系"、模板链接
├─ contracts.md              每个包一页，模板见第九节
├─ runtime.md
├─ fakes.md
├─ lab.md
└─ generated/                机器生成，页首有"生成，勿改"和生成命令
   ├─ packages.md            包清单（来自 `pnpm ls`）
   ├─ dependency-graph.md    Mermaid 依赖图（来自 dependency-cruiser）
   └─ json-schema/           每种 kind 一个文件（来自 `z.toJSONSchema()`）
```

- **手写页和生成物分开放**，手写页用相对链接引用生成物，不复制内容。这样"哪些内容不能手改"从目录就能看出来。[推断]
- **生成物提交进仓库**，并在整理 story 里重新生成、检查 `git diff` 是否为空，做法参照 api-extractor 对 API 报告的处理。[推断]（是否接受提交生成物，见第十二节。）
- **包内只放很薄的 `AGENTS.md`**（需要时再建）：写命令和"先读哪页 as-built"的指针，不写现状。项目当前没有根目录的 `AGENTS.md` 或 `CLAUDE.md`；建不建属于另一个问题，本文只提醒：不要把 as-built 的内容搬进去。[推断]
- 页面数量按包，不按目录。arc42 建议"重要性优先于完整性"，所以 `src/` 下只有重要的概念目录才进"内部构成"表。[官方/原文] + [推断]

### 与现有约束的关系

- `project-structure.md` 第五节"什么时候建什么"规定不要提前建空目录：`docs/as-built/` 随第一个 epic 的整理 story（#38 之后）建立，每个包的页面在该包有代码之后才建。[推断]
- 包名和目录名沿用 `project-structure.md` 第三节的命名：文件名用包的目录名，如 `contracts.md`。

---

## 三、怎么写：写什么、不写什么、怎样链接、怎样标注核对时间

### 证据

- Claude Code 官方：每行都问"删掉它会不会让 Claude 犯错"；不要写能从代码读出来的内容、逐个文件的描述、经常变化的信息。[官方/原文]（best-practices 页）
- arc42：隐藏黑盒的内部；写清源代码与构件的映射；接口用单元测试或运行时场景说明，而不是长篇文字。[官方/原文]
- Google：每篇文档只有一个目的；前几段要回答谁、什么、何时、哪里、为什么，其中"何时"要写明创建、评审或更新的时间；给文档附"新鲜度日期"（`reviewed`），并且在文档里署名"最后评审人"，这提高了被采用的程度。[官方/原文]
- Swimm：把文档里的代码片段、路径等元素与代码耦合，CI 会检查它们是否与最新代码一致；常规的位移、改名能自动同步，重要变化会让检查失败，并把受影响的文档标为"可能已过期"。[官方/原文]
- Anthropic 的长时运行 agent 文章：agent 把功能标记为完成却没有真正测试；功能清单用 JSON，因为"模型不太会不恰当地改写 JSON，相比 Markdown"；git 提交用作交接记录。[官方/原文]

### 哪些值得写，哪些不该写

| 值得写（读代码很难直接得到） | 不该写（会过时或只是复述） |
|---|---|
| 每个概念目录的**职责**和**边界**（谁能依赖它、它不负责什么） | 函数、字段的逐个说明（交给 `.describe()` 和 JSON Schema） |
| 读代码看不出来的**不变量**，并指向证明它的测试文件 | "这个文件做了什么"一类的复述（code-style.md 第十节第 6 条同样不让注释这样写） |
| **与设计文档的偏差**：设计写了什么、实际是什么、为什么 | 行号、函数体的片段 |
| **已知缺口**：设计里有、代码里还没有的部分 | 依赖列表（生成）、包清单（生成） |
| 怎样验证这一页的主张：命令或测试路径 | 外部工具的详细用法（链接官方文档或 `docs/research/`） |

### 页面结构

固定模板见第九节。要点：每页顶部是机器可读的 front matter（`covers`、`verified-at`），正文按"职责、公开入口、内部构成、依赖、关键不变量、与设计的偏差、已知缺口、验证"八节。

### 怎样链接代码

- 用**仓库相对路径**加**符号名**（反引号），例如 `[append-event.ts](../../packages/runtime/src/event-log/append-event.ts)` 与 `appendEvent`。**不用行号**：行号在任何改动后都会偏。这是本文的判断；Swimm 的做法是用工具追踪代码片段的位移。[推断]
- 引用设计依据时写 ADR 编号和文件路径，不复制 ADR 内容。
- 每个被引用的路径和符号都能被脚本检查（第四节）。

### 怎样标注"最后核对于哪个提交"

- 在 front matter 里写 `verified-at: <40 位提交哈希>`，含义是"核对时代码所在的提交"。因为文档本身也要提交，这里**写的是核对时的 `HEAD`（文档提交的父提交）**，而不是文档提交自己的哈希（一个提交无法包含自己的哈希）。[推断]
- 同时写 `verified-on: 2026-xx-xx` 和 `verified-by`，对应 Google 的"新鲜度日期"和"最后评审人"。[官方/原文]（Google）+ [推断]
- 判断是否过期：`git diff --name-only <verified-at>..HEAD -- <covers 中的路径>` 有输出，就说明这页覆盖的代码在核对之后变过。文档自己的提交不在 `covers` 里，所以不会让自己过期。[推断]

### agent 读者和人类读者的需求

- 官方的说法：README 给人，AGENTS.md 给 agent，放构建步骤、测试和约定。[官方/原文]
- Claude Code 的 `CLAUDE.md` 是"上下文，不是强制配置"；要强制，用 hook。[官方/原文]
- 论文摘要：agent 会认真遵守上下文文件的指令，但仓库概览没有帮助，LLM 生成的上下文文件总体上也没有帮助。[官方/原文·摘要]
- 据此的判断：给 agent 的文件（AGENTS.md）要短，只放命令和规则；as-built 页是"按需读取的参考"，由 AGENTS.md 指向，而不是预先加载。人类读者需要的"概览和为什么"，在 `docs/as-built/index.md` 里用几句话加链接解决。[推断]

### 与现有约束的关系

- 中文写作、术语用 GLOSSARY.md、`_Avoid_` 列出的词不用。
- code-style.md 第十节的"注释只写为什么"同样适用于 as-built 文档：不复述代码。

---

## 四、频率和触发；怎样发现文档过期

### 证据

- Google：文档默认会变旧，"随着时间推移，文档会变得过时、废弃"；GooWiki 退役时约 90% 的文档在前几个月没有浏览或更新；原因是没有负责人、没有添加文档的流程、发现错误的人无法修改、工程师把文档当负担。做法：文档要有负责人，可以走 bug 跟踪和代码评审；附新鲜度日期，超过一段时间（例如三个月）没动就发邮件提醒；不再有用的文档要么删除、要么标明已过时。[官方/原文]
- Swimm：在 CI 中验证文档所耦合的代码元素；失败时可以阻止提交或 PR，或开一个 issue 并限定处理时间；受影响的文档被标记为"可能已过期"。[官方/原文]
- Write the Docs：团队可以"禁止不带文档的新功能合并"。[官方/原文]
- api-extractor：API 报告随 PR 的 diff 出现，并可用 CODEOWNERS 要求批准。[官方/原文]
- Claude Code 的 `/doctor prompt-audit`：检查指令文件里"引用了不存在的文件或命令"的内容和相互矛盾的内容；报告提出修改建议，在你要求之前不会改文件。[官方/原文]
- Claude Code 的 Stop hook 可以运行脚本，"阻止本轮结束，直到检查通过"；`CLAUDE.md` 的指令只是建议，hook 是确定性的。[官方/原文]
- lychee（链接检查器）可以检查 Markdown 里的本地相对链接、锚点（`--include-fragments`），`--offline` 只检查本地；退出码 2 表示有链接失败。[官方/原文]
- markdownlint 的 MD051 检查链接片段（锚点）是否有效；规则列表中没有检查"相对链接指向的文件是否存在"的规则。[官方/原文]

### 检测过期的机制，按强度排序

| 机制 | 检测什么 | 做法 | 依据 |
|---|---|---|---|
| 路径存在检查 | 文档中引用的路径已被删除或改名 | 脚本抽取反引号和链接中的路径，检查文件存在 | 链接部分用 lychee `--offline`（外部二进制，npm 中是否有可用封装没核实）或一个短的 Node 脚本；`/doctor prompt-audit` 对指令文件做同类检查 [官方/原文] |
| 符号存在检查 | 文档提到的函数、类型已不存在 | 脚本抽取反引号中的标识符，在 `covers` 路径下 `grep` | [推断] |
| 变更到文档的映射 | 代码变了，对应的页面没更新 | `covers` 加 `verified-at`，用 `git diff --name-only` 检查 | Swimm 把文档与代码元素耦合 [官方/原文]；本文的做法是页面级耦合，更粗但不需要专用工具 [推断] |
| 新鲜度日期 | 很久没人核对 | `verified-on` 超过阈值提醒 | Google [官方/原文]；对 Memex 价值较低：Memex 的节奏是 epic，不是日历 [推断] |
| 生成物 diff | 生成内容与代码不一致 | 重新生成后 `git diff --exit-code docs/as-built/generated` | api-extractor 的做法 [官方/原文] |

### 事件驱动还是定时

- **事件驱动**：Memex 的工作单位是 epic（`docs/plans/v0-integration.md` 第六节：#38 地基、#39 端到端、#40 契约、#41 关卡），而且 ADR 0025 规定每个 story 完成后单独提交。所以触发点就是"epic 的整理 story"。[推断]
- **story 里不强制更新**：story 内强制会拖慢 coding agent，而且 `pre-push` 已经运行完整的 `pnpm check`（tech-stack.md），再加文档新鲜度检查，会让每次推送都被中间状态卡住。所以分两层：
  1. `pnpm check` 里只放**结构类检查**（路径存在、链接有效、front matter 字段齐全、`verified-at` 是当前历史的祖先：`git merge-base --is-ancestor <hash> HEAD`）。
  2. **新鲜度检查**（`covers` 内有变更而页面没更新）只在整理 story 里运行，必须为空才能关闭该 story。
  [推断]
- **定时检查**：Memex 现在没有 CI（tech-stack.md：hooks 只是本机便利，CI 在决策关卡之后），所以定时任务暂时没有地方运行。到有 CI 之后，可以每周运行一次新鲜度检查并开 issue（Swimm 的"开 issue 并限期"做法）。[推断]

### 与现有约束的关系

- ADR 0012、0020：决策关卡之前不增加流程负担，所以新鲜度检查不进 pre-push。
- 本文提议的 `pnpm docs:check`、`docs:stale` 脚本**目前不存在**，需要在某个 story 里实现；它们应当是几十行的 Node 脚本（Node 26 直接运行 `.ts`），不引入新的依赖（tech-stack.md 选型原则 1）。[推断]

---

## 五、保持统一：多个 agent 和人写，怎样保持风格和术语一致

### 证据

- Vale：命令行的"散文 lint"工具，用 YAML 定义风格，重点是"多个作者之间的一致性"；对 Markdown 能识别结构，默认忽略代码块和行内代码。[官方/原文]。词表（vocabulary）：目录 `<StylesPath>/config/vocabularies/<name>/` 下的 `accept.txt`（批准的词）和 `reject.txt`（禁用的词），每行一个正则，由 `.vale.ini` 中的 `Vocab` 键启用。[官方/原文]。Vale 对中文的支持，我没有在读到的页面里找到答案。
- Vale 是 Go 程序；`npm view vale` 返回 404（2023 年已被撤下）。[实测]
- markdownlint-cli2：用配置文件驱动的 Markdown lint，可 `--fix`；规则 MD013（行长）默认 80 字符，MD025（多个一级标题）、MD041（首行为一级标题）、MD051（锚点有效）。[官方/原文]。版本 0.23.3，2026-09-20 更新。[实测]
- Google：文档要有负责人，才能走评审和 bug 流程；三种评审：技术（准确性）、受众（清晰度）、写作（一致性）。[官方/原文]
- Claude Code：多个互相矛盾的指令，Claude 可能任选一个；要定期检查冲突和过时的内容。[官方/原文]

### 对 Memex 的建议

1. **单一责任人**：每个 epic 的整理 story 里的 **coding agent** 是 as-built 页的唯一作者；**规划 agent** 是核对人，只运行检查并读 diff，不直接改页面（与"规划 agent 只读代码"的分工一致）。人类用户批准结构变化。页首的 `verified-by` 记录是哪个 story。[推断]
2. **模板**：第九节的模板就是统一的主要手段，章节名、字段名固定。
3. **术语**：GLOSSARY.md 的 `_Avoid_` 列表是现成的"禁用词表"。最小做法是一个脚本：读取 GLOSSARY.md 中每个术语的 `_Avoid_` 词，在 `docs/as-built/` 中搜索它们。注意 `_Avoid_` 里有些是**限定用法**（例如 "ground truth" 专指评测时生成器掌握的 World，在那个意思上可以用），脚本只应当报告、不自动改，由人工判断。[推断]
4. **Markdown 风格**：markdownlint-cli2，关掉 MD013（中文不按 80 字符断行）。可信度：规则本身 [官方/原文]，关掉 MD013 的决定 [推断]。
5. **Vale 暂不引入**：中文支持没有核实，而且它是一个额外的非 npm 二进制，要登记依赖分类（tech-stack.md 选型原则 3）。如果以后要用，先用 `reject.txt` 做术语表的实验。[推断]
6. **链接检查**：见第四节；markdownlint 没有"相对链接文件存在"的规则，所以需要 lychee 或自己的脚本。

### 与现有约束的关系

- 工具若要新增，要在 tech-stack.md 里登记分类；markdownlint-cli2 属于"开发工具"。本文不修改 tech-stack.md。

---

## 六、哪些可以自动生成（TypeScript 7 + Zod + dependency-cruiser + pnpm workspaces）

### 版本核对（2026-10-13，`npm view <包名> version peerDependencies time.modified`）[实测]

| 包 | 最新版 | 声明的 `peerDependencies` | 最后更新 | 对 TS 7 的含义 |
|---|---|---|---|---|
| typescript | 7.0.2（`next` 标签为 7.1.0-dev） | — | 2026-10-13 | 与 tech-stack.md 一致：编程接口要等 7.1 |
| zod | 4.6.7 | 无 | 2026-10-12 | 纯 JS，不依赖编译器接口 |
| dependency-cruiser | 18.6.0 | **没有声明** | 2026-10-11 | 声明里没有限制，但这**不等于能在 TS 7 下工作**；V0-02 实测 |
| knip | 6.41.0 | **没有声明** | 2026-10-09 | 同上 |
| typedoc | 0.28.20 | `typescript: 5.0.x … 5.9.x \|\| 6.0.x` | 2026-07-05 | **声明不含 7**；不建议 |
| @microsoft/api-extractor | 7.59.4 | 无；自带依赖 `typescript 5.9.3` | 2026-10-06 | 用自带的 TS 5.9.3，可能能分析 `.d.ts`，但需要 `.d.ts` 输入 |
| madge | 8.0.0 | `typescript: ^5.4.4` | 2024-08-05 | **声明不含 7**，两年没更新；不建议 |
| ts-morph | 28.0.0 | 无 | 2026-04-12 | 没核实它与 TS 7 的关系；TS 7 本身没有编程接口 |
| skott | 0.35.12 | 无；自带依赖 `typescript ^5.9.3` | 2026-09-11 | 同 api-extractor 的情形，没有核实 |
| markdownlint-cli2 | 0.23.3 | — | 2026-09-20 | 不涉及 TypeScript |
| typedoc-plugin-markdown | 4.13.1 | `typedoc: 0.28.x` | 2026-09-18 | 随 typedoc |

注：dependency-cruiser 和 knip 的 `peerDependencies` 查询结果为空，只说明它们在 npm 元数据里没有声明；它们是否在运行时 `require('typescript')`、在 TS 7 下表现如何，没有核实。这与 tech-stack.md"尚未核实"第 1 条一致。

### 哪些信息可以生成

| 现状信息 | 生成方式 | 来源 | 与 TS 7 | 可信度 |
|---|---|---|---|---|
| 包清单（名称、目录、版本、workspace 内的互相依赖） | `pnpm ls -r --depth -1 --json`（只列出项目）；`--only-projects` 显示 workspace 内的依赖 | pnpm 文档 | 无关 | [官方/原文] |
| 包之间和目录之间的依赖图 | `depcruise … -T mermaid`（或 `-T archi`、`-T ddot`、`-T dot`），用 `--include-only` 限定到 `packages`、`--focus` 看某个模块及其邻居、`--collapse` 折叠到目录层级 | dependency-cruiser 的 `doc/cli.md` | 取决于 V0-02 实测 | [官方/原文] |
| 架构规则（谁能依赖谁）的现状 | `.dependency-cruiser.cjs` 本身就是机器可读的规则；as-built 页链接它，不复制 | `project-structure.md` | — | [推断] |
| 契约的字段和说明 | 用 `z.toJSONSchema()` 导出；`.describe()` 的内容会进入 `description`；`io: "input"` 可导出输入类型；`transform`、`bigint`、`date` 这类类型默认会抛错，可以用 `unrepresentable: "any"` 退化成 `{}` | zod.dev | 与 TS 7 无关 | [官方/原文] |
| 包的公开导出清单 | 因为每个包只有 `src/index.ts` 一个公开入口，可以用一个小脚本在运行时 `import` 后列出 `Object.keys`；类型只导出的符号看不到 | project-structure.md 第二节 | 无关 | [推断] |
| 测试清单、测试数量 | `vitest list`（没有核实该命令的输出格式） | — | — | [推断]，未核实 |
| 未使用的导出和依赖 | knip 的报告 | tech-stack.md | 见上表 | — |
| 公开 API 的签名报告 | api-extractor 的 `.api.md`（要求 `.d.ts` 输入） | api-extractor 文档 | 需要构建出 `.d.ts`，与"实验阶段不构建"的栈不合 | [官方/原文] + [推断] |

### 对 Memex 的建议

- **生成什么**：包清单、依赖图、每种 `kind` 的 JSON Schema。三者都不需要新依赖：`pnpm`、`dependency-cruiser`（已在栈内）、`zod`（已在栈内）。[推断]
- **JSON Schema 已经是 v0-integration.md 的关卡**：I1 的关卡写了"导出的 JSON Schema 能校验 `examples/` 中的全部文件"。as-built 的 `generated/json-schema/` 与它共用同一个导出脚本，不要写第二个。[推断]
- **不引入 TypeDoc、madge**：它们的声明不含 TS 7。**api-extractor** 暂不引入，因为它需要 `.d.ts`；契约本来就在 Zod schema 里，JSON Schema 已经覆盖了"公开契约"。[推断]
- **生成命令**统一成一个入口，例如 `pnpm docs:generate`，把输出写到 `docs/as-built/generated/`，页首写明命令。这个脚本目前不存在，需要在某个 story 里建。[推断]

### 与现有约束的关系

- tech-stack.md："Node 自带的功能够用就不装包"，所以生成脚本用 Node 26 直接运行的 `.ts`。
- ADR 0009 要求 Zod 导出 JSON Schema，本节是同一路径的延伸。
- 若 V0-02 发现 dependency-cruiser 在 TS 7 下不能工作，退路（另装一份 TS 6）同样影响依赖图生成。

---

## 七、代码索引工具：codebase-memory-mcp

### 证据（来自 GitHub README、项目页、基准报告，以及本机该 MCP 服务器暴露的工具定义）

- 是什么：把代码库索引成知识图谱的 MCP 服务器，本地运行，不需要 API Key；MIT 许可。[官方/原文]
- 工具（README 列出 17 个）：`index_repository`（默认同步；可 `async`）、`index_status`、`list_projects`、`delete_project`、`check_index_coverage`、`search_graph`、`trace_path`、`detect_changes`、`query_graph`、`get_graph_schema`、`compare_graphs`、`get_code_snippet`、`get_file_outline`、`get_architecture`、`search_code`、`manage_adr`、`ingest_traces`。[官方/原文]
- **`detect_changes`**：README 说它"把 git diff 映射到受影响的符号和影响范围（blast radius），并给出风险分类"，并分页返回改动的文件、受影响的符号和模块摘要；项目首页写的是"把**未提交**的 git diff 映射到…"。[官方/原文]。本机该服务器暴露的工具定义里，参数有 `project`（必填）、`base_branch`（默认 `main`）、`depth`（默认 2）、`scope`、`since`（"Git ref 或日期，例如 HEAD~5、v0.5.0、2026-01-01"）。[官方/原文]（工具定义）。两处描述（只看未提交的改动，与带 `since` 参数）是否一致，我没有运行验证，见第十一节。
- **`index_repository` 的模式**：`full`（所有文件加相似度/语义边）、`moderate`、`fast`（过滤后的文件，不做相似度/语义）；所有模式都做类型感知的调用和使用解析。参数 `persistence`（默认 `false`）为真时会把压缩的图写到仓库里的 `.codebase-memory/graph.db.zst`，供团队共享。[官方/原文]（工具定义和 README）
- **自动更新**：后台 watcher 检测"当前 MCP 会话所在项目"的文件变化并增量重新索引；git 项目默认被监视；其他已索引的仓库需要手动重新运行 `index_repository`；"只有第一次构建或大的 `git pull` 之后才需要手动索引"；没有变化时重新索引"通常是亚毫秒级的空操作"。`index_status` 的返回里有 `watch` 对象。[官方/原文]
- **`check_index_coverage`**：检查某些路径或范围是否已索引且新鲜；"结果干净只表示没有记录到缺口，不是完整性的证明"。[官方/原文]
- **`compare_graphs`**：比较两个已索引快照之间节点和边的增减。[官方/原文]
- **`get_architecture`**：返回语言、包、路由、热点、聚类和 ADR 的概览；工具定义里说明它包含"clusters"：对调用/导入图做 Leiden 社区发现，给出事实上的模块（带标签、成员数、内聚度、代表节点），"这些聚类常常横跨目录布局"。[官方/原文]
- **`manage_adr`**：对 ADR 做增删改查，模式 `get`/`update`/`sections`；`sections` 只改写指定的小节，其余字节不变；ADR 存在工具自己的存储里，"跨会话保留"。[官方/原文]
- **存储**：SQLite，位于用户的缓存目录，可通过环境变量改位置。[官方/原文]
- **对 TypeScript 的准确度**：基准报告（v0.3.0，2026-03-01）里 NestJS 项目得分 10.5/12（87%）；函数参数和返回类型大多没有被提取；查询结果最多 200 行；评分由项目维护者自己做；没有精确率和召回率。[官方/原文]
- README 对 TypeScript 的支持写了"所有 162 种语言"和"158 个 tree-sitter 语法"两个不同的数字。[官方/原文]
- README 没有写：怎样用它保持文档与代码同步；`git pull`、切分支之后的建议；git hook 用法。[官方/原文·摘要]（`since`、`base_branch`、post-commit 在 README 中没有出现。）

### 它适合辅助维护 as-built 文档吗？

适合做**审查输入**，不适合做**文档本身**，也不能直接回答"哪页文档过期"。[推断]

| 用途 | 怎么用 | 限制 |
|---|---|---|
| 核对"内部构成"表 | `get_architecture` 的聚类与 `docs/as-built/<包>.md` 中的目录划分对照：聚类横跨目录，往往说明边界划错了 | 聚类是统计结果，不是设计；只提示，不替代判断 |
| 核对"依赖"一节 | `trace_path`（谁调用谁）、`search_graph` 找某概念被谁用 | 类型信息提取弱；与 dependency-cruiser 的 import 图相比，它更偏调用关系 |
| 找出自上次核对以来变了什么 | `detect_changes` 用 `since: <verified-at>`（参数存在，未实测语义），得到受影响的符号和模块；与页面的 `covers` 对照，决定要改哪几页 | 它给出符号，不给文档页；"符号到页面"要靠我们的 `covers` |
| 检查索引是否可靠 | `index_status`、`check_index_coverage` | "干净"不是完整的证明 |
| 记录决定 | `manage_adr` | **不用**：ADR 已经在 `docs/adr/`，再存一份在工具里会有两个来源 [推断] |

### 重新索引的最佳时机

1. **整理 story 的"重新索引"这一步放在审查之后、更新文档之前**（流程里已经是这个顺序）：先 `index_status` 看 `watch` 状态；因为会话在 git 仓库里，watcher 默认在工作，但整理 story 前的大改动之后要手动 `index_repository`（模式 `full`）确保是最新的，再运行 `get_architecture` 和 `detect_changes`。[推断]，依据是 README 的"大的 `git pull` 之后手动索引"和 `index_status` 的 `watch` 字段。
2. **每次合并后不必手动索引**：watcher 会处理。[官方/原文]
3. **不要开 `persistence`**：它会把二进制快照写进仓库，并在每次索引（包括 watcher 的快速档）时重写；README 自己建议"按发布、里程碑或夜间任务的节奏，而不是每次保存都提交"。Memex 的索引是本机的派生数据，不属于仓库内容。[官方/原文] + [推断]

### 与现有约束的关系

- 这个索引的存储在用户本机的缓存目录，不属于仓库；as-built 文档中不要引用索引里的内部标识符，也不要写本机路径（与"环境信息只进 `.env`"的约定一致）。
- 索引工具的输出是**证据**，不是页面内容：不能把 `get_architecture` 的输出整段粘进 as-built 页。

---

## 八、规划 agent 与 coding agent 分工下的做法

### 证据

- Anthropic 的最佳实践：Claude 在"看起来完成"时就停下，没有可运行的检查时，"看起来完成"是唯一的信号；要给 Claude 一个可以运行、并返回通过或失败的检查；让它给出证据（命令输出），而不是断言成功；"信任后再验证的缺口"（trust-then-verify gap）是列出的失败模式之一：产出看起来合理，但没有处理边界情况，"如果你无法验证，就不要上线"。[官方/原文]
- 同一页：用新的子 agent 上下文做"对抗式审查"，审查者只看到 diff 和你给的标准，不看到产生改动的推理；提示审查者"只报告影响正确性或既定需求的缺口"，否则它会报一堆缺口导致过度设计。[官方/原文]
- 同一页：用确定性的 Stop hook 阻止回合结束，直到检查通过；`CLAUDE.md` 是建议。[官方/原文]
- Anthropic 的长时运行 agent 文章：agent 会提前"宣布完成"、把功能标成完成却没有测试；功能清单用 JSON，约束 agent 只能改 `passes` 字段，因为模型较少不恰当地改写 JSON；用 git 提交作为交接。[官方/原文]
- 论文 *Evaluating AGENTS.md*：agent 会认真遵守上下文文件，LLM 生成的上下文文件总体上没有帮助。[官方/原文·摘要]
- **没有找到的**：关于"coding agent 编造文档中不存在的内容"或"文档更新被忽略"的一手失败案例（官方工程博客或论文）。我的搜索只找到上面这些关于验证和提前宣布完成的一般性描述，所以下面的措施是对这些一般性失败模式的应用，不是针对文档失败案例的实证。[推断]

### 对 Memex 的建议

1. **验收标准要能用命令检查**（第十节）。规划 agent 在同步 issue 状态时，**自己运行**这些命令，看退出码和输出，不依赖 coding agent 在 PR 描述里的自述。依据：Anthropic 要求"展示证据，而不是断言"。[官方/原文] + [推断]
2. **把可机械检查的字段做成 front matter（结构化数据）**：`covers`、`verified-at` 是 YAML；Anthropic 观察到模型较少改写 JSON，说明结构化字段比散文更不容易被随手改坏，但对 YAML 是否同样没有证据。[官方/原文] + [推断]
3. **让页面里的每个"事实"都带一个可检查的指针**：路径、符号名、测试文件。"不变量"一节每条都要指向一个测试，缺指针就不收。这样编造的内容在路径检查和符号检查中会暴露。[推断]
4. **独立核对**：整理 story 的 PR 里，规划 agent（或在新上下文里启动的审查 agent）只给出"代码目录"和"as-built 页"，要求列出页面中与代码不符的陈述，并提示只报告影响正确性的差异（Anthropic 的提示建议）。这一步成本较高，可放在每个 epic 一次。[官方/原文] + [推断]
5. **hook 做硬关卡**：整理 story 的 coding agent 会话里可以配置 Stop hook 运行 `pnpm docs:check`；这是本机便利，不替代规划 agent 的核对。需要用户操作 `.claude/settings.json`，本文不改它。[官方/原文] + [推断]
6. **规划 agent 只读**：规划 agent 不改文档，所以核对结果以 issue 评论的形式反馈。[推断]

---

## 九、建议的 as-built 模板（一页包级文档）

文件：`docs/as-built/<包目录名>.md`，例如 `docs/as-built/runtime.md`。以下为完整模板，`<>` 为待填内容。

````markdown
---
package: "@memex/runtime"
covers:
  - packages/runtime/src/**
  - packages/runtime/package.json
verified-at: <核对时 HEAD 的 40 位提交哈希>
verified-on: <YYYY-MM-DD>
verified-by: <story 编号，例如 V0-27>
design-refs:
  - docs/adr/0008-dependency-inversion-and-config-driven-composition.md
  - docs/architecture/contracts.md
---

# @memex/runtime 现状

> 本页描述代码**现在**是什么样，不描述打算怎么做（那是设计文档）。字段细节见生成的 JSON Schema，不在这里重复。
> 最后核对于提交 `<短哈希>`（<YYYY-MM-DD>）。核对范围见页首 `covers`。

## 1. 职责

<一到三句话：这个包做什么、不做什么。使用 GLOSSARY.md 中的术语。>

对应设计：<ADR 编号或设计文档的小节链接>。

## 2. 公开入口

- 唯一入口：[`src/index.ts`](../../packages/runtime/src/index.ts)。
- 导出清单（生成）：[generated/exports.md](./generated/exports.md)
- 契约和 schema：[generated/json-schema/](./generated/json-schema/)

## 3. 内部构成

| 目录 | 职责（一句话） | 关键文件 | 对应设计 |
|---|---|---|---|
| `event-log/` | <职责> | [`append-event.ts`](../../packages/runtime/src/event-log/append-event.ts) | <ADR/小节> |
| `<目录>/` | | | |

只列重要的概念目录；普通、简单的目录不列。

## 4. 依赖

- 允许依赖：<来自 `.dependency-cruiser.cjs` 的规则，写规则文件的路径，不复制>
- 现状依赖图（生成）：[generated/dependency-graph.md](./generated/dependency-graph.md)
- 需要解释的依赖：<只写不明显的依赖及原因>

## 5. 关键不变量

| 不变量 | 证明它的测试 |
|---|---|
| <读代码看不出来的约束> | [`<被测文件>.test.ts`](../../packages/runtime/src/<目录>/<被测文件>.test.ts) |

每条必须有测试；没有测试的写进第 7 节。

## 6. 与设计的偏差

| 设计文档的说法 | 实际 | 原因 / 状态 |
|---|---|---|
| <文档路径与小节：写了什么> | <代码实际是什么> | <为什么；是否已回写设计文档> |

没有偏差时写"无"，并保留本节。

## 7. 已知缺口

- <设计里有、代码里还没有的部分；每条写对应的 issue 编号>

## 8. 怎样验证本页

```
pnpm docs:check          # 路径、链接、front matter
pnpm docs:stale          # covers 范围内自 verified-at 起有无变更
pnpm check
```

页面中每个反引号里的路径和符号，都要能在 `covers` 范围内找到。
````

模板中的 `pnpm docs:*` 命令目前不存在，见第四节。

---

## 十、整理 story 里"更新 as-built"一步的验收标准草案

每条都有命令或可见结果。命令里的 `docs:check`、`docs:stale`、`docs:generate` 是**待建的脚本**（见第四、六节）；在它们建成之前，对应条目可以用括号里的原生命令检查。

| # | 验收标准 | 检查方式 |
|---|---|---|
| 1 | 本 epic 涉及的每个包都有页面 `docs/as-built/<包目录名>.md`，且 `docs/as-built/index.md` 列出它 | `ls docs/as-built/`；在 `index.md` 中搜索包名 |
| 2 | 每页 front matter 含 `package`、`covers`、`verified-at`、`verified-on`、`verified-by` | `pnpm docs:check` 退出码为 0（原生命令：对页面逐个 `grep -E '^(package\|covers\|verified-at\|verified-on\|verified-by):'`） |
| 3 | 每页 `verified-at` 是 40 位哈希，是当前 `HEAD` 的祖先，且**等于整理 story 开始时的代码提交** | `git merge-base --is-ancestor <hash> HEAD && echo ok`；与 PR 中记录的提交对照 |
| 4 | 对每页，`covers` 范围内自 `verified-at` 起没有变更（即页面核对之后代码没有再动） | `git diff --name-only <verified-at>..HEAD -- <covers 中的路径>` 输出为空 |
| 5 | 页面中所有相对链接和反引号路径指向的文件都存在 | `pnpm docs:check`（或 `lychee --offline docs/as-built`，若采用 lychee） |
| 6 | 页面中所有反引号符号名都能在 `covers` 范围内找到 | `pnpm docs:check`（原生命令：对每个符号在 `covers` 路径下 `git grep -n <符号>`） |
| 7 | 第 5 节"关键不变量"每行都有指向测试文件的链接，且该测试文件存在并在 `pnpm check` 中通过 | `pnpm docs:check`；`pnpm check` 退出码为 0 |
| 8 | 页面第 6 节"与设计的偏差"存在；每条偏差要么已回写设计文档（`git diff` 中能看到对应修改），要么在第 7 节有 issue 编号 | 阅读 PR diff；`gh issue view <编号>` |
| 9 | `docs/as-built/generated/` 与代码一致：重新生成后没有 diff | `pnpm docs:generate && git diff --exit-code docs/as-built/generated` |
| 10 | 页面中没有 GLOSSARY.md 的 `_Avoid_` 词被误用（报告为空，或每条都有人工说明） | 术语检查脚本的输出 |
| 11 | markdownlint 通过 | `pnpm exec markdownlint-cli2 "docs/as-built/**/*.md"` 退出码为 0 |
| 12 | 页面不含行号引用（形如 `file.ts:123`、`#L12`）和代码段复制 | `git grep -nE '\.ts:[0-9]+\|#L[0-9]+' docs/as-built` 无输出 |
| 13 | 重新索引已执行，且 `index_status` 显示索引对应当前 `HEAD`，`detect_changes`（`since` 取上一次的 `verified-at`）列出的受影响模块都对应到某个已更新的页面 | PR 描述中粘贴 `index_status` 和 `detect_changes` 的输出摘要；规划 agent 对照 `covers` 复核（`detect_changes` 的实际行为见第十一节） |
| 14 | `pnpm check` 全绿 | `pnpm check` 退出码为 0 |
| 15 | 这一步的所有改动只在 `docs/as-built/`（以及回写的设计文档）内，没有改源代码 | `git diff --stat <整理 story 开始的提交>..HEAD`，检查路径 |

---

## 十一、尚未核实

1. **`detect_changes` 的确切语义**：README 和项目首页说它映射"未提交"的 git diff；本机服务器的工具定义有 `since`、`base_branch` 参数。两者是否一致，`since: <提交>` 是否按两个提交之间的 diff 计算，没有运行验证。
2. **codebase-memory-mcp 的 `index_repository` 是否真的增量、`get_architecture` 聚类在 TypeScript monorepo 上是否有用**：没有对 Memex 代码运行过（现在也没有代码）。README 中语言数量也有不一致（162 与 158）。
3. **dependency-cruiser 18.6.0 和 knip 6.41.0 在 TypeScript 7 下能否工作**：`npm view` 只显示没有声明 peer 依赖；没有安装运行。V0-02 会实测。
4. **Vale 对中文的支持**：读到的页面没有写。词表按"每行一个正则"，对中文分词是否可用没有验证。
5. **有没有检查"相对链接指向的文件存在"的 markdownlint 规则**：在规则列表中没有找到，没有逐条核对所有规则。
6. **lychee 是否有可以通过 pnpm 安装的包**：lychee 是 Rust 程序；没有查是否有 npm 封装，也没有核对它对 Windows 的支持。
7. **`pnpm ls -r --depth -1 --json` 在 pnpm 12 下的行为**：读到的是 pnpm 文档页（没有标注版本），没有在 pnpm 12 上运行。
8. **Living Documentation（Martraire）的具体内容**：只看到搜索结果里的书目摘要，没有读到一手内容，上文不据此得出结论。
9. **C4 官方是否有关于图与代码同步的说明**：首页没有写；没有看它的"工具"页。
10. **关于"coding agent 顺手更新文档"的一手失败案例**：没有找到；第八节的措施是对一般性失败模式的应用。
11. **AGENTS.md 论文的结论能否推广到 TypeScript 项目和 as-built 文档**：只读了摘要，任务集是 Python；它评估的是"上下文文件"，不是"按需读取的参考文档"。
12. **本文提议的 front matter 字段和 `docs:*` 脚本是否好用**：这是设计，没有试过；`verified-at` 取"文档提交的父提交"这一约定，需要在第一次整理 story 时试一次。
13. **ADR 0026 草案**：没有在仓库里找到文件，流程按任务描述理解。

---

## 十二、需要用户决定的事

以下只涉及个人偏好，调研查不到答案：

1. **生成物是否提交进仓库**（`docs/as-built/generated/`）：本文推荐提交（PR 里能看到 diff，agent 可直接读），代价是 diff 噪声。也可以不提交，用时再生成。
2. **新鲜度检查（`docs:stale`）在整理 story 里是硬关卡还是只报告**：硬关卡会让 story 在页面未更新时无法关闭；只报告则依赖规划 agent 自觉。本文推荐硬关卡，但这会增加整理 story 的工作量。
3. **要不要建根目录的 `AGENTS.md`（或 `CLAUDE.md`）**，以及里面是否放"先读哪页 as-built"的指针。本文只说明 as-built 内容不要放进去；建不建、写多长，是工作方式上的选择。

---

## 来源

以下页面均在 2026-10-13 实际打开过。

- Diátaxis 首页：[diataxis.fr](https://diataxis.fr/)（四类文档）；参考文档的原则：[diataxis.fr/reference](https://diataxis.fr/reference/)
- arc42 构件视图：[docs.arc42.org/section-5](https://docs.arc42.org/section-5/)
- C4 模型：[c4model.com](https://c4model.com/)
- docs-as-code：[Write the Docs：Docs as Code](https://www.writethedocs.org/guide/docs-as-code/)
- Google 的文档实践：[Software Engineering at Google 第 10 章 Documentation](https://abseil.io/resources/swe-book/html/ch10.html)
- AGENTS.md 官网：[agents.md](https://agents.md)
- Claude Code 的记忆与指令文件：[code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory)
- Claude Code 的最佳实践（验证、对抗式审查、hook、CLAUDE.md 内容）：[code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)
- Anthropic 工程博客，长时运行 agent 的失败模式和交接：[Effective harnesses for long-running agents](https://anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- 论文摘要，上下文文件对 coding agent 的影响：[arXiv 2602.11988](https://arxiv.org/abs/2602.11988)
- codebase-memory-mcp 的 README（工具列表、watcher、存储、persistence）：[github.com/DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)；原始 README：[raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/README.md](https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/README.md)；项目首页：[deusdata.github.io/codebase-memory-mcp](https://deusdata.github.io/codebase-memory-mcp/)；基准报告：[docs/BENCHMARK.md](https://github.com/DeusData/codebase-memory-mcp/blob/main/docs/BENCHMARK.md)。另外使用了本机该 MCP 服务器暴露的工具定义（`detect_changes`、`index_repository`、`index_status`、`get_architecture`、`manage_adr` 的参数和说明）
- Zod 的 JSON Schema 导出：[zod.dev/json-schema](https://zod.dev/json-schema)；`.describe()` 与 `.meta()`：[zod.dev/metadata](https://zod.dev/metadata)
- dependency-cruiser 命令行的输出类型和选项：[doc/cli.md](https://github.com/sverweij/dependency-cruiser/blob/main/doc/cli.md)
- TypeDoc 的输入选项（monorepo 的 `packages` 策略）：[typedoc.org/documents/Options.Input.html](https://typedoc.org/documents/Options.Input.html)（该页没有写 TypeScript 版本支持，版本信息取自 `npm view`）
- api-extractor 的 API 报告：[api-extractor.com/pages/setup/configure_api_report](https://api-extractor.com/pages/setup/configure_api_report/)
- pnpm list：[pnpm.io/cli/list](https://pnpm.io/cli/list)
- Swimm 的 Auto-sync：[docs.swimm.io/features/keep-docs-updated-with-auto-sync](https://docs.swimm.io/features/keep-docs-updated-with-auto-sync/)
- Vale 概览：[docs.vale.sh](https://docs.vale.sh/)；词表：[docs.vale.sh/keys/vocabularies.md](https://docs.vale.sh/keys/vocabularies.md)
- markdownlint-cli2：[github.com/DavidAnson/markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2)；规则列表：[doc/Rules.md](https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md)
- lychee：[github.com/lycheeverse/lychee](https://github.com/lycheeverse/lychee)
- 版本号：2026-10-13 在命令行执行 `npm view <包名> version peerDependencies time.modified`（包括 typescript 的 `dist-tags`），涉及 typescript、zod、dependency-cruiser、knip、typedoc、@microsoft/api-extractor、madge、ts-morph、markdownlint-cli2、typedoc-plugin-markdown、skott 等
