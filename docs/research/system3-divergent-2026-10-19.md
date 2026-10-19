# System 3：发散、重组的离线系统——理论与算法支持

日期：2026-10-19。调研时仓库提交为 `e6dc5f4e`。

## 负责人提出的设想

除了 System 1（直觉）和 System 2（推理），还有一个 **System 3**：一个混沌的、发散的系统，比如做梦和头脑风暴。

- 它会**随机**把一些认知和记忆打乱、重新组合。
- 重组发生在一个"虚拟内存"里，和真实世界、和已经确认的认知是隔开的。
- 大部分重组没有意义。比如白天上了学、看了电影，晚上梦见自己在电影院里上课，两件事其实没有关系。
- 少数重组会带来顿悟。比如有人研究八字四柱没学懂，过几天玩了桌游，晚上梦见八字其实可以变成桌游的规则，早上醒来忽然就懂了。

本文调查这个设想有没有理论和算法上的依据。

可信度标记（沿用仓库约定）：**[官方/原文]**、**[官方/原文·摘要]**、**[二手]**、**[推断]**。本次所有条目都来自摘要或搜索结果，最高只到 [官方/原文·摘要]。

---

## 结论

| 问题 | 结论 | 证据强度 |
|---|---|---|
| 人脑里有没有这样一个"离线、发散、重组"的过程？ | 有。睡眠中的记忆重组、做梦探索弱关联（NEXTUP）、孵化效应、走神，都指向它 | 中到强。现象可靠，机制还有争论 |
| 它真的能带来"顿悟"吗？ | 有实验证据。Wagner 等（2004）：睡一觉后，发现隐藏规则的人数是没睡的两倍多（59% 对比最多 25%） | 强（经典实验） |
| 随机性本身有用吗？ | 有理论支持。"过拟合大脑"假说：梦是注入噪声，帮助泛化。但这个假说还没有被直接检验 | 弱到中 |
| 有没有可用的算法？ | 有，而且有一个共同的结构：**离线生成 → 外部筛选 → 留下有用的抽象**。DreamCoder、FunSearch、生成式回放、Dyna/Dreamer、sleep-time compute 都是这个结构 | 中到强 |
| Memex 能用吗？ | 能用一大部分。FunSearch 用的是冻结的模型，DreamCoder 的抽象阶段学的是程序库，sleep-time compute 改的是记忆而不是权重，都不违反原则 3 | [推断] |

**最关键的发现** [推断]：所有成功的做法都不是"只有混沌"，而是**发散的生成加上严格的筛选**。做梦产生大量没有意义的组合，真正留下来的只是少数经过检验的。对 Memex 来说，System 3 的产出不能直接进入 Worldview，必须经过 Verification。这和"虚拟内存"的直觉是一致的。

---

## 一、理论与实验支持

### 1.1 睡眠中的记忆重组带来顿悟 [官方/原文·摘要]

- **Wagner 等（2004，*Nature*）**：数字简化任务可以一步步慢慢算，也可以发现一条隐藏的捷径。训练和复测之间睡了一夜的被试中，59% 第二天早上发现了捷径；四个没睡的对照组，都不超过 25%。
- 作者的解释：睡眠**重组了新形成的记忆表征**，帮助从中提取出明确的知识，于是产生了顿悟。

**对应负责人的例子**：八字没学懂，睡了几晚之后忽然懂了。Wagner 的实验测的正是这种"隐藏规则被发现"。

### 1.2 做梦是在探索弱关联：NEXTUP [二手]

- 来源：Zadra 和 Stickgold，《When Brains Dream》（2021）。NEXTUP 的全称是 Network Exploration to Understand Possibilities，意思是"探索网络，理解可能性"。
- 做梦是一种依赖睡眠的记忆处理：大脑在探索记忆网络中的**弱关联**，把醒着时连不起来的东西连起来，让知识更灵活、更整合。
- 一个可能的机制：REM 睡眠时去甲肾上腺素降低，联想皮层更活跃，联想可以自由地游走。
- 它不认为梦有明确的目的，而是一种探索，顺带产生好处。
- 只找到书评和二手转述，没有读到原始论文。

**对应负责人的例子**：电影院和教室的组合，就是在探索两段记忆之间的弱关联。大部分探索没有结果，这本身符合 NEXTUP 的描述。

### 1.3 梦是注入噪声，防止过拟合 [官方/原文·摘要]

