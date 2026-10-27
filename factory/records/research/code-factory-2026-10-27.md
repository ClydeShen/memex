# 软件工厂（code factory）的概念：前人怎么做，和 ADR 0028 的三区有什么异同

日期：2026-10-27。起因：ADR 0028 把仓库分成 `harness/`（驱动）、`factory/`（车间，由 agent 自治管理）和 `product/`（孤立的成品）。负责人想知道"软件工厂"这个概念有没有前人的研究和实践。

可信度标记沿用仓库约定：**[官方/原文]**、**[官方/原文·摘要]**、**[二手]**、**[推断]**。

---

## 结论

| 问题 | 结论 |
|---|---|
| 有没有这个概念？ | **有，而且有三代。** 1969 年起日本厂商的"软件工厂"（流程标准化和复用）；2004 年微软的 Software Factories（用一套配置批量生产同一类产品）；2026 年的"agent 软件工厂"（人造工厂，agent 造产品） |
| 和三区的分法一致吗？ | **核心一致。** 三代都把"生产的配置"和"生产出来的产品"分开；2026 年的几家都强调"人负责造工厂，不再亲手造产品"，和"harness 驱动、factory 自治"是同一个方向 |
| 有没有人做过同样严格的隔离？ | **没有找到。** 看到的做法（OpenAI、Spec Kit、Kiro）都把工厂材料放在产品仓库里，通常是一个 `docs/` 或一个点目录，没有"产品不能引用工厂""只发布产品目录"这类机械边界。三区在这一点上比现有做法更严格 [推断，基于本次检索范围] |
| 有哪些值得借用？ | 隐藏在 agent 视野之外的验收场景；外部服务的行为克隆；持续运行的清理 agent；带修复说明的检查报错；工厂观察自己并改进的闭环。见第四节 |
| 有哪些不该照搬？ | "黑灯工厂"（代码完全不经人审查）和每人每天上千美元的 token 预算。见第五节 |

---

## 一、第一代：日本的软件工厂（1969 年起） [官方/原文·摘要]

- Cusumano 1991 年的书 *Japan's Software Factories* 研究了日立、东芝、NEC、富士通怎样用工厂式的组织、工具和方法做大型软件。
- 日立在 1969 年第一个把一个软件部门叫作"工厂"。四家都在 1960 年代末到 1970 年代末开始，目的是在内部统一流程。
- 书中各章的重点：日立是流程和质量控制，东芝是把生产率和复用联系起来。

**对三区的意义 [推断]**：工厂的本义是**标准化的流程加上复用**。harness 就是"标准化的流程"那部分，"换一个产品还用得上"这条判断规则，就是复用。

## 二、第二代：微软的 Software Factories（2004） [二手]

Greenfield 和 Short 在 2004 年的书和白皮书中提出：

- **软件工厂**是一套语言、模式、框架和工具的配置，用来生产**同一类产品的不同变体**。
- 它分三部分：
  - **schema（配方）**：产品由哪些部分组成、怎样组合，用哪些领域语言，模型怎样变成代码；
  - **template（模板）**：具体的资产，例如模式、指南、框架、脚本；
  - **environment（环境）**：被模板配置好的开发工具（当时是 Visual Studio Team System）。

**对三区的意义 [推断]**：

| Software Factories | ADR 0028 |
|---|---|
| schema 加 template | `harness/`（规范、工作流、模板、skill、检查） |
| environment | agent 工具本身（Codex、Claude Code），由 `AGENTS.md` 和生成的 skill 目录配置 |
| 一类产品 | 换一个产品，harness 基本可以带走 |
| 一个产品变体 | `product/` |

微软的方案后来没有流行起来。这次没有查到它失败的一手分析，所以不下结论。

## 三、第三代：agent 软件工厂（2026）

### 3.1 OpenAI：harness engineering（2026-02） [官方/原文·摘要，原文页面返回 403，内容来自摘要和转述]

- 三名工程师驱动 Codex，做出一个内部产品，**没有一行手写代码**，合并了大约 1,500 个 PR，代码量在百万行级别。
- 早期教训：给 agent 一张**地图**，而不是一本手册。一个很大的 AGENTS.md 会挤占上下文，也很快过期。后来的 AGENTS.md 只有约 100 行，指向 `docs/`。
- "Codex 看不到的东西就不存在"：Slack 里的约定、聊天里的决定，都要写进仓库。
- 用 CI 和 linter 检查知识库是否最新、是否自洽。自定义 linter 的报错信息里写着修复方法，agent 读了就能改。
- 定期运行的 agent 扫描过期文档（doc-gardening），以及偏离"黄金原则"的代码，然后开修复 PR。他们一开始每周五花 20% 的时间手工清理，后来发现持续的小清理比集中的大清理便宜。

