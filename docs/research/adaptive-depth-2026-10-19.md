# 多点、多级的快慢思考：理论与算法支持

日期：2026-10-19。对象：负责人提出，模型不应该只在一处使用。一个任务中有很多元判断：要不要思考、思考多深、要不要先做计划等等。快慢思考不应该只有"一层 Intuition、一层 Reasoning"的二分。本文调查这个思路有没有理论支持和算法支持。调研时仓库提交为 `e6dc5f4e`。

**已对齐的方向**（负责人选择 B，2026-10-19）：验证阶段保持现在的二分（Fast Path / Slow Path）。契约设计成可以扩展：深度是一个枚举值，元判断是 Intuition 的不同题目种类。多级决策等验证阶段之后，看数据有没有暴露出"二分不够"的证据再做。本文只回答"有没有依据"，不改任何决定。

可信度标记（沿用仓库约定）：
- **[官方/原文]**：读过一手来源的相关部分。
- **[官方/原文·摘要]**：只读到摘要或概述页。
- **[二手]**：来自搜索结果摘要或第三方转述，没有追到一手来源。
- **[推断]**：本文作者的判断，没有直接证据。

本次所有条目都来自搜索结果摘要，最高只到 [官方/原文·摘要]，没有通读全文。

---

## 结论

| 问题 | 结论 | 证据强度 |
|---|---|---|
| 理论上，"花多少计算"本身是不是一个决策？ | 是。理性元推理（Russell 和 Wefald）、有限最优性、认知控制的期望价值（EVC）都把它当作"收益减成本"的决策，而且决策点不止一个 | 强（经典理论，多条独立的线） |
| 理论上，深浅是二分还是连续？ | 是连续的、可以递归的。EVC 问的是"要不要、用在哪、用多少"；Soar 的僵局会逐层递归生成子目标 | 强 |
| 有没有可用的算法？ | 有，而且分得很细：调用前路由、调用后级联、学会何时思考、按难度分配推理算力、学会何时计划、按子目标分配快慢、自适应停止 | 中（大多是 2023–2026 年的论文，只读了摘要） |
| Memex 能直接用吗？ | 只能用一部分。多数算法要训练模型（强化学习或微调），这违反第一性原则 3。不需要训练的部分有：阈值级联、自适应停止、规则型元认知（SOFAI）、经过 Calibration 的置信度 | [推断] |

---

## 一、理论支持

### 1.1 理性元推理：计算的价值（VOC）[官方/原文·摘要]

- 来源：Russell 和 Wefald（1991）。元推理决定行动之前要做哪些计算。核心量是**计算的价值**（value of computation, VOC）：一次计算预期带来的效用提升，减去它的成本。
- 规则：选 VOC 最高的那次计算；当没有任何计算的 VOC 为正时，停止思考，直接行动。
- 最优的元推理在计算上是不可解的。有研究提出，人可能是通过元认知层面的强化学习，学会了怎么选择计算，从而绕开了这个问题（Lieder 等，arXiv 1711.06892）。
- 有限最优性（bounded optimality）在贝叶斯理性的基础上加入时间和算力的限制。"资源理性"（resource-rational）一系列研究都源自这里。

**对 Memex 的意义** [推断]：
- "要不要升级到 Reasoning"只是 VOC 决策的一个特例。
- "要不要计划""要不要再采样一次""要不要做 Verification"都可以用同一个框架来看。
- 停止规则（"没有正 VOC 就停"）正好对应"什么时候不再深想"。
- 精确计算 VOC 不可行，只能用便宜的近似。在 Memex 里，这个近似就是 Intuition 给出、经过 Calibration 的 Certainty。

### 1.2 认知控制的期望价值（EVC）[官方/原文·摘要]

- 来源：Shenhav、Botvinick、Cohen（2013，*Neuron*）。前扣带皮层的多种功能可以统一解释为：按控制的期望价值来分配认知控制。
- EVC 综合三样东西：控制带来的预期收益、需要投入的控制量、努力的成本。它决定**要不要**投入控制、**用在哪里**、**用多少**。
- 控制强度越高，感觉越费力，成本越高。
- 后续实验（Frömer 等，2021）发现：控制收益越高、越有效，人投入的控制就越多。

