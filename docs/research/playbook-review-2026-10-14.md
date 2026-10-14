# Playbook 整体评审：冲突、闭环缺口、文件边界

日期：2026-10-14。对象：`docs/playbook/` 全部文件，评审时的提交为 `4d9013b3`。这次评审把 playbook 当作 harness 的操作手册来看，分两轮进行：
- 第一轮：从技术、harness、交付团队三个角度，找冲突、闭环缺口和歧义。
- 第二轮：检查每个文件的边界和用途，找出重复的规则、放错地方的规则、多余的解释，以及混进文档的"写文档要求"。

两轮的处理方式都已经和负责人对齐（"同意""好的 执行"）。本文记录发现的问题和做出的决定，修改本身在 playbook 里。

## 一、第一轮：冲突、缺口、歧义

### 冲突（两个文件说法不同）

| # | 冲突 | 决定 |
|---|---|---|
| 1 | 改结构：Phase 6 要求先写 ADR；Phase 5 和 review.md 写的是"ADR 或者在 issue 里写理由" | 改结构必须先有 ADR；改契约要在 issue 里写理由，并更新契约文档 |
| 2 | 主干坏了：工作流要求先回滚；social contract G1 写的是修复或回滚都行 | 先回滚 |
| 3 | 谁修改受保护的验收测试：testing 规则 3、5 说是 owner；规则 6 和 delivery-planning 1.4 说是 planner | planner 修改，owner 确认需求 |
| 4 | 谁能关闭 issue：工作流规定只有 planner 能在验收后关闭；Task 7 又允许别人先关闭，关了就保持关闭 | 绕过验收被关闭的 issue 要重新打开，放回 verifying；不使用会自动关闭 issue 的关键词 |
| 5 | 审查能不能阻塞：feedback 说审查不能阻塞；工作流里确认过的阻塞发现可以把 issue 退回 | 意见本身不阻塞；确认过的发现有证据，可以阻塞 |
| 6 | checklist 里 `workflow-states` 是 Required，`verification-flow` 却是 Recommended，而且时机写成 pre-integration | `verification-flow` 改为 Required，时机改为 post-integration |
| 7 | social contract D1"可以撤回的决定写下来就做"，字面上和 ADR 先行、约束表、AGENTS.md 冲突 | 限定为：自己角色范围内的决定，不违反 ADR、约束和 issue 的范围 |

### 闭环缺口

| # | 缺口 | 决定 |
|---|---|---|
| 8 | 放下认领、转交认领都没有对应的转换 | 新增 In progress → Ready；转交认领时状态不变，只换认领人 |
| 9 | 审查通过后合并队列拒绝，没有对应的回边 | In review → In progress，算一轮 |
| 10 | 已合并但还没验收的改动可能被发布 | 只从这样的提交发布：其中每个 issue 要么已关闭，要么改动在默认关闭的开关后面。验收失败、修复赶不上下次发布时，回滚或者关掉开关 |
| 11 | "not live-verified" 的 issue 没有去处，会一直挂在 verifying | 可以以 logic-done 关闭，但要标记 not live-verified，并把它的 live 检查加进发布冒烟清单；发布记录写明结果，失败时按事故处理 |
| 12 | 验收例子要求就绪前"因为正确的原因失败"，但连接代码由实现者写，就绪时例子还跑不起来 | 例子不需要新的连接代码时，就绪前必须因功能缺失而失败。需要连接代码时，就绪前先标为 pending；实现者先写连接代码，并证明例子是因功能缺失而失败，再写产品代码 |

另外一个技术细节：GitHub、GitLab 这类平台在合并时，如果 PR 里有 `Fixes #12` 这类关键词，会自动关闭 issue，直接跳过验收。

### 歧义

| # | 歧义 | 决定 |
|---|---|---|
| 13 | "owner"一词多义：既指做决定的那个角色，也出现在 owner of the cause、owner of the test 等说法里 | Owner 只指那个角色；其他说法改成具体的角色名，或者"能消除原因的角色" |
| 14 | 状态图和转换表不一致 | 补齐状态图 |
| 15 | On hold 是独立状态，还是 backlog 里的一个标记 | 独立状态，离开时回到 Backlog |
| 16 | 谁执行合并 | 审查通过后，由实现者或者合并队列合并 |
| 17 | 回滚以后算不算一轮 | 算一轮 |

还有一个设计上的局限：所有上报都指向同一个 Owner。决定：只加一句话，"Owner 可以为某个领域指定决定人，并写下名字"，不增加新的机制。

## 二、第二轮：文件边界

### 发现

1. **同一组规则分散在好几个地方**：
   - 工作流：framework Phase 4、5 和 delivery-planning 2A、7A、7B。
   - 术语：framework 的 Words、delivery-planning 的 Terms、document-map 的 Owners。这违反了 playbook 自己"术语表只有一份"的规则。
   - "测试放在哪里"：分散在三处。
   - 怎么记录决定：分散在四处。
   - 机器信息只放 `.env`：分散在五处。
   - 先查再问：分散在三处。
2. **规则放错了文件**：
   - 所有角色共用的工作流写在 planner 的规程里。
   - framework 本该是阶段地图，有一半是细则：Git 约定、检查分层、日志和错误、并行工作、发布、回路卡。
   - delivery-planning 里混进了架构规则和测试规则。
   - social contract E5 按它自己的标准应该是设定，不是约定。
3. **写进文档的"写文档要求"和来源信息**：
   - feedback.md 开头写着"适用于任何语言、团队规模……"。
   - framework 的陷阱 13"为简单情况设计"，讲的是怎么写 playbook，不是项目会踩的坑。
   - practices 里每一条都标着"confirmed by the owner"。
   - 各文件的 Status 行，以及 framework §6 的来源说明，和 README 重复，而且每个文件的写法都不一样。
4. **多余的解释**：
   - 规则中间夹着研究数据，例如合并冲突的比例、AGENTS.md 的研究结论、ASD-STE 的发布期次。
   - framework 的陷阱列表和各阶段的"常见错误"大量重复。

### 决定：新的文件边界

| 文件 | 只管这些 |
|---|---|
| README | 是什么、文件表、怎么用、维护规则、成熟度（唯一一处）、变更记录 |
| glossary.md（新增） | playbook 的全部术语和角色 |
| framework.md | 核心理念、七个阶段（做什么、产出、完成标准、链接到细则）、规模适配 |
| workflow.md（新增，STE） | 所有角色共用的工作流：状态、转换、停下时的分类、轮数上限、回滚、发布、回路卡、闭环规则、交付健康信号 |
| guardrails.md（新增） | 检查分层、Git 约定、日志和错误、安全需求、并行工作和合并冲突 |
| delivery-planning.md | 只放 planner 的任务 |
| testing.md | 测试，以及"测试放在哪里"的唯一出处 |
| review.md / feedback.md | 不变，删掉元要求和研究数据 |
| practices.md | 只放判断方法；删掉已经有归属的条目和"confirmed by the owner" |
| writing-standards.md | 怎么写，以及怎么记录决定（唯一出处） |
| social-contract.md | 约定目录。E5 删除，编号不复用；E2 和 C1 链接到各自的唯一出处 |
| document-map.md | 要准备哪些文档；角色定义改为链接术语表；"Owner"列改名为"Maintained by" |

成熟度标注（Used、Designed、Researched）统一放在 README 的一张表里，各文件不再写 Status 行。