### 3.2 StrongDM：Software Factory（2026-02） [官方/原文·摘要]

- 两条规则：代码不能由人写，代码不能由人审查。
- **场景（scenario）**：端到端的用户故事，**放在代码库之外，agent 看不到**，作用类似训练模型时留出的测试集，由 LLM 判断软件是否满足。原因是普通测试会被 agent 改写或者钻空子。
- **满意度**：不再看"测试是否全绿"，而是看所有场景的运行中，有多大比例可能让用户满意。
- **Digital Twin Universe**：Okta、Jira、Slack、Google Docs 等外部服务的行为克隆，由 agent 按公开 API 文档构建。没有限流和配额，每小时能跑几千个场景，也能测在真实服务上不敢测的故障。
- 衡量标准：每个工程师每天至少花 1,000 美元的 token。
- 质疑：Simon Willison 认为这个成本只有少数企业承受得起；斯坦福法学院的文章认为，一家安全软件公司取消人工审查，会带来责任和监管问题 [二手]。

### 3.3 Dan Shapiro：五个等级（2026-01） [二手]

从"带调料的自动补全"（第 0 级）到"黑灯软件工厂"（第 5 级）。第 4 级像工程团队：人和 agent 一起写规格和计划，agent 做实现。第 5 级是规格进去、软件出来，没有人审查代码；人设计的是这个系统本身，包括证明软件可用的测试、工具和模拟环境。

### 3.4 Factory.ai：Factory 2.0（2026-06） [官方/原文·摘要]

- 软件工厂是一个相互连接、以 agent 为单元、端到端的系统，**通过观察自己不断改进**。
- 输入（缺陷报告、用户反馈、业务需求）被整理成计划中的改动，再经过构建、测试、审查、安全、发布、监控。一个阶段的发现会反馈给其他阶段，例如事故会关联到引起它的 PR。
- 人负责**造工厂**，以及治理、安全和业务结果。
- 自主程度按组织的准备情况逐步放开。

### 3.5 把工厂材料放进仓库的现成工具 [官方/原文·摘要]

| 工具 | 放在哪里 | 放什么 |
|---|---|---|
| GitHub Spec Kit | `.specify/`（`memory/`、`templates/`、`scripts/`） | 项目宪章（原则）、规格、计划、任务；一次性的缺陷报告和评估 |
| Kiro | `.kiro/steering/`、`.kiro/specs/` | 产品、技术栈、目录结构的长期说明；每个规格一个目录 |
| OpenAI（3.1） | `AGENTS.md` 加 `docs/` | 设计文档、执行计划、架构决策、质量评分 |

这些工具都把工厂材料和产品代码放在同一个仓库里，没有规定产品不能引用它们，也没有规定发布时排除它们 [推断]。

---

## 四、和三区对照：印证了什么，可以借用什么 [推断]

### 4.1 印证

| 前人的做法 | 三区中的对应 |
|---|---|
| 人造工厂，agent 造产品（Factory.ai、Shapiro 第 5 级、StrongDM） | harness 由负责人和 agent 共同管理；factory 由 agent 自治 |
| AGENTS.md 是地图，不是手册（OpenAI） | 根目录 `AGENTS.md` 很薄，正文在 `harness/agents/` |
| 看不到的东西就不存在（OpenAI） | 决定和调研都进 `factory/records/` |
| 用机械检查守住标准（OpenAI） | `harness/sensors/`；ADR 0028 第三节的边界检查 |
| 外部服务的行为克隆（StrongDM） | Micro World、Fake Provider、录制与回放（ADR 0005、0024） |
| 流程标准化加复用（日本软件工厂、微软） | "换一个产品还用得上，就放 harness" |

### 4.2 可以借用

