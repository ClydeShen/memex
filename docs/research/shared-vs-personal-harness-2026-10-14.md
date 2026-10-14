# 共享 harness 与个人 harness 的边界：团队约定（social contract）

日期：2026-10-14。对象：多人团队里，每个人用自己的工具和 agent 工作，但共用一套仓库和 harness。没有工具强制的地方，团队靠哪些约定保护共享的那部分（"约定大于设定"）。调研时仓库提交为 `a4eb970c`，闭环相关的改动还没有提交。本文只是调研记录，写入 playbook 前要先和负责人对齐理解。

可信度标记（沿用仓库约定）：**[官方/原文]**、**[官方/原文·摘要]**、**[二手]**、**[推断]**，含义见 `feedback-loop-2026-10-14.md`。

**范围**（2026-10-14 和负责人对齐）：
- 这里的 social contract 不是一般的团队协作守则（响应时间、会议礼仪等）。它只管一件事：**共享的 harness 和个人的 harness 之间的边界和约定**。
- 前提是多人团队。凡是需要写成 social contract 的，都默认不是工作流里的强制步骤。强制步骤已经由 playbook 的工作流和检查负责。

---

## 一、现状：playbook 已经覆盖了什么

| 已有内容 | 位置 | 覆盖了边界的哪一部分 |
|---|---|---|
| 机器信息只写在 `.env`，提交前搜索暂存区 | practices 第 8 条，checklist `env-and-gitignore` | 机器层 |
| `.env.example`、`.gitignore`、`.editorconfig`、`.gitattributes` | framework Phase 1，document-map | 机器层，以及格式统一 |
| 最外层关卡跑全部检查，规则不能只放在 agent hooks 或本地 git hooks 里 | framework 关于分层的规则 | "以结果为准"的强制部分 |
| 一个格式化工具到处用 | framework 冲突预防 | 个人编辑器习惯 |
| AGENTS.md 保持最小，受保护路径改动需要 owner 审查 | checklist `agents-md`、`protect-checks` | 共享层的一部分 |

**缺口** [推断]：
1. 没有把共享、个人、机器三层作为一个整体讲清楚，也没有给出每一层放什么。
2. 共享的 agent 上下文（AGENTS.md、共享技能、提示词、hooks、agent 工具的项目配置）改动以后，除了审查，没有要求通知团队。
3. 共享文档和配置可能依赖某个人的环境，例如写进私人技能名或个人工具路径。没有约定禁止这一点。
4. 个人 agent 的记忆里有对团队有用的教训，但没有约定要把它搬进共享的反馈台账。
5. 用个人工具产出的东西由谁负责，没有约定。

## 二、调研到的做法

### 2.1 主流 agent 工具都把配置分成层 [官方/原文·摘要]

| 工具 | 共享（提交） | 个人·本项目（不提交） | 个人·所有项目 | 优先级 |
|---|---|---|---|---|
| Claude Code | `.claude/settings.json`、`CLAUDE.md` | `.claude/settings.local.json`（工具自动加入忽略）、`CLAUDE.local.md` | `~/.claude/settings.json`、`~/.claude/CLAUDE.md` | 托管 > 命令行 > 本地 > 项目 > 用户；权限规则合并 |
| Cursor | `.cursor/rules/*.mdc`、`AGENTS.md` | — | 用户规则 | 团队规则 > 项目规则 > 用户规则 |
| Codex（AGENTS.md） | 各级 `AGENTS.md` | `AGENTS.override.md` [二手] | `~/.codex/AGENTS.md` | 越近越优先；override 不会删掉上级规则 [二手] |

共同点：
- 每个工具都有"共享"和"个人"两层，多数还有"组织强制"一层。
- 文件名和优先级各不相同。所以 playbook 只能写"用你的工具的本地层"，不能写具体文件名（通用性要求）。
- Claude Code 文档建议本地层用来"先试，再分享给团队"。这正好是个人层升级到共享层的路径。

### 2.2 Git 本身的三层忽略规则 [官方/原文]

gitignore 手册：
- 所有人都要忽略的写在提交的 `.gitignore` 里。
- 只和某个人在这个仓库里的工作方式有关的，写在 `.git/info/exclude`。
- 某个人在所有仓库都要忽略的（编辑器、操作系统产生的文件），写在 `core.excludesFile` 指向的全局文件里。

推论 [推断]：团队的 `.gitignore` 不必列出每个人的编辑器文件。个人工具产生的垃圾由个人自己忽略。团队只负责项目本身产生的文件。

### 2.3 配置和代码分开 [官方/原文·摘要]

- Twelve-Factor 第三条：在不同部署之间会变的东西都是配置，开发者自己的机器也算一个部署。配置和代码要严格分开。配置文件很容易被误提交。
- EditorConfig：跨编辑器统一缩进、换行和编码。它不能代替格式化工具和 lint。
- Dev Containers：用一份提交的容器定义解决"在我机器上能跑"。它是可选的，不是每个项目都需要。

