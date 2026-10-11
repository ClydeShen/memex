# 核心功能的前沿算法调研

日期：2026-10-11。对象：Memex 的七个核心功能：快慢路由与校准、Claim 置信度与信念修正、预算内的注意力选择、经验整合与 Pattern、Decay、本体扩展、小样本实验统计。本文建立在 [cross-check-2026-10-10.md](./cross-check-2026-10-10.md) 之上，那里已经核对过的结论（溯源加权约等于不防御 p=0.80、RACER 自我路由无效、SwiftSage、ExpeL、Nous、Context Rot、经验跟随 arXiv 2505.16067）不再重复，只在有更新的证据时补充。

可信度标记：
- **[官方/原文]**：读过论文原文（方法和结果部分）或官方文档。
- **[官方/原文·摘要]**：只读过论文摘要页，没有核对正文中的实验细节。
- **[二手]**：来自综述、引用或第三方介绍。
- **[推断]**：本文作者的推理，没有直接证据。

**新近标记**：标有 **〔2026-06 后〕** 的论文发表于 2026 年 6 月之后，大多是未经同行评审的预印本，而且常常只有一个作者、一个数据集。它们的方向值得参考，数字不宜直接当作结论。

**更正（ADR 0018）**：本文第四节中"只有经 Oracle 确认的成功才能形成 Pattern"已被修订：学习信号只来自 Environment 和 Verification，Oracle 只用于 Evaluator 打分。文中的"T5 的学习曲线"应为 T6（长序列学习），T5 是经验迁移。M0–M4 等里程碑名称按 ADR 0020 的对照表理解。正文保留原样。

约束提醒：所有建议都必须满足 VISION 原则 3（不训练、不微调、不做 LoRA；只允许阈值、温度系数这类配置层面的 Calibration），并服从 ADR 0010（每个维度只有一个主选、最多一个对照）。

---

## 总览

| 问题 | 推荐做法 | 依据强度 | 对应端口 / 里程碑 / 问题 |
|---|---|---|---|
| 1. 快慢路由与校准 | 对选项字母概率依次做三件事：先去除选项先验偏差（PriDe），再做温度缩放，最后用 Learn-then-Test / Conformal Risk Control 在校准集上选阈值，保证"走 Fast Path 时的错误率 ≤ α"（概率 ≥ 1−δ） | 中：理论保证成熟；在 4B 决策模型上没有直接证据；分布偏移时保证会失效 | Intuition 与 Cognitive Strategy / M1–M2 / Q1 |
| 2. Claim 置信度 | 每个（主体, 关系）维护一份 Dirichlet 证据计数（等价于 Subjective Logic 的观点）：证据按来源可信度折扣，上限由溯源决定（取溯源与内容的最小值），并沿 derivedFrom 传递污点；由 Projector 确定性地算出 Confidence 和 Epistemic Status | 中：Nous 的结果支持"可信度不同才有用"；小模型无法自己裁决冲突 | Knowledge（Projector）/ M1 / Q2 |
| 3. 预算内的注意力 | 按"每 token 边际收益"贪心做子模选择（相关性 + 覆盖 − 冗余），把信任等级的占用比例作为硬约束；评测时监控"答案是否留在上下文里" | 中：2026 年多篇预印本一致，但都是单作者的小规模研究 | Attention / M1–M2 / Q2（间接也服务 Q1、Q3） |
| 4. 经验与 Pattern | 把 Pattern 做成**可执行的计划模板**（类似 Agentic Plan Caching）：按本体类型匹配，由 Intuition 确认是否适用，经 Verification 后直接执行，不调用 Reasoning。只有经 Oracle 或 Verification 确认的成功才能形成 Pattern | 中偏弱："减少调用"只有 APC 等少数直接证据；"压缩后的经验常被忽略"有一项大规模研究支持 | Cognitive Strategy、Knowledge / M2–M4 / Q3 |
| 5. Decay | MVP 不做按时间衰减 Confidence。改为**由矛盾驱动的撤销**：Valid Time 封口，并沿依赖关系传播（真值维护）。Pattern 按成败计数降级 | 弱：衰减类方法大多只报告了节省存储，受控研究没有测出准确率差异 | Knowledge、Consolidation / M2–M4 / Q2、Q3 |
| 6. 本体扩展 | 先提议，经过确定性关卡（SHACL、OWL 推理机一致性检查、按嵌入做规范化去重、保守的停止规则），再由用户批准。只有在测出 Agent 分不清两件事时才触发 | 弱：迭代修复容易让 schema 失控；没有小模型方面的证据 | Verification、Policy / M4 之后 / 不属于 Q1–Q3 |
| 7. 实验统计 | 配对设计（同一世界、同一种子）；按 Task Family 做聚类 bootstrap；Q1 用非劣效检验；Q3 用多种随机任务顺序；每项重复 ≥ 8 次估计组内方差；名称混淆防污染 | 强：统计方法本身成熟；关于 Agent 方差的新证据也一致 | Lab（Evaluator）/ M0–M2 / Q1–Q3 |

---

## 一、快慢路由与校准（Intuition → Escalation）

### 1.1 现有方法

