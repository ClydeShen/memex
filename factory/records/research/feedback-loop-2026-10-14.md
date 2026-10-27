# harness 中的 feedback loop：有效反馈是什么、从哪来、冲突怎么办、到哪去

日期：2026-10-14。对象：在 harness engineering 的框架下（引导 guides / 传感器 sensors；计算型 / 推理型），回答四个问题：(1) 什么样的反馈是有效的，对结构有什么要求；(2) 通过什么方式获取；(3) 反馈冲突时怎么处理；(4) 反馈通过什么方式回到 agent，提高之后的质量。附带少量调查 2026 年出现的两个新词：loop engineering 和 graph engineering。调研时仓库提交为 `20dc43f5`。本文只是调研记录，不是 playbook 的结论；写入 playbook 前要先和负责人对齐理解。

可信度标记（沿用仓库约定）：
- **[官方/原文]**：读过一手来源（论文页面、官方博客、官方文档）的相关部分。
- **[官方/原文·摘要]**：只读到摘要或概述页。
- **[二手]**：来自搜索结果摘要或第三方转述，没有追到一手来源。
- **[推断]**：本文作者的判断，没有直接证据。

**利益冲突说明**：本文由 Claude（Anthropic 的模型）撰写。引用 Anthropic 的内容只采用机制性建议，不采信效果宣传，与其他厂商同等对待。

**关于新词**：loop engineering、graph engineering 都是 2026 年才出现的说法，来源多为博客和厂商相关文章，定义不统一，有明显炒作成分（有来源报告 graph engineering 出现 48 小时内就有三种定义和一项伪造的研究）。本文只采用多个来源一致的部分，不把它们当成标准。

---

## 一、有效的反馈是什么

### 1.1 判断标准：接收者是否据此行动

- **Google Tricorder / 静态分析经验**：定义"有效误报"（effective false positive）为开发者没有据此行动的结果——即使技术上正确，只要对方看不懂、被误解或不重要，也算误报；反过来，为可读性做的修改不算误报。新检查的收录标准：易懂、可操作且容易修、有效误报低于约 10%、对代码质量有实际影响。每条结果有"Not useful"按钮，点击后可以直接给分析器作者提 bug；团队跟踪"Not useful"比率（尤其相对于审查者点"Please fix"的比率），不改进的分析器被下线。一个案例：某检查每周收到"没用"的报告，最后只改了错误消息的措辞就解决了。FindBugs 早期使用率低，原因是结果大量是开发者不关心的。[官方/原文·摘要]（10% 的具体数字只在二手摘要中核对到 [二手]）
- **Coverity（Bessey 等，CACM 2010）**：误报超过约 30% 就容易出问题；信任下降会形成恶性循环——真实 bug 也被当成误报关掉，信任进一步下降。[二手]
- **推论**：反馈通道本身也需要反馈。每个传感器都应能被标记"没用"，误报率持续偏高的传感器要改写消息、调整或删除。[推断，依据上面两条]

### 1.2 一条好反馈的要素

- **三要素：哪里错、应该怎么做、去哪看更多上下文**。Fowler 网站的 harness 文章指出为 LLM 优化的传感器输出（例如带自我修复指引的 linter 消息）特别有用；实践者文章把好的修复消息拆成这三部分，并认为它比指令文件里的条目更有效，因为它出现在违规发生的时刻，而不是几千 token 之前预加载。[官方/原文]（Fowler）+ [二手]（三要素的拆法）
- **"成功时安静，失败时详细"**：通过的检查少输出；失败的检查给堆栈、lint 位置、失败测试的 diff，让 agent 不需要人就能修。[二手]（Thoughtworks 等实践者文章）
- **错误要引导下一次调用**：Anthropic 的工具设计文章建议错误不要只给一个代码（如 `TOO_MANY_RESULTS`），而要告诉 agent 怎么做（分页、过滤、换格式并给示例）；在真实 agent 运行中观察失败再改写错误消息；把工具错误次数作为评估指标。[官方/原文·摘要]（具体措辞来自二手转述 [二手]）
- **检验方法**：只给模型错误文本和工具文档，看它提出的下一步是否正确；不正确，就改写消息。[二手]

### 1.3 推理型反馈（AI 审查）的风险