### 2.4 约定优于配置 [二手]

- 出自 Rails：框架给出合理的默认值，只有偏离默认时才需要显式写出来。
- 公认的代价：约定是隐式的，新人不容易找到行为来自哪里。

借来的概念 [推断]：团队约定也遵循同样的形状。默认做法写一次，大家都照做；偏离默认时要写出来并说明理由。约定必须写下来，否则就是"只有老人知道的隐式规则"。

### 2.5 agent 产出由谁负责 [官方/原文·摘要]

几个开源项目公开的 AI 贡献政策（Coder、earthaccess、CodeCarbon、MQT）有共同点：
- **提交的人对每一行负责**，不管是谁写的。agent 不能被追责。
- PR 用人的账号开，或者有明确授权的人。
- 披露 agent 的参与（各项目要求的程度不同）。
- 提交前人要看过并验证过。

分歧在于是否允许 agent 自主开 PR：earthaccess 禁止；MQT 允许，但要有人明确授权范围。

### 2.6 共享 agent 配置的治理 [二手]

- 没有找到官方标准。
- 有的文章建议给 AGENTS.md、agent 和技能目录设置 CODEOWNERS，并检查内容是否过期。理由是过期的 agent 指令比没有指令更糟，因为它会把模型带偏。
- 有的文章指出，agent 改动波及面很大时，CODEOWNERS 会把审查请求同时发给很多团队，需要按风险分级。

## 三、候选约定 [推断]

只收"工具不强制、靠人自觉、关于共享与个人边界"的内容。已经由检查强制的不重复写。

| # | 约定 | 依据 |
|---|---|---|
| 1 | **三层分开**：共享层（提交，改动经过审查）放团队都要用的指令、技能、hooks、检查配置；个人层（不提交）放个人偏好和个人技能，使用工具自带的本地层；机器层只写在 `.env` | 2.1、2.2、2.3，practices 第 8 条 |
| 2 | **共享内容不依赖个人环境**：共享的文档和配置写需要什么能力，不写某个人的工具名、私人技能名或本地路径。某件事只有在某人的环境里才能跑通，要么把依赖搬进共享层，要么去掉 | 2.3，"在我机器上能跑" |
| 3 | **看结果，不管过程**：每个人可以用自己的工具和 agent。产出必须通过共享的检查和审查 | framework 的最外层关卡规则 |
| 4 | **改共享上下文要通知**：改 AGENTS.md、共享技能、hooks 或检查配置会影响所有人的 agent。除了经过审查，还要告诉团队改了什么、为什么改 | 2.6 |
| 5 | **先在个人层试，再提议到共享层**：新的指令或技能先在自己的本地层试用，证明有用之后再提交到共享层 | 2.1（Claude Code 文档） |
| 6 | **教训进共享的地方**：对团队有用的教训写进共享的反馈台账，不只留在个人或个人 agent 的记忆里 | feedback.md 4.4 |
| 7 | **个人的东西自己忽略**：编辑器、操作系统和个人 agent 产生的文件，用个人的忽略文件处理，不提交。团队的 `.gitignore` 只管项目本身产生的文件 | 2.2 |
| 8 | **启动 agent 的人负责它的产出**：请别人审查之前，自己先看过并验证过。agent 写的 PR 和评论要标明 | 2.5 |
| 9 | **偏离默认时写出来**：偏离团队约定可以，但要在 issue 或 PR 里写明理由 | 2.4 |
| 10 | **定期回顾约定**：每个里程碑看一次。反复被违反、又能由工具检查的约定，升级成检查；没人用的约定删掉 | feedback.md 4.2 的升级路线 |

可以合并或删减的地方：
- 3 和 8 都是关于"产出"，可以合并成一条。
- 7 是 1 的细节，可以并入 1。
- 合并后大约 7 到 8 条，符合"短"的要求。

## 四、大团队推演：这些约定够不够 [推断]

推演场景（2026-10-14 和负责人讨论）：大型团队，各种角色，每个角色不止一人，每个人都有自己的 agent，整个团队在 harness 环境里由 agent 驱动。

### 4.1 第三节的约定在大团队里的作用

