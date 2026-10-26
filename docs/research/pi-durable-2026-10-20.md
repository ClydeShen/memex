# Pi Durable 是什么，适不适合 Memex

日期：2026-10-20。调研时仓库提交为 `6368ddf6`。负责人认为 Pi Durable 这个刚发布的框架很适合 Memex，要求调研。

可信度标记（沿用仓库约定）：**[官方/原文]**、**[官方/原文·摘要]**、**[二手]**、**[推断]**。本次读了 Earendil 的发布文章、pi.dev 首页和 Cloudflare 的集成文档（都是 WebFetch 的摘要，记为 [官方/原文·摘要]），没有读源码，也没有运行。

---

## 结论

| 问题 | 结论 | 把握 |
|---|---|---|
| Pi Durable 是什么 | 一个 TypeScript 框架，用来构建**长时间运行、能从崩溃中恢复**的 agent 应用。它和 Pi 1.0 编码 agent 一起发布，但不是编码 agent，而是一个通用的 harness | 高 |
| 设计思路和 Memex 像不像 | **非常像**：任务在推进前先存检查点、"第一次写入为准"的 memo、工具标明能不能重跑、存储适配器配一致性测试、对话可以分叉。这几乎就是 ADR 0005 和 ADR 0024 想做的事 | 中到高 |
| 能不能直接当 Memex 的底座 | **现在不建议**。主要冲突是事实来源：Memex 规定 Event Log 是唯一的事实来源（ADR 0005），Pi Durable 有自己的存储和对话模型。另外它是实验性的，API 可能会变；Cloudflare 的版本也还没有工具调用的审批步骤，而 Memex 需要 Policy 检查（ADR 0014、0022） | 中 |
| 建议 | **先借设计，不加依赖**：把它的几个机制对照进 Memex 自己的运行时设计。把 Pi 的仓库加进学习标本，读源码。验证阶段之后，再评估要不要把它作为"持久执行"这个端口的一个适配器 | [推断] |

---

## 一、Pi Durable 是什么

### 1.1 来历 [官方/原文·摘要]

- 发布方是 Earendil，和 Pi 1.0 编码 agent 同在 2026-10-01 发布。Pi 1.0 带来了内置 MCP 支持、延迟加载工具等更新。
- Pi Durable 是一个**实验性**的独立包，API 可能会变。
- 它不是 Pi 编码 agent 的替代品。两者共用底层代码（`pi-ai`），也共用两条原则：**极简**和**可塑**。
- 仓库在 `github.com/earendil-works/pi` 的 `packages/durable` 目录。npm 包：`@earendil-works/pi-durable`、`@earendil-works/pi-ai`、`@earendil-works/chord`。
- 许可证：Pi 编码 agent 是 MIT（pi.dev 首页）。Pi Durable 的发布文章没有写许可证，一个第三方的发布追踪站写的是 MIT [二手]，需要到仓库核实。

### 1.2 目标 [官方/原文·摘要]

- 进程崩溃、容器重新部署、内存耗尽之后都能继续运行。
- 支持很长的对话。
- 支持同时运行很多对话。
- 支持多个人同时引导同一个 agent。
- 能在任何 JavaScript 运行时上运行：Node、Bun、Cloudflare Workers。

### 1.3 数据模型 [官方/原文·摘要]

| 概念 | 内容 |
|---|---|
| Conversation（对话） | 一份 transcript，加上 agent 的配置：模型、思考级别、选用的扩展和启用的工具、指令、工作目录。可以从 transcript 的任意位置**分叉**，分叉共享父对话的历史，不复制 |
| Transcript | 一组条目，包括模型消息。压缩时会把旧消息总结掉，但**原文仍然留在存储里** |
| Document（文档） | 有类型的 JSON，存放应用状态（待办、计划、工单），和 transcript 的改动**在同一次提交里原子地写入**。每个文档可以设定分叉时的行为：取分叉那一刻的状态、取当前状态，或者从空白开始 |
| Task（任务） | 一个工作单元：一次模型请求、一次工具调用、一次压缩，或者扩展定义的工作。每个任务存检查点，还可以拥有其他任务或对话 |
| Memo | 存在任务上的小值，**第一次写入为准**。这样在重启之后，钩子不会重复做同一个决定 |
| Submission（提交） | 排队的输入，用 `requestId` 去重 |

