# Memex

Memex 是一个运行在本地的认知运行时。接入某个领域的数据后，Agent 在该领域中建立并不断修正自己的世界观，再结合本地模型的推理能力完成任务，并从经过验证的经验中持续学习。

## 世界与信念

**World**:
Agent 所处的客观环境，包含真实状态和因果规则。Agent 无法直接访问 World，只能通过 Observation 了解它。
_Avoid_: reality, ground truth（Ground Truth 专指评测时由生成器掌握的 World 本身）

**Observation**:
Agent 从 World 中获得的一次原始感知，或一次 Action 返回的结果。
_Avoid_: input, message, event

**Evidence**:
从一个或多个 Observation 中提炼出的、可以支持或反驳某个 Claim 的依据。
_Avoid_: proof, fact

**Claim**:
Agent 认为可能为真的一条结构化命题，带有溯源、时间范围、认知状态和置信度。Claim 不等于事实。
_Avoid_: fact, triple, memory item, knowledge entry

**Proposition**:
Claim 所断言的内容本身，形式为"主体、关系、客体或值"。
_Avoid_: statement, triple

**Provenance**:
一条 Claim 从哪里来：用户告知、直接观测、Agent 推断、模型猜测、外部工具或其他 Agent。不同来源的可信度不同。
_Avoid_: source（source 只指 Provenance 中的具体来源对象）

**Epistemic Status**:
Agent 对一条 Claim 的把握程度：已知、相信、怀疑、未知或已被反驳。
_Avoid_: truth value, validity

**Hypothesis**:
为解释 Observation 而提出、尚待验证的候选 Claim 或因果解释。
_Avoid_: guess, assumption

**Worldview**:
Agent 关于某个领域的全部 Claim、Ontology 和 Pattern 构成的、可修正的整体理解。
_Avoid_: world model, knowledge base, memory

## 经验与学习

**Experience**:
一次完整的经历记录：目标、Observation、做出的决定、采取的 Action 和结果。Experience 是学习的原材料，本身不是知识。
_Avoid_: memory, log, trajectory

**Pattern**:
从多个 Experience 中归纳出的、经过验证的可复用结构，说明在某类情境下什么做法往往有效。
_Avoid_: rule, workflow, template

**Consolidation**:
把 Experience 比较、归纳、验证后提升为 Claim 或 Pattern 的过程。
_Avoid_: summarisation, memorisation

**Decay**:
降低或撤销长期未被支持、已过时或已被反驳的 Claim 和 Pattern 的过程。遗忘是正常的认知操作。
_Avoid_: deletion, cleanup

## 认知过程

**Goal**:
Agent 要让 World 达到的目标状态，或要回答的问题。
_Avoid_: task, prompt

**Cognitive State**:
Agent 当前正在用的那一小部分信息：目标、当前关注的实体、活跃的 Claim 和 Hypothesis、可用 Capability 和最近几步。它有明确的上限。
_Avoid_: context, prompt, session

**Cognitive Budget**:
Cognitive State 和推理被允许占用的资源上限，例如活跃 Claim 的数量、送入推理模型的 token 数。
_Avoid_: context window

**Attention**:
决定哪些信息此刻值得占用 Cognitive Budget 的判断。Attention 不同于检索：检索回答"有什么"，Attention 回答"现在该看什么"。
_Avoid_: retrieval, search

**Intuition**:
快速、低成本、基于概率的判断，即 System 1。负责判断熟悉度、新颖性、不确定性，以及是否需要深入推理。
_Avoid_: classifier, router, heuristic（这些可以是 Intuition 的实现方式，但不是它的名字）

**Reasoning**:
缓慢、高成本、深思熟虑的推理，即 System 2。负责规划、检验假设、处理矛盾和陌生问题。
_Avoid_: thinking, LLM call

**Fast Path**:
不调用 Reasoning 就完成一次决策的路径。它不等于完全不使用语言模型。
_Avoid_: shortcut, cache hit

**Slow Path**:
调用 Reasoning 完成一次决策的路径。
_Avoid_: full path

**Calibration**:
调整 Intuition 输出的置信度与实际正确率之间对应关系的配置参数，例如阈值或温度系数。它不修改模型本身，因此不属于训练。
_Avoid_: training, fine-tuning

**Escalation**:
Intuition 判断当前情况不适合走 Fast Path，转交给 Reasoning。
_Avoid_: fallback, retry

**Verification**:
在采取行动或接受结论之前，对候选结论做的检查。能用确定性方法检查的，就不用模型检查。
_Avoid_: validation（validation 专指 Pattern 的验证）

