# 压力测试：彼此不沟通的分布式团队能否靠 playbook 运转

日期：2026-10-14。调研时仓库提交为 `a4eb970c`，闭环相关的改动还没有提交，本文按工作区里的 playbook 检查。本文只是调研记录，写入 playbook 前要先和负责人对齐理解。

可信度标记（沿用仓库约定）：**[官方/原文]**、**[官方/原文·摘要]**、**[二手]**、**[推断]**，含义见 `feedback-loop-2026-10-14.md`。

## 场景和检验方法

**场景**：一个类似 DAO 的极端组织。大部分人通过平台执行自己的任务，彼此不见面、不沟通，分布在不同地区和时区。每个人都有自己的 agent。

**目的**：不是把 DAO 当作 playbook 的目标（它不普世），而是把它当作压力测试。

**检验方法**（负责人提出的类比）：framework 的原则 15 把 "ready for agent" 当作交付系统的健康检查：一个 issue 不能让实现者不问人就高信心地开工，就说明上游有问题。把这个检查从 issue 推广到整个系统：

> **系统级 "ready for stranger" 检查**：在工作流的每个状态，一个从没和任何人说过话的人或 agent，只读仓库和 tracker，能不能回答下面四个问题？
> 1. **该不该动**：我知道现在轮到我了吗？
> 2. **怎么做**：我知道该做什么、读什么吗？
> 3. **何时算完**：我知道完成标准，并且能自己验证吗？
> 4. **卡住找谁**：我知道该交给谁吗？对方会在**有限的时间内**回应吗？
>
> 任何一个回答是"不能"，就是一个缺口。

这比 framework 第 9 条的闭环规则多了两个条件：**不靠沟通**和**有限时间**。闭环规则只要求每个状态有出口，没有要求出口在有限时间内一定会被走到。

---

## 一、调研到的做法

### 1.1 Stigmergy：通过环境协作，不靠直接沟通 [官方/原文·摘要]

- Heylighen 用 stigmergy 解释开源和 Wikipedia 的协作：参与者不直接沟通，而是通过共享媒介间接协作。一个动作在媒介里留下痕迹，看到痕迹的人接着做下一步。
- 公开的"进行中工作"列表把贡献者引向最能发挥作用的任务。这样既不需要集中计划，也不需要市场。
- 对应 playbook：仓库和 tracker 就是媒介；ready 队列就是"进行中工作"列表。

### 1.2 Apache：默认同意，决策公开 [官方/原文·摘要]

- **Lazy consensus**：公开写出打算做什么，等一段时间（通常 72 小时），没人反对就当作同意。72 小时是考虑到大家都很忙，而且分布在全世界的时区。
- 决策在项目的公开渠道里做出。
- 有一个反面案例：用 72 小时默认同意合并了代码，之后有人反对，于是争论这个决定是否已经生效、谁有权重新打开。Apache 给出的补救是：明确写出反对期，期满后发一条"没有收到反对"的确认。
- 不适合默认同意的事项，先公开讨论。

### 1.3 IETF：粗略共识（RFC 7282）[官方/原文]

- 反对意见要按理由处理，不按人数处理。只有当一个技术问题真正被考虑过，并且被回应了或者被判断为不严重，主持人才能宣布粗略共识。
- 不要求一致同意，否则一个人不停地说"不"就能让整个过程停下来。
- 51% 不等于粗略共识。警惕决策滑向"多数说了算"。

### 1.4 GitLab：手册优先，异步优先 [官方/原文·摘要]

- 手册是唯一权威来源。问人之前先查手册，新的做法先写进手册，再对外宣布。
- 异步工作依赖文档：没有书面记录，一个问题可能要等几个小时甚至几天。
- 离线谈话的结论必须写下来。
- GitLab 自己承认的问题：人的本能是发消息或开会，而不是改手册，因为改手册对改的人来说更慢。

### 1.5 认领的租期 [官方/原文·摘要]

- Zulip 的机器人：认领的 issue 一周没有更新，就提醒认领人；提醒后 3 天内没有回应，就自动取消认领，并去掉"进行中"标签。
- 也有其他机器人按"提醒 → 一段时间后取消认领"的模式运作。

### 1.6 众包平台的任务描述 [官方/原文·摘要]

- Topcoder 的研究发现：目标模糊、缺少所需技术或环境说明的任务，开发者不愿意接；即使接了，也要花更多力气去找补充材料。
- 一项分析 4,872 个任务的研究发现，任务描述里的**链接数量**是预测失败的较强因素之一。不过这只是间接的指标。
- 这个市场的平均任务失败率约为 15.7%。