**对 Memex 的意义** [推断]："要不要、用在哪、用多少"正好对应负责人说的"要不要思考、思考什么、思考多深"。这是神经科学对"多级、多点"思路的直接支持。

### 1.3 Soar：僵局触发深入推理，并且递归 [官方/原文·摘要]

- 当现有知识不足以选出或执行一个操作时，Soar 产生一个**僵局**（impasse），自动建立一个子状态，在子状态里推理以补足缺失的知识。
- 子状态里运行的是同一个问题求解过程，所以可以层层递归，形成子状态的栈。计划和层级任务分解就是从这里产生的。
- 子状态的结果解决了上层的僵局之后，**chunking** 会把这段推理编译成规则，下次直接使用。

**对 Memex 的意义** [推断]：
- "僵局才深想"对应 Escalation，"递归"对应负责人说的"计划中的每一步又会遇到同样的判断"。
- chunking 对应 Pattern 的形成：把一次 Slow Path 的结果编译成以后可以直接执行的计划模板（ADR 0018）。
- Soar 说明：多层深度和"把慢变快"的学习可以放在同一个架构里，而且已经实现过。

### 1.4 SOFAI：元认知模块在多个求解器之间选择 [官方/原文·摘要]

- Booch 等（2021）提出 SOFAI（Slow and Fast AI）：快求解器和慢求解器由一个**元认知模块**统管，灵感来自 Kahneman 的 System 1 和 System 2。
- 元认知模块监控各个求解器的表现，综合解的质量、可用资源和求解器的历史表现，动态选择最合适的求解器。
- 已经应用到经典规划和多智能体认知规划（Fabiano 等，2023）。2025 年发表在 *npj Artificial Intelligence* 的版本报告：在受约束的导航任务中，决策质量更高，资源消耗更少。
- 后来的批评（arXiv 2508.17959）：早期的 SOFAI 类系统只是**按实例二选一**，快慢之间没有迭代协作。

**对 Memex 的意义** [推断]：
- SOFAI 的元认知模块，就是 Memex 里"Intuition 负责判断要不要深想"这个角色的泛化：可以有多个求解器，而不只是两个。
- 那条批评正好就是负责人提出的问题：按实例二选一是不够的。

---

## 二、算法支持

### 2.1 调用前路由和调用后级联 [二手]

| 方式 | 代表 | 时机 | 依赖什么 |
|---|---|---|---|
| 调用前路由 | RouteLLM（Ong 等） | 生成之前，先判断这个问题需要强模型还是弱模型 | 训练过的路由器（用 Chatbot Arena 的偏好数据） |
| 调用后级联 | FrugalGPT（Chen 等） | 先用便宜的模型生成，质量检查不过关再升级 | 一个打分器或质量判断 |

- 两种方式的取舍：路由省掉了白做的生成，但依赖事先能分得清难易；级联要先付一次便宜生成的成本，适合大多数问题便宜模型就能处理的场景。现在常见的是两者结合。
- 一篇 2026 年 ICML 的论文（级联护栏）报告：现成模型的校准通常很差（ECE 6%–28%），用温度缩放、保序回归这类事后方法可以大幅改善；2B 到 8B 的级联，准确率和单用 8B 只差约 1 个点，推理成本降低 55%。

**对 Memex 的意义** [推断]：
- 现在的 Intuition 是**调用前路由**（先判断，再决定要不要调用 Reasoning）。
- Verification 失败后再升级，就是**调用后级联**。
- 两个时机都可以是元判断点。
- 校准是瓶颈，这一点支持 ADR 0023 把 Calibration 放在核心位置。

### 2.2 让推理模型学会何时思考 [官方/原文·摘要]

