# Memex

Memex 是一个认知 Agent 的 Framework。接入某个领域的数据后，Agent 会在该领域中建立并不断修正自己的 Worldview，结合模型的推理能力完成任务，并从经过验证的经验中持续学习。Framework 在某台机器上装配起来运行，就是一个 Instance。

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
Agent 认为可能为真的一条结构化命题，带有 Provenance、时间范围（Valid Time）、Epistemic Status 和 Confidence。Claim 不等于事实。
_Avoid_: fact, triple, memory item, knowledge entry

**Proposition**:
Claim 所断言的内容本身，形式为"主体、关系、客体或值"。
_Avoid_: statement, triple

**Provenance**:
一条 Claim 从哪里来：用户告知、直接观测、Agent 推断、模型猜测、外部工具或其他 Agent。不同来源的可信度不同。
_Avoid_: source（source 只指 Provenance 中的具体来源对象）

**Epistemic Status**:
Agent 对一条 Claim 所处的确信状态，分为已知、相信、怀疑、未知、已被反驳、有争议几类。中文统一称"确信状态"，不要写成"认知状态"（容易和 Cognitive State 混淆）。
_Avoid_: truth value, validity, 认知状态

**Confidence**:
一条 Claim 的置信度，是一个由证据、来源可信度和时间相关性推导出的数值。它只用于 Claim。
_Avoid_: certainty（Certainty 专指 Intuition 给出的把握度）

**Valid Time**:
一条 Claim 在 World 中为真的时间范围（validFrom、validUntil）。在 Micro World 中，它使用模拟器时间。
_Avoid_: timestamp

**Recorded Time**:
Agent 得知或记录某件事的时间。它和 Valid Time 是两条独立的时间轴：世界变了，改的是 Valid Time；Agent 改变看法，产生的是新的 Recorded Time。这两条时间轴合起来，就是数据库领域所说的"双时态"。
_Avoid_: created time, update time

**Hypothesis**:
为解释 Observation 而提出、尚待验证的候选 Claim 或因果解释。
_Avoid_: guess, assumption

**Worldview**:
Agent 关于某个领域的全部 Claim、Ontology 和 Pattern 构成的、可修正的整体理解。
_Avoid_: world model, knowledge base, memory

## 经验与学习

**Event Log**:
只追加写入的事件记录，是 Instance 唯一的事实来源。Worldview、Experience 和 Trace 都是从它推导出来的 Projection。
_Avoid_: database, history, memory

**Projection**:
从 Event Log 推导出来、随时可以丢弃并重建的视图，例如图存储中的 Worldview。这是 Event Sourcing 的标准术语。
_Avoid_: cache, copy

**Projector**:
读取 Event Log、生成和更新 Projection 的核心组件。对同一段日志，重建得到的结果必须完全相同。按调研建议（docs/research/core-algorithms-2026-10-11.md 第 2 节），Claim 的 Confidence 和 Epistemic Status 也由它确定性地算出；具体算法是可以做实验比较的变量（ADR 0002）。
_Avoid_: indexer, materializer

**Experience**:
一次完整的经历：目标、Observation、做出的决定、采取的 Action 和结果，是从 Event Log 推导出来的 Projection。Experience 是学习的原材料，本身不是知识。
_Avoid_: memory, log, trajectory

**Pattern**:
从多个 Experience 中归纳出的、经过验证的**可直接执行的计划模板**：按 Ontology 类型描述的适用条件、带参数的 Action 序列，以及证据记录。由 Intuition 判断是否适用，经 Verification 检查后直接执行，不调用 Reasoning（ADR 0018）。
_Avoid_: rule, workflow, template

**Consolidation**:
把 Experience 比较、归纳、验证后提升为 Claim 或 Pattern 的过程。
_Avoid_: summarisation, memorisation

**Decay**:
降低或撤销长期未被支持、已过时或已被反驳的 Claim 和 Pattern 的过程。遗忘是正常的认知操作。
_Avoid_: deletion, cleanup

## 认知过程

**Goal**:
Agent 要让 World 达到的目标状态，或要回答的问题。"给它一个目标，让它自己去完成"是 Memex 的产品定义；验证阶段的任务也一律以 Goal 的形式给出，目标完成率是共同主指标（ADR 0021）。
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
快速、低成本、基于概率的判断，即 System 1。负责判断熟悉度、新颖性、不确定性，以及是否需要深入推理。它的每一个判断都附带一个 Certainty。
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