| 方法 | 需要什么 | 能给出的保证 | 和 Memex 是否匹配 |
|---|---|---|---|
| 温度缩放（Guo et al. 2017） | 一个参数，带标签的校准集 | 无，只能降低 ECE | 匹配，VISION 原则 3 明确允许 **[官方/原文]** |
| 去除选项先验偏差 PriDe（Zheng et al., ICLR 2024） | 在约 5% 的样本上打乱选项顺序，**不需要标签** | 无 | 很匹配。论文测了 20 个 LLM，发现偏差主要来自"选项 ID 这个 token 本身的先验"，提示词和 CoT 都消除不了 **[官方/原文·摘要]** |
| Token 级置信度级联（Gupta et al., ICLR 2024） | 生成文本的 logprob | 无 | 是 2026 年级联研究的标准基线 **[二手]** |
| 共形预测用于选择题（Kumar et al. 2023） | 选项概率 + 校准集 | 预测集合以 1−α 覆盖正确答案（边际意义上） | 很匹配：一次前向就够，不需要采样 **[官方/原文·摘要]** |
| Learn-then-Test / Conformal Risk Control（Angelopoulos et al. 2021/2022） | 校准集 | 以概率 ≥ 1−δ，保证"接受区域内的风险 ≤ α" | 很匹配：这就是"不降低准确率"的形式化写法 **[官方/原文]** |
| Trust or Escalate（Jung et al., arXiv 2407.18370） | 校准集；用模拟标注者估计置信度 | 可证明的"与人类一致率"下界；小模型先判，拿不准再上大模型 | 结构上就是 Memex 的快慢路由。用 Mistral-7B 在约 80% 的覆盖率下保证了 > 80% 的一致率 **[官方/原文·摘要]** |
| CP-Router（arXiv 2505.19970） | 共形预测集合的大小 | 无需训练，在 LLM 和推理模型之间路由 | 匹配 **[官方/原文·摘要]** |
| 语义熵（Farquhar et al., Nature 2024） | 多次采样 + 语义聚类 | 无 | 不太匹配：每道题都要采样多次，Fast Path 就不便宜了 **[官方/原文]** |
| UCCI（arXiv 2605.18796） | top-1 与 top-2 的概率差，再做保序回归（isotonic）校准 | 在若干假设下，阈值策略是成本最优的 | 匹配。保序回归是外部映射，不改模型，属于 Calibration。在一个 NER 生产负载上，F1=0.91 时成本降低 31%（95% CI 27–35%），ECE 从 0.12 降到 0.03 **[官方/原文·摘要]** |
| Conformal Cascade（arXiv 2607.25018）〔2026-06 后〕 | 每题采样 16 次，按共形集合大小决定：集合只剩一个答案才接受 | K 层级联错误率 ≤ Kα（附加假设成立时 ≤ α） | 思路匹配，但采样成本高。建议每层至少 200 条校准样本。基线是在测试集上用 oracle 调参的，所以优势被高估 **[官方/原文]** |

### 1.2 2026 年下半年的两项提醒

1. **分布一偏移，保证就失效。** arXiv 2606.29054〔2026-06 后〕在 716 种配置（3B–72B 共 6 个模型、8 个数据集）上发现：跨数据集迁移时，静态 CRC 和所有测试过的自适应 ACI 步长，在 16 次迁移中有 14 次违反了目标风险。论文还给了一个**可以事先计算的可行性公式**：如果基础错误率 μ 高于目标 α，任何不依赖分布的方法都至少要放弃 (μ−α)/(M−α) 比例的输入（M 是单题风险的上限）。**[官方/原文·摘要]**
   - 对 Memex 的含义 **[推断]**：在 Micro World 上量出 Tev1 的基础错误率 μ 以后，就能先算出"Fast Path 比例的理论上限"。例如 μ=0.30、α=0.05 时，至少 26% 的题必须 Escalation。这能提前告诉我们 Q1 有多大空间。
2. **小心自欺。** arXiv 2610.07354（2026-10-05）〔2026-06 后〕在 GSM8K 上测到语义熵识别小模型错误的 AUROC 为 0.871，比随机 Escalation 最多高 9 个百分点；但在合成基准上，一条**只看题目、不用模型的难度规则**就能达到同样效果。它提出的检查包括：①一定要和"只看题目的难度基线"比较；②"Escalation 有效"有不同定义，结论可能随定义改变；③基准要留有余地，即大模型确实比小模型好；④采样的真实成本要算进去。另外，基于缓存结果的路由换到新数据集后，AUROC 从 0.908 跌到 0.518。**[官方/原文·摘要]**
   - 对 Memex 的含义 **[推断]**：ADR 0010 的对照组"启发式规则"恰好就是检查①要的基线。T2 还要额外确认 B3-noI 确实比 Fast Path 强（检查③）。

### 1.3 对 Memex 的建议

- **主选**：在 IntuitionProvider 适配器后面接一条确定性的 Calibration 流水线：
  1. 用 PriDe 估计并除去选项字母的先验（不需要标签）。
  2. 用温度缩放校准 Certainty（一个参数）。
  3. 在留出的校准集上（带 Oracle 标签，与评测用的 Task Family 和种子分开），用 Learn-then-Test 的固定序列检验选阈值 τ，保证 P(Fast Path 答错) ≤ α 的概率至少是 1−δ。
  4. 上线后按 Task Family 分组监控实际错误率，超出 α 就重新校准（因为 2606.29054 显示偏移下保证会失效）。
  - 端口：Intuition（适配器内）与 Cognitive Strategy（阈值）。里程碑：M1 实现，M2 用 T2 验证。服务 Q1。
  - 是否违反约束：不违反。只有阈值和温度两个配置参数，加一张先验向量。
- **备选**：如果概率差和真实对错的单调关系很弱，就按 UCCI 的做法，改用 top-1 与 top-2 的概率差，加保序回归映射。保序回归同样是模型外部的映射，属于 Calibration。

---

## 二、Claim 的置信度与信念修正

### 2.1 现有方法