| 约定 | 大团队里的作用 | 判断 |
|---|---|---|
| 1 三层分开 | 几十个人的偏好不污染共享层 | 必要 |
| 2 共享内容不依赖个人环境 | BA 的 agent 写的 issue 里如果有私人技能名，其他人的 coding agent 用不了 | 关键 |
| 3 看结果、谁启动谁负责 | 每个 agent 背后都有负责的人，出了问题能找到人 | 关键 |
| 4 改共享上下文要通知 | 方向对，但"通知所有人"在大团队里会变成噪音 | **需要修正**：共享上下文有归属人（例如 CODEOWNERS），改动写进变更记录 |
| 5 先个人试、再共享 | 防止一个人的实验影响所有人的 agent | 有用 |
| 6 教训进共享台账 | 跨角色的教训（例如 QA 发现的问题模式）让 coding agent 也读得到 | 有用 |
| 7、8、9、10 | 偏离写理由、定期回顾等 | 有用 |

**结论**：这些约定保护的是共享上下文，是协作的前提，但不够。大团队有两个主要瓶颈，这些约定都没有覆盖：
1. **人的注意力**：agent 的产出量很大，下游的人审不过来。
2. **上下文不互通**：一个人的 agent 不知道另一个人的 agent 在会话里想过什么。

### 4.2 人怎么给其他角色的 agent 提供有效信息

核心原则：**不和对方的 agent 直接对话，写进共享的工件。** 对方的 agent 有三个特点：会话结束就没了；只读自己被告知要读的地方（issue、ADR、验收例子、检查结果）；把外部内容当作数据，分不清谁的话有效力。

一条信息要对另一个角色的 agent 起作用，需要满足：

1. **写在规定的位置，不写在聊天里。** 口头讨论、私信和会议结论，对方的 agent 都看不到。不在 issue 或文档里的信息，就当作不存在。

   | 信息类型 | 写在哪里 | 谁有权写 |
   |---|---|---|
   | 需求或验收变更 | 验收例子（Given/When/Then），不写在评论里 | BA / planner |
   | 设计约束 | ADR 和约束表；能检查的写成检查 | architect |
   | 质量问题 | 一个会失败的测试或场景，或者五段式发现 | QA、reviewer |
   | 决定 | issue 的决策记录：决定了什么、为什么、否掉了哪些方案、谁决定的、日期 | owner、tech lead |
   | 生产问题 | 带复现步骤的 issue | 运维、值班的人 |

2. **写给没有记忆的读者。** 内容自包含，不写"按刚才说的"。给出可以检查的完成标准或例子，不写一段描述。
3. **写明效力。** 有约束力的信息放在只有对应角色能改的位置（决策记录、受保护路径里的验收测试、检查配置）。普通评论只算建议。这和 feedback.md 的来源优先级一致，也防住了提示注入：效力来自位置和角色，不来自文字里自称的权威。
4. **用状态变化作为门铃，并通知背后的人。** 改了需求而 issue 状态不变，正在工作的 agent 不会知道。中途改需求时，把 issue 移回 ready 或标为 blocked，更新验收例子，再通知负责的实现者。状态机本身就是跨角色的信号（delivery-planning 2A）。
5. **反方向也一样，agent 问人要结构化。** blocked 时写清背景、2 到 3 个选项、推荐哪个以及理由、不决定的影响。人的回答写回决策记录，不在聊天里回复。

**例子：BA 中途改验收标准。**
- ❌ BA 在群里说"折扣规则改成满 200 减 30"。coding agent 看不到，reviewer 的 agent 按旧标准审查，QA 按旧例子验收。三方各自正确，结果互相冲突。
- ✅ BA 先更新 issue 里的验收例子，在决策记录里写一行改了什么、为什么改，再把 issue 从 in progress 移回 ready，并 @ 负责的实现者。所有角色的 agent 读到的都是同一份新例子。

### 4.3 由此补充的候选约定

| # | 约定 | 依据 |
|---|---|---|
| 11 | **工件就是接口**：跨角色的信息只写在 issue 和文档的规定位置，不依赖聊天和会议 | 4.2 第 1 点 |
| 12 | **写给没有记忆的读者**：信息自包含，并给出可以检查的例子 | 4.2 第 2 点，testing.md 规则 6 |
| 13 | **效力看位置**：有约束力的内容写在只有对应角色能改的地方，评论只算建议 | 4.2 第 3 点，feedback.md 第 3 节 |
| 14 | **改了就动状态**：需求或决定变了，推动 issue 的状态，并通知负责的人 | 4.2 第 4 点，delivery-planning 2A |
| 15 | **控制产出量**：每个人同时等待审查的 agent 产出有上限，不把下游的人淹没 | 4.1 瓶颈 1，看板的 WIP 限制 |

第 4 条改为：共享上下文有归属人，改动写进变更记录，不再通知所有人。

第 11 到 14 条其实是 playbook 已有机制的约定化：状态机、决策记录、验收例子、来源优先级。机制已经存在，缺的是"团队成员都通过这些机制沟通"的共识。

## 四之二、收敛：social contract 的最终形式（2026-10-14 和负责人对齐）

讨论经过了几轮修正，记录如下：