- **Hoel（2021，*Patterns*）**："过拟合大脑"假说。白天的学习会让大脑过拟合；梦每晚产生分布外的、扭曲的感官刺激，像机器学习里的噪声注入和 dropout 一样，保护泛化能力。
- 例子：长时间玩俄罗斯方块之后做的梦，通常不是重放具体的游戏，而是细节稀少、带有幻觉性质的画面。
- 预测：缺少睡眠，特别是缺少做梦，会让大脑仍然能记住和学习，但泛化不好。
- **这个假说还没有被直接检验。**

### 1.4 孵化效应：放下问题一段时间反而更容易解决 [官方/原文·摘要]

- **Sio 和 Ormerod（2009，*Psychological Bulletin*）**：对 117 项研究的元分析。孵化效应存在，但不大：总体效应量 d 约为 0.29 到 0.32；发散思维任务更明显，d 约为 0.65。
- 准备时间越长，孵化效应越大。
- 孵化期间做**高认知负荷**的任务，效果变小。做**低负荷**的任务，反而比完全休息效果更好。一种解释是低负荷任务让人走神，激活了语义网络中较远的联想。
- 机制还没有定论，可能是无意识过程和有意识过程共同作用。

**对 Memex 的意义** [推断]：
- "准备时间越长越好"：System 3 要先有足够的材料，白天得先认真学过八字。
- "高负荷会抑制孵化"：System 3 不应该和 System 2 抢同一份资源。它适合在空闲时运行。

### 1.5 概念整合与双重联想 [二手]

- **Koestler（1964）的双重联想**（bisociation）：创造发生在两个原本不相干的思维平面相交的时候。普通的思考只在一个平面上进行。
- **Fauconnier 和 Turner 的概念整合**（conceptual blending）：两个输入空间通过一个"共有空间"对齐，选择性地投射到一个混合空间里，在里面产生两边原本都没有的新结构。
- 计算实现有 Sapper，以及 Veale 的概念创造研究。2019 年的一篇论文指出，人做概念整合看起来毫不费力，但在 AI 里是一个复杂的问题，有两个难点：**找到两个概念之间的共有结构**，以及**评价新的组合好不好**。

**对应负责人的例子**：电影院加教室是一次概念整合（没有产生有用的结构）。八字加桌游也是一次概念整合（产生了有用的结构：八字的规则可以用桌游规则的框架来理解）。

### 1.6 结构映射：类比靠的是关系，不是表面 [官方/原文·摘要]

- **Gentner 的结构映射理论**：类比依靠的是**关系**的对应，而不是对象属性的相似。人偏好那些包含更高阶关系的映射，因为这样迁移过去的知识更连贯。
- 已经有计算实现：Klenk 和 Forbus 用类比，在平动运动学和转动运动学之间迁移知识。
- 人很难自发地想到跨领域的类比，但给出提示后就能做到（Gick 和 Holyoak，1980）。

**对 Memex 的意义** [推断]：
- "八字变成桌游规则"之所以有用，是因为两者的**关系结构**对得上（元素、生克、回合……），而不只是表面相似。
- 这给 System 3 的筛选提供了一个标准：**一次重组有没有价值，看它能不能建立关系结构上的对应**。
- 这也是 VISION 里"把精通领域的经验转换成其他领域的参考"的认知基础。
- 第一性原则 5（本体是共同的语言）在这里很关键：只有按类型和关系组织经验，才能做结构映射。只看文字相似是不够的。

### 1.7 混沌巡回与临界性 [官方/原文·摘要]

- **Tsuda 的混沌巡回**（chaotic itinerancy）：皮层活动在高维状态空间里自发地游走，先后经过一系列"准吸引子"。准吸引子对应感知、思想和记忆，它们之间的混沌转移对应搜索。
- **大脑的临界性**：大脑可能处在有序和随机之间的相变边缘，因为这样的系统处理信息的效果最好。有人认为，离开这个临界点，滑向完全混沌或完全周期，都会扰乱信息处理。
- 两者在概念上相关，但没有被直接检验过。

**对 Memex 的意义** [推断]：负责人说的"混沌系统"在神经科学里确实有对应。重要的启示是：**完全随机没有用，完全有序也没有用，有用的是两者之间的边缘**。换成工程语言就是：System 3 的随机程度需要一个可以调节的参数，而且这个参数应该由实验来决定。

---

## 二、算法支持

这些算法有一个共同的结构：**离线生成 → 外部筛选 → 保留有用的抽象或经验**。

### 2.1 DreamCoder：醒和睡交替，学出抽象 [官方/原文·摘要]