| 方法 | 要点 | 对 Memex 的意义 |
|---|---|---|
| Subjective Logic（Jøsang 2016） | 观点 = (相信, 不信, 不确定, 基率)，与 Beta/Dirichlet 证据计数一一对应；独立来源用累积融合，相关来源用平均融合；用信任折扣处理二手消息。部分融合算子不满足结合律（arXiv 1805.01388） | 能把"证据少"（未知）和"证据冲突"（有争议）分开表示，这正好对应两种 Epistemic Status **[官方/原文]** |
| 真值发现（TruthFinder、CRH 等，综述 arXiv 1505.02463） | 不知道来源可靠性时，交替估计"来源可靠性"和"命题真值" | 适合来源多、互相重叠的场景。Micro World 的来源数量少，收益可能不大 **[推断]** |
| Nous 的分类贝叶斯更新（arXiv 2606.22030） | 每个（实体, 属性）维护一个分类分布，可靠度 r 作为观测值的似然；溯源上限：r = min(溯源等级, 内容置信度) | 见 2.2 **[官方/原文]** |
| BeliefMem（arXiv 2605.05583） | 每条观察保留多个候选结论，用 noisy-OR 更新概率，检索时一起返回 | 与"有争议的 Claim 可以共存"一致 **[官方/原文·摘要]** |
| Zep / Graphiti（arXiv 2501.13956） | 双时态知识图谱：新事实使旧边失效，但不删除，保留历史 | 与 ADR 0002 的双时态一致；论文报告 LongMemEval 准确率最多提升 18.5%，延迟降低 90% **[官方/原文·摘要]** |
| TOKI（arXiv 2606.06240） | 把"后写者胜、证据加权合并、等待确认、按规则处理"四种冲突启发式统一为双时态算子；证明了**要保证回放一致，必须把裁决者（LLM 判定）的决定带键记录下来** | 与 ADR 0005（录制所有 Provider 调用）一致。注意：作者自己说跨系统比较的统计功效不足 **[官方/原文·摘要]** |

### 2.2 新证据：什么时候有用，什么时候反而有害

- **Nous 的消融实验**（arXiv 2606.22030 v2）〔2026-06 后〕：**[官方/原文]**
  - 在 LoCoMo 上，贝叶斯更新基本不起作用：后写者胜得 72.46，完整引擎得 69.62。真正起作用的是"聚合"这一步（去掉后得 66.58）。
  - 在合成测试中，**来源可靠度都相同时**，贝叶斯（67.1）不如后写者胜（73.5）；**可靠度不同时**，贝叶斯得 100，后写者胜 74.3，频率计数 48.2。
  - **置信度和正确性相反时**（对抗性场景），Nous 得 0，后写者胜 42。也就是说，方法完全依赖"可靠度能反映正确性"这个前提。
  - 溯源上限：面对 1 到 50 条投毒、对 4 条可信观察，攻击成功率始终为 0%；但信道信任度超过约 0.55 时失效。经过可信中间方"洗白"的内容会让攻击成功率回到 100%，除非追踪污点。代价是：如果合法的更正经由低等级（0.3）的来源到达，矛盾场景的准确率从 100% 降到约 54%。
  - Nous 的指数遗忘在所有评测中都没有被用到，所以没有证据支持或反对它。
- **小模型不会自己裁决冲突**（arXiv 2609.01852）〔2026-06 后〕：用 Qwen3 0.6B–8B 测试，模型的问题是"过度信任"，而不是"困惑"。给出元数据只对能力较强的模型有帮助；**对两个较小的模型，只有事先把冲突裁决好才能恢复准确率**。给过时笔记标上较新的日期，反而更容易骗过较大的模型。**[官方/原文·摘要]**
- **隐性冲突**（STALE, arXiv 2605.06527）：后来的观察在不明说的情况下让旧记忆失效。最好的模型也只有 55.2%。作者的结论是"显式的状态裁决"是有希望的方向。**[官方/原文·摘要]**
- **可信度元数据在 RAG 里有帮助，但不够**（CONFACT, IJCAI 2025）：现有 RAG 方法不擅长优先采用可信来源；在检索和生成阶段都加入可信度分数，有所改善。**[官方/原文·摘要]**

### 2.3 对 Memex 的建议

- **主选**：Confidence 由 Projector 确定性地计算，不交给模型：
  1. 每个（subject, predicate）是一个维度，维护一份 Dirichlet 证据计数。每条 Evidence 贡献的计数为 r = min(溯源等级上限, 内容置信度)。模型给出的"语气置信度"只能把 r 往下拉，不能往上抬（Nous 的规则）。
  2. 沿 `derivedFrom` 传递污点：推断得到的 Claim，可信等级不高于它最弱的上游来源。这样可以防止"洗白"。
  3. 按 Subjective Logic 的对应关系，同时算出 Confidence（期望概率）和不确定度 u = W/(W+Σr)：u 高时记为 `unknown`；两个值都超过阈值时记为 `contested`。
  4. 时间不进入权重：Valid Time 决定"当前哪个值成立"，有新证据取代旧证据时，给旧 Claim 的 validUntil 封口（Graphiti 的做法），不删除。
  5. **送入 Cognitive State 的是裁决后的结果**（当前值、Confidence、是否 contested），而不是一堆互相矛盾的原始笔记。这是根据 2609.01852 的发现：小模型自己裁决不了。
  - 端口：Knowledge（Projector）与 Action（形成或修改 Claim 的 Action）。里程碑：M1。服务 Q2。
  - 是否违反约束：不违反。纯确定性计算，可以回放。
  - T4 必须包含三种场景：①能回答问题的证据恰好来自低可信来源（cross-check 已提出）；②"语气自信但内容是错的"这种反向场景（Nous 在这种场景下得 0）；③经由可信中间方洗白的投毒。
- **备选**：如果维度不是单值的（例如集合属性），改用 BeliefMem 的做法：每个候选结论各自保存一个概率，用 noisy-OR 更新。

---

## 三、预算内的注意力与上下文选择

### 3.1 现有方法与新证据