- **AdaptThink**（Zhang 等，EMNLP 2025）：用强化学习，让推理模型按题目难度在"逐步思考"和"直接回答"之间选择。在三个数学数据集上，平均回答长度降低 53%，准确率提高 2.4%。只在数学题上测过。
- **AutoThink**（arXiv 2505.10832）：在提示里插入一个省略号，可以随机触发思考或不思考，再在此基础上做强化学习。
- **Thinkless**（arXiv 2505.13379）：目标相同。

**对 Memex 的意义** [推断]：这类方法要训练模型，Memex 不能直接用（原则 3）。但它们证明了"思考还是不思考"按题目来定，比整个实验固定开或关要好。Memex 现在是把"是否开启思考模式"作为 Experiment 的固定配置（ADR 0018），这正是可以细化的地方：把它变成每次调用时的一个选项，由元判断来选。

### 2.3 按难度分配推理时的算力 [官方/原文·摘要]

- **Snell 等**（ICLR 2025 oral）：不同的推理时扩展方法（用过程奖励模型搜索，或者让模型修改自己的回答）效果好坏，**取决于题目的难度**。按题目自适应分配算力（compute-optimal），比 best-of-N 的效率高 4 倍以上。在小模型有一定成功率的题目上，推理时多花算力可以胜过一个大 14 倍的模型。

**对 Memex 的意义** [推断]：这是"深度应该是梯子，而且要按题目选"最直接的实证支持。它也支持 Memex 的中心假设：在同一个模型上，"什么时候深想、想多深"可以带来很大的差距。

### 2.4 学会何时计划 [官方/原文·摘要]

- **Paglieri 等**（arXiv 2509.03581，NeurIPS 2026）：每一步行动之前都计划（如 ReAct）既昂贵，又会在长任务上降低表现；从不计划则会限制上限。
- 只有当计划带来的预期策略收益**超过计算成本和频繁重新计划带来的不稳定**时，才值得计划。
- 方法：先用合成数据做监督微调，再在长任务环境里做强化学习。在 Crafter 上，动态计划的 agent 样本效率更高，能完成更复杂的目标。也可以由人写的计划来引导。

**对 Memex 的意义** [推断]："要不要计划"作为一个独立的元判断点，有直接的算法依据。"频繁重新计划带来的不稳定"也是一项成本，需要计入。

### 2.5 按子目标分配快慢：System-1.x [官方/原文·摘要]

- **Saha 等**（ICLR 2025）：一个控制器把问题拆成子目标，并给每个子目标标上"简单"或"困难"。简单的交给快规划器直接生成，困难的交给慢规划器搜索。由一个混合系数 x 调节偏向哪一边。
- 三个组件都在同一个基础模型上微调，只需要搜索轨迹作为监督。在迷宫和积木世界上测试。

**对 Memex 的意义** [推断]：这正是负责人说的"递归"：快慢的选择发生在**子目标的粒度**上，而不是整个任务一次性决定。它也需要微调，Memex 只能借用结构，不能借用训练方法。

### 2.6 自适应停止：再想一次值不值 [官方/原文·摘要]

- **Adaptive-Consistency**（Aggarwal 等，EMNLP 2023）：按已有样本的一致程度决定还要不要继续采样。在 17 个推理和代码数据集上，样本预算最多减少 7.9 倍，平均准确率下降不到 0.1%。**不需要训练**，但阈值需要用数据来调，而且对阈值敏感。
- **ESC**（arXiv 2401.10480）：不需要超参数的版本，窗口内的答案全部一致就停止。
- **Soft Self-Consistency**（arXiv 2402.13212）：用于 agent 行动的似然阈值版本。

**对 Memex 的意义** [推断]：这是"什么时候不再深想"可以直接使用的、不需要训练的算法。它对应 VOC 的停止规则。

### 2.7 把 VOC 用到大模型上 [官方/原文·摘要]

- **Rational Metareasoning for LLMs**（arXiv 2410.05563）：把 VOC 作为奖励函数，训练模型自适应地推理。推理 token 减少约 20%–42%（各版本数字不同），任务表现持平或更好。