- **LLM 会在正确代码里"发现" bug**：arXiv 2609.10123（*If It's Not Buggy, Don't Fix It*）报告，多个模型和修复环境下，LLM 稳定地声称在无 bug 的程序里发现 bug；修复流程弄坏正确程序的速率高于修好错误程序的速率；长期会进入同样的修改被反复加上又删掉的"伪修复循环"。摘要没有给具体的应对建议，作者的含义是：无监督的盲目迭代有风险，需要停止条件。[官方/原文·摘要]
- **实际接受率低**：CodeRabbit 审查的实证研究（arXiv 2607.03316，239 个仓库、31,073 对审查与回应）——36.4% 被接受，7.3% 引起讨论，56.3% 被拒绝，拒绝主要因为误报、重复、超出范围、与开发者意图不符。RevMate 在 Mozilla 和 Ubisoft 的部署：评论接受率约 8%，多数受访审查者说审查变慢了。[二手]
- **过度纠正**：有来源（引 arXiv 2603.00539）称 LLM 会把正确实现判为不合规，且要求模型解释推理并提出修正的提示词，误判率反而更高。[二手，未读原文]
- **评测口径**：厂商基准常用已知有 bug 的 PR，或不计误报，会高估效果；"已解决"在不同研究里定义不同。[二手]
- **推论**：AI 审查的发现不能自动驱动修改；每条发现要带可验证的失败场景，并经过验证；必须允许"无发现"作为合法结果。[推断，依据上面几条]

### 1.4 结构上的要求

- **SARIF 可以承载计算型和推理型发现**，但推理型来源要额外注意：rule id 在多次运行之间必须稳定（AI 审查者不能每次自己起规则名），路径用仓库相对路径，用 `partialFingerprints` 去重，否则每次运行都会产生新告警、关掉旧告警；没有标准的方式跨运行跟踪"已驳回"，需要自己按 fingerprint 记录；单次上传最多 5000 条结果，需要排序后取前面的；LLM 的置信度和 `security-severity` 分级不能直接对应，需要自己定映射。[官方/原文]（GitHub 文档）+ [二手]（对 LLM 来源的适用性）
- **经验教训（lesson）的结构**：compound engineering 的多个模板一致使用"症状 → 根因 → 修复 → 预防"四段。[二手]
- **测试结果**：沿用 QA 调研的结论——退出码 + JUnit XML / JSON，只输出失败。（见 `qa-harness-tools-2026-10-14.md`）

---

## 二、从哪来

### 2.1 loop engineering：能让工作失败的检查 vs 只发表意见的检查

- **定义**：设计、运行和改进让 agent 计划、行动、观察结果、修正方法直到达成目标的反馈系统；名称和框架归于 Addy Osmani（2026 年 6 月前后）。[二手]（没有读到 Osmani 原文）
- **验证**：Sonar 的文章转述 Osmani 的区分——能让工作失败的检查，和只给意见的验证器。确定性检查（测试、类型、构建、静态分析）每次结果一样；LLM 判断是概率性的；有较好的证据表明独立的评分者优于自我批评；两类检查回答不同的问题，应该叠加。[二手]
- **循环的控制**：机器可读的验证器、成功退出条件、迭代上限、预算上限；没有验证器和停止规则把关时，agent 倾向于做到"看起来完成"。验证失败的项要记录并跳过，不在原地重试，避免一个顽固的情况耗尽预算；最后一轮无新改动时循环自行结束。[二手]（Augment、Developers Digest）
- **风险**：设计差的循环会整夜消耗预算，同时"相信"自己在进步；同样的模型，不同的循环设计，结果差别很大。[二手]

### 2.2 三层循环的诊断词汇（agentpatterns.ai）[二手]

| 循环 | 边界 | 失败信号 | 修法 |
|---|---|---|---|
| 工具循环（一轮内） | 一轮内的模型与工具调用 | 相似参数的同一工具调用反复出现，轮与轮之间没有进展 | 检查工具定义和权限，降低迭代上限，加循环检测 |
| 验证循环（跨轮） | 测试或构建通过 | 测试或构建一直红，修改在几种改法之间打转 | 让错误信号更清楚：缩短反馈周期，缩小测试，给完整堆栈 |
| 收敛循环（跨轮） | 没有机器可检查的关卡，只能看是否稳定 | diff 来回震荡，范围漂移，没有一个版本更接近完成 | 停止修改产物，回到计划或范围；用收敛信号而不是模型的自信判断；由人决定是否停止 |

要点：一层的症状可能掩盖另一层的病因（例如工具循环卡住，原因可能是 spec 有歧义）。一次性任务或已有严格测试关卡定义"完成"时，不需要这套框架。