**Certainty**:
Intuition 对单个判断给出的把握度，由模型的输出经过 Calibration 得到。
_Avoid_: confidence（Confidence 专指 Claim 的置信度）

**Calibration**:
调整 Certainty 与实际正确率之间对应关系的配置参数，例如阈值或温度系数。它不修改模型本身，因此不属于训练。所用的标签只能来自产品中也能拿到的信号，主要是 Shadow Escalation，不能用 Oracle（ADR 0023）。
_Avoid_: training, fine-tuning

**Shadow Escalation**:
Intuition 有把握、本可以走 Fast Path 时，按配置的比例照样调用 Reasoning，比较两边的结论是否一致，作为 Calibration 的标签。它产生的 Reasoning 调用计入成本（ADR 0023）。中文称"影子升级"。
_Avoid_: double check, audit call

**Escalation**:
Intuition 判断当前情况不适合走 Fast Path，转交给 Reasoning。
_Avoid_: fallback, retry

**Verification**:
在采取行动或接受结论之前，对候选结论做的检查。能用确定性方法检查的，就不用模型检查。
_Avoid_: validation（英文 validation 指验证阶段，见 ADR 0020）。中文单独说"验证"容易和验证阶段混淆，指本术语时写 Verification

**Action**:
一次有名字、有参数结构、记录执行者，并经过策略检查的改动，可以改动 World（通过 Capability 执行），也可以改动 Worldview 或本体。所有改动都必须以 Action 的形式进行。Observation 不是 Action：Observation 是"发生了什么"的记录，直接写入 Event Log；而根据 Observation 形成或修改 Claim，则是一个 Action。
_Avoid_: step, tool call, direct write, mutation

**Risk Level**:
每种 Action 在定义中声明的风险等级：只读、可撤销、不可撤销、对外发送、修改自身。Policy 按它和配置的档位决定放行、拒绝或等待用户审批；风险等级为"修改自身"的 Action 只有用户能执行，不随档位变化（ADR 0022）。中文称"风险等级"。
_Avoid_: severity, permission level

**Capability**:
Agent 能够执行的一种操作，带有输入输出说明。
_Avoid_: tool, function, skill（Skill 指外部的 Agent Skills 格式）

**Self-Evolution**:
Memex 逐步积累关于自身构成、能力、限制、运行原理和升级历史的 Claim，并据此给出有依据的改进计划。它不包括未经授权修改自身。
_Avoid_: self-modification, self-improvement

## 语义结构

**Domain**:
一个有边界的主题领域，Agent 要在其中建立 Worldview，例如保险、AWS 运维，或者 Memex 本身（World 0）。
_Avoid_: world（World 指 Agent 所处、可以观察和操作的环境）

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
接入一个新 Domain 时需要提供的一整套内容：Domain Ontology、数据接入方式、该 Domain 的 Capability、Environment 和评测集。
_Avoid_: plugin, adapter, dataset

## 架构

**Framework**:
Memex 的代码和契约本身，不绑定任何具体的模型、服务或运行环境。验证阶段的 Lab 放在同一个仓库里，但不属于 Framework，不随产品发布（ADR 0020）。
_Avoid_: platform, product

**Instance**:
Framework 加上一套配置、本机可用的模型和服务、以及数据，在某台机器上实际运行起来的 Memex。默认情况下，每个用户运行自己的 Instance。
_Avoid_: deployment, server, system

**Cognitive Contract**:
各组件之间唯一稳定的接口约定。除它以外，一切都可以替换。
_Avoid_: API, interface spec

**Provider**:
按 Cognitive Contract 实现某一种功能的可替换组件，例如 Intuition Provider、Reasoning Provider、Policy Provider。在端口与适配器架构（Ports and Adapters）里，Cognitive Contract 是端口，Provider 是适配器。
_Avoid_: plugin, module；也不要用来指模型服务商（应写作"模型服务商"或 Model Backend）

**Model Backend**:
真正运行模型推理的服务，例如 llama.cpp、vLLM、某个云端 API。Provider 通过 Model 资源连接到 Model Backend；更换 Backend 只需要改配置。
_Avoid_: model provider, engine

**Environment**:
Agent 通过 Observation 和 Action 与之交互的 World 的接口，例如 Micro World 的模拟器，或 World 0 的仓库与运行时。它是 Memex 自定义的三个标准之一。
_Avoid_: simulator, sandbox