**对 Memex 的意义** [推断]：说明 VOC 不只是理论，可以落地到大模型上。但这个方法也要训练，Memex 只能用它的判断标准（收益减成本），不能用它的训练方法。

### 2.8 何时交给别人：learning to defer [二手]

- learning to defer（L2D）学习一个路由策略：每次预测交给哪个模型，或者交给人。它是"拒绝回答"这类选择性预测的推广。
- 有研究把升级的判断放在**一次生成的过程中**，用模型自己的 token 级信号，提前停掉注定失败的推理。FrugalGPT、RouteLLM 这类级联都要等一次完整的生成之后才判断。

**对 Memex 的意义** [推断]：元判断点不只在调用之前和之后，也可以在推理的过程中。验证阶段先不做，记下来备用。

---

## 三、映射到 Memex [推断]

### 3.1 候选的元判断点

| 元判断 | 理论依据 | 算法依据 | 不需要训练的做法 |
|---|---|---|---|
| 见过没有、要不要升级（现有） | VOC、SOFAI | 路由、级联 | Intuition 的选择题，加 Calibration |
| 要不要先计划 | EVC（要不要） | Paglieri 2025 | Intuition 的一道新选择题 |
| 想多深 | EVC（用多少）、Snell | AdaptThink、Snell | 深度梯子作为选择题的选项 |
| 哪个子目标需要慢想 | Soar、System-1.x | System-1.x | 计划里的每个子目标都问一次"想多深" |
| 要不要继续、什么时候停 | VOC 的停止规则 | Adaptive-Consistency、ESC | 一致性阈值（是配置，不是训练） |
| 要不要 Verification、查到什么程度 | EVC | 级联的质量检查 | 按 ADR 0022 的风险等级决定 |

### 3.2 一个可能的深度梯子

| 级别 | 做法 | 现在有没有 |
|---|---|---|
| 0 | 直接执行 Pattern，不调用模型 | 有（ADR 0018） |
| 1 | 只用 Intuition 判断 | 有（Fast Path） |
| 2 | 调用 Reasoning，不开思考模式 | 部分有（思考模式是 Experiment 级别的配置） |
| 3 | 调用 Reasoning，开思考模式，带 token 预算 | 部分有 |
| 4 | 先计划，拆成子目标，每个子目标再走一遍这个梯子 | 没有 |

### 3.3 和第一性原则的关系

- **原则 3（不训练）**：第二节里多数算法要训练模型，Memex 不能用。可以用的是：阈值、Calibration、停止规则、规则型的元认知，以及 Intuition 的选择题。
- **一个边界问题**：RouteLLM、FrugalGPT 这类方法训练的是**一个独立的小路由器或打分器**，不改 Reasoning 模型的权重。原则 3 说"凡是修改模型本身都算训练"，训练一个独立的路由器算不算"训练"？这需要负责人决定（见第六节）。
- **原则 8（实验驱动）**：理论和算法都支持多级深度，但它们不能代替 Memex 自己的测量。先在验证阶段测出"二分不够"的证据。

### 3.4 对 B 方案的契约建议

1. **深度是一个枚举值**，不是布尔值。验证阶段只使用其中两个值（相当于 Fast 和 Slow），其余的值先保留。
2. **元判断是 Intuition 的题目种类。** Intuition 本来就只做选择题（ADR 0018）。"要不要计划""想多深"都是新的题目，不需要新的组件类型。
3. **每次元判断都写进 Event Log**：题目、选项、选择、Certainty、实际结果。这样，验证阶段结束时就有数据回答"二分在哪里不够用"。
4. **影子升级可以推广为"影子加深"**：按比例照样多跑一级，作为 Calibration 的标签。成本更高，验证阶段先不做。

---

## 四、风险 [推断]