| 方法 / 研究 | 发现 | 可信度 |
|---|---|---|
| MMR（Carbonell & Goldstein 1998）、Lin–Bilmes 子模摘要（ACL 2011） | 相关性减冗余；在背包约束下，"按每 token 边际收益贪心 + 单个最优元素兜底"有近似保证 | **[官方/原文]** |
| Recall Is Not Enough（arXiv 2607.00725）〔2026-06 后〕 | 提出"答案是否留在上下文里"（answer-in-context）这个指标，它在召回率之外又多解释了 R² 0.17–0.27。即使所有正确证据都检索到了，打包时是否保留答案，会让 EM 相差 4.6 倍。预算内的子模打包在 3 类读者模型、4 种规模、4 种预算下，都胜过 top-k 截断和 LLMLingua-2 压缩，token 用量相同或更少；和精心手调的启发式打平 | **[官方/原文·摘要]** |
| Budget-Aware Routing for Long Clinical Text（arXiv 2605.00336） | 同样把问题写成"背包 + 单调子模"；结论取决于场景：低预算的抽取式任务，按位置取开头最好；生成式任务用 MMR 去冗余有帮助 | **[二手]**（只见到搜索摘要） |
| PACMS（arXiv 2606.20047）〔2026-06 后〕 | 把记忆、对话轮次、工具输出放进同一个候选池，统一做子模选择，代替按时间截断 | **[官方/原文·摘要]**，摘要中没有数字 |
| 投毒防御（arXiv 2608.21230，cross-check 已引用） | 补充：只污染 1.2% 的 LongMemEval 语料，准确率就从 0.850 降到 0.300；作者建议"在检索时设定占用上限"，而不是加权 | **[官方/原文·摘要]** |
| HippoRAG 2（ICML 2025，arXiv 2502.14802） | 基于 Personalized PageRank 的图检索，联想记忆任务比最好的嵌入模型高约 7%，而且在事实记忆上不再输给普通 RAG | **[官方/原文·摘要]** |
| GraphRAG-Bench（ICLR 2026，arXiv 2506.05690）、RAG vs GraphRAG（arXiv 2502.11371） | GraphRAG 在很多实际任务上不如普通 RAG；图检索主要在多跳推理和全局汇总上占优，简单查找时反而引入噪声，延迟也更高 | **[官方/原文·摘要]** + **[二手]** |
| Context Rot（cross-check 已引用） | 与正确答案相似但错误的干扰信息伤害最大 | 已确认 |

### 3.2 对 Memex 的建议

- **主选**：Attention 用"按每 token 边际收益的贪心子模选择"：
  - 目标函数 = 与目标的相关性 + 对目标所涉实体或关系的覆盖 − 与已选内容的冗余。
  - 约束一：token 预算（背包约束）。
  - 约束二：每个信任等级的占用上限（分区约束）。这就是 cross-check 提出的"占用比例"，在这里成为一个硬约束，而不是加权项。
  - 同一维度的多个 Claim 先在 Knowledge 层裁决（见第二节），只送一条结果，不送互相冲突的近似重复内容（这是 Context Rot 里伤害最大的那类）。
  - 候选集由 Retrieval（BM25 + 向量）加上图上一跳邻居生成。
  - Lab 中增加诊断指标 answer-in-context（由 Oracle 判断答案所需的 Claim 是否进入了 Cognitive State）。这样能区分是 Attention 出了问题，还是 Reasoning 出了问题。
  - 端口：Attention（选择）、Retrieval（候选）、Lab（诊断）。里程碑：M1 实现，M2 用 T4 验证。服务 Q2，间接服务 Q1 和 Q3（上下文越小越便宜）。
  - 是否违反约束：不违反。
- **备选**：只有在测出"多跳题目答错，而且原因是所需 Claim 没能进入候选集"时，才把候选生成换成 HippoRAG 2 式的 Personalized PageRank 扩展。这符合原则 8，也正好可以检验 VISION 中"本体加图谱在挑选信息上是否优于向量相似度"这个问题。

---

## 四、经验整合与 Pattern 学习（不训练）

### 4.1 哪些方法真的减少了调用或 token（Q3 关心的指标）

| 方法 | 主要提升了什么 | 是否减少了推理调用或 token | 可信度 |
|---|---|---|---|
| ExpeL（AAAI 2024） | 准确率 | 没有直接证据（cross-check 已核对） | 已确认 |
| Agent Workflow Memory（arXiv 2409.07429） | Mind2Web 相对成功率 +24.6%，WebArena +51.1% | 摘要说"减少了成功完成任务所需的步数"，没有给数字 | **[官方/原文·摘要]** |
| Dynamic Cheatsheet（arXiv 2504.07952） | GPT-4o 在 Game of 24 上从 10% 升到 99% | 没有报告 | **[官方/原文·摘要]** |
| ACE（ICLR 2026，arXiv 2510.04618） | AppWorld +10.6%，金融 +8.6% | **减少的是"适应过程"的成本**：与 GEPA 相比延迟降低 82.3%、rollout 减少 75.1%；与 DC 相比 token 成本降低 83.6%。**不是每道题推理调用的减少** | **[官方/原文]** |
| ReasoningBank（ICLR 2026，arXiv 2509.25140） | 成功率提升 | WebArena 平均步数下降约 9–16%（例如 Gemini-2.5-pro 从 8.8 到 7.4）；SWE-Bench-Verified 下降 1.3–2.8 步。论文自称成功任务的步数最多相对下降 26.9%，但这个数字我们从表格中复算不出来。用的都是前沿大模型 | **[官方/原文]** |
| Agentic Plan Caching（NeurIPS 2025，arXiv 2506.14852） | 准确率持平 | **平均成本降低 50.31%，延迟降低 27.28%**：从执行记录中提取计划模板，按关键词匹配新任务，再由轻量模型把模板改写成具体计划 | **[官方/原文·摘要]** |
| AgenticCache（arXiv 2604.24039） | 成功率 +22% | token 减少 50%，后台由 LLM 校验和更新缓存条目 | **[二手]** |
| Mem0（arXiv 2504.19413） | 相对 OpenAI 记忆 +26% | 与全上下文相比 token 节省 > 90%，p95 延迟降低 91%（这里比的是上下文大小，不是调用次数） | **[官方/原文·摘要]** |