发布文章没有说存储是不是事件溯源或只追加。它提到了"提交"，`watch()` 会给出"每次提交的确切操作"，压缩也不删除任何东西。这些都说明它接近只追加的提交日志，但文章没有确认。

### 1.4 存储 [官方/原文·摘要]

- 自带三种适配器：内存、SQLite、JSONL。另外提供一套**一致性测试**和基准测试，用来检验自定义的后端。
- SQLite 和 JSONL 的实现不依赖 Node 专有的 API，所以加一个小适配器就能在 Bun 或 Cloudflare Durable Object 里运行。
- 用 SQLite 时，内存里只保留正在用的部分：活跃的 transcript、运行中的任务、待处理的提交。
- 同一份存储同一时间只能由一个进程拥有，其他客户端连接到这个进程。

### 1.5 恢复 [官方/原文·摘要]

- 每个任务**推进之前先存检查点**。崩溃之后，新进程打开同一份存储，找到没完成的任务，从各自的最后一个检查点继续（`harness.resume()`）。
- 被打断的模型请求会**重新发送**。已经流式输出的部分留在 transcript 里，标记为"已中止"。
- 排队的消息仍然在队列里。
- **工具重跑**：工具声明 `replay: "safe"` 才会在崩溃后重新执行。没有声明的工具不会重跑，模型会被告知这次调用被打断了，并拿到已经存下的部分输出。

### 1.6 分叉和多人引导 [官方/原文·摘要]

- `fork()` 可以从任意一条 transcript 条目创建新对话。分叉和父对话并行运行，互不阻塞。
- 任意数量的客户端可以连接同一个对话。新连接的客户端先拿到当前视图（transcript、流式输出、运行中的工具、队列、agent、用量），然后接收增量更新。
- 客户端可以在对话运行中插入引导（`whenBusy: "steer"`），也可以排队追加消息。

### 1.7 扩展和模型 [官方/原文·摘要]

- 扩展是普通对象，带有 `name`、`tools`、`sections`。工具用 TypeBox 定义参数结构，带重跑标志和 `execute` 函数。
- Pi 编码 agent 的理念：子 agent、计划模式、权限确认、沙箱都做成扩展，不放进核心。
- 模型通过 `pi-ai` 接入。pi.dev 列出的服务商里，本地运行时只有 Ollama。自定义的服务商和模型可以通过 `models.json` 或扩展加入。llama.cpp 的 OpenAI 兼容接口应该可以作为自定义服务商接入 [推断]，没有验证。

### 1.8 已知限制（Cloudflare 集成的 beta 版本）[官方/原文·摘要]

- 工具调用**没有审批或权限步骤**。
- 事件流不能从游标恢复，重启之后客户端要重新取快照。
- `abort()` 会一直等到会话空闲，忽略中止信号的工具会把它卡住。
- 单次模型请求流式输出超过 15 分钟可能被切断。
- 还不能删除对话。

---

## 二、和 Memex 的对照 [推断]

### 2.1 设计上的对应

| Pi Durable | Memex 现有的决定 | 关系 |
|---|---|---|
| 任务推进前先存检查点，崩溃后从检查点继续 | ADR 0005：崩溃恢复建立在 Event Log 和回放上 | 目标相同，做法不同：Pi 存检查点，Memex 重放日志 |
| Memo：第一次写入为准，重启后不重复决定 | ADR 0024：在不确定性进入系统的边缘录制，回放时直接用录下的结果（参照 Temporal） | **几乎相同的思路** |
| 工具声明 `replay: "safe"` 才重跑 | ADR 0024：有副作用的调用不重新执行，用录下的结果 | 思路相同。Pi 是按工具声明，Memex 是统一录制 |
| 被打断的模型请求重新发送 | ADR 0024：模型调用是不确定的，应该录下结果 | **有差异**：重发会得到不同的结果，破坏可复现性 |
| 存储适配器加一致性测试 | 契约、Provider 和一致性测试（ADR 0008、testing） | 相同 |
| 文档和 transcript 原子提交 | 所有改动通过 Action 写进 Event Log（ADR 0014） | 相近 |
| 压缩时不删原文 | Event Log 只追加；Projection 可以丢弃重建 | 相近 |
| 分叉：共享历史，并行运行 | 每个 Experiment 独立进程（ADR 0004）；Counterfactual Probe、System 3 的 Sandbox（open-questions 第 5、6 条） | **很有用**：分叉正好可以实现"隔离的假设区"和"换一个条件再判断一次" |
| 多客户端连接、运行中插入引导 | Communication 入口；ADR 0022 的"等待审批"需要暂停和恢复 | 相近 |
| 能在 Node、Bun、Workers 上运行 | ADR 0013：可移植部署 | 一致 |
| TypeScript | Memex 的技术栈是 Node 和 TypeScript | 一致 |