- **Ellis 等（PLDI 2021）**：系统交替进行三个阶段：
  - **醒**：用现有的程序库解题；
  - **抽象**：在已经解出的程序里找共同的子结构，把它们重构成新的库函数，库因此越来越深；
  - **做梦**：用库随机生成"幻想"的程序和任务，训练搜索策略。
- 在 8 个领域里，同时学习库和搜索策略能解出更多题，也解得更快。
- 它独立地重新发现了函数式编程的基本概念（map、fold）、向量代数，甚至基本的物理定律。

**对 Memex 的意义** [推断]：
- 这是和负责人设想最接近的算法："白天解题、晚上做梦、早上多了一个抽象"。
- DreamCoder 的抽象阶段相当于从 Experience 中归纳 Pattern。
- 它的做梦阶段相当于 System 3 在虚拟内存里生成组合。
- 它的神经搜索策略需要训练，这部分 Memex 不能照搬。但"抽象"和"做梦生成任务"这两个阶段不改模型权重，可以借用。

### 2.2 FunSearch：冻结的大模型加确定性的评估器 [官方/原文·摘要]

- **Romera-Paredes 等（*Nature*，2023）**：一个**冻结的**预训练大模型提出候选程序，一个**确定性的**评估器运行并打分，过滤掉错误的结果。最好的程序被放回下一轮提示，种群一代代演化。
- 它搜索的是"生成解的程序"，而不是解本身。
- 结果：在帽集问题上找到了比已知更大的构造，改进了渐近下界；在线装箱的启发式算法也优于常用的基线。

**对 Memex 的意义** [推断]：
- **完全不训练模型**，符合原则 3。
- "大模型发散生成，确定性评估器严格筛选"，正是 System 3 加 Verification 的组合。
- 这也符合 Memex 的 Verification 原则："能用确定性方法检查的，就不用模型检查"。

### 2.3 生成式回放：用想象的数据防止遗忘 [官方/原文·摘要]

- **Shin 等（NeurIPS 2017）**：灵感来自海马体的生成性。一个生成模型生成旧任务的"伪数据"，和新数据一起学习，从而防止灾难性遗忘。

**对 Memex 的意义** [推断]：离线重放不只用来产生新想法，也用来**巩固和整合**旧知识。Memex 不训练模型，但可以借用这个思路来复核 Worldview：离线时重新用旧的 Experience 检验 Claim 和 Pattern。

### 2.4 Dyna 和 Dreamer：在想象中学习 [官方/原文·摘要]

- **Dyna**（Sutton，1990；这次凭已有知识引用，没有找到来源）：用学到的环境模型生成模拟的经验，用来规划和更新价值。
- **Dreamer**（Hafner 等，ICLR 2020）：完全在学到的世界模型的**潜在想象**中学习行为。Dreamer 4（2025）只用离线数据，在 Minecraft 里拿到了钻石。

**对 Memex 的意义** [推断]："在虚拟内存里想象"是成熟的强化学习技术。Memex 的 Worldview 可以作为模拟器：在 Worldview 里推演"如果这样会怎样"，而不是去真实世界里试。

### 2.5 大模型 agent 的离线思考 [二手]

- **sleep-time compute**（Letta / Lin 等，2025）：agent 利用空闲时间，在问题到来之前先离线思考上下文，预先算好有用的东西，并改写自己的记忆，从而减少回答时的计算。当未来的问题可以从现有上下文中部分预测时，效果最好。
- **Generative Agents**（Park 等，2023）的反思和 **Reflexion**（Shinn 等，2023）：agent 把经验总结成文字形式的反思，存进记忆，而不是更新权重。
- 也有 2026 年的研究直接改模型参数（"LLM Sleep"），这类不符合 Memex 的原则 3。

**对 Memex 的意义** [推断]：sleep-time compute 和反思都只改记忆，不改权重，可以直接借用。它们比 System 3 更"收敛"：主要是整理和预计算，没有强调随机重组。

### 2.6 盲目变异和选择性保留（BVSR）[官方/原文·摘要]

- **Campbell（1960）提出，Simonton 持续发展**：创造来自**盲目的变异**（产生变体时不知道哪个是对的）和**选择性的保留**。
- 争议已经持续了半个多世纪。Simonton 后来也承认，专业知识、远距离联想和策略在生成想法时起着重要但次要的作用。

**对 Memex 的意义** [推断]：BVSR 是 System 3 最直接的理论框架："随机重组"就是变异，"醒来后检验"就是选择。它的争议也提醒我们：变异不必完全盲目。按关系结构去重组，比完全随机地重组更有效（见 1.6）。

---

## 三、映射到 Memex [推断]

### 3.1 System 3 在 Memex 里可能是什么