**结论 [推断]**：直接证明"随经验增加，推理调用持续下降"的工作，仍然只有计划缓存这一类（APC、AgenticCache）。这类方法减少调用的方式是**跳过规划步骤**，而不是"给推理模型更好的提示"。大多数经验方法提高的是准确率，或者降低了"学习本身"的成本。

### 4.2 已知的失败方式（2026 年新证据）

- **压缩后的经验常常被忽略**（arXiv 2601.22436，v3 2026-06）：在 4 个框架、13 个骨干模型、9 个环境上做因果干预，发现 Agent 稳定地依赖**原始经验**，却经常忽略或误读**压缩后的经验**（即使那是唯一提供的经验）。这一点在不同模型规模上都成立。**[官方/原文·摘要]**
  - 这直接挑战了"把 Pattern 写成文字建议塞进 Reasoning 上下文"的做法。
- **经验在什么时候用，和存什么一样重要**（ExpWeaver, arXiv 2605.07164）：把经验变成可以按需调用的资源，比"开头一次性注入"或"每步都注入"效果更好；Agent 倾向于在不确定性高的时候调用经验。**[官方/原文·摘要]**
- **上下文坍缩与简短偏差**（ACE）：反复重写上下文会让细节丢失。论文中的一个例子是，第 60 步时上下文有 18,282 个 token、准确率 66.7，下一步坍缩成 122 个 token，准确率 57.1，低于不做适应的基线 63.7。没有可靠的反馈信号时，ACE 和 DC 都可能退化。**[官方/原文]**
- **自我改进很脆弱**（arXiv 2608.18066）〔2026-06 后〕：多次重复运行的方差很大；**结果高度依赖任务顺序**，常用的默认顺序其实起到了隐含课程的作用。**[官方/原文·摘要]**
- **没有治理的经验会变成负收益**（arXiv 2606.17591）：在金融预测案例里，同样积累的经验，没有筛选和维护时低于零样本基线，有维护时则明显更好。作者建议为每条规则保留证据日志，记录它在各个 episode 中是否可靠。**[官方/原文·摘要]**
- **经验跟随与错误传播**（arXiv 2505.16067，cross-check 已确认）。

### 4.3 对 Memex 的建议

- **主选**：Pattern 做成**可执行的计划模板**，而不是文字建议：
  1. Pattern = 按 Ontology 类型描述的适用条件 + 带参数的 Action 序列 + 证据记录（成功和失败计数，以及来自哪些 Experience）。
  2. 匹配时先按类型和结构做确定性筛选，不只靠文本相似度（这也是 VISION 原则 5 的要求，并能降低经验跟随的风险）。然后向 Intuition 提一个选择题："这个 Pattern 是否适用？"，Certainty 过阈值就走 Fast Path 执行模板，经 Verification 检查，不调用 Reasoning。
  3. 只有经过 Oracle（在 Lab 中）或确定性 Verification 确认的成功，才能进入 Consolidation，形成 Pattern。只靠自我评判的成功不算。
  4. 每次使用 Pattern 后更新它的证据计数。失败率上升就降级，并送回 Slow Path（见第五节）。
  5. 用 Deceptive Task 测"错误套用 Pattern"的比率。
  6. 为避免任务顺序造成的假象，T5 的学习曲线用多种随机顺序来测（见第七节）。
  - 端口：Cognitive Strategy（走哪条路径）、Knowledge（Pattern 存储）、Intuition（是否适用）、Verification。里程碑：M2 实现最小版本，M4 做完整生命周期。服务 Q3，同时为 Q1 提供第二条 Fast Path。
  - 是否违反约束：不违反。没有训练。
- **备选**：如果 Pattern 很难写成可执行的形式（例如开放式推理任务），就退回到 ReasoningBank 式的"策略记忆"：同时保留成功和失败的经验，但按 ExpWeaver 的方式**按需提供**，只在 Escalation 后交给 Reasoning。同时记录 Reasoning 是否真的用到了它（因果消融），以检验"压缩后的经验被忽略"的问题在本项目中是否出现。

---

## 五、Decay 与遗忘

### 5.1 证据

| 研究 | 做法 | 结果 | 可信度 |
|---|---|---|---|
| MemoryBank（arXiv 2305.10250） | 按艾宾浩斯曲线衰减，被回忆时强化 | 只有定性评估 | **[官方/原文·摘要]** |
| FadeMem（arXiv 2601.18642） | 按语义相关性、访问频率、时间调节的指数衰减 | 存储减少 45%；摘要声称多跳推理更好，但没有数字，也没有说明是否与"不遗忘"的基线比较过 | **[官方/原文·摘要]** |
| Oblivion（arXiv 2604.00131） | 遗忘 = 降低可访问性，而不是删除 | 作者承认衰减温度需要按任务调 | **[二手]** |
| What Eviction Destroys（arXiv 2609.08279）〔2026-06 后〕 | 把正确证据放回去重跑，区分"不可恢复"和"可恢复"的错误 | 在准确率相同的策略之间，**没有测出**不可恢复错误率的差别（分辨率约 1.2–6 个百分点）；8k 预算下所有策略的不可恢复比例都是 1.00 | **[官方/原文·摘要]** |
| Stale Constraints（arXiv 2608.25553）〔2026-06 后〕 | 记忆中的约束，其来源后来被撤回 | 16 个模型平均每 5 次只有约 1 次会回头检查来源；约 75% 的决定沿用了过时的约束。把一个检查名额分给关键路径，就能挽回 61–74 个百分点。单纯给出"新鲜度"提示没有作用 | **[官方/原文·摘要]** |
| Nous | 指数混合到均匀分布 | 评测中从未被触发，没有证据 | **[官方/原文]** |