### 2.3 其他来源

- **执行者不应给自己打分**；在完成信号处拦截，强制走一遍验证清单再允许结束。[二手]
- **元信号**：工具错误次数、调用次数、token 消耗、运行时间作为评估指标。[官方/原文·摘要]（Anthropic）
- **让应用本身对 agent 可观测**：OpenAI 的 harness engineering 实践让 agent 能用 LogQL / PromQL 直接查询日志和指标。[二手]（没有读到 OpenAI 原文）
- **QA 调研中已有的来源**（会话内 hook、关卡测试、独立审查子 agent、集成后的变异测试等）见 `qa-harness-tools-2026-10-14.md`。

---

## 三、冲突怎么办

### 3.1 graph engineering：把路由显式化

- **三种含义**（PuppyOne 的整理）：执行/编排图（下一步运行什么）；循环与控制组成的图（评估、重试、策略检查、审计如何互相约束，作者自称是概念性的）；知识/记忆图。三种含义常被混用。[二手]
- **与反馈相关的部分**：[二手]
  - 反馈是回到前面节点的边（loop-back edge）。
  - 关卡是条件边，把结果路由到**通过 / 修改 / 拒绝 / 上报**。
  - **审查者不应能改写它评判的产物**；成功要用**图外部的证据**（测试、独立数据）判定。
  - 恢复路径：有上限的重试边；副作用隔离、操作幂等、检查点。
  - 上报：把控制权交给人或更安全的流程；批准应绑定到具体的运行、检查点、动作和**状态版本**。
  - 停止条件：循环次数、尝试次数、时间和花费预算、人的响应期限、可度量的通过条件。
  - 常见失败：无上限的循环；恢复后重放副作用；**多个相似的 agent 强化同一个错误来源，并把这种一致当成验证**。
- **成本**：多数一次性问题和独立任务不需要图；建议从最小的图开始，在真实任务上和更简单的方法比较。[二手]（Wavect）
- 研究方面有 arXiv 2608.21156 把它作为 LLM agent 系统的范式；本文没有读。

### 3.2 优先级

- 没有找到对照研究。实践者材料（一个处理审查意见的 skill）给出的顺序：**用户意图 > 需求/spec > 审查建议**；审查建议与 spec 矛盾时，先记录冲突，检查 spec 本身是否错：spec 对就按 spec 实现并记录审查者的担忧；spec 错就先上报，不擅自改。修改前先对照实际代码核实反馈；已有的代码模式优先于某个审查者的偏好。[二手]
- **测试不自动是最高权威**：测试一直红，可能是测试本身编码了错误假设，所以测试要先和 spec 核对，再当作事实依据。[二手]

### 3.3 震荡

- agent 通常只在上一次猜测上做小变化，所以会在两种几乎相同的错误修复之间来回切换；失败的尝试留在上下文里，影响下一次尝试。[二手]（freeCodeCamp 等）
- 在普通的 agent 循环里，恢复没有上限，也没有上报协议。[官方/原文·摘要]（arXiv 2604.11378）
- 一篇论文的控制器统计重复失败次数，直接策略用尽后升级策略（玩具任务，只作示意）。[二手]

### 3.4 综合 [推断]

1. 显式排序：用户意图 > spec > 已和 spec 核对的测试 > 计算型检查 > 推理型审查 > agent 自己的判断。
2. agent 必须写出冲突是什么、按哪一级裁决，不能悄悄二选一。
3. 限制重试并检测震荡（本次修改回退了上一次的 diff，或同一测试红绿来回翻）。
4. 达到上限或 spec 看起来有错时，上报给人，同时附上审查意见和 spec 的对应条款。
5. 不允许用削弱检查（删测试、加忽略、降阈值）的方式消解冲突。

---

## 四、到哪去

### 4.1 出错时给，比提前写进上下文更有效