### 2.2 冲突和风险

1. **事实来源有两个**：ADR 0005 规定 Event Log 是唯一的事实来源，Worldview 等都是从它推导出来的 Projection。如果把 Pi Durable 当底座，它的存储（transcript、document、task）就成了第二个事实来源。两者必须定下主从关系，否则会互相矛盾。
2. **以对话为中心**：Pi Durable 的核心对象是对话和 transcript。Memex 的核心是 Worldview、Claim、Experience，以及 Intuition → Escalation → Reasoning → Verification → Action 这个循环。让 Pi 的 agent 循环替代 Memex 的认知循环，等于把 Memex 要研究的东西交给了框架。VISION 说 Memex 本身就是一个 Agent 框架。
3. **可复现性**：被打断的模型请求会重新发送，这和 ADR 0024 的录制和回放冲突。如果要用，录制必须放在它下面的模型连接层。
4. **Policy**：Cloudflare 的 beta 版本没有工具调用的审批步骤。Memex 的所有改动都必须经过 Policy 检查，并支持"等待审批"（ADR 0014、0022）。Pi 的理念是把权限做成扩展，所以大概能做到，但需要验证。
5. **实验性**：API 可能会变。Memex 的原则是契约稳定、其余可替换。依赖一个不稳定的框架，只能放在端口后面。
6. **本地模型**：pi.dev 只列出了 Ollama。Memex 用的是 llama.cpp（ADR 0017、docs/research/llama-cpp-backend.md），需要验证能否作为自定义服务商接入。

### 2.3 三个选项

| 选项 | 做法 | 好处 | 代价 |
|---|---|---|---|
| A. 当底座 | 用 Pi Durable 的 agent 循环和存储运行 Memex | 最快获得崩溃恢复、分叉、多客户端 | 事实来源冲突；认知循环被框架决定；依赖实验性的 API |
| B. 当适配器 | 定义一个"持久执行"的端口，Pi Durable 作为其中一个适配器，只管执行状态（任务、检查点、队列）。Event Log 仍然是认知层面的唯一事实来源 | 符合 ADR 0008；可以替换；能用上分叉 | 要设计端口；两套存储之间要同步 |
| C. 只借设计 | 不加依赖，把它的机制对照进 Memex 自己的运行时：任务检查点、第一次写入为准的 memo、工具的重跑标志、存储一致性测试、分叉 | 没有依赖风险；V0 不受影响 | 需要自己实现 |

**建议**：现在做 C；验证阶段之后，如果长时间运行和分叉成了实际需要，再按 B 评估。另外把 `earendil-works/pi` 加进学习标本，和 hermes-agent、iii 一样读源码。理由：
- V0 还没开始写代码，现在引入一个实验性的底座，风险大于收益；
- 它最有价值的部分是设计思路，而这些思路和 ADR 0005、0024 高度一致，可以直接用来检验和细化 Memex 自己的设计；
- 分叉对 Counterfactual Probe 和 System 3 的 Sandbox 很有启发，但这两项都是验证阶段之后才决定的事。

### 2.4 可以马上借用的设计点

1. **工具声明能不能重跑**：Capability 的定义里加一个字段，说明它在回放或恢复时能否重新执行。这让 ADR 0024 的"有副作用的调用不重跑"变得更明确。
2. **第一次写入为准的 memo**：回放时，凡是"做过的决定"（例如 Intuition 的判断、Policy 的结果）都读录下的值，不重新决定。
3. **存储适配器的一致性测试**：Event Log 的每种存储实现都要通过同一套一致性测试。这和已有的一致性测试原则一致。
4. **分叉共享历史，不复制**：将来实现 Experiment 的分支、Counterfactual Probe、Sandbox 时，可以参考这种做法。
5. **压缩不删原文**：和 Event Log 只追加一致。可以确认 Memex 的上下文压缩也只生成 Projection，不改动日志。