**结论 [推断]**：目前没有受控证据表明"按时间衰减 Confidence"能提高准确率。衰减方法报告的主要是节省存储。真正有证据的问题是**过时内容没有被撤销**。而且 Agent 自己很少回头核查，所以撤销必须由系统确定性地完成。这其实就是经典的真值维护系统（Doyle 1979）：一个前提被撤回，依赖它的结论也随之失效。

### 5.2 对 Memex 的建议

- **主选**：MVP 不做时间衰减。Decay 只包括两种确定性的操作：
  1. **由矛盾驱动的撤销**：一条 Evidence 被取代或反驳时，给相应 Claim 的 validUntil 封口，状态改为 `refuted` 或 `contested`；再沿 `derivedFrom` 把依赖它的 Claim 和 Pattern 标记为"需要重新验证"。这是一个 Action，写入 Event Log，可以回放。
  2. **基于效用的 Pattern 降级**：按第四节的成败计数降级 Pattern，不按时间。
  - 从 Cognitive State 中移出信息由 Attention 负责，不等于删除。Event Log 永远只追加。
  - 端口：Knowledge（Projector）、Consolidation。里程碑：撤销在 M2，Pattern 降级在 M4。服务 Q2（过时信息）和 Q3（防止坏 Pattern 累积）。
  - 是否违反约束：不违反。
- **备选**：只有当 Lab 测出"Claim 数量增长导致 Attention 变慢或选错"时，才加入基于访问频率的可访问性衰减（Oblivion 的思路：只降低排名，不删除）。衰减系数作为配置项，并用 2609.08279 的"把证据放回去重跑"的方法评估。

---

## 六、由 Agent 提议的本体扩展

### 6.1 证据

- **LLMs4OL 2025**：效果最好的是"商用 LLM + 领域嵌入 + 微调"的混合方案（cross-check 已核对）。补充：有一个任务用本地 Qwen3-8B、不做任何训练也能运行，但成绩落后于 Claude Sonnet 4；领域内的少样本提示明显优于通用的单样本提示。**[二手]**
- **EDC：抽取、定义、规范化**（EMNLP 2024，arXiv 2404.03868）：先开放抽取，再让 LLM 给每个关系写定义，最后用嵌入相似度把同义的关系合并到已有 schema 上。它的 schema 检索器是训练过的，Memex 不能照搬这一部分，但"定义 + 按嵌入规范化"这一步不需要训练。**[官方/原文·摘要]**
- **AutoSchemaKG**（ACL 2026，arXiv 2505.23628）：抽取和 schema 归纳一步完成，与人工 schema 的对齐率为 92%（v3）。这是网页规模的工作，用的是大模型。**[官方/原文·摘要]**
- **验证关卡**（LLM4KGOE 2026 研讨会，CEUR Vol-4246）：
  - OG-NSD：LLM 起草，再经 SHACL 校验、OWL/DL 推理、能力问题（Competency Question）评估和迭代修复。结果好坏参半：**激进的修复会让 schema 失控增长**，反复插入未声明的类，推理变得不稳定；只有保守的停止策略才有帮助。**[二手]**（只见到摘要片段）
  - MASEO：生成 → 用 RDFLib 修复语法 → 用 HermiT 检查逻辑一致性 → 用 OOPS! 检测常见缺陷。**[二手]**
- **小模型做本体演化**：没有找到相关研究。**证据不足。**

### 6.2 对 Memex 的建议

- **主选**：本体扩展走"提议 → 确定性关卡 → 用户批准"（ADR 0014 已经定义了"提议"和"批准"两种 Action）：
  - 触发条件：Lab 测出 Agent 把两个类别混淆（例如 Pattern 在 Deceptive Task 上被错误套用），符合 VISION 原则 5 和 8。
  - 提议由 Reasoning 模型给出，包括新类型或新关系，以及它的自然语言定义。
  - 确定性关卡：①按 EDC 的方法，用嵌入和已有术语比较，太相似的就合并，不新建；②SHACL 形状校验；③OWL 推理机检查一致性；④每次最多加入少量元素，并有保守的停止规则（来自 OG-NSD 的教训）；⑤用户批准。
  - 端口：Verification（关卡）、Policy（批准）。里程碑：M4 之后。不属于 Q1–Q3，MVP 阶段不做。
  - 是否违反约束：不违反。
- **备选**：无。证据太弱，先不设备选。

---

## 七、小规模、有噪声、结果不确定的实验怎么做统计

### 7.1 证据

- **Adding Error Bars to Evals**（Miller, arXiv 2411.00640）：题目之间不独立时（例如共用一段材料），朴素的标准误偏小，聚类调整后可能相差 3 倍；同一批题目上的模型比较应当用配对差值来降低方差，并事先做功效分析。**[官方/原文·摘要]**
- **Agent 评测的随机性**（arXiv 2512.06710）：用组内相关系数 ICC 把方差拆成"题目难度"和"Agent 自身的不一致"两部分。GAIA 上 ICC 为 0.304–0.774。结构化任务大约需要每题 8–16 次重复，ICC 才会收敛；复杂推理任务需要 32 次以上。**[官方/原文·摘要]**
- **General Agent Evaluation**（arXiv 2602.22953）：二元结果用配对 McNemar 检验，连续分数用配对 t 检验，成功率用 Wilson 区间，并做多重比较校正；单个基准上小于约 8–10 个百分点的差异要谨慎解读。**[二手]**（只见到搜索摘要）
- **任务顺序**（arXiv 2608.18066）：自我改进的结果高度依赖任务顺序，所以必须对多种顺序取平均。**[官方/原文·摘要]**
- **随时有效的序贯检验**：e-process 和置信序列允许"边看结果边决定是否停止"，而不会让第一类错误膨胀（ICML 2026 的 SERPANT、Deadline-Valid Replay）。后者在 Qwen2.5 的研究中，没有任何一组比较越过 α=0.05 的门槛，说明很多表面差距其实没有证据支持。**[二手]**
- **防污染**：在 Mystery Blocksworld（PlanBench, arXiv 2206.10498）中把名称打乱后，模型成绩大幅下降（cross-check 已核对）。GSM-Symbolic（arXiv 2410.05229）只改动题目中的名字和数字，模型成绩也会下降、方差变大。**[官方/原文·摘要]**
- **AI Agents That Matter**（arXiv 2407.01502）：必须同时报告成本和准确率，并与简单基线比较。**[官方/原文·摘要]**