**Action**:
一次有名字、有参数结构、记录执行者，并经过策略检查的改动，可以改动 World（通过 Capability 执行），也可以改动 Worldview 或本体。所有改动都必须以 Action 的形式进行。
_Avoid_: step, tool call, direct write, mutation

**Capability**:
Agent 能够执行的一种操作，带有输入输出说明。
_Avoid_: tool, function, skill（Skill 指外部的 Agent Skills 格式）

**Self-Evolution**:
Memex 逐步积累关于自身构成、能力、限制、运行原理和升级历史的 Claim，并据此给出有依据的改进计划。它不包括未经授权修改自身。
_Avoid_: self-modification, self-improvement

## 语义结构

**Ontology**:
Agent 用来描述 World 和自身认知的概念与关系的集合。
_Avoid_: schema, taxonomy

**Core Ontology**:
所有领域共用的最小 Ontology，只描述认知过程本身和最基本的世界概念。
_Avoid_: upper ontology, base schema

**Domain Ontology**:
某个具体领域在 Core Ontology 之上扩展出的概念和关系。
_Avoid_: domain schema

**Domain Pack**:
接入一个新领域时需要提供的一整套内容：Domain Ontology、数据接入方式、该领域的 Capability 和评测集。
_Avoid_: plugin, adapter, dataset

## 架构

**Framework**:
Memex 的代码、契约和实验平台本身，不绑定任何具体的模型、服务或运行环境。
_Avoid_: platform, product

**Instance**:
Framework 加上一套配置、本机可用的模型和服务、以及数据，在某台机器上实际运行起来的 Memex。默认情况下，每个用户运行自己的 Instance。
_Avoid_: deployment, server, system

**Cognitive Contract**:
各组件之间唯一稳定的接口约定。除它以外，一切都可以替换。
_Avoid_: API, interface spec

**Provider**:
按 Cognitive Contract 实现某一种认知功能的可替换组件，例如 Intuition Provider、Reasoning Provider。
_Avoid_: plugin, module, adapter

**Cognitive Strategy**:
决定整个认知循环如何运转的可替换策略：先看什么、何时 Escalation、何时 Verification。
_Avoid_: architecture, pipeline, workflow

**Reasoning Strategy**:
Reasoning 内部如何推理的可替换策略，例如单次推理、先计划后执行、假设与证据交替。它从属于 Cognitive Strategy。
_Avoid_: prompting technique

## 评测

**Experiment**:
一次完整、互相隔离的评测运行，由配置唯一确定。一个 Experiment 内部可以积累经验，Experiment 之间不能有任何状态泄漏。
_Avoid_: run, test, trial

**Micro World**:
由生成器按配置和随机种子确定性生成的合成 World，用于在已知真实答案的条件下评测 Agent。
_Avoid_: simulation, sandbox, toy environment

**World 0**:
第一个真实领域：Memex 本身及其相关知识，包括开发知识和运行数据。目的是让 Memex 认识自己、从自己的经历中学习。
_Avoid_: self domain, meta world

**World Generator**:
根据版本化配置和随机种子生成 Micro World 的组件。相同版本、配置和种子必定生成相同的 Micro World。
_Avoid_: dataset, fixture

**Ground Truth**:
World Generator 掌握的 Micro World 真实状态和因果规则。只有 Oracle 和 Evaluator 能看到它。
_Avoid_: label, answer key

**Oracle**:
能访问 Ground Truth、为评测提供标准答案和标签的组件。Agent 永远无法访问 Oracle。
_Avoid_: judge, grader

**Evaluator**:
对照 Oracle 给 Agent 的表现打分并计算指标的组件。
_Avoid_: judge, scorer

**Baseline**:
用来对照的简化架构，与 Memex 使用同一个本地模型：B0 只用推理，B1 传统 RAG，B2 直觉加推理，B-sym 掌握完整规则的符号求解器。
_Avoid_: control group

**Task Class**:
按认知能力划分的任务类别：T0 世界观构建、T1 状态发现、T2 诊断、T3 目标导向行动、T4 信念修正、T5 经验迁移。
_Avoid_: domain, category

**Task Family**:
共享同一底层结构、只在表面细节上不同的一组任务。
_Avoid_: task set, template

**Deceptive Task**:
表面上属于某个 Task Family、实际在一个关键结构上不同的任务，用于测试 Agent 是否会错误套用 Pattern。
_Avoid_: trick question, adversarial example

**Trace**:
一次 Experiment 中每一个认知步骤的完整记录：输入、输出、耗时、所用 Provider、做出的决定和结果。
_Avoid_: log, transcript

**Learning Curve**:
随着 Experience 增加，准确率、推理调用率、上下文大小和延迟的变化曲线。它是证明 Agent 在学习的主要证据。
_Avoid_: progress chart