- **判断错误层层叠加**：元判断点越多，每一处的误判都会影响后面。每个点都需要自己的 Calibration 标签。
- **元判断本身的成本**：精确的 VOC 不可行，"想要不要想"也要花钱。元判断必须比它所节省的推理便宜得多，否则得不偿失。
- **重新计划的不稳定**：Paglieri 等指出，过于频繁的重新计划会降低表现。
- **实验矩阵膨胀**：每个元判断点都是一个变量。这就是选择 B 的原因。

## 五、待核实

- 所有条目都只读了摘要或搜索结果，具体数字没有在原文里核对过。
- Russell 和 Wefald 1991 年的原文、Booch 等 2021 年的 SOFAI 原文、Graves 2016 年的 Adaptive Computation Time，这次都没有找到一手来源。
- FrugalGPT 和 RouteLLM 的结论来自第三方转述。

## 六、需要负责人决定

1. 训练一个独立的小路由器或打分器（不改 Reasoning 和 Intuition 模型的权重），算不算原则 3 说的"训练"？这决定了 RouteLLM、FrugalGPT 一类的做法能不能用。**已决定（2026-10-19）**：不算训练，见 ADR 0027。
2. 要不要把"多级、多点的快慢思考"作为一条待定事项写进 `docs/open-questions.md`，并给出一个决定日期（例如：验证阶段结束时）？**已决定**：写进去，验证阶段结束时决定（open-questions 第 5 条）。

## 七、补充：从人类认知得到的启发（2026-10-19 讨论，部分已查证）

负责人在讨论中提出了三点观察。下面是对应的研究，以及对 Memex 的意义。

### 7.1 System 1 默认接受，System 2 负责拒绝 [官方/原文·摘要]

- **负责人的观察**：打电话时，别人递过来东西会下意识地接。System 1 默认接受，System 2 运作时才会想要不要拒绝。
- **Gilbert（1991，*American Psychologist*）**：理解一句话的同时就接受了它，必须先相信才能拒绝（"斯宾诺莎式"的观点）。他认为这比笛卡尔"先理解、再接受或拒绝"的观点在心理学上更站得住。
- **实验**（Gilbert、Krull、Malone，1990）：用第二个任务打断被试的加工，会让他们更容易把假命题当成真的，但不会把真命题当成假的。1993 年的实验这次没有找到原文。
- **批评**（Vorms 等，2022）：最初那一步接受时，内容本身是否可信也会起作用，并不是所有命题都同等地被先接受。

**对 Memex 的意义** [推断]：
- Fast Path 本质上就是默认接受。这是可以的，因为 Claim 是可以推翻的（原则 2）。
- Reasoning 的主要职责可能是**否决**，而不是生成。
- 风险在"来不及拒绝"：Cognitive Budget 紧张时，未经审查的东西会被当成真的。所以 Fast Path 上形成的 Claim 应该标记为"未经审查"，Confidence 更低；能默认接受的只能是低风险、可撤回的动作（ADR 0022）；外部内容绝不能被默认接受成指令（ADR 0016）。

### 7.2 直觉是成对的条件，四格里出现意外就会困惑 [官方/原文·摘要]

- **负责人的观察**：直觉的判断通常是成对的条件：A 成立 B 就成立，A 不成立 B 就不成立。如果发现 A 不成立而 B 也成立，直觉就会困惑，就会调用 System 2 去想为什么。
- **Cummins（1995，*Memory and Cognition*）**：人对因果条件句的推理，会随着他能想到的**替代原因**和**阻断条件**的多少而改变。
  - 替代原因：导致结果的另一条途径。
  - 阻断条件：原因存在，但结果被挡住了。
- 后续实验：每想起一个阻断条件，对"A 所以 B"的接受度就下降；每想起一个替代原因，对"B 所以 A"的接受度就下降。
- Fairley 和 Manktelow（1997）认为 Cummins 的预测不一致，提出了别的解释模型。

四格表：

| | B 发生 | B 不发生 |
|---|---|---|
| **A 成立** | 符合预期 | **意外①**：存在阻断条件 |
| **A 不成立** | **意外②**：存在替代原因 | 符合预期 |