- **AGENTS.md 的评测**（ETH Zurich 与 LogicStar.ai，arXiv 2602.11988，ICLR 2026）：在 SWE-bench 任务和新建的 AGENTbench（138 个真实 Python 任务）上，比较无上下文文件、LLM 生成的文件、人写的文件。arXiv 版本说上下文文件没有提高任务成功率，推理成本增加 20% 以上；ICLR 摘要说法更弱一些，称倾向于降低成功率。agent 确实会遵守文件中的指令（更多测试、更多文件遍历），但不必要的要求让任务变难。作者结论：人写的上下文文件应只描述最少的必要要求。[官方/原文·摘要]（人写 +4% / LLM 生成 −2% 的数字只在二手摘要中看到 [二手]）
- **Thoughtworks**：agent 一直不遵守提示文件中的约定时，把它升级成机械的传感器（自定义 lint 规则、类型检查、架构测试）；问题反复出现时，改进前馈或反馈控制，而不是更密地盯着；可以让 agent 自己搭建 linter 和结构测试。[二手]
- **只有反馈没有规则**会重复犯错；**只有规则没有反馈**无法知道规则是否起效，两者都要。[二手]

### 4.2 外回路：每个 bug 变成永久的护栏

- **compound engineering（Every）**：计划 → 实施 → 审查 → 沉淀四个阶段；每个 PR、bug、审查都回到系统默认值里。一种自动化做法：bug 被标记后，生成失败的单元测试、对修复加回归测试、新建 linter 或策略检查、往 agent 的规则里追加一条"不再重犯"。lesson 按生命周期分放：功能相关放进度文件，长期模式放 AGENTS.md（全局或子目录），代码级的坑放行内注释，防复发放测试。来源自己承认依赖持续整理，否则规则库会过时或膨胀。效果数据都是自述。[二手]
- **OpenAI harness engineering**：早期每周五用 20% 的时间手动清理"AI 垃圾"，不可持续；改为把"黄金原则"写进仓库，后台任务每天扫描偏离、更新质量分、开修复 PR（"垃圾回收"）。架构约束（依赖方向、层边界、命名、文件大小、结构化日志命名）写成自定义 linter 和结构测试，lint 错误专门写给 agent 读。多数审查变成 agent 对 agent，只在关键判断上要求人审查；审查 agent 按角色（可靠性、可扩展性等）在每次推送时触发。[二手]（没有读到 OpenAI 原文）
- **Tricorder**：见 1.1，没用的检查会被修改或下线——外回路不只是增加规则，也包括删除规则。[官方/原文·摘要]

### 4.3 维护积累的经验时不能丢细节

- **ACE（Agentic Context Engineering，arXiv 2510.04618，ICLR 2026）**：把上下文当作不断演进的条目化"手册"，由生成、反思、整理三个角色维护。指出两种失败：**简短偏好**（为了简洁丢掉领域细节）和**上下文坍缩**（让模型反复整体重写，细节逐步丢失；二手报告的例子是约 18,000 token 被一次重写压到约 122 token，准确率从 66.7% 降到 57.1%，低于完全不做适应）。做法：**增量更新**——只追加小批新条目，用确定性步骤合并、去重，不整体重写；可以只用执行反馈，不需要标注。报告在 agent 基准上提升 10.6%，金融任务上提升 8.6%。[官方/原文·摘要]（坍缩的具体数字 [二手]）

---

## 五、对讨论中初步框架的修正 [推断]

1. **新增"反馈的反馈"**：每个反馈通道要能被标记"没用"，误报率持续高的传感器要改写、调整或删除（依据 1.1）。
2. **AI 审查只提发现，不直接驱动修改**：必须附可验证的失败场景，允许"无发现"，经过验证再进入修复清单（依据 1.3）。
3. **测试要先和 spec 核对**，再作为裁决依据；冲突处理要写出裁决依据并检测震荡（依据 3.2–3.4）。
4. **升级阶梯得到多个来源印证**（依据 4.1、4.2），并补一条：维护经验只做增量合并，不让 agent 整体重写精简（依据 4.3）。
5. **用三层循环作为诊断工具**，判断该修信号还是回到计划（依据 2.2）。

## 六、待核实

- Osmani 的 loop engineering 原文、OpenAI *Harness engineering* 原文、Coverity CACM 原文、arXiv 2603.00539、arXiv 2608.21156、RevMate 预印本：本文只读到二手转述。
- Tricorder 的 10% 阈值措辞。
- AGENTS.md 评测中人写 / LLM 生成文件的具体百分比。

---

## 来源

