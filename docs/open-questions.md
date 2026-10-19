# 待决问题

这里记录讨论中还没有定下来的事项。定下来的决定按重要程度写进 `docs/adr/` 或 `GLOSSARY.md`，并从本文件中删除。

## 需要决定

1. **Micro World 对 Agent 隐藏什么。**（何时决定：V2 实现真实的世界生成器之前。做法：做成生成器的配置项，例如 `visibility: {state, rules, actionEffects}`，这样就不是一次性的决策；V0 先用最简单的世界。） 有两个选项：只隐藏世界状态；或者连因果规则和动作效果也一起隐藏，让 Agent 自己摸索。后者更贴近"建立世界观"的目标，但也更难。如果规则是公开的，T1–T3 就很接近规划问题，B-sym 可能占优。
2. **流程精简。**（何时决定：进入正式阶段时，见 ADR 0012。） 提议：保留可复现、实验隔离、对照组、学习曲线和基本统计（均值、置信区间）；简化 release 数据集的保密流程、72 小时稳定性测试，以及 Alpha/Beta/RC/V1 的正式关卡。
3. **个人数据如何删除。**（何时决定：P1 接入 World 0 之前，或者 Memex 分发给他人使用之前，以先到者为准。见 docs/security-and-data.md D8。） Event Log 只追加、不修改，但个人数据可能需要真正删除。常见做法有两种：一是把个人数据放在日志之外单独存储，事件中只保存引用（forgettable payload）；二是每个人一把加密密钥，删除数据时销毁密钥（crypto-shredding）。有观点认为只销毁密钥不一定满足 GDPR 的删除要求。目前只使用合成数据，暂时不受影响。注意：Decay 是认知层面的"不再相信"，不等于删除数据。
4. **行动的自主程度：具体档位。**（何时决定：决策关卡，设计 P1 时。） 方向已由 ADR 0022 确定：Action 带风险等级（只读、可撤销、不可撤销、对外发送、修改自身），Policy 按档位给出 allow / deny / ask，产品默认以谨慎为主，随功能完善逐步放开；"修改自身须用户批准"是核心不变量。还没定的是：分几档、默认是哪一档、每一档对各风险等级怎样处理、是否用快速分类模型判断哪些 Action 需要审批。可参考 Claude Code 的权限模式，以及 OpenClaw、Hermes 的审批机制。
5. **多级、多点的快慢思考。**（何时决定：验证阶段结束时。调研见 docs/research/adaptive-depth-2026-10-19.md。） 验证阶段保持二分（Fast Path / Slow Path），契约做成可以扩展：深度是一个枚举值，"要不要计划""想多深"这类元判断是 Intuition 的不同题目。每次元判断都写进 Event Log（题目、选项、选择、Certainty、结果），验证阶段结束时用这些数据回答"二分在哪里不够用"。候选做法：深度梯子（Pattern → 只用 Intuition → Reasoning 不开思考 → 开思考并给预算 → 先计划、拆子目标）；用 Counterfactual Probe 主动探测必要和充分条件（一次换一个条件，多个 Intuition 并行），探测结果或实际观察出现 Surprise 时触发 Escalation（替代原因，或阻断条件），并把可疑的条件交给 Reasoning；Fast Path 上形成的 Claim 标记为未经审查；Calibration 按 Ontology 类型分开做；Pattern 连续失败时降级；独立的路由器或打分器（ADR 0027 允许，按原则 8 决定是否采用）。
6. **System 3：离线的发散与重组。**（何时决定：验证阶段结束时。调研见 docs/research/system3-divergent-2026-10-19.md。） 在空闲时离线运行，把不同领域的 Experience 和 Claim 按关系结构重新组合（概念整合、结构映射），产出放在一个隔离区里，只是候选，必须经过 Verification 才能成为低 Confidence 的 Claim 或新的 Pattern，不能直接触发 Action。随机程度是配置参数。按原则 8，先设计能测出效果的实验，例如仿照 Wagner 2004 的隐藏规则任务：离线重组之后，发现规则的比例有没有提高。术语需要单独一个类别（见 GLOSSARY.md）。