## 二之二、按"能用就用"重新评估（2026-10-20 负责人提出）

负责人不想重复造轮子：能直接用的就用，不采用要给具体理由，并说明在哪个阶段引入。按这个标准重新对照 [推断]：

| Memex 需要的部件 | Pi 能否直接提供 | 引入阶段 |
|---|---|---|
| 长时间运行的目标：后台执行、中断后接着做、等审批后继续（P1 的退出条件） | 能，Pi Durable 的核心 | P1 |
| 工具和外部能力：MCP、Skills | 能，Pi 1.0 内置 | P3（P1 需要工具就提前） |
| Slow Path 里的多步推理（先计划再执行、调用工具） | 能，Pi 的 agent 循环 | V2 或 P1 |
| 分叉：Counterfactual Probe、System 3 的 Sandbox | 能，`fork()` | 验证阶段之后 |
| 产品界面（pi-tui） | 部分能 | P1 |
| 模型连接（Reasoning） | 能，`pi-ai` | V1，先验证 |
| 模型连接（Intuition） | 不确定：要传 `logprobs`、`top_logprobs`、`chat_template_kwargs` | V1，先验证 |
| 认知循环、Worldview、Claim、Intuition 和 Escalation | 不能，这是 Memex 的研究对象 | — |
| Event Log、Action Executor、Policy | 部分能，但不是 Memex 的领域事件，beta 版也没有审批 | P1 时决定两者怎么结合 |

**V0 不引入的具体理由**：V0 只用 Fake Provider，用不到 Pi；Pi 恢复时会重发模型请求，会给"运行两次 traceHash 相同"这条通过标准增加一个不确定的层；V0 要做的 Event Log、Action、Policy，Pi 没有现成的对应物。V0 只需要让 Event Log 的存储接口能对接 Pi 的存储适配器。

**状态（2026-10-27）**：负责人决定暂时只记下这个知识点，到下列时机再拿出来研究讨论（docs/open-questions.md 第 7 条）：
1. **V1 开始前**：验证 pi-ai 能否在 llama.cpp 上传上面三个参数，能否在模型连接层被录制和回放（ADR 0024）。
2. **V2 设计 Reasoning Strategy 时**：评估多步推理是否跑在 Pi 的 agent 循环上。
3. **P1 设计时**：评估 Pi Durable 作为长时间运行的执行层，用 ADR 定清楚它和 Event Log 谁是事实来源，以及审批怎么接 Memex 的 Policy。
4. **P3 设计时**：MCP 和 Skills 是否直接用 Pi。

## 三、待核实

- Pi Durable 的许可证（发布文章没写，第三方说是 MIT）。
- 存储是不是只追加的提交日志。
- llama.cpp 能不能作为 `pi-ai` 的自定义服务商接入。
- Pi Durable 本身（不是 Cloudflare 集成）有没有工具调用的审批钩子。
- 以上都需要读源码确认。

## 四、需要负责人决定

1. 选 A、B、C 中的哪一个？建议 C，验证阶段之后再看 B。
2. 要不要把 `earendil-works/pi` 加进学习标本目录？
3. 第 2.4 节的 5 个设计点，要不要现在写进 ADR 0024 的修订，或者 contracts.md？

## 来源

- [Earendil：Pi Durable 发布文章](https://earendil.com/posts/pi-durable/)
- [pi.dev](https://pi.dev/)
- [Cloudflare Agents：Pi harness 文档](https://developers.cloudflare.com/agents/harnesses/pi/)
- [AlternativeTo：Pi 1.0 和 Pi Durable 的新闻（二手）](https://alternativeto.net/news/2026/10/pi-1-0-brings-native-mcp-support-and-pi-durable-for-long-running-crash-resistant-ai-agents/)
- [Kingy AI 发布追踪（二手，许可证信息来源）](https://kingy.ai/ai-launch-tracker/pi-durable-experimental-package-2026-10-01/)