1. **不是追踪机制。** 压力测试（`async-stress-test-2026-10-14.md`）找到的缺口，起初被写成了时限、租约、指派规则这类"设定"。负责人指出：这些属于 social contract，是每个成员脑子里的共识，约定大于设定。没有人会去追踪每个人的时限，追踪只会平白增加心智负担。
2. **"ready for stranger" 不是 issue 上的状态。** 它是团队配合默契的共识点，作为根原则："留下的工作，让一个从没和你说过话的人也能接着做。"它也适用于成员从不见面、分布在各个时区的团队。
3. **是目录，不是一套必须遵守的规则。** 条目可以很多，团队按需挑选。每条按 ASD-STE100 写，一条一个动作，简单、容易遵守、没有可争的判断边界。
4. **分级写全称，并给出定义。** 用 Recommended（多数团队受益，没有理由就采用）和 Good to know（看情况决定）。不用 R/G 这样的缩写，没有上下文的人看不懂。
5. **不收一般性的团队守则**（审查礼仪、沟通礼仪）。
6. **避免歧义的写法。** 例如"不要审查自己的工作"会被理解成"agent 产出的负责人不用看自己 agent 的产出"，所以删除。改为 F2："把 agent 的产出交给别人之前，自己先读过并检查过。"审查人不是实现者，这一点已经由 review.md 规定。
7. **约定和设定互相流动。** 工具能低成本强制的，就用设定。约定反复没人遵守、又能检查的，就升级成检查。检查经常被绕过的，可以降级成约定。没人用的约定，删掉。

结果写入 `docs/playbook/social-contract.md`。

## 五、写入方式的建议 [推断]

1. 新增 `docs/playbook/team-agreements.md`，或者作为模板放到 `templates/`。内容是上面的约定、每条一句理由，以及"如何修改这份约定"。
2. framework Phase 1 搭建 harness 时加一句：多人团队同时建立这份约定。
3. checklist 加一项 W1、推荐级的 `shared-vs-personal-config`。完成标准：共享层、个人层、机器层各自放什么有书面说明，个人层的文件不在仓库里。
4. 不进核心 14 条，不改已有权重。

## 六、不建议采用的

- **写死某个工具的文件名**（如 `settings.local.json`、`.cursor/rules`）：违反通用性，只作为例子出现。
- **强制使用 Dev Containers**：成本高，不是每个项目都需要。作为可选项提一句。
- **强制披露每次 AI 辅助**：各项目的做法分歧很大。只要求标明 agent 写的 PR 和评论，细节由团队定。
- **一般性的团队协作守则**（响应时间、会议、沟通渠道）：已经和负责人确认不属于这个话题。

## 七、待核实

- Codex 的 `AGENTS.override.md` 文件名和行为只来自二手资料，没有看到官方文档。
- Cursor 用户规则的存储位置，各来源说法不一致。
- `CLAUDE.local.md` 是否被工具自动忽略，没有确认。

以上三点都只影响例子，不影响约定本身。

## 来源

所有页面在 2026-10-14 打开。

- Claude Code 设置文档：[settings](https://code.claude.com/docs/en/settings)
- Cursor 规则文档：[rules](https://cursor.com/docs/context/rules)
- AGENTS.md 分层与 override（二手）：[AGENTS.md Advanced Patterns](https://codex.danielvaughan.com/2026/03/26/agents-md-advanced-patterns/)、[Layer Agent Instructions by Specificity Across Scopes](https://agentpatterns.ai/instructions/layered-instruction-scopes/)
- Git 手册：[gitignore](https://git-scm.com/docs/gitignore/2.54.0)
- [The Twelve-Factor App: III. Config](https://12factor.net/config)
- [EditorConfig（Wikipedia）](https://en.wikipedia.org/wiki/EditorConfig)
- Dev Containers（二手）：[How to Set Up Dev Containers for Team Development](https://oneuptime.com/blog/post/2026-01-25-dev-containers-team-development/view)
- [Convention over configuration（Wikipedia）](https://en.wikipedia.org/wiki/Convention_over_configuration)
- AI 贡献政策：[Coder AI_CONTRIBUTING](https://coder.com/docs/v2.37/about/contributing/AI_CONTRIBUTING)、[earthaccess AI policy](https://earthaccess.readthedocs.io/en/latest/contributor/ai-policy/)、[CodeCarbon AI policy](https://docs.codecarbon.io/latest/how-to/ai_policy/)、[MQT AI usage](https://mqt.readthedocs.io/projects/naviz/en/latest/ai_usage.html)
- 共享 agent 配置的治理（二手）：[CODEOWNERS for the Fleet](https://tianpan.co/blog/2026-07-02-codeowners-for-the-fleet)、[setup agents review（Tessl）](https://tessl.io/registry/nitinjain999/platform-skills/files/references/setup-agents-review.md)