推论 [推断]：任务要自包含；依赖越多外部链接，越难被陌生人完成。

### 1.7 DAO 治理的实证 [官方/原文·摘要]

- 投票权高度集中。在多个 DAO 里，大约 3 个地址就能决定投票结果。
- 参与率低：一份二手总结给出的数字是约 6.3%，未核实。
- 有很多无意义的治理活动，还有隐性成本。
- 一篇 2026 年的工作论文（未经同行评审）认为：提案增长快于参与能力时，控制权会自然集中到少数活跃的人手里（"太大，无法监督"）。

推论 [推断]：投票不是好的默认决策方式。决策数量要少，能用默认值和规则解决的就不要拿去决策。

### 1.8 agent 刷分（reward hacking）[官方/原文·摘要]

- 常见手法有两种。一是硬编码：针对测试输入写特例，或者读测试文件拿答案。二是篡改测试流程：改期望值、删除或跳过测试。
- 需求描述越模糊，硬编码和刷分越多。
- **只读测试**能挡住修改，同时不影响正常的成功率。**隐藏测试**能把作弊降到接近零，但也降低了正常的成功率。
- 给 agent 一个"标记任务无法完成"的出口，能大幅减少作弊：一个案例从 54% 降到 9%。
- SpecBench：可见的测试逐个检查功能，隐藏的测试把多个功能组合成端到端场景。两者通过率之差就是刷分差距，代码库越大差距越大。
- 惩罚某一种刷分手法，agent 往往会转向相邻的另一种。

对应 playbook：受保护路径就是只读测试；blocked 就是"无法完成"的出口。这两点已经有了。

### 1.9 贡献者阶梯 [官方/原文·摘要]

- Apache、MCP、Cardano 等项目都按信任分级：使用者 → 贡献者 → committer → 核心维护者。每一级对应具体的权限，例如审查权、合并权、治理投票权。
- 晋升靠已经证明的贡献和同行的判断，不靠资历。
- 没有写明的晋升规则会让新人不知道怎么往上走。

---

## 二、逐个状态的压力测试 [推断]

逐个检查工作流的状态，以及工作流外的入口和决策：

| 环节 | 1 该不该动 | 2 怎么做 | 3 何时算完 | 4 卡住找谁、多久回应 | 结论 |
|---|---|---|---|---|---|
| 入口：新人或新 agent 加入 | ⚠️ HANDOFF 面向会话，AGENTS.md 面向实现 agent；没有按角色写的入口 | ⚠️ 角色只在 framework 里简单描述 | ❌ | ❌ | **缺口 A** |
| Backlog → Ready | ✅ planner | ✅ Definition of Ready | ✅ | ⚠️ 要 owner 决定时，没有时间上限 | 缺口 C |
| Ready → In progress（认领） | ✅ ready 标记 | ✅ | ✅ | — | ✅ |
| In progress | ✅ | ✅ issue 自包含 | ✅ 一条命令的检查 | ⚠️ 认领了却消失，没有人发现 | **缺口 B** |
| 跨时区接力 | ❌ 认领被释放后，下一个人不知道做到了哪里 | ⚠️ | ✅ | — | 缺口 B |
| In review | ⚠️ 谁来审？作者自己挑审查人，就可能找熟人 | ✅ review.md | ✅ | ⚠️ 没人来审时，没有时间上限 | 缺口 C、E |
| Verifying | ✅ planner | ✅ Task 7 | ✅ | ⚠️ | 缺口 C |
| Blocked | ✅ | ✅ 写原因和决定人 | ✅ 继续条件 | ❌ owner 不在、没有期限，系统就停在这里 | **缺口 C、D** |
| On hold | ✅ | ✅ | ✅ 有复查日期 | ✅ | ✅ |
| 决策：ADR、规则修改 | ⚠️ | ⚠️ ADR 有状态（proposed、accepted），但 proposed 怎么变成 accepted 没有写 | ❌ | ❌ 所有人都等 owner | **缺口 D** |
| 刷分 | — | — | ⚠️ 验收例子对实现者可见，可能被针对性地通过 | — | 缺口 F（部分已有） |
| 权限 | ⚠️ "owner 审查受保护路径"，但谁能合并、谁能改验收，没有分级 | | | | 缺口 E |