**Composition Root**:
把组件装配起来的地方，分两部分：一是 `@memex/runtime` 中的注册表和装配逻辑（读取配置、校验、按 `type` 查注册表、实例化、能力检查），它本身不引用任何具体实现；二是**装配入口**（验证阶段 V0–V2 是 Lab Worker 的启动文件，P1 起是 `apps/*`），只有它 import 具体的 Provider 并登记到注册表。核心代码从不直接引用具体的 Provider。
_Avoid_: container, bootstrap

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

**Experiment 快照**:
记录一次 Experiment 全部输入的 JSON 文件：最终生效的配置及其哈希、各 Provider 的类型和版本、模型来源和 sha256、World Generator 的版本和种子、本体版本、Model Backend 版本、思考模式设置、硬件信息，以及录制内容存储的位置（ADR 0024）。有了它就能回放这次 Experiment。
_Avoid_: snapshot（单独使用时容易和 Event Log 的加速快照混淆）

**Lab**:
验证阶段运行和评测 Experiment 的工具：Runner 为每个 Experiment 启动一个独立的 Worker 进程，借助 Runtime 的录制与回放复现结果，汇总 Evaluator 的结果并输出报告。Worker 和 Runtime 运行同一套代码，所以被验证的就是产品组件本身。Lab 不属于产品，不随产品发布，通过 `pnpm lab ...` 在仓库中使用（ADR 0020）。
_Avoid_: test harness, benchmark runner

**Fake Provider**:
按 Cognitive Contract 实现、行为由种子和配置确定的假组件，例如可以设定准确率的 FakeIntuition。用于在不接真实模型的情况下验证运行时和 Lab。
_Avoid_: mock, stub

**对照**（Control）:
与主选在同一组实验中**同时运行**、用来比较的变体，例如 Intuition 的启发式规则、B3-noI（ADR 0018）。
_Avoid_: 备选

**备选**（Alternate）:
主选未通过收敛规则时**才换上**的组件，不与主选同时运行，例如 Reasoning 的 Qwen3.6-35B-A3B（ADR 0017、0018）。
_Avoid_: 对照、fallback

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
能访问 Ground Truth、为评测提供标准答案和标签的组件。Agent 永远无法访问 Oracle；它的结果只用于打分和诊断，不进入 Agent 的 Worldview、Pattern 或任何配置（ADR 0018、0023）。
_Avoid_: judge, grader

**Evaluator**:
对照 Oracle 给 Agent 的表现打分并计算指标的组件。
_Avoid_: judge, scorer

**Baseline**:
用来对照的简化架构，在同一组对比中与 Memex 使用同一个 Reasoning 模型（ADR 0018）。B0：只用 Reasoning。B1：传统 RAG 加 Reasoning。B2：Intuition 加 Reasoning，没有 Worldview。B3：完整的 Memex。B3-noI：去掉 Intuition 的 B3，全部走 Slow Path。B-sym：掌握完整规则的符号求解器，只用来检查题目难度，不参与对比。验证阶段只使用 B0、B1、B3 和 B3-noI（ADR 0010）。
_Avoid_: control group

**Task Class**:
按认知能力划分的任务类别：T0 世界观构建、T1 状态发现、T2 诊断、T3 目标导向行动、T4 信念修正、T5 经验迁移、T6 长序列学习（同一 Task Family 的任务按顺序给出，测量随 Experience 增加的变化；ADR 0018）。验证阶段只用 T2（Q1）、T4（Q2）、T6（Q3）。ADR 0021 之后，T2、T4、T6 也都以 Goal 的形式给出；Task Class 按考查的认知能力区分，不按任务形式区分，T3 考查的是多步规划和执行本身。
_Avoid_: domain, category

**Task Family**:
共享同一底层结构、只在表面细节上不同的一组任务。
_Avoid_: task set, template

**Deceptive Task**:
表面上属于某个 Task Family、实际在一个关键结构上不同的任务，用于测试 Agent 是否会错误套用 Pattern。
_Avoid_: trick question, adversarial example

**Trace**:
一次 Experiment 中每一个认知步骤的完整记录：输入、输出、耗时、所用 Provider、做出的决定和结果。它是从 Event Log 推导出来的 Projection，是学习和评测用的数据。系统运行状况的日志和指标叫"运维遥测"，不叫 Trace（ADR 0015）。
_Avoid_: log, transcript, telemetry

**Learning Curve**:
随着 Experience 增加，准确率、推理调用率、上下文大小和延迟的变化曲线。它是证明 Agent 在学习的主要证据。
_Avoid_: progress chart