### 7.2 对 Memex 的建议

- **主选**：Lab 的 Evaluator 默认采用以下做法：
  1. **配对设计**：B3 和 B3-noI（Q1）、B3 和 B1（Q2）使用同一批 World Generator 种子和同一批题目。录制和回放可以保证同一次运行的结果可复现；另外再用多次真实运行来估计组内方差。
  2. **Q1 用非劣效检验**：事先定好允许的准确率损失 Δ（例如 2 个百分点）。只有"准确率差值的单侧 95% 置信下界 > −Δ"，并且推理调用的减少比例的置信区间不包含 0，才算回答了 Q1。
  3. **按 Task Family 做聚类 bootstrap**（重采样的单位是"族"，不是单道题），因为同一个族的题目是相关的。
  4. **Q3 的学习曲线**：至少用 5 种随机任务顺序 × 若干种子；画出"推理调用率 vs 已有 Experience 数"的曲线和 bootstrap 置信带；用曲线的斜率或曲线下面积来概括，不用某一个点的数值。
  5. **重复次数**：先跑一轮试验，估计 ICC；结构化任务每题重复 8 次以上。
  6. **路由信号的检查**：按 2610.07354，每个 Intuition 信号都要和"只看题目的难度基线"比较，并确认 B3-noI 的准确率确实明显高于只走 Fast Path。
  7. **防污染**：Micro World 的实体和关系用无意义的名字；另外准备一组"只改名字"的扰动版本，作为检查。
  - 端口：Lab（Evaluator、实验运行器）。里程碑：M0 定方案，M2 起使用。服务 Q1–Q3。
  - 是否违反约束：不违反。这些都是统计分析，没有训练。
- **备选**：如果每次真实运行的成本太高，就用随时有效的置信序列做序贯评测，达到预先设定的精度就停止。

---

## 对当前设计冲击最大的三点

1. **压缩成文字的 Pattern 可能根本不起作用**（arXiv 2601.22436；另外 ACE 降低的只是适应过程的成本，arXiv 2510.04618）。Agent 依赖原始经验，却经常忽略压缩后的经验。目前唯一直接证明"调用次数减少"的路线，是可执行的计划缓存（arXiv 2506.14852）。因此，Q3 能否成立，很可能取决于 Pattern 是"直接执行、绕过 Reasoning"，还是"写成提示交给 Reasoning"。建议在 M2 之前把 Pattern 定义为前者。
2. **小模型无法在上下文中自己裁决冲突**（arXiv 2609.01852；STALE arXiv 2605.06527；arXiv 2608.25553）。只给元数据，帮不了小模型；只有事先把冲突裁决好才有效；而 Agent 也很少回头核查过时的来源。所以 Claim 的裁决、撤销以及依赖传播，都必须由 Projector 确定性地完成，Cognitive State 里只放裁决后的结果。这也意味着 Nous 式的贝叶斯更新**只有在来源可靠性真正不同时**才值得做，而且一旦"语气自信但内容错误"就会彻底失效（arXiv 2606.22030）。
3. **"不降低准确率"可以做成形式化保证，但只在分布不变时成立**（Learn-then-Test / CRC；arXiv 2606.29054；arXiv 2610.07354）。阈值必须在带 Oracle 标签、且与评测分开的校准集上选；可以事先算出 Fast Path 比例的上限；分布一偏移就要重新校准；而且所有路由信号都必须先赢过"只看题目的难度规则"。ADR 0010 现在的启发式对照组正好可以承担这个角色。

---

## 来源