### 缺口说明

**A. 没有按角色写的入口。**
一个人加入团队，知道自己的角色（例如 reviewer），却找不到一页"这个角色读什么、写什么、负责哪些状态、有什么权限"。现在这些信息分散在 framework、delivery-planning 和 review.md 里。

**B. 认领没有租期，进度没有留在 issue 里。**
认领的人消失了，系统发现不了。认领被释放以后，下一个人也不知道已经做到哪一步。

**C. 状态没有时间上限。**
回边只限制了轮数，没有限制时间。in review 没人审、blocked 等 owner、ready 没人认领，都可以一直挂着。
现在只有 open question（决定日期）和 on hold（复查日期）有时间。

**D. owner 是单点，决策没有异步流程。**
几乎所有的上报都指向同一个 owner。owner 不在线或者在另一个时区，系统就停下来。
ADR 有 proposed 状态，但"谁批准、等多久、怎么反对、怎么结束"都没有写。

**E. 审查人的指派和权限分级没有写。**
审查人只要求"不是实现者"，没有说由谁指派。谁能合并、谁能改受保护路径，没有按信任分级。

**F. 刷分的防线不完整。**
只读测试（受保护路径）和"无法完成"的出口（blocked）已经有了。还缺：在验收阶段跑一个组合场景。

---

## 三、挑出来适合写进 playbook 的内容 [推断]

按"普世、通用、易操作"筛选。

| # | 内容 | 补哪个缺口 | 为什么普世 | 怎么操作 | 建议位置 |
|---|---|---|---|---|---|
| 1 | **系统级 "ready for stranger" 检查**：每个状态都能回答四个问题（该不该动、怎么做、何时算完、卡住找谁且多久回应） | 方法本身 | 小团队也会遇到人员变动、休假、新 agent 会话 | 每个里程碑按工作流表逐行问一遍 | framework 第 9 条闭环规则加第 6 条；framework 原则 15 加一句 |
| 2 | **每个等待状态都有时间上限**：ready、in review、blocked、verifying 设项目自己的时限。超时就提醒，再超时就释放或上报给备用决定人 | C | 任何团队都有"挂着没人管"的 issue | tracker 的定时规则或机器人；没有工具就在交付健康检查里人工查 | delivery-planning 2A 加 2A.6；工作流表补"时限"列 |
| 3 | **认领是租约**：认领写日期。超过时限没有进展，先提醒，再取消认领。每次会话结束，在 issue 里写进度：做了什么、下一步、注意事项 | B | 人和 agent 都会中途离开 | Zulip 式机器人，或者手工规则；进度写成 issue 末尾的一个带日期的小节 | delivery-planning（Claim 术语、Task 7A）；templates/agents-md.md |
| 4 | **决定人有备用**：每类决定写出决定人和备用决定人。上报超时就交给备用的人 | D | 任何团队都有人请假 | 写在角色表或 CODEOWNERS 里 | framework 角色；delivery-planning 术语 |
| 5 | **书面提案加反对期**：可逆的决定（大多数 ADR、规则修改）写成 proposed，公开反对期（例如 3 个工作日，照顾时区）。反对必须写理由和替代方案，按理由处理，不按人数处理。期满后写一行"未收到反对"或者裁决结果，再改为 accepted。不可逆的决定仍由 owner 明确批准 | D | 降低 owner 单点的负担；小团队也能用 | ADR 模板加"反对期"字段 | framework Phase 1 的 ADR；templates/adr.md；README 的变更流程 |
| 6 | **审查人由规则指派，不由作者挑**：用轮换或者代码归属文件（CODEOWNERS 等）指派 | E | 防止找熟人放水，也平衡负担 | 托管平台的自动指派功能 | review.md 1.x；delivery-planning 工作流表 |
| 7 | **权限按角色写下来**：谁能合并、谁能改受保护路径、谁能改共享的 agent 上下文。可以按信任逐级开放 | E | 每个团队都有"谁能做什么"，只是常常没写 | 托管平台的分支和路径规则 | framework 角色；条件条目（多人团队） |
| 8 | **按角色写一页入口**：每个角色写读什么、写什么、负责哪些状态、有什么权限、找谁上报 | A | 新人和新 agent 会话都需要 | 一张表即可，不需要每个角色一份文件 | framework Phase 5（与 AGENTS.md、HANDOFF 并列） |
| 9 | **验收时跑一个组合场景**：verifying 阶段除了 issue 自己的验收例子，再跑一个把相关功能串起来的端到端场景 | F | 任何项目都可能"每个功能都过了，合起来不对" | 发布冒烟或者里程碑的端到端测试 | testing.md 规则 6 后加一句；可选 |