| 人脑 | Memex 里的对应 | 现在有没有 |
|---|---|---|
| 白天的学习 | 解题时形成的 Experience 和 Claim | 有 |
| 睡眠，离线运行 | 空闲时运行的后台过程，不占用 System 2 的资源 | 没有 |
| 随机重组记忆，探索弱关联 | 从 Worldview 里抽取不同领域的 Experience 或 Claim，让 Reasoning 模型尝试概念整合或结构映射 | 没有 |
| 虚拟内存 | 一个隔离的"假设区"：生成的组合只是候选，不是 Claim，不进入 Worldview | 没有 |
| 醒来后检验 | Verification：能用确定性方法检查的就用确定性方法，否则在 Worldview 里推演，或者用真实任务检验 | 有（Verification） |
| 顿悟：学会一条规则 | 通过检验的组合变成新的 Claim、新的 Pattern，或者扩展本体 | 部分有（Pattern 归纳） |
| 准备不足就做不出好梦 | 只在某个领域积累了足够的 Experience 之后，才让 System 3 处理这个领域 | 没有 |

### 3.2 和第一性原则的关系

- **原则 1（智能不等于记忆的多少）**：System 3 正是"把经验整理成结构"的一种方式，而且是跨领域的。
- **原则 2（存储的是 Claim，不是事实）**：System 3 的产出连 Claim 都还不是，只是**假设**。检验通过之后，才能以低 Confidence 的 Claim 进入 Worldview，并标明来源是"System 3 的重组"。
- **原则 3（不训练）**：FunSearch、DreamCoder 的抽象阶段、sleep-time compute、反思都不改权重，可以用。DreamCoder 的神经搜索策略和"LLM Sleep"一类会改权重，不能用。
- **原则 5（本体）**：结构映射需要按类型和关系组织的经验。有了本体，System 3 才能找到"八字"和"桌游"之间关系结构的对应，而不只是文字上的相似。
- **原则 8（实验驱动）**：System 3 是一个新的认知组件，必须先回答"它解决了哪个已经测出来的问题、改进能不能测量"。可以测量的方向，比如：在一组有隐藏规则的任务上，离线运行 System 3 之后，发现规则的比例是否提高。这正好仿照 Wagner 2004 的实验设计。
- **VISION**："把精通领域的经验转换成其他领域的参考"，是 System 3 最直接的产品价值。

### 3.3 设计上的要点

1. **生成和筛选分开**：发散的生成可以很便宜、很随机，筛选必须严格，而且尽量是确定性的。
2. **隔离**：System 3 的产出放在假设区，绝不直接写进 Worldview，也不能直接触发 Action（ADR 0014）。
3. **随机程度是一个配置参数**：既不能完全随机，也不能完全按相似度来。按关系结构去抽取组合，再加可以调节的随机性。参数由实验来定。
4. **在空闲时运行**：不和 System 2 抢资源（孵化效应里，高负荷会抑制效果）。
5. **成本计入 Cognitive Budget**：离线运行也要花钱，需要记录。
6. **按领域的准备程度触发**：某个领域积累了足够的 Experience、而且有未解决的问题或者反复出现的意外（见上一份调研的四格表）时，才让 System 3 处理这个领域。

### 3.4 和 System 1、System 2 的关系

| | System 1 | System 2 | System 3 |
|---|---|---|---|
| 方向 | 收敛：认出见过的模式 | 收敛：按规则推出结论 | **发散**：产生没见过的组合 |
| 什么时候运行 | 一直在运行 | 被冲突、意外或高风险唤醒 | **空闲时、离线** |
| 输出 | 判断和 Certainty | 结论，或者否决 | **假设**，必须经过检验 |
| 在 Memex 里 | Intuition | Reasoning | 还没有 |

一个完整的循环 [推断]：
1. 白天解题时，System 1 遇到意外，唤醒 System 2；
2. System 2 解释不了的意外，留给 System 3；
3. System 3 在夜里尝试跨领域的重组；
4. 通过检验的重组变成新的 Pattern；
5. 第二天，System 1 就能直接认出这类情况。

这就是负责人说的"八字醒来就懂了"。

---

## 四、风险 [推断]

- **噪声多，有用的少**：大多数重组没有意义（电影院里上课），筛选的成本可能远高于生成的成本。
- **评价是难点**：概念整合的研究也指出，"评价新组合好不好"是公认的难题。领域里没有确定性的检查方法时，只能依靠 Reasoning 来评价，这就带来了模型自我评价的偏差。
- **污染 Worldview**：如果隔离做得不好，看似合理的错误类比会以 Claim 的形式进入 Worldview。所以 System 3 的产出要有明确的来源标记，Confidence 要低，而且可以被撤销。
- **难以测量**：顿悟是稀有事件，需要专门设计的任务（带隐藏规则的任务），才能在实验里测出效果。