**对 Memex 的意义** [推断]：
1. **Escalation 的触发条件**：Pattern 和 Claim 都记录"在什么条件下、预期什么结果"。观察落在意外格里，就触发 Reasoning。这比只看 Certainty 低不低更具体，也可以测量。
2. **Reasoning 该问什么**：意外①就去找漏掉的条件，意外②就去找别的原因。
3. **学习的产物**：答案变成一条新的 Claim，或者 Pattern 的一条新的适用条件。
4. **契合原则 5**：意外格就是"分不清两件事"的时刻，本体在这时扩展。
5. 这只改变"什么时候升级"，不增加深度的级别，和方案 B 兼容。

### 7.3 思考时会想"如果……"和"万一……" [推断]

- **负责人的观察**：人在思考时会想"如果这样就会那样，如果不这样就不会那样"，还会考虑"万一怎么样可能怎么样"。
- 前一半是反事实推理，检验 A 和 B 之间是否真有因果。"万一"是在主动寻找 7.2 的两类意外：阻断条件和替代原因。这和 Cummins 的研究一致。
- **对 Memex 的意义**：被调用的 Reasoning 可以按这个结构工作：正反两个方向推演，列出阻断条件和替代原因，然后决定接受、否决，还是先做 Verification。"列出多少个万一"可以作为"想多深"的一个具体刻度：风险越高，列得越多。

### 7.4 直觉只在有规律、有反馈的领域可信 [官方/原文·摘要]

- **Kahneman 和 Klein（2009，*American Psychologist*）**：判断一个直觉值不值得信任，取决于两点：环境是否足够有规律，以及这个人有没有机会学到这些规律。主观上的把握感并不能说明判断准不准。
- Klein 后来补充：直觉是一个重要的数据点，但仍然需要有意识地去检验。

**对 Memex 的意义** [推断]：Calibration 不应该只有一个全局阈值，应该**按 Ontology 类型分开做**。在有规律的任务类型上，可以放手走 Fast Path；在没规律的任务类型上，应该一直走 Slow Path。这只是配置的粒度变化，不是训练。

### 7.6 反事实探测：一次换一个条件，看判断变不变 [官方/原文·摘要]

- **负责人的进一步说明**：意外本质上关系到充要条件和必要条件。请求一来，就把其中一个条件换掉，看判断是否还成立。就像几个直觉模型并行地各做一次变异测试。
- 这样可以主动测出必要和充分：

  | 换掉一个条件之后 | 说明 | 对应 |
  |---|---|---|
  | 换掉 A，B 跟着不成立 | A 是必要的 | 符合预期 |
  | 换掉 A，B 还是成立 | A 不是必要的，存在替代原因 | 意外② |
  | A 保留，换掉另一个条件 C，B 不成立了 | A 不是充分的，C 是阻断条件 | 意外① |
  | 换掉一个本来无关的条件，B 变了 | 判断依赖了不该依赖的东西 | 判断不稳 |

**依据**：
- **穆勒的方法**（Mill，1843，《逻辑体系》）：**契合法**找所有出现结果的场合都有的因素，指向必要条件；**差异法**比较只差一个因素、结果却不同的两个场合，指向充分条件。"一次只换一个条件"就是差异法。[二手]
- **Pearl 的因果概率**（Tian 和 Pearl，2000）：给出了**必要性概率**（PN：没有 X，Y 就不会发生的概率）、**充分性概率**（PS）和**必要且充分的概率**（PNS）的严格定义。没有额外的假设，这些量一般不能精确求出，只能求出界限。实验数据和观察数据结合，可以把界限收紧。[官方/原文·摘要]
- **蜕变测试**：没有标准答案（"预言问题"）时，不检查单个输出，而是检查**一组相关输入的输出之间是否满足预期的关系**。已经大规模用于测试大模型：一项研究收集了 191 条蜕变关系，用其中 36 条在三个大模型上跑了约 56 万次测试。难点是设计好的蜕变关系。已经有人用大模型从需求里自动推导蜕变关系。[官方/原文·摘要]
- **集成和扰动的不确定性**：多个模型之间的分歧（深度集成），以及在语义等价的扰动下回答是否一致，都被用来估计大模型的不确定性。但一项 2025 年的用户研究（2,976 人）发现，常用的一致性指标和人的判断经常不一致。[官方/原文·摘要]
- **人的反事实思维**（Byrne，《The Rational Imagination》）：人想象"如果当时没有……"时，倾向于改动行动而不是不行动、可控的而不是不可控的事件、在一串事件里最近发生的那一个。想象一个**不同的结果**，会让人觉得这个前提的因果作用更强；想象一个**相同的结果**，则会觉得它更弱。后者正对应"换掉 A，B 还是成立"。[官方/原文·摘要]