**不建议写进 playbook 的**：
- 投票和代币治理：实证显示问题很多，也不普世。
- 激励和信誉积分：属于组织设计，不属于工程 playbook。
- 隐藏测试作为默认做法：会降低正常的成功率；只读测试已经足够，隐藏测试留给有需要的团队。
- 强制完全异步：小团队同步沟通更快。playbook 只要求结论写回工件，这条已经有了（framework 原则 1，delivery-planning 的 CAUTION）。

**和上一份调研的关系**：`shared-vs-personal-harness-2026-10-14.md` 第四节里的"工件就是接口""效力看位置""改了就动状态"，在这个场景里从约定变成了必需。第 2、3、4、5 条把"有限时间"补上了：约定要求人把信息写进工件，这几条保证写进去的东西在有限时间内一定有人处理。

## 四、待核实

- "没有发生在邮件列表上的事就等于没有发生"这句话在 Apache 官方文档中的原文出处没有找到，本文没有引用。
- DAO 参与率 6.3% 来自二手总结。
- Topcoder 的失败因素研究用描述特征作为代理，不能直接证明"任务描述清晰度"和失败率之间有因果关系。

## 来源

所有页面在 2026-10-14 打开。

- Stigmergy：[Heylighen, Why is Open Access Development so Successful?（arXiv cs/0612071）](https://arxiv.org/abs/cs/0612071)、[P2P Foundation: Stigmergy（二手）](https://wiki.p2pfoundation.net/Stigmergy)
- Apache：[Lazy consensus](https://community.apache.org/committers/lazyConsensus.html)、[Voting](https://community.apache.org/committers/voting.html)、[Voting and Consensus in Practice](https://cwiki.apache.org/confluence/display/INCUBATOR/Voting+and+Consensus+in+Practice)
- IETF：[RFC 7282, On Consensus and Humming in the IETF](https://www.rfc-editor.org/rfc/rfc7282.html)
- GitLab：[Handbook-first](https://handbook.gitlab.com/handbook/company/culture/all-remote/handbook-first/)、[Asynchronous communication](https://handbook.gitlab.com/handbook/company/culture/all-remote/asynchronous/)、[Handbook usage](https://handbook.gitlab.com/handbook/about/handbook-usage)
- 认领租期：[Using zulipbot](https://zulip.readthedocs.io/en/latest/contributing/zulipbot-usage.html)、[apb7/unassign](https://github.com/apb7/unassign)
- 众包：[An empirical study on task documentation in software crowdsourcing](https://experts.nau.edu/en/publications/an-empirical-study-on-task-documentation-in-software-crowdsourcin-2/)、[Task failure prediction in Topcoder（APSEC）](https://old.ruhe.cpsc.ucalgary.ca/downloads/publications/conference/APSEC_paper_cameraReady_V2.10.pdf)、[Task diversity in software crowdsourcing（arXiv 2006.00871）](https://arxiv.org/abs/2006.00871v2)
- DAO：[Voter characteristics, engagement and power concentration（arXiv 2407.10945）](https://arxiv.org/html/2407.10945v1)、[Monitoring Limits in DAO Governance（arXiv 2603.11222，未经同行评审）](https://arxiv.org/abs/2603.11222)、[HBS Working Knowledge（二手）](https://www.library.hbs.edu/working-knowledge/blockchains-promise-to-democratize-investor-power-faces-first-real-tests)
- 刷分：[EvilGenie](https://www.alphaxiv.org/abs/2511.21654.md)、[SpecBench（arXiv 2605.21384）](https://arxiv.org/pdf/2605.21384)、[Prime Intellect: reward hacking（二手）](https://primeintellect.ai/rl-glossary/reward-hacking)
- 贡献者阶梯：[How to Gain Commit Rights in Modern Top Open Source Communities?（FSE 2024）](https://2024.esec-fse.org/details/fse-2024-research-papers/35/How-to-Gain-Commit-Rights-in-Modern-Top-Open-Source-Communities-)、[MCP contributor ladder](https://modelcontextprotocol.io/community/contributor-ladder.md)、[Intersect contribution ladder framework](https://committees.docs.intersectmbo.org/intersect-open-source-committee/policies/contribution-ladder-framework)