## 五、待核实

- 所有条目都只读了摘要或搜索结果，具体数字没有在原文里核对过。
- NEXTUP 只找到书评和二手转述，没有读到原始论文。
- 过拟合大脑假说还没有被直接检验。
- Dyna 的描述是凭已有知识引用的，这次没有找到来源。
- DreamCoder"做梦"阶段的细节，这次没有在原文里核对。

## 六、需要负责人决定

1. 要不要把 System 3 作为验证阶段之后的一个候选认知组件，写进 `docs/open-questions.md`？我的建议是写进去，和上一份调研的"多级、多点快慢思考"放在一起。按原则 8，先要设计一个能测出效果的实验，比如仿照 Wagner 2004 的隐藏规则任务。**已决定（2026-10-19）**：写进去（open-questions 第 6 条）。
2. System 3 的产出叫什么？它需要一个术语，和 Claim 区分开。可以用"Hypothesis"，也可以用你更习惯的说法。

## 来源

- [Wagner 等 2004 的相关综述（Stickgold 和 Walker，*TICS* 2004）](https://walkerlab.berkeley.edu/reprints/Stickgold%20&%20Walker%20TICS_2004.pdf)、[PMC2505318](https://pmc.ncbi.nlm.nih.gov/articles/PMC2505318)
- [When Brains Dream（Publishers Weekly 书评）](https://www.publishersweekly.com/9781324002833)、[International Journal of Dream Research 的相关文章](https://journals.ub.uni-heidelberg.de/index.php/IJoDR/libraryFiles/downloadPublic/890)
- [The Overfitted Brain（Hoel，arXiv 2007.09560）](https://arxiv.org/abs/2007.09560v1)、[*Patterns* 版本（PMC8134940）](https://pmc.ncbi.nlm.nih.gov/articles/PMC8134940)
- [Sio 和 Ormerod 2009 元分析](https://eprints.lancs.ac.uk/id/eprint/56211)
- [Conceptual blending（Wikipedia）](https://en.wikipedia.org/wiki/Conceptual_blending)、[Blending under deconstruction（Confalonieri 和 Kutz，2019）](https://www.research.unipd.it/retrieve/7a8afccb-f226-4d52-9e7e-932eb9de3c5b/2019_Article_BlendingUnderDeconstruction.pdf)
- [Structure-Mapping: A Computational Model of Analogy and Similarity](https://www.qrg.northwestern.edu/ideas/smeidea.htm)、[Klenk 和 Forbus：Domain Transfer via Analogy](https://www.qrg.northwestern.edu/papers/Files/QRG_Dist_Files/QRG_2009/klenk_domain_transfer(cogsysres).pdf)
- [Tsuda：Chaotic itinerancy（北海道大学）](https://eprints.lib.hokudai.ac.jp/dspace/handle/2115/61041)、[How critical is brain criticality?（2022）](https://pubmed.ncbi.nlm.nih.gov/36096888/)
- [DreamCoder（PLDI 2021）](https://pldi21.sigplan.org/details/pldi-2021-papers/55/DreamCoder-Bootstrapping-Inductive-Program-Synthesis-with-Wake-Sleep-Library-Learnin)
- [FunSearch（DeepMind 博客）](https://deepmind.google/blog/funsearch-making-new-discoveries-in-mathematical-sciences-using-large-language-models/)、[*Nature* 论文（PMC10794145）](https://pmc.ncbi.nlm.nih.gov/articles/PMC10794145)
- [Continual Learning with Deep Generative Replay（NeurIPS 2017）](https://proceedings.neurips.cc/paper/2017/hash/0efbe98067c6c73dba1250d2beaa81f-Abstract.html)
- [Dream to Control（Dreamer，arXiv 1912.01603）](https://arxiv.org/abs/1912.01603v2)、[Dreamer 4](https://danijar.com/project/dreamer4/)
- [Sleep-time compute（Letta）](https://letta.com/blog/sleep-time-compute)
- [An Analysis of the BVSR Theory of Creativity（arXiv 1309.4692）](https://arxiv.org/pdf/1309.4692)、[Simonton：BVSR creativity](https://simonton.faculty.ucdavis.edu/wp-content/uploads/sites/243/2015/08/BVSRcreativity.pdf)