**对 Memex 的意义** [推断]：
1. **Certainty 有了结构上的含义**：不只是模型输出的概率，还包括"判断在扰动下稳不稳"。关键条件换掉后，结论都按预期变化，就走 Fast Path；有一个条件不符合预期，就 Escalation，并且同时告诉 Reasoning 是哪个条件可疑。
2. **不需要 Oracle**：扰动后的一致性是产品里能拿到的信号，符合 ADR 0023。这和蜕变测试绕开"预言问题"的思路相同。
3. **适合 Intuition**：Intuition 模型小，只做选择题，可以并行跑很多次。
4. **换哪些条件由本体和 Attention 决定**：只扰动这类情况的关键条件，否则成本会爆炸。按 Ontology 类型预先定义"哪些条件可以换、换了之后预期怎样"，这相当于为每个类型写蜕变关系。
5. **和 System 3 连成一条谱**：System 1 的扰动是"变异"（在线、局部、一次改一个条件，用来检验判断）；System 3 的重组是"交叉"（离线、跨领域，用来产生新的猜想）。
6. **和方案 B 兼容**：改的是 Certainty 怎么来、什么时候升级，不增加深度的级别。验证阶段可以作为 Intuition 的一个实验变量：只用概率，对比用概率加扰动稳定性，看哪种更能预测"真正需要 Reasoning"。成本是每次判断多调用 K 次 Intuition，要计入 Intuition token。
7. **一个提醒**：自动的一致性指标和人的判断经常不一致，所以扰动稳定性也需要用 Shadow Escalation 的标签来校准，不能直接当作 Certainty 使用。

### 7.5 其他推断（还没查证）

- **Pattern 需要降级机制**：一个人开了十年车，到了靠左行驶的国家，原来的习惯反而会害了他。Pattern 在某类情况下连续失败，或者 Verification 不通过，就应该退回 Slow Path，并重新检查适用条件。ADR 0018 规定了 Pattern 的证据记录，但没有写降级的规则。
- **工具的可供性**：手边有什么工具，就倾向于去用。所以 Attention 也应该决定"此刻能用哪些工具"。
- **System 2 是唯一、串行的稀缺资源**，而 System 1 是大量并行的自动过程。Memex 的长期形态可能是"很多并行的便宜过程，加上一个需要调度的 Reasoning"。
- **System 3**：负责人提出的第三个系统（发散、离线、重组），另见 `system3-divergent-2026-10-19.md`。

## 来源