**一、路由与校准**
- [Guo et al. 2017, On Calibration of Modern Neural Networks, arXiv 1706.04599](https://arxiv.org/abs/1706.04599)
- [Zheng et al., LLMs Are Not Robust Multiple Choice Selectors (PriDe), ICLR 2024, arXiv 2309.03882](https://arxiv.org/abs/2309.03882)
- [Gupta et al., Language Model Cascades: Token-level Uncertainty and Beyond, arXiv 2404.10136](https://arxiv.org/abs/2404.10136)
- [Kumar et al., Conformal Prediction with LLMs for Multi-Choice QA, arXiv 2305.18404](https://arxiv.org/abs/2305.18404)
- [Angelopoulos et al., Learn then Test, arXiv 2110.01052](https://arxiv.org/abs/2110.01052) · [Conformal Risk Control, arXiv 2208.02814](https://arxiv.org/abs/2208.02814)
- [Jung et al., Trust or Escalate, arXiv 2407.18370](https://arxiv.org/abs/2407.18370)
- [CP-Router, arXiv 2505.19970](https://arxiv.org/abs/2505.19970)
- [Farquhar et al., Semantic Entropy, Nature 2024](https://www.nature.com/articles/s41586-024-07421-0)
- [UCCI, arXiv 2605.18796](https://arxiv.org/abs/2605.18796)
- [Conformal Cascade, arXiv 2607.25018](https://arxiv.org/abs/2607.25018)
- [When Can Conformal Risk Control Certify LLM Outputs?, arXiv 2606.29054](https://arxiv.org/abs/2606.29054)
- [Evaluating Escalation Signals for LLM Routing, arXiv 2610.07354](https://arxiv.org/abs/2610.07354)
- [FrugalGPT, arXiv 2305.05176](https://arxiv.org/abs/2305.05176)

**二、Claim 置信度与信念修正**
- [Jøsang, Subjective Logic (Springer 2016)](https://link.springer.com/book/10.1007/978-3-319-42337-1) · [Multi-Source Fusion in Subjective Logic, arXiv 1805.01388](https://arxiv.org/abs/1805.01388)
- [Li et al., A Survey on Truth Discovery, arXiv 1505.02463](https://arxiv.org/abs/1505.02463)
- [Nous: When Does Belief-Based Agent Memory Help?, arXiv 2606.22030](https://arxiv.org/abs/2606.22030)
- [BeliefMem, arXiv 2605.05583](https://arxiv.org/abs/2605.05583)
- [Zep / Graphiti, arXiv 2501.13956](https://arxiv.org/abs/2501.13956)
- [TOKI, arXiv 2606.06240](https://arxiv.org/abs/2606.06240)
- [The Memory Trust Gap, arXiv 2609.01852](https://arxiv.org/abs/2609.01852)
- [STALE, arXiv 2605.06527](https://arxiv.org/abs/2605.06527)
- [CONFACT, IJCAI 2025, arXiv 2505.17762](https://arxiv.org/abs/2505.17762)

**三、注意力与上下文选择**
- [Carbonell & Goldstein 1998, MMR](https://dl.acm.org/doi/10.1145/290941.291025) · [Lin & Bilmes 2011, ACL](https://aclanthology.org/P11-1052/)
- [Recall Is Not Enough, arXiv 2607.00725](https://arxiv.org/abs/2607.00725)
- [PACMS, arXiv 2606.20047](https://arxiv.org/abs/2606.20047)
- [Budget-Aware Routing for Long Clinical Text, arXiv 2605.00336](https://arxiv.org/abs/2605.00336)
- [Agent memory poisoning, arXiv 2608.21230](https://arxiv.org/abs/2608.21230)
- [HippoRAG 2, arXiv 2502.14802](https://arxiv.org/abs/2502.14802)
- [GraphRAG-Bench, arXiv 2506.05690](https://arxiv.org/abs/2506.05690) · [RAG vs GraphRAG, arXiv 2502.11371](https://arxiv.org/abs/2502.11371)

**四、经验与 Pattern**
- [ExpeL, arXiv 2308.10144](https://arxiv.org/abs/2308.10144) · [Agent Workflow Memory, arXiv 2409.07429](https://arxiv.org/abs/2409.07429) · [Dynamic Cheatsheet, arXiv 2504.07952](https://arxiv.org/abs/2504.07952)
- [ACE, arXiv 2510.04618](https://arxiv.org/abs/2510.04618)
- [ReasoningBank, arXiv 2509.25140](https://arxiv.org/abs/2509.25140)
- [Agentic Plan Caching, arXiv 2506.14852](https://arxiv.org/abs/2506.14852) · [AgenticCache, arXiv 2604.24039](https://arxiv.org/abs/2604.24039)
- [Mem0, arXiv 2504.19413](https://arxiv.org/abs/2504.19413)
- [LLM Agents Are Not Always Faithful Self-Evolvers, arXiv 2601.22436](https://arxiv.org/abs/2601.22436)
- [ExpWeaver: Rethinking Experience Utilization, arXiv 2605.07164](https://arxiv.org/abs/2605.07164)
- [On the Fragility of Self-Improving Agents, arXiv 2608.18066](https://arxiv.org/abs/2608.18066)
- [Closing the Feedback Loop: Insight Governance, arXiv 2606.17591](https://arxiv.org/abs/2606.17591)
- [How Memory Management Impacts LLM Agents, arXiv 2505.16067](https://arxiv.org/abs/2505.16067)

**五、Decay**
- [MemoryBank, arXiv 2305.10250](https://arxiv.org/abs/2305.10250) · [FadeMem, arXiv 2601.18642](https://arxiv.org/abs/2601.18642) · [Oblivion, arXiv 2604.00131](https://arxiv.org/abs/2604.00131)
- [What Eviction Destroys, arXiv 2609.08279](https://arxiv.org/abs/2609.08279)
- [When Stale Constraints Go Unchecked, arXiv 2608.25553](https://arxiv.org/abs/2608.25553)
- [Doyle 1979, A Truth Maintenance System, Artificial Intelligence 12(3)](https://doi.org/10.1016/0004-3702(79)90008-0)

**六、本体扩展**
- [LLMs4OL 2025 Overview](https://vivo.tib.eu/fis/display/n91428) · [OntoLearner, arXiv 2607.01977](https://arxiv.org/abs/2607.01977)
- [EDC, arXiv 2404.03868](https://arxiv.org/abs/2404.03868) · [AutoSchemaKG, arXiv 2505.23628](https://arxiv.org/abs/2505.23628)
- [LLM4KGOE 2026 Proceedings, CEUR Vol-4246（OG-NSD、MASEO）](https://ceur-ws.org/Vol-4246/)
- [Ontology Generation using LLMs, arXiv 2503.05388](https://arxiv.org/abs/2503.05388)

**七、实验统计**
- [Miller, Adding Error Bars to Evals, arXiv 2411.00640](https://arxiv.org/abs/2411.00640)
- [Stochasticity in Agentic Evaluations (ICC), arXiv 2512.06710](https://arxiv.org/abs/2512.06710)
- [General Agent Evaluation, arXiv 2602.22953](https://arxiv.org/abs/2602.22953)
- [SERPANT, ICML 2026](https://icml.cc/virtual/2026/poster/66048) · [Deadline-Valid Replay, ICML 2026](https://icml.cc/virtual/2026/80034)
- [PlanBench, arXiv 2206.10498](https://arxiv.org/abs/2206.10498) · [GSM-Symbolic, arXiv 2410.05229](https://arxiv.org/abs/2410.05229)
- [AI Agents That Matter, arXiv 2407.01502](https://arxiv.org/abs/2407.01502)