harness 与传感器消息：
- [Harness engineering for coding agent users（Fowler 网站）](https://martinfowler.com/articles/harness-engineering.html)
- [Thoughtworks: Engineering the harness](https://thoughtworks.com/insights/blog/architecture/engineering-the-harness-a-practical-pattern-for-reliable-coding-agents)
- [agentpatterns.ai: Harness Engineering](https://agentpatterns.ai/training/foundations/harness-engineering/)
- [Anthropic: Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Your Error Messages Are Prompts Now](https://tianpan.co/blog/2026-07-02-your-error-messages-are-prompts-now)
- [Errors Are the Interface Agents Actually Read](https://steel.dev/blog/errors-are-the-interface-agents-actually-read)

静态分析与 AI 审查的有效性：
- [Lessons from Building Static Analysis Tools at Google（CACM 2018）](https://cacm.acm.org/magazines/2018/4/226371-lessons-from-building-static-analysis-tools-at-google/pdf)
- [Tricorder: Building a Program Analysis Ecosystem](https://www.cs.umd.edu/class/spring2019/cmsc414/papers/tricorder-building-a-program-analysis-ecosystem.pdf)
- [Software Engineering at Google, ch.20 Static Analysis](https://abseil.io/resources/swe-book/html/ch20.html)
- [AI Code Review at Scale: false positive trap](https://tianpan.co/blog/2026-04-17-ai-code-review-at-scale-false-positive-trap)
- [Is AI Code Review Actually Worth It — measured evidence](https://www.youngju.dev/transcribe/2026-07-17-ai-code-review-measured-evidence.en)
- [Is Agentic Code Review Helpful? CodeRabbit（arXiv 2607.03316）](https://arxiv.org/pdf/2607.03316)
- [Developer Responses to Agent-Generated Code Review Comments（arXiv 2607.21997）](https://arxiv.org/pdf/2607.21997)
- [If It's Not Buggy, Don't Fix It（arXiv 2609.10123）](https://arxiv.org/abs/2609.10123)
- [LLM review overcorrection](https://agentpatterns.ai/patterns/anti-patterns/llm-review-overcorrection/)
- [GitHub: SARIF support for code scanning](https://docs.github.com/en/enterprise-server@3.1/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning)

loop engineering：
- [Sonar: Loop engineering without verification is just automation](https://www.sonarsource.com/blog/loop-engineering-without-verification-is-just-automation/)
- [Augment: What is loop engineering](https://www.augmentcode.com/guides/what-is-loop-engineering)
- [Developers Digest: Loop engineering, designing agent loops](https://www.developersdigest.tech/blog/loop-engineering-designing-agent-loops)
- [MindStudio: What is loop engineering](https://mindstudio.ai/blog/what-is-loop-engineering-autonomous-ai-agent-workflows)
- [The Three Loops of Agentic Coding](https://agentpatterns.ai/loop-engineering/three-loops-agentic-coding/)

graph engineering：
- [PuppyOne: What Is Graph Engineering for AI Agents?](https://www.puppyone.ai/en/blog/graph-engineering-ai-agents-map)
- [Analytics Vidhya: Graph Engineering for AI Agents](https://www.analyticsvidhya.com/blog/2026/07/graph-engineering/)
- [I-Scoop: What is graph engineering](https://www.i-scoop.eu/what-is-graph-engineering-how-structure-makes-ai-agents-reliable/)
- [Wavect: Graph engineering](https://wavect.io/blog/graph-engineering-ai-agents.md)

冲突与震荡：
- [Review response skill（tessl registry）](https://tessl.io/registry/skills/github/nyldn/claude-octopus/skill-review-response)
- [How to break the AI coding agent fix loop（freeCodeCamp）](https://www.freecodecamp.org/news/how-to-break-the-ai-coding-agent-fix-loop/)
- [From Agent Loops to Structured Graphs（arXiv 2604.11378）](https://arxiv.org/pdf/2604.11378)

上下文、经验沉淀：
- [Evaluating AGENTS.md（arXiv 2602.11988）](https://arxiv.org/pdf/2602.11988)
- [Agentic Context Engineering（arXiv 2510.04618）](https://arxiv.org/html/2510.04618v2)
- [Every: My AI had already fixed the code before I saw it](https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it?via=sergio)
- [Compounding Engineering: Building Self Improving Systems With AI](https://afeatureaday.substack.com/p/compounding-engineering-building)
- [compound-engineering skill（skills.sh）](https://skills.sh/5dlabs/cto/compound-engineering)
- [ZenML: Harness engineering（OpenAI 案例）](https://zenml.io/llmops-database/harness-engineering-building-software-where-humans-steer-and-agents-execute)
- [Harness engineering survey](https://yage.ai/share/harness-engineering-survey-en-20260312.html)