| 编号 | 做法 | 来源 | 放在哪里 | 建议时机 |
|---|---|---|---|---|
| F1 | **验收场景放在实现 agent 看不到的地方**。playbook 现在只规定"实现者不能改受保护的测试"，StrongDM 更进一步，让实现 agent 根本看不到。和 Harness² 调研里的 Oracle 守卫是同一个思路 | StrongDM | 决定放在哪里：独立仓库，或者只有 CI 能读的位置 | V1（和 Oracle 守卫一起） |
| F2 | **持续运行的清理 agent**：定期扫描 `factory/design/` 和 `product/` 中过期的文档、偏离规范的代码和标记词，开小的修复 PR。现在的整理 story 每个 epic 做一次，可以作为补充 | OpenAI | `harness/workflow/`；factory 自治的一部分 | V0 结束后，看整理 story 的实际负担再定 |
| F3 | **检查的报错里写修复方法**：自定义检查失败时，告诉 agent 该怎么改，而不只是哪里错了 | OpenAI | `harness/sensors/` 的写法规范 | V0-01 起 |
| F4 | **工厂观察自己**：把事故、审查意见、检查失败关联到引起它们的提交，反馈到 feedback 记录和 harness | Factory.ai | `factory/records/`；playbook 的 feedback 流程 | 有真实使用之后（P1 起） |
| F5 | **按概率衡量的验收**：对没有确定答案的行为，用多次运行中满足要求的比例代替一次通过或失败 | StrongDM | 产品的验收方式；和 Memex 的 Calibration 思路接近 | 决策关卡讨论 |

## 五、不建议照搬的 [推断]

1. **代码完全不经人审查（第 5 级、StrongDM）**：playbook 有"最后一道关卡"和"理解债"（团队读不懂 agent 写的代码）的条目，Memex 的核心不变量是"修改自身须用户批准"（ADR 0022）。"factory 由 agent 自治"指的是日常管理不需要负责人动手，**审查和批准的范围由 harness 规定**，不等于取消审查。相当于 Shapiro 的第 4 级，加上一部分第 5 级的自动化。
2. **每人每天上千美元的 token 预算**：个人研究项目不适用。成本要记账，这和 Harness² 调研里的成本账本是同一件事。
3. **把工厂材料放进隐藏目录（`.specify/`、`.kiro/`）**：ADR 0028 已经说明了原因（ripgrep 默认跳过隐藏目录）。

## 六、可以考虑写进 playbook 的（先和负责人对齐）

- 三区模型：驱动（harness）、车间（factory）、成品（product），以及"换一个产品还用得上吗"这条判断规则。
- 验收场景对实现 agent 不可见（F1），作为"受保护的测试"的加强版。
- 检查报错写修复方法（F3）。

## 七、待核实

- OpenAI 的原文页面返回 403，第 3.1 节来自摘要和转述，`docs/` 下的具体子目录没有核实。
- 微软 Software Factories 只读到了白皮书的二手描述，PDF 正文没有提取出来。
- StrongDM 的 Principles 和 Techniques 页面没有读到，人在其中具体做什么没有核实。
- 没有查到微软 Software Factories 没有流行起来的一手分析。
- "没有人做过同样严格的隔离"只基于本次检索范围，没有系统性地排查。

## 来源

- [Japan's Software Factories（Cusumano，Oxford Academic）](https://academic.oup.com/book/52424)、[MIT 工作论文 SWP-3087](https://dspace.mit.edu/bitstream/1721.1/2280/1/SWP-3087-24832363.pdf)
- [Moving to Software Factories（Greenfield、Short，微软白皮书，2004）](https://www.softwarefactories.com/ScreenShots/MS-WP-04.pdf)、[Skillsoft 书目](https://skillsoft.com/book/software-factories-assembling-applications-with-patterns-models-frameworks-and-tools-ccee4a40-f15d-11e6-b06a-0242c0a80b05)
- [Harness engineering（OpenAI，2026-02-11）](https://openai.com/index/harness-engineering/)、[yage.ai 的综述](https://yage.ai/share/harness-engineering-survey-en-20260312.html)、[The Neuron 的解读](https://www.theneuron.ai/explainer-articles/openais-harness-engineering-playbook-how-to-ship-1m-lines-of-code-without-writing-any/)
- [StrongDM Software Factory](https://factory.strongdm.ai)、[Simon Willison 的介绍](https://simonwillison.net/2026/Feb/7/software-factory/)、[Stanford Law：Built by Agents, Tested by Agents, Trusted by Whom?](https://law.stanford.edu/2026/02/08/built-by-agents-tested-by-agents-trusted-by-whom/)
- [The Five Levels（Dan Shapiro）](https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/)、[Simon Willison 的摘要](https://simonwillison.net/2026/Jan/28/the-five-levels/)
- [Factory 2.0: From coding agents to software factories（Factory，2026-06-15）](https://factory.com/news/software-factory)
- [The agentic software factory（BCG Platinion）](https://www.bcgplatinion.com/insights/the-agentic-software-factory)
- [GitHub Spec Kit](https://github.com/github/spec-kit)、[Kiro Steering](https://kiro.dev/fr/docs/crew/capabilities/steering/)