- [Rational Metareasoning for Large Language Models（arXiv 2410.05563）](https://arxiv.org/abs/2410.05563)
- [Learning to select computations（arXiv 1711.06892）](https://arxiv.org/abs/1711.06892v2)
- [Bounded Optimality and Rational Metareasoning（NeurIPS 2015 workshop）](https://neurips.cc/virtual/2015/workshop/4910)
- [The expected value of control（Shenhav 等，2013）](https://pmc.ncbi.nlm.nih.gov/articles/PMC3767969)、[Expectations of reward and efficacy guide cognitive control allocation（2021）](https://ideas.repec.org/a/nat/natcom/v12y2021i1d10.1038_s41467-021-21315-z.html)
- [Soar (cognitive architecture)（Wikipedia）](https://en.wikipedia.org/wiki/Soar_(cognitive_architecture))
- [Thinking Fast and Slow in AI（arXiv 2110.01834）](https://ar5iv.labs.arxiv.org/html/2110.01834)、[Fast and Slow Planning（arXiv 2303.04283）](https://arxiv.org/abs/2303.04283v1)、[Language Models Coupled with Metacognition Can Outperform Reasoning Models（arXiv 2508.17959）](https://arxiv.org/pdf/2508.17959)
- [Dynamic Model Routing and Cascading for Efficient LLM Inference: A Survey（arXiv 2603.04445）](https://arxiv.org/pdf/2603.04445)
- [Calibrated Deferral Routing for Cost-Efficient Guardrails（ICML 2026）](https://icml.cc/virtual/2026/67782)
- [AdaptThink（arXiv 2505.13417）](https://huggingface.co/papers/2505.13417)、[AutoThink（arXiv 2505.10832）](https://arxiv.org/abs/2505.10832v3)
- [Scaling LLM Test-Time Compute Optimally（Snell 等，ICLR 2025）](https://proceedings.iclr.cc/paper_files/paper/2025/hash/1b623663fd9b874366f3ce019fdfdd44-Abstract-Conference.html)
- [Learning When to Plan（Paglieri 等，arXiv 2509.03581）](https://arxiv.org/abs/2509.03581v1)
- [System-1.x（Saha 等，ICLR 2025）](https://arxiv.org/abs/2407.14414v2)
- [Adaptive-Consistency（Aggarwal 等，EMNLP 2023）](https://preview.aclanthology.org/setup/2023.emnlp-main.761)、[ESC（arXiv 2401.10480）](https://arxiv.org/pdf/2401.10480)、[Soft Self-Consistency（arXiv 2402.13212）](https://arxiv.org/pdf/2402.13212)
- [Knowing When to Ask for Help: Bayesian Self-Escalation in Hierarchical LLM Agents（arXiv 2608.24087）](https://arxiv.org/pdf/2608.24087)、[Towards Robust Human–AI Decision-Making via Learning-to-Defer（AAAI）](https://ojs.aaai.org/index.php/AAAI/article/view/42160)
- [How Mental Systems Believe（Gilbert，1991）的讨论（Le Moyne 课程材料）](https://web.lemoyne.edu/~hevern/psy355_24F/psy355documents/Belief.pdf)、[Vorms 等 2022](https://discovery-pp.ucl.ac.uk/id/eprint/10139921)
- [Cummins 1995 的相关文献（Conditional reasoning and causation）](https://api.philpapers.org/rec/CUMCRA)、[Causal and conditional inferences: a comment on Cummins (1995)](https://acnpsearch.tweb-dev.unibo.it/singlejournalindex/6198465)
- [Conditions for intuitive expertise: a failure to disagree（Kahneman 和 Klein，2009）](https://pubmed.ncbi.nlm.nih.gov/19739881/)
- [Mill's methods（Britannica）](https://www.britannica.com/print/article/1528471)、[Mill's methods（Wikipedia）](https://en.wikipedia.org/wiki/Mill%27s_methods)
- [Probabilities of Causation: Bounds and Identification（Tian 和 Pearl）](https://alphaxiv.org/abs/1301.3898)
- [Metamorphic Testing of Large Language Models for NLP（arXiv 2511.02108）](https://alphaxiv.org/abs/2511.02108)、[用大模型推导蜕变关系（arXiv 2401.17019）](https://arxiv.org/html/2401.17019v1)
- [A Survey of Uncertainty Estimation in LLMs（arXiv 2410.15326）](https://arxiv.org/html/2410.15326v1)、[Estimating LLM Consistency: A User Baseline vs Surrogate Metrics（arXiv 2505.23799）](https://arxiv.org/abs/2505.23799v3)
- [Precis of The Rational Imagination（Byrne）](https://www.tara.tcd.ie/items/e22ee26c-d0a5-466d-93a3-60ef8a01d616)
