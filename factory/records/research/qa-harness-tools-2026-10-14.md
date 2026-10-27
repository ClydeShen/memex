# harness 中 QA 部分的工具、框架与工程化配置调研

日期：2026-10-14。对象：在"harness engineering"的框架下（引导 guides / 传感器 sensors；计算型 / 推理型；工作过程中 / 集成之前 / 集成之后 / 持续），哪些**最新的、适合 agent 驱动项目**的 QA 工具和配置值得用，覆盖 11 个类别；并对本仓库（结论 A）和通用的 agent 驱动项目（结论 B）给出建议。调研时仓库提交为 `2cb21b76`。

可信度标记（沿用仓库约定）：
- **[官方/原文]**：读过官方文档、工具 README、官方博客或论文页面的相关部分。
- **[官方/原文·摘要]**：只读到摘要、落地页或概述页，或该页对某个细节没有写。
- **[二手]**：来自搜索结果摘要、新闻等第三方描述，没有追到一手来源。
- **[推断]**：本文作者的判断，没有直接证据。
- **[实测]**：2026-10-14 在命令行执行 `npm view`、PyPI JSON、NuGet flat container、`gh api .../releases/latest` 得到的结果。

**利益冲突说明**：本文由 Claude（Anthropic 的模型）撰写，第 9、11 类涉及 Anthropic 自己的产品（Claude Code 的 `/code-review`、Code Review、hooks、`/goal`）。这些条目只引用官方文档写明的机制，不采信任何效果宣传；与其他厂商的产品同等对待。厂商自己给出的效果数据一律标"厂商说法"。

**与 playbook 的关系（先说明一个事实）**：任务描述说 playbook 已经选定 Stryker、Playwright 等。实际 `grep` 结果是：`playbook/` 中没有出现 Stryker、Playwright、mutation、flaky、contract testing 等词；`language-profiles.md` 的第 4 个角色"Tests and property-based tests"只定了 Vitest 5 + fast-check 4.10、pytest 9.1.1 + Hypothesis 6.169.0、xUnit v3 + FsCheck 3.4.0。所以下文的大部分推荐对 playbook 来说是**补充**（新角色），不是替换。[实测]

---

## 一、harness 框架回顾（一手来源要点）

- **Fowler 网站上的 *Harness engineering*（Birgitta Böckeler，2026-04-02）**：引导（前馈）在 agent 动手前提高第一次就做对的概率；传感器（反馈）在动手后观察并支持自我纠正，"为 LLM 写的"传感器消息（例如带修复指引的 linter 消息）特别有用。计算型传感器确定、便宜，可以每次改动都跑；推理型传感器（AI 代码审查、LLM as judge）昂贵、不确定，不适合每次提交都跑。时间点：工作过程中（LSP、指令文件、skill、linter）；集成之前（linter、快速测试、基础审查 agent）；集成之后（变异测试、更大范围的架构审查）；持续（死代码、覆盖率质量、依赖扫描；运行时 SLO、AI judge 抽样、日志异常）。文章明确说：AI 生成的测试套件还不够可信；"行为"是最难调控的一类；一个从不触发的传感器，可能说明质量高，也可能说明检测弱，作者呼吁有"评估 harness 覆盖度"的方法（类似覆盖率和变异测试）。[官方/原文]
- **Anthropic 工程博客 *Effective harnesses for long-running agents*（2025-11-26）**：初始化 agent 写一份 JSON 格式的功能清单（每条有 category、description、测试步骤、`passes`），coding agent 只能改 `passes`，提示词写明"不允许删除或修改测试"；选 JSON 是因为模型比较不容易乱改 JSON。没有明确要求时，Claude 只跑单元测试或 `curl`，不做端到端确认；被要求"像人类用户那样"用浏览器自动化（Puppeteer MCP）测试后，验证效果明显变好；但 Puppeteer MCP 看不到浏览器原生的 alert 弹窗。每个 session 开始先跑 `init.sh` 和一个基础的端到端测试，先修好已有的问题再加功能。文章把"专门的测试/QA agent"列为未验证的方向。[官方/原文]
- **Claude Code 最佳实践**：给 agent 一个能运行的检查（测试、构建退出码、linter、对 fixture 的 diff、截图对比），让循环自己闭合。门禁强度分四级：在同一个提示词里要求；`/goal` 条件（另一个模型每轮之后判断）；Stop hook（脚本，确定性地阻止回合结束）；验证子 agent（新的上下文，试图推翻结果）。要求 agent 出示证据而不是声称成功。hook 是确定性的，CLAUDE.md 只是建议。对抗式审查：新上下文的子 agent 只看 diff 和标准；审查者被要求找问题时总会报一些，应只关注影响正确性和需求的问题。[官方/原文]

---

## 二、总览矩阵

| # | 类别 | 首选 | 备选 | harness 位置 | 适合 agent 的理由 | 可信度 |
|---|---|---|---|---|---|---|
| 1 | agent 用的浏览器与 E2E | **Playwright Test 1.64.0**（写成测试）+ **@playwright/cli 0.1.22** 或 **agent-browser 0.39.1**（agent 交互式验证） | Playwright MCP 0.0.83；Chrome DevTools MCP 1.10.1（调试、性能）；Stagehand 4.2.1、Browser Use 0.13.11（自然语言驱动，不确定） | 计算型传感器（测试）；工作过程中 + 集成之前/之后。交互式验证属于"工作过程中"的行为传感器 | 无障碍树快照 + 元素引用，无需视觉模型；CLI 比 MCP 省 token（Playwright 官方说法）；`--json` 输出；Playwright Test 结果确定、一条命令 | [官方/原文] + [实测] |
| 2 | 测试生成 | **不引入独立工具**：用 coding agent 自己生成，并用变异测试筛选（Meta ACH 思路）；Web 项目可用 Playwright 的 planner/generator | Keploy v3.6.122（从流量录制 API 测试）；Diffblue Cover（只 Java，商业）；Qodo Cover **已停止维护** | 引导（生成的测试成为后续的传感器）；工作过程中 | 生成本身是推理型的，必须靠计算型传感器（运行、变异杀死率）把关 | [官方/原文] + [实测] |
| 3 | 变异测试 | **Stryker**（JS/TS 10.0.0；.NET 5.0.0）；Python **mutmut 3.8.0** | Python cosmic-ray 8.7.0（Windows 原生、任意测试命令）；Java PIT 1.30.0；Rust cargo-mutants 27.1.0 | 计算型传感器；集成之后 / 持续（增量或按 diff 时可前移到集成之前） | 都有 CLI；Stryker 有 JSON 报告和 `break` 阈值退出码；均支持增量或按 diff | [官方/原文] + [实测] |
| 4 | 测试影响分析 / 选择 | 先用测试运行器自带的：**Vitest `--changed` / `vitest related`**；**pytest-testmon 2.2.0**；monorepo 用 **Nx affected 23.3.0** | Datadog Test Impact Analysis（商业，含 .NET）；CloudBees Smart Tests（原 Launchable，商业）；Develocity PTS（只 Gradle/Maven）；Bazel | 计算型（Datadog/testmon 用覆盖率）或统计模型（Launchable/Develocity）；工作过程中（快速反馈）、集成之后（缩短流水线） | 本地一条命令；agent 每次改动后只跑相关测试 | [官方/原文] + [实测] |
| 5 | 不稳定测试管理 | 先**消除不确定性**（注入时钟和种子、随机顺序跑）；需要平台时 **Trunk Flaky Tests**（analytics-cli 0.16.0） | BuildPulse（$99/月起）；Datadog Test Optimization；pytest-rerunfailures 16.7（只是重试） | 持续传感器；集成之后 | Trunk 基于 JUnit XML，隔离（quarantine）通过覆盖退出码实现，对 agent 透明 | [官方/原文] |
| 6 | 密闭的集成测试 | **Testcontainers**（Node 12.2.1 / Python 4.15.0 / .NET 4.16.0）；HTTP 依赖用 **MSW 3.0.3**（Node）或 **WireMock**（WireMock.Net 2.19.0 / Java 3.13.2） | 自写 fake（端口 + 一致性测试） | 计算型传感器；集成之前 / 之后 | 本地和 CI 同一条命令；需要 Docker | [官方/原文] + [实测] |
| 7 | 契约与 schema 测试 | 有 OpenAPI 时 **Schemathesis 4.31.0**；双方都在自己控制下的服务间通信用 **Pact**（JS 17.1.4 / Python 3.4.1 / .NET 5.0.1） | Specmatic 2.55.3（OpenAPI 等作为可执行契约，MIT，JVM） | 计算型传感器；集成之前 | Schemathesis 输出 JUnit XML 和最小 `curl` 复现；Pact 的 `can-i-deploy`（未核实细节） | [官方/原文] + [实测] |
| 8 | 视觉回归 | **Playwright `toHaveScreenshot`**（或 Vitest 浏览器模式的 `toMatchScreenshot`） | Chromatic（免费层 5,000 次快照/月）；Percy；Applitools | 计算型传感器；集成之前 / 之后 | 本地、确定（同一环境生成基线时）；SaaS 适合人审查，不适合 agent 自己闭环 | [官方/原文] |
| 9 | AI 代码审查（推理型） | 本地：**新上下文的审查子 agent**（如 Claude Code `/code-review`、CodeRabbit CLI `cr --agent`） | 托管 PR 审查：Claude Code Code Review（Team/Enterprise，平均 $15–25/次）、GitHub Copilot code review、Cursor Bugbot、CodeRabbit | 推理型传感器；集成之前（本地）/ 集成之前（PR） | 都只给评论、默认不阻止合并；证据强度低（缺独立评测） | [官方/原文] |
| 10 | 评测 LLM 功能 | **promptfoo 0.124.1**（Node 项目、YAML、JUnit 输出、失败退出码 100） | **Inspect AI 0.3.280**（Python，agent 评测和沙箱）；DeepEval 4.2.8（Python，pytest 风格）；Braintrust（商业平台，autoevals MIT） | 计算型断言 + 推理型（llm-rubric 等）；集成之前 / 之后；持续（运行时抽样） | CLI、确定性断言与模型评分可混用、缓存 | [官方/原文] + [实测] |
| 11 | agent 工具自身的 QA 配置 | **Claude Code hooks**（PostToolUse、Stop、PreToolUse）+ 权限 `deny` 规则；**Codex hooks**（同名事件）；服务端 **required status checks + Code Owners 审查** | `/goal`（模型判定）；验证子 agent；沙箱 `denyWrite`（不支持原生 Windows） | 引导（规则）+ 计算型/推理型传感器；工作过程中 + 集成之前 | 确定性；不依赖 agent 自觉 | [官方/原文] |

---

## 三、按类别分节

### 1. agent 用的浏览器与端到端测试

**证据**

- **Playwright Test Agents**：三个内置 agent。planner 探索应用、写 Markdown 测试计划（输入：需求、seed 测试、可选 PRD）；generator 把计划变成测试文件，运行中实时检查选择器和断言；healer 运行测试、重放失败步骤、检查当前界面、提出补丁并重跑，**它也可以把它认为"覆盖了已坏功能"的测试跳过**。初始化：`npx playwright init-agents --loop=<vscode|claude|codex|opencode>`；Playwright 升级后要重新生成定义；输出 `specs/`（计划）、`tests/`（测试）、`seed.spec.ts`。[官方/原文]
- **Playwright MCP**：用结构化的无障碍快照（accessibility snapshot）驱动浏览器，不需要视觉模型，README 称其"快、轻、确定"；`browser_snapshot` 比截图更好（截图上不能直接操作）。README 自己说：**对 coding agent，CLI 可能更合适**，因为更省 token、不加载大量工具 schema；MCP 适合需要持久状态和丰富页面检查的专门循环（探索式自动化、自愈测试）。选项 `--headless`、`--isolated`、`--caps`。[官方/原文]
- **@playwright/cli（playwright-cli）**：`npm install -g @playwright/cli@latest`；`playwright-cli install --skills` 给 Claude Code、Copilot 等装 skill；命令有 `open/goto/click/fill/snapshot`（返回 `e15` 这样的引用）、`console`、`requests`、`screenshot`、`tracing-start`、`run-code`；会话默认在内存中，`-s=name` 命名会话。旧包 `playwright-cli` 已标注"Deprecated, use @playwright/cli"。[官方/原文] [实测]
- **agent-browser（Vercel Labs）**：Rust 写的原生 CLI，守护进程不需要 Playwright 或 Node；`snapshot` 返回带 `@e2` 引用的无障碍树；`--json` 机器可读输出；`snapshot --delta`、`--if-changed`、`--max-output` 用来控制上下文；也提供 `mcp` 子命令；Apache-2.0；页面提到 Windows（私有桌面上的无头 Chrome）。README 说快照加引用"对 LLM 最优"，**没有给基准数据**。[官方/原文]
- **Chrome DevTools MCP**：让 agent 控制和检查一个真实的 Chrome；性能 trace、网络请求、控制台（带 source map 的堆栈）、截图；输入自动化基于 Puppeteer；也提供"不用 MCP"的 CLI；只正式支持 Chrome 和 Chrome for Testing；警告会把浏览器内容暴露给 MCP 客户端。定位是调试和性能分析，不是测试。[官方/原文]
- **Stagehand**：`act`/`observe`/`extract` 用自然语言操作页面，需要模型 API key；TS、Python（另有 Go）；MIT；缓存在 Browserbase 云端，页面没有说这让操作变得确定。**Browser Use**：浏览器 agent，Python 和 TS，MIT，需要模型；有给 coding agent 用的 CLI（`browser-use skill install`）。[官方/原文]

**版本与维护**（2026-10-14 [实测]）：@playwright/test 1.64.0（GitHub 发布 2026-10-07，Apache-2.0）；PyPI playwright 1.64.0、pytest-playwright 0.10.0；NuGet Microsoft.Playwright 1.63.0（也有 `.MSTest`、`.Xunit.v3` 包）；@playwright/mcp 0.0.83（2026-09-28）；@playwright/cli 0.1.22（2026-09-28）；chrome-devtools-mcp 1.10.1（2026-09-23）；agent-browser 0.39.1（2026-10-13）；@browserbasehq/stagehand 4.2.1（npm 2026-10-14）；browser-use 0.13.11（2026-10-07）。

**推荐**

- **"agent 像用户一样验证"**（工作过程中的行为传感器）：首选 **@playwright/cli** 或 **agent-browser**。两者都是 CLI、无障碍树加引用、机器可读输出，符合 Anthropic 博客"像人类用户那样用浏览器测试"的做法，而且比 MCP 省上下文（Playwright 官方说法）。已经用 Playwright Test 的项目优先 @playwright/cli（同一引擎、同一套选择器）；不想引入 Node 的项目用 agent-browser。[官方/原文] + [推断]
- **把验证固化为回归测试**（集成之前/之后的计算型传感器）：**Playwright Test**。三语言都有官方绑定；但 test agents 的 `init-agents` 是 npx 命令，生成 TypeScript 测试，Python/.NET 是否可用没有查到。[官方/原文] + [尚未核实]
- **healer 的风险**：它可以跳过测试。在 agent 驱动的流程中，"跳过测试"正是要防的行为（第五节），所以 healer 的改动必须经过人工或"改动测试路径"检查。[推断]
- Stagehand、Browser Use 适合"产品本身是浏览器 agent"，不适合做确定性的测试传感器。[推断]

**与 playbook 的关系**：补充。playbook 没有 E2E 角色。

### 2. 测试生成

**证据**

- **Meta ACH**（博客 2025-02-05；论文 arXiv 2501.12862，2025-01-22 v1）：工程师用自然语言描述要防的一类故障；LLM 生成相应的变异体（检查等价变异），再生成能杀死它们的单元测试。论文摘要：在 7 个平台的 10,795 个 Android Kotlin 类上，生成 9,095 个变异体、571 个测试，工程师接受 73%，其中 36% 被判为与隐私相关（Meta 自己的数据）。[官方/原文·摘要]
- **Qodo Cover（原 cover-agent）**：README 的 News 一节写明 2025-06-15 起"不再维护"，建议 fork；GitHub API 显示仓库没有设置 archived，最新发布 0.3.10（2025-05-21），AGPL-3.0。功能：生成测试、运行、用 Cobertura 覆盖率确认覆盖上升。[官方/原文] [实测]
- **Diffblue Cover**：文档称"强化学习 AI 平台"，只写 Java 单元测试；有 Cover CLI；只看到 IntelliJ 插件和 CLI 的免费试用。另一个产品 Diffblue Agents 的 Testing Agent 支持 Java 和 Python，代码生成交给用户自己的 coding agent。[官方/原文·摘要]
- **Keploy**：用 eBPF 在网络层录制 API 调用，回放成测试和 mock；README 列出含 Node、Python、C# 在内的大量语言；Linux 需内核 5.10+，安装页说 macOS（Apple Silicon）和 Windows x86-64 有原生安装；Apache-2.0；也能用录制和 OpenAPI 建议边界值测试。v3.6.122（2026-10-13）。[官方/原文] [实测]
- Fowler 文章：AI 生成的测试套件还不够可信。[官方/原文]

**推荐**：不单独引入测试生成工具。coding agent 本身就能写测试；问题是"写出的测试是否有用"，这要由计算型传感器回答：**生成的测试必须能失败**（先写失败测试；或用变异测试检查它杀死了哪些变异）。这就是 ACH 的核心思路，用 Stryker / mutmut 就能在本地实现简化版。Keploy 适合"已有服务、缺少回归测试"的遗留系统。[推断]

**与 playbook 的关系**：补充一条做法（生成的测试用变异测试验收），不引入工具。

### 3. 变异测试

**证据**

- **StrykerJS 10.0.0**（2026-08-14，Apache-2.0）：`--incremental` 把结果存到 `reports/stryker-incremental.json`，下次只重测变化的部分；Vitest、Jest 能精确报告测试位置；依赖、环境变量、`.snap` 的变化检测不到。`--mutate src/app.js:5-7` 限定行范围。reporter：`html`、`json`、`progress`、`clear-text`、`dots`、`dashboard`；`thresholds.break` 低于时退出码 1，默认 `null`（不失败）。`checkers: ["typescript"]` 可以在测试前剔除类型错误的变异体。[官方/原文] `@stryker-mutator/vitest-runner` 10.0.0 声明 peer `vitest >=2.0.0`，core 要求 Node ≥22。[实测]
- **Stryker.NET 5.0.0**（2026-09-11）：`--since:<commit>` 只测改动的代码；`--with-baseline:<commit>` 复用未变化变异体的结果、仍输出完整报告（基线可存 Disk、Dashboard、Azure、S3）；reporter 含 `json`、`html`、`dashboard`；`break-at` 低于时退出码 1；`test-runner` 为 `vstest`（默认）或 `mtp`（Microsoft Testing Platform，预览）；`test-case-filter` 不能用于 xUnit v3 或 TUnit 的 MTP 运行器。[官方/原文] [实测]
- **mutmut 3.8.0**（2026-09-12，BSD-3-Clause）：需要 fork，**Windows 上必须在 WSL 中运行**；`mutmut run` 跑 pytest；进度保存，可中断续跑；只重测"源代码有变化的函数"中的变异体；`mutmut run "my_module*"` 限定范围；`mutmut browse` 终端界面；`type_check_command` 用 mypy 或 pyrefly 剔除类型错误的变异体；`mutmut export-cicd-stats`（格式未写明）。[官方/原文] [实测]
- **cosmic-ray 8.7.0**（2026-08-09，MIT）：TOML 配置；`cosmic-ray init` 建 SQLite 会话 → `baseline` → `exec` → `cr-report` / `cr-html`；`test-command` 是任意 shell 命令；支持分布式执行；`cr-filter-git` 只保留相对某分支新增或修改的行上的变异；README 有"Python version (windows) 3.9+"徽章，说明支持 Windows。**代码或测试变化后要重新 `init`**（会覆盖会话文件）。[官方/原文] [实测]
- **PIT 1.30.0**（2026-08-27）：`withHistory` 增量分析；输出 HTML、XML、CSV；PR 集成等高级功能在商业插件 Arcmutate 中。**cargo-mutants 27.1.0**（2026-06-02）：`--in-diff <diff 文件>` 只测与 diff 重叠的变异体；只匹配被测代码，不匹配测试代码。[官方/原文] [实测]

**mutmut 与 cosmic-ray 的比较**

| | mutmut 3.8 | cosmic-ray 8.7 |
|---|---|---|
| 上手 | 零配置倾向，`mutmut run` | 需要 TOML 和 init/baseline/exec 三步 |
| 测试运行器 | pytest | 任意命令 |
| Windows | 只能 WSL | 原生（README 徽章） |
| 增量 | 自动：只重测源代码变了的函数 | 会话可续跑；代码变了要重新 init |
| 按 diff | 用模式限定模块/函数 | `cr-filter-git`（按行） |
| 类型过滤 | mypy / pyrefly | 未见 |
| 规模 | 单机 | 可分布式 |
| 发布 | 更频繁（2026-09） | 2026-08 |

**首选 mutmut**：对典型的 pytest 项目，它的自动增量（只重测改过的函数）最适合 agent 反复运行，类型过滤减少无效变异体，维护更活跃。**以下情况选 cosmic-ray**：必须在原生 Windows 上运行、测试不是 pytest、或需要分布式。[推断，基于上表的 [官方/原文] 事实]

**推荐**：变异测试按 Fowler 的分类属于"集成之后 / 持续"，因为慢。agent 驱动项目可以把它前移成**增量或按 diff**的形式（Stryker `--incremental` 或 `--since`、mutmut 自动增量、`cr-filter-git`、cargo-mutants `--in-diff`），在里程碑或整理时运行，**只报告、不设分数门槛**，存活的变异体逐条处理：补测试，或说明为何等价。它也是回答 Fowler"传感器从不触发，是质量高还是检测弱"这个问题的最直接手段。[推断]

**与 playbook 的关系**：补充一个角色（建议在 language-profiles 增加"Mutation testing"）。

### 4. 测试影响分析 / 测试选择

**证据**

- **Vitest**：`vitest related <文件...>` 只跑覆盖这些源文件的测试；`--changed [since]` 只跑受改动影响的测试。[官方/原文]
- **pytest-testmon 2.2.0**（2025-12-01，MIT）：用 Coverage.py 记录每个测试执行了哪些代码，`pytest --testmon` 只跑受影响的测试；数据库每次运行更新，不依赖版本控制；上次失败的测试总会重跑；不跟踪静态文件和外部服务。[官方/原文] [实测]
- **Nx affected 23.3.0**：用 git 找改动文件，经项目图映射到项目及其依赖者，`nx affected -t test`；默认按项目，`NX_LEGACY_AFFECTED=false` 按任务输入；`--explain` 说明选择原因；CI 需要完整历史。页面只展示 JS/TS。[官方/原文] [实测]
- **Datadog Test Impact Analysis**（原 Intelligent Test Runner）：按每个测试的代码覆盖率与改动文件交叉，跳过无关测试；有 .NET、Java、JS、Swift、Python、Ruby、Go 的设置指南；商业。[官方/原文]
- **Launchable / CloudBees Smart Tests**：用机器学习，根据历史测试结果和改动预测要跑哪些测试；文档站登录链接已指向 CloudBees Smart Tests。CLI：PyPI `launchable` 1.125.1 和 `smart-tests-cli` 2.16.1（GitHub `launchableinc/cli` v2.16.1，2026-10-09，Apache-2.0）。[官方/原文·摘要] [实测]
- **Develocity Predictive Test Selection**：根据 Build Scan 数据预测；只支持 Gradle 5.4+、Maven Surefire/Failsafe 2.22.2+，JUnit Platform；是需要开通的扩展。[官方/原文]

**推荐**：agent 的工作过程中，首选**测试运行器自带的选择**（Vitest `related`/`--changed`、pytest-testmon），免费、本地、确定；把它放进 agent 的 PostToolUse 或 Stop hook，让每次改动只跑相关测试，完整测试留给提交前或推送前。monorepo 用 Nx affected 做项目级选择。.NET 没有找到等价的免费本地工具（Datadog 有，但是商业的）。ML 预测类（Launchable、Develocity）适合测试套件很大、CI 很贵的组织。[推断]

**与 playbook 的关系**：补充。playbook 的"一条命令检查全部"仍是集成前的完整检查，测试选择只用于加快工作过程中的反馈。

### 5. 不稳定测试（flaky）管理

**证据**

- **Trunk Flaky Tests**：检测 flaky 和"broken"（持续高比例失败）的测试；与语言、框架无关；可自动或手动隔离；隔离靠 `trunk-analytics-cli`：`test --junit-paths=... -- <命令>` 包裹测试命令，或测试后 `upload`，当一个任务中**所有**失败都已隔离时覆盖退出码让任务通过；只识别 JUnit 中的测试，未写入 JUnit 的构建错误可能被误放行。analytics-cli 0.16.0（2026-09-29，MIT）。[官方/原文] [实测]
- **BuildPulse**：自动检测并隔离最严重的 flaky 测试；示例有 RSpec、Jest、pytest；Analytics $99/月（年付）起。[官方/原文·摘要]
- **Datadog TIA 页面**：只说减少每次运行的测试能降低 flaky 的干扰，没有写隔离功能。[官方/原文]
- **Vitest**：`--sequence.shuffle.files`、`--sequence.shuffle.tests` 随机顺序，`--sequence.seed` 固定种子，`--repeats <n>` 重复每个测试，`--retry.count` 失败重试。pytest-rerunfailures 16.7 提供失败重跑。[官方/原文] [实测]

**推荐**：对 agent 来说，flaky 测试的危害是双向的：agent 会误以为自己的改动破坏了什么而去"修"，或者学会"重跑直到通过"。所以优先**从源头消除**：时钟、随机数、网络通过参数注入；定期用随机顺序加固定种子运行，发现顺序依赖。**重试只用于诊断，不作为门禁的一部分**。只有在多人、CI 规模大时才引入 Trunk 这类平台。[推断]

**与 playbook 的关系**：补充（随机顺序检查和"重试不进门禁"的规则）。

### 6. 密闭的集成测试

**证据**

- **Testcontainers**：在测试中启动一次性容器（数据库、消息队列、浏览器等）；支持 Java、Go、.NET、Node.js、Python、Rust 等；50+ 模块；"只需要 Docker"。testcontainers-node 12.2.1（2026-10-13）、testcontainers-python 4.15.0（2026-07-24）、testcontainers-dotnet 4.16.0（2026-10-09）。[官方/原文] [实测]
- **MSW 3.0.3**（2026-10-10，MIT）：浏览器中用 Service Worker、Node 中用类扩展在网络层拦截请求，作为整个技术栈共用的 mock 层。[官方/原文] [实测]
- **WireMock**：开源 API mock；Java 库、独立 JAR、Docker、npm 包；.NET 有 WireMock.Net；WireMock Cloud 是商业服务；文档有 v4 Beta 链接。GitHub 最新正式发布 3.13.2（2025-11-14）；WireMock.Net 2.19.0（2026-10-07）；PyPI `wiremock`（Python 客户端）2.7.0（2025-07-28）。[官方/原文] [实测]

**推荐**：外部依赖是数据库、队列时用 Testcontainers（三语言都有官方库）；外部依赖是 HTTP 服务时，Node/TS 用 MSW（进程内，不需要 Docker），C# 用 WireMock.Net（进程内），Python 可以用 WireMock 的 Docker 镜像加客户端，或 Testcontainers 模块。凡是能定义成端口的依赖，**优先自己写 fake 并让它通过端口的一致性测试**（playbook 已有的 conformance suite 做法），比通用 mock 更贴近契约。[推断]

**与 playbook 的关系**：补充；与 playbook 的"每个端口一套一致性测试"互补，不冲突。

### 7. 契约测试与基于 schema 的 API 测试

**证据**

- **Pact**：消费者驱动的契约测试，"契约即示例"，契约由消费者的自动化测试生成，提供者执行验证。适合双方都在自己控制下、都在开发中、消费者数量少的服务；**不适合公开 API**（消费者无法识别）、对方不愿使用、提供者需求不由消费者驱动的情况。pact-js 17.1.4（2026-09-07）、pact-python 3.4.1（2026-09-17）、PactNet 5.0.1（2025-03-22，一年半没有新版）。[官方/原文] [实测]
- **Schemathesis 4.31.0**（2026-10-12，MIT）：从 OpenAPI（2.0–3.2）或 GraphQL schema 自动生成基于性质的测试，能串联多步工作流，每个发现给出最小 `curl` 复现；输出 JUnit XML、Allure、HAR；有 CLI 和 pytest 集成。[官方/原文] [实测]
- **Specmatic 2.55.3**（2026-10-05，MIT）：把 OpenAPI、AsyncAPI、GraphQL、gRPC、WSDL 等规范变成可执行契约；README 明确以"验证 AI coding agent 的每次改动"为卖点；JVM 实现，有 npm/PyPI 包装和 Docker 镜像；仓库里有 `specmatic-mcp` 目录（用途未读）。[官方/原文·摘要] [实测]

**推荐**：服务对外有 OpenAPI 时，首选 **Schemathesis**：不需要写测试、语言无关（它从外部打 HTTP）、输出 JUnit、给出可复现的 `curl`，很适合 agent 读。两个都由团队控制的服务之间用 **Pact**。只有一个进程、没有网络接缝的项目，"契约测试"就是 schema 测试加端口一致性测试，不需要这些工具。[推断]

**与 playbook 的关系**：补充；playbook 的"schema 关卡"（框架第三阶段的三层关卡）在跨服务时就由这些工具实现。

### 8. 视觉回归

**证据**

- **Playwright `toHaveScreenshot`**：第一次运行生成基线，提交进仓库；文件名带浏览器和平台；`--update-snapshots` 更新；`threshold`、`maxDiffPixels` 控制容差；渲染因系统、浏览器版本、硬件而异，应在生成基线的环境中运行。[官方/原文]
- **Vitest 浏览器模式 `toMatchScreenshot`**：基线放在测试旁的 `__screenshots__`；建议在共享环境（CI、Docker、云）生成基线，**不要在本地 `--update`**，用手动触发的 workflow 更新。[官方/原文]
- **Chromatic**：免费层 $0/月 5,000 次快照；Storybook、Playwright、Cypress 集成；TurboSnap 只快照受影响的部分。CLI chromatic 18.12.1。[官方/原文·摘要] [实测]
- **Percy**（BrowserStack）：真机和浏览器；"AI review agent"用自然语言总结视觉变化。@percy/cli 1.32.11。**Applitools Eyes**：Visual AI，页面称"99.999% 精度"（厂商说法）；有 Playwright SDK；页面列出 MCP server（厂商说法）。@applitools/eyes-playwright 1.50.1。[官方/原文·摘要] [实测]

**推荐**：agent 自己闭环用 **Playwright 截图对比**（本地、确定、无费用）。风险是 agent 发现截图不一致时直接 `--update-snapshots`，所以**基线更新必须由人或专门的流程触发**（Vitest 文档的建议正好是这一点）。SaaS（Chromatic、Percy、Applitools）的价值在于人审查界面，适合有设计评审的团队。[推断]

**与 playbook 的关系**：补充。

### 9. AI 代码审查（推理型传感器）

**证据**

- **Claude Code `/code-review`**（本地）：在后台子 agent 中审查当前分支的提交加未提交改动，或指定 PR、分支、ref 范围；报告正确性问题；`--fix` 应用、`--comment` 发到 PR；`low` effort 报最有把握的发现，误报更少。**Code Review**（托管）：研究预览，Team 和 Enterprise；多 agent 并行，加一个对照实际代码过滤误报的验证步骤；严重度分 Important / Nit / Pre-existing；check run **总是中性结论，不阻止合并**，最后一行是可解析的 JSON 计数，可自己在 CI 中做门禁；`REVIEW.md` 调整严重度、限制 nit 数量、跳过路径；平均每次 $15–25（按 token）。[官方/原文]
- **GitHub Copilot code review**：任意语言；默认**不计入必需的批准**（Copilot 批准是公开预览，可选开启）；读取 `.github/copilot-instructions.md`、`.github/instructions/**/*.instructions.md`、根目录 `AGENTS.md`、`.github/skills/`；可用 ruleset 自动触发；Copilot Free 不包含。[官方/原文]
- **Cursor Bugbot**：PR 更新时自动审查；GitHub、GitLab、Bitbucket、Azure DevOps；`.cursor/BUGBOT.md` 规则；按用量计费；Autofix 会启动云 agent 修复。[官方/原文]
- **CodeRabbit**：PR 审查；CLI `cr` 审查本地改动，`--agent` 输出 NDJSON 给 agent 解析；一次审查 7 到 30+ 分钟，建议后台运行、最多循环两次；免费层"有限的每日用量"；支持 Windows。[官方/原文]
- **证据强度**：本次没有找到这些工具的独立、可比的效果评测；所有效果数据都来自厂商（包括 Anthropic 自己）。Fowler 文章：LLM 审查能部分发现语义问题，但昂贵且概率性。Copilot 文档自己写明会遗漏和犯错，需要人复核。[官方/原文] + [推断]

**推荐**：最小做法是**本地、新上下文、对照验收标准**的审查子 agent，在 agent 宣布完成之前运行，只处理影响正确性和需求的发现（Claude Code 最佳实践）。托管 PR 审查作为额外一层，**保持"只评论、不阻止"**，记录有用/误报比例，用数据决定是否保留。不要让审查者和实现者是同一个上下文。[官方/原文] + [推断]

**与 playbook 的关系**：补充。playbook 核心思想 14"审查转移而不消失"讲的是人审查的位置，这里补上推理型传感器的位置。

### 10. 评测 LLM 功能的框架

**证据**

- **promptfoo**：开源 CLI 和库，评测与红队测试；README 写明"Promptfoo 现在是 OpenAI 的一部分，仍然开源、MIT 许可"；`promptfoo eval`，自动加载 `promptfooconfig.yaml`；`-o` 支持 csv、json、jsonl、yaml、html、xml、`junit.xml`；测试失败或通过率低于 `PROMPTFOO_PASS_RATE_THRESHOLD`（默认 100）时退出码 100；确定性断言（`equals`、`contains`、`is-json`、`javascript`、`python`、`trajectory:tool-sequence` 等）和模型评分断言（`llm-rubric`、`g-eval`、`factuality` 等）可以混用；`--no-cache`。npm 0.124.1（2026-10-08）。收购的一手公告（openai.com）返回 403 没读到，新闻稿称 2026-03-09 宣布。[官方/原文] [实测] [二手]
- **Inspect AI**（UK AI Security Institute 与 Meridian Labs）：task = 数据集 + solver + scorer；200+ 预置评测；内置 bash、python 工具和 MCP 工具；`react()` agent；Docker、Kubernetes、Modal 沙箱；`inspect eval`、`inspect view`。0.3.280（2026-10-14，MIT）。[官方/原文] [实测]
- **DeepEval**："类似 pytest，专门测 LLM 应用"；`deepeval test run`；G-Eval、RAG、agent、多轮、安全指标；Python 3.9+，仓库也有 TS 目录；Apache-2.0；Confident AI 云平台可选。PyPI 4.2.8（2026-10-02）；npm 上的 `deepeval` 0.9.22 是否官方未核实。[官方/原文] [实测]
- **Braintrust**：agent 可观测性平台，`bt` CLI 能运行评测；平台的商业条款页面没有写。npm braintrust 3.37.2、PyPI 0.45.0；评分库 autoevals（npm 0.4.0）MIT。[官方/原文·摘要] [实测]

**推荐**：Node/TS 项目首选 **promptfoo**（YAML 配置、JUnit 输出、明确的失败退出码，最容易接进"一条命令检查"）；Python 项目、尤其要评测 agent 行为并需要沙箱时首选 **Inspect AI**；习惯 pytest 的 Python 团队可用 DeepEval。原则：**能用确定性断言的不用模型评分**；模型评分的结果要固定评分模型和版本、开缓存，并且作为集成之后或持续的传感器，不作为每次提交的门禁。[推断]

**与 playbook 的关系**：补充（只在产品含 LLM 功能时需要）。

### 11. agent 工具自身的 QA 配置

**证据**

- **Claude Code hooks**：事件包括 `PreToolUse`、`PostToolUse`、`PostToolUseFailure`、`Stop`、`SubagentStop`、`TaskCompleted`、`FileChanged` 等。`PreToolUse` 用 `hookSpecificOutput.permissionDecision: "deny"` 或退出码 2 阻止调用。`PostToolUse` 用 `decision: "block"` 加 `reason`，或 `additionalContext` 把反馈给 Claude（退出码 2 不阻止，因为工具已运行）；输入里的 `tool_input.file_path` 是绝对路径。`Stop` 用 `decision: "block"` 加 `reason` 阻止结束；输入有 `stop_hook_active`，用来避免死循环；连续阻止 8 次后强制结束（`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` 可调）。matcher `Edit|Write` 是精确匹配。hook 类型：`command`、`http`、`mcp_tool`、`prompt`、`agent`（实验性）。[官方/原文]
- **`/goal`**：每轮结束后，由配置的小模型根据对话判断条件是否满足；它是会话级的"基于提示词的 Stop hook"；**评估器不运行命令、不读文件**，只看 Claude 已经输出到对话里的内容，所以条件要写成"`npm test` 退出码为 0"这类 agent 输出能证明的形式，并写上"不能修改其他测试文件"之类的约束；无进展时会停下。[官方/原文]
- **权限规则**：`Edit(path)` 和 `Read(path)` 用 gitignore 语法；**deny 规则作用于内置文件工具、Claude Code 识别的 Bash 文件命令（`cat`、`sed`、`tee` 等）和重定向目标，但不作用于自己打开文件的 Python/Node 脚本等子进程**；要对所有进程生效需要沙箱。为 `Write` 写路径规则不会被检查，要写 `Edit(...)`。[官方/原文]
- **沙箱**：`sandbox.filesystem.denyWrite` / `allowWrite` 在操作系统层面限制 Bash 及其子进程；**只支持 macOS、Linux、WSL2；原生 Windows 上命令不经沙箱运行**；文件工具、MCP、hook 在沙箱之外。[官方/原文]
- **Codex**：支持 hooks，事件有 `PreToolUse`、`PermissionRequest`、`PostToolUse`、`Stop`、`SubagentStop` 等；配置在 `.codex/hooks.json` 或 `config.toml` 的 `[hooks]`；项目内的 hook 只在 `.codex/` 层被信任后加载；`Stop` 返回 `decision: "block"` 会用 `reason` 作为续写提示让 Codex 继续；默认开启。[官方/原文]
- **GitHub rulesets**：可要求 Code Owners 审查、要求状态检查通过；push ruleset 的"Restrict file paths"阻止包含指定路径改动的提交被推送，但 push ruleset 用于私有和内部仓库；rulesets 页面写的是面向 Team 和 Enterprise 客户（公开仓库在免费计划下的可用性该页没写）。[官方/原文·摘要]
- **Biome**：`noFocusedTests`（suspicious 组，推荐，默认警告）、`noSkippedTests`（不在推荐集，需手动开启）。[官方/原文]
- **Vitest agent reporter**：`agent` 是 `minimal` 的别名，只输出失败的测试和错误信息；**Vitest 检测到在 AI coding agent 中运行时自动启用**；但如果项目自己设置了 `reporters`，默认值被替换，agent reporter 不会再被加入。[官方/原文]

**推荐**：见第五节（防止 agent 改测试）和第四节（参考配置）。

---

## 四、QA harness 参考配置

按四个时间点。每格写"做什么检查：用什么工具"。

### 工作过程中（agent 每次编辑、每轮结束）

| 检查 | Node / TS | Python | C# |
|---|---|---|---|
| 编辑后立即 lint/格式（PostToolUse，`Edit\|Write`） | `biome check <文件>` | `ruff check <文件>` + `ruff format --check` | `dotnet format --include <文件> --verify-no-changes`（较慢，可只在 Stop 跑） |
| 只跑相关测试 | `vitest related <文件> --run` | `pytest --testmon` | 无免费的按文件选择；跑受影响的测试项目 [推断] |
| 回合结束门禁（Stop hook，检查 `stop_hook_active`） | 类型检查 + lint + `vitest --changed` | 类型检查 + ruff + `pytest --testmon` | `dotnet build` + 受影响项目的 `dotnet test` |
| 测试输出给 agent 读 | Vitest `agent` reporter（自动） | `pytest -q` / `--tb=short` | `dotnet test --logger "console;verbosity=minimal"` [推断] |
| 像用户一样验证（Web） | `@playwright/cli` 或 `agent-browser` | 同左（CLI 与语言无关） | 同左 |
| 禁止改测试/门禁配置 | 权限 `deny: ["Edit(<受保护路径>)"]` + PreToolUse hook | 同左 | 同左 |

### 集成之前（提交、推送、PR）

| 检查 | Node / TS | Python | C# |
|---|---|---|---|
| 一条命令完整检查（pre-push） | `pnpm check`（tsc、Biome、dependency-cruiser、knip、Vitest） | `uv run nox -s check` | `dotnet build && dotnet test && dotnet format --verify-no-changes` |
| 禁止 `.only` / `.skip` | Biome `noFocusedTests`、`noSkippedTests` 设为 error | Ruff 无对应规则；用 `git grep` 检查 `pytest.mark.skip` 新增 [推断] | 检查新增的 `Skip =` [推断] |
| 测试改动报告 | `git diff --name-status <基线>..HEAD -- '*.test.*'` | 同左（`test_*.py`） | 同左（`*Tests/**`） |
| 独立审查（推理型） | 新上下文子 agent，对照验收标准 | 同左 | 同左 |
| HTTP 依赖的密闭测试 | MSW | WireMock（Docker）/ Testcontainers | WireMock.Net |
| 数据库等依赖 | testcontainers 12.2.1 | testcontainers 4.15.0 | Testcontainers 4.16.0 |
| API 契约 | Schemathesis（外部运行）/ Pact JS | Schemathesis / pact-python | Schemathesis / PactNet |
| 服务端强制（PR） | required status checks；Code Owners 审查受保护的测试路径 | 同左 | 同左 |

### 集成之后（主干流水线、里程碑）

| 检查 | Node / TS | Python | C# |
|---|---|---|---|
| 变异测试（增量 / 按 diff，只报告） | StrykerJS 10 + vitest-runner，`--incremental` | mutmut 3.8（原生 Windows 用 cosmic-ray 8.7 + `cr-filter-git`） | Stryker.NET 5，`--with-baseline` |
| E2E 回归 | Playwright Test 1.64 | pytest-playwright 0.10 | Microsoft.Playwright 1.63 |
| 视觉回归 | `toHaveScreenshot`（基线由人更新） | 同左（Playwright Python 无内置截图对比，用 JS 版或 SaaS） [尚未核实] | 同左 [尚未核实] |
| LLM 功能评测 | promptfoo | Inspect AI / DeepEval | promptfoo（外部运行）[推断] |
| 托管 AI PR 审查（只评论） | Claude Code Code Review / Copilot / CodeRabbit / Bugbot | 同左 | 同左 |
| 大套件测试选择 | Nx affected | pytest-testmon | Datadog TIA（商业） |

### 持续（漂移、运行时）

| 检查 | Node / TS | Python | C# |
|---|---|---|---|
| 顺序依赖 / flaky 探测（定期） | `vitest run --sequence.shuffle.files --sequence.shuffle.tests --sequence.seed=<n>` | pytest-randomly [尚未核实] | xUnit 默认按集合并行 [尚未核实] |
| flaky 隔离（规模大时） | Trunk analytics-cli（JUnit） | 同左 | 同左 |
| 死代码、依赖漂移 | knip | vulture + deptry | IDE0051 等 |
| 变异分数趋势 | Stryker dashboard / JSON | mutmut | Stryker.NET dashboard |
| 运行时 LLM 质量抽样 | promptfoo / Braintrust | Inspect / DeepEval | — |

---

## 五、防止 agent 改测试的可用配置

按"从软到硬"排列。越往下越不依赖 agent 自觉。

1. **提示词和数据格式**（引导）：Anthropic 的做法是功能清单用 JSON，agent 只能改 `passes`，提示词写明不能删改测试。[官方/原文] 这只是建议，不是约束。
2. **`/goal` 条件里写约束**：例如"`npm test` 退出码为 0，并且没有修改 `test/` 下已有的文件"；评估器只看对话，所以要让 agent 输出 `git diff --stat` 作为证据。[官方/原文]
3. **lint 规则**：Biome `noFocusedTests`、`noSkippedTests` 设为 error，让 `.only`、`.skip` 无法通过 `check`。[官方/原文]
4. **Claude Code 权限 deny 规则**（`.claude/settings.json`，提交进仓库）：

   ```json
   {
     "permissions": {
       "deny": ["Edit(/tests/acceptance/**)", "Edit(/.githooks/**)", "Edit(/biome.json)"]
     }
   }
   ```

   覆盖内置文件工具、`sed`/`tee` 等被识别的 Bash 命令和重定向；**不覆盖** agent 写一个 Node/Python 脚本去改文件。[官方/原文] 路径是示例。
5. **PreToolUse hook**：matcher `Edit|Write`，脚本读 `tool_input.file_path`，命中受保护路径就输出 `permissionDecision: "deny"` 和原因（或退出码 2）。比 deny 规则更灵活（例如只允许新增测试文件、禁止修改已有测试文件）。[官方/原文] Codex 有同名事件，可用同样的脚本。[官方/原文]
6. **沙箱 `sandbox.filesystem.denyWrite`**：操作系统层面阻止 Bash 子进程写入，补上第 4 条的缺口；**原生 Windows 不可用**（需 WSL2）。[官方/原文]
7. **git 层面的检查（与 agent 工具无关）**：在 pre-push hook 或验收命令中运行 `git diff --name-status --diff-filter=MD <基线>..HEAD -- <测试路径>`，有输出就要求逐条说明；本地 hook 可以被 `--no-verify` 跳过（playbook 已禁止 agent 这样做）。[推断]
8. **服务端**（多人、PR 流程）：受保护测试路径写进 `CODEOWNERS`，ruleset 要求 Code Owners 审查；一个 required status check 在受保护路径有改动时失败，除非 PR 带特定标签（由人加）[推断]；私有仓库可用 push ruleset 的"Restrict file paths"直接阻止推送。[官方/原文·摘要]
9. **用传感器验证测试本身**：变异测试检查"测试是否会失败"；负面测试（故意写错的实现必须让一致性测试失败）；关卡测试的对照组。agent 削弱了测试，变异分数会下降。[推断]

注意 Playwright healer 可以跳过测试（第三节第 1 类），用它时第 4–8 条更重要。[官方/原文] + [推断]

---

## 六、结论 A：本项目怎样适当补足 harness 的 QA 部分

**约束**：轻量、免费、本地；Node 26 + TypeScript 7 + pnpm 12 + Vitest 5 + fast-check + Biome + dependency-cruiser + knip；V0 没有 Web 界面、没有真实模型；一个人加一个实现 agent，顺序工作；验证阶段不走 PR 和 CI（ADR 0012、0020）。读过：factory/records/plans/v0-integration.md、factory/design/tech-stack.md、factory/design/code-style.md 第九节、ADR 0012/0020/0026，以及 issue #38–#71（只读）。

**现状已经做得好的**（不需要补）：契约的 schema 测试和"导出的 JSON Schema 校验 `examples/`"（#45、#52）；端口一致性测试加负面测试（#53 验收第 2 条）；不泄漏关卡的对照组（#66 验收第 2 条）；性质测试（#55）；确定性要求（code-style 第九节第 5 条）；pre-push 跑 `pnpm check`（#44）；整理 story 检查 `refactor:` 类型和 dependency-cruiser 例外（#70、#71）。这些已经覆盖了"schema / 一致性 / 集成"三层关卡和"测试能失败"的一部分。

下面的建议都是**补充**，每条给出工具、理由、建议放进的 issue 和可直接复制的验收条件。版本为 2026-10-14 实测。

### A1. 禁止 `.only` / `.skip` 进入代码（计算型，集成之前）

- **工具**：Biome 2.5.15 自带的 `noFocusedTests`、`noSkippedTests`，设为 `error`。
- **理由**：agent 让检查通过最省事的办法之一是跳过失败的测试；Biome 已在栈内，零成本。`noSkippedTests` 不在推荐集，必须显式开启。
- **放进**：#43（V0-01，`biome.json` 在它的范围内）。
- **建议的验收条件**：
  - [ ] `biome.json` 中 `suspicious.noFocusedTests` 和 `suspicious.noSkippedTests` 的级别为 `error`；在任一 `*.test.ts` 中临时加入 `it.only` 或 `it.skip` 后，`pnpm check` 失败并指出规则名；验证后撤销这处修改。

### A2. 让 agent 读到精简的测试输出（计算型传感器的"可读性"，工作过程中）

- **工具**：Vitest 5.0.4 的 `agent` reporter（只输出失败的测试和错误）。
- **理由**：Vitest 在检测到 AI coding agent 时自动启用它，但**项目一旦自己写了 `reporters`，自动启用就失效**。#43 要写 `vitest.config.ts`，正是会踩到的地方。
- **放进**：#43。
- **建议的验收条件**：
  - [ ] `vitest.config.ts` 不覆盖 `reporters`，或覆盖时包含 `agent`；有一个故意失败的测试时，`pnpm vitest run --reporter=agent` 只输出该失败测试及其错误；验证后撤销。

### A3. agent 侧的确定性 hook（计算型，工作过程中）

- **工具**：Claude Code 2.1.299 的 hooks（项目 `.claude/settings.json`，提交进仓库）：`PostToolUse`（matcher `Edit|Write`）对改动的 `.ts` 文件运行 `biome check`；`Stop` 运行快速检查（`pnpm typecheck && pnpm lint && pnpm vitest related --run <改动文件>`），失败时返回 `decision: "block"` 和原因，`stop_hook_active` 为真时不再阻止。前提：实现 agent 是 Claude Code（见"需要用户决定"）。
- **理由**：git hook 只在提交和推送时运行，而 agent 在一个 story 里会编辑很多次；hook 让反馈在编辑后立刻出现，并让 agent 在检查不通过时不能宣布完成（Claude Code 最佳实践的"确定性门禁"）。完整的 `pnpm check` 仍留在 pre-push。原生 Windows 上沙箱不可用，所以只用 hook 和权限规则。
- **放进**：#44（V0-03，epic「地基」的主题就是"提交和推送都受 hooks 保护"）。
- **建议的验收条件**：
  - [ ] `.claude/settings.json` 中有 `PostToolUse` hook（matcher `Edit|Write`），对改动的 `.ts` 文件运行 `biome check`；agent 写入一个 lint 错误后，同一轮内收到包含规则名的反馈。
  - [ ] `.claude/settings.json` 中有 `Stop` hook，运行类型检查、lint 和与改动相关的测试；有类型错误时阻止回合结束并给出原因；`stop_hook_active` 为真时不再阻止（不会死循环）。
  - [ ] 以上 hook 在 Windows 上实测通过；hook 脚本是 `.ts`，由 Node 26 直接运行，不装包。

### A4. 防止实现 agent 修改检查配置（引导 + 计算型，工作过程中）

- **工具**：Claude Code 权限 `deny` 规则：`Edit(/.githooks/**)`、`Edit(/.claude/**)`、`Edit(/.dependency-cruiser.cjs)`、`Edit(/biome.json)`、`Edit(/knip.json)`。
- **理由**：#70、#71 已经事后检查 dependency-cruiser 例外；deny 规则把这件事前移到"做不到"。规则只拦内置文件工具和常见 Bash 文件命令，不拦脚本，所以事后检查仍要保留。修改这些配置时由用户临时放开。
- **放进**：#44（与 A3 同一个文件）。
- **建议的验收条件**：
  - [ ] `.claude/settings.json` 的 `permissions.deny` 包含 `.githooks/`、`.claude/`、`.dependency-cruiser.cjs`、`biome.json`、`knip.json` 的 `Edit(...)` 规则；在 agent 会话中尝试编辑其中任一文件被拒绝。

### A5. 整理时检查"测试没有被删除或放宽"（计算型，集成之前）

- **工具**：git（`git diff --name-status --diff-filter=D`）和 `git grep`。
- **理由**：整理只做重构，按定义不应该删测试或改断言。这是"防止 agent 改测试"在本项目流程中最便宜的落点，不需要任何新工具。
- **放进**：#70 和 #71（两个整理 story 各加一条）。
- **建议的验收条件**：
  - [ ] `git diff --name-status --diff-filter=D <基线>..HEAD -- '*.test.ts'` 没有输出（整理没有删除测试文件）；`git diff <基线>..HEAD -- '*.test.ts'` 中每处修改的断言都在本 issue 中说明原因，没有修改时写"无"。

### A6. 随机顺序运行测试，发现顺序依赖（计算型，持续）

- **工具**：Vitest 5 的 `--sequence.shuffle.files`、`--sequence.shuffle.tests`、`--sequence.seed`。
- **理由**：code-style 第九节第 5 条要求测试确定，"不泄漏"关卡也依赖没有隐藏的共享状态；随机顺序是检验这一点的免费手段。只在整理时运行，不放进 `pnpm check`，避免日常的不确定性。
- **放进**：#70 和 #71。
- **建议的验收条件**：
  - [ ] `pnpm vitest run --sequence.shuffle.files --sequence.shuffle.tests --sequence.seed=<n>` 用 3 个不同的种子各运行一次，全部通过；种子值写进本 issue。

### A7. 对产品核心包做一次增量变异测试（计算型，集成之后）

- **工具**：StrykerJS 10.0.0 + @stryker-mutator/vitest-runner 10.0.0（声明 peer `vitest >=2.0.0`），`incremental: true`，reporter `clear-text` 和 `json`，**不设 `break` 阈值**，不用 TypeScript checker（TS 7 没有编程接口，checker 大概率不能工作 [推断]）。
- **理由**：Fowler 的开放问题"传感器从不触发是质量高还是检测弱"，在本项目最直接的回答就是变异测试；它也检验 #53 的一致性测试和 #55 的性质测试是否真的能抓住错误。只报告、不设门槛，与 code-style 第九节第 3 条"不设覆盖率指标"的精神一致。放在契约 epic 的整理里，因为那时 `runtime` 的核心组件已经完整；按 tech-stack 选型原则 2（到需要的里程碑才引入），到那时再装。Stryker 能否在 Node 26 直接运行 `.ts`、Vitest 5、pnpm 12 的组合下工作没有实测，所以第一步是兼容性检查，不行就记录并跳过。
- **放进**：#71（V0-30）。
- **建议的验收条件**：
  - [ ] 在 `packages/contracts` 和 `packages/runtime` 上运行 StrykerJS（`incremental: true`，不设 `break`）；不能运行时，在本 issue 中贴出错误并注明"跳过"。
  - [ ] 能运行时：变异分数和存活变异体清单贴进本 issue；`runtime` 中 Event Log、Action Executor、Projector 的每个存活变异体，要么补一个测试杀死它，要么在"待整理"评论中说明它是等价变异或不重要的理由。
  - [ ] Stryker 的配置和增量文件路径登记进 factory/design/tech-stack.md（开发工具，分类与引入里程碑）；`reports/` 被 `.gitignore` 忽略。

### A8. 完成前的独立审查（推理型，集成之前）

- **工具**：新上下文的审查子 agent，例如 Claude Code 的 `/code-review`（本地，不需要 GitHub App），或用户已有的"对照标准和需求两条轴审查"的审查 skill。
- **理由**：本项目不走 PR，所以没有托管 PR 审查可用；而 Claude Code 最佳实践明确建议在 agent 宣布完成前，让一个看不到实现过程的子 agent 对照验收标准审查 diff，并且只处理影响正确性和需求的发现。写进 `AGENTS.md`（#69 的范围）就能覆盖之后所有 story，不必逐个改 issue。成本是 token。
- **放进**：#69（V0-28，根目录 `AGENTS.md`）。
- **建议的验收条件**：
  - [ ] `AGENTS.md` 的"工作方式"中有一条：完成 story 之前，用新上下文的审查子 agent 对照 issue 的验收标准审查本 story 的 diff，只修正影响正确性和验收标准的发现，并把审查结论（发现数量和处理结果）贴进 issue；`AGENTS.md` 仍不超过 60 行。

### A9. 关卡测试完成后加保护（引导 + 计算型，持续）

- **工具**：Claude Code 权限 `deny` 规则，针对三条通过标准的关卡测试文件；加 git 检查。
- **理由**：V0 的完成定义就是三条关卡测试通过；进入 V1 后，关卡测试是"可复现、不泄漏、可替换"的长期回归保护，最不应该被实现 agent 顺手修改。V0 期间 #65–#67 还要写它们，所以在 #68（合并收尾）时加保护最合适。
- **放进**：#68（V0-27）。
- **建议的验收条件**：
  - [ ] `.claude/settings.json` 的 `permissions.deny` 包含三条关卡测试所在路径的 `Edit(...)` 规则；路径写进 `AGENTS.md`，注明"修改关卡测试需要用户同意"。

### 以后再做

| 内容 | 工具 | 什么时候 | 理由 |
|---|---|---|---|
| LLM 功能评测 | promptfoo 0.124.1（Node 栈首选，JUnit 输出、退出码 100）；需要评测 agent 轨迹和沙箱时 Inspect AI | **V1 基线**（开始接真实模型时） | V0 没有真实模型；V1 的录制与回放（ADR 0024）可以让评测在回放模式下变得确定 [推断] |
| 产品界面的行为测试 | ink-testing-library 4.0.0（注意 2024-05 之后没有新版） | **P1**（TUI 引入时） | tech-stack 已把 Ink 放在 P1 |
| 浏览器 E2E 和 agent 交互式验证 | Playwright Test + @playwright/cli 或 agent-browser | 产品**有 Web 界面时**（目前没有计划） | V0 无 Web 界面 |
| 视觉回归 | Playwright `toHaveScreenshot` | 同上 | 同上 |
| 托管 AI PR 审查、required status checks、Code Owners、merge queue | Claude Code Code Review / Copilot / CodeRabbit；GitHub rulesets | **决策关卡之后**（开始走 PR 和 CI，ADR 0012、0020） | 现在没有 PR |
| flaky 管理平台、测试选择平台 | Trunk、Datadog、Launchable | 不预计需要 | 一个人、套件小、测试确定；随机顺序检查（A6）足够 |
| 契约测试工具 | Pact、Schemathesis | **P3 对外扩展**（若有 HTTP 接口） | 现在只有进程内端口和进程间 JSONL，一致性测试已覆盖 |
| 密闭集成测试 | Testcontainers、MSW | V1 起若 Model Backend 需要在测试中模拟 HTTP | 录制层（#62）的假 Model Backend 已在进程内替换 `fetch`，暂不需要 |
| 测试生成工具 | 无 | — | agent 自己写测试，用 A7 的变异测试验收 |

---

## 七、结论 B：通用 agent 驱动项目应该做哪些 QA

适用于多人、多个 agent 并行、语言不限的项目。每条写明 harness 位置和依据。

### 最小最佳实践（每个项目都做，成本低）

| # | 做法 | harness 位置 | 依据 |
|---|---|---|---|
| B1 | **一条命令完整检查，输出精简且机器可读**：类型、lint、架构规则、测试；测试运行器用面向 agent 的精简输出（只报失败），需要时另存 JUnit XML 或 JSON | 计算型传感器；集成之前 | Fowler（计算型传感器便宜、每次改动都能跑；为 LLM 写的消息更有用）；Vitest agent reporter [官方/原文] |
| B2 | **agent 工具里的确定性 hook**：编辑后对改动文件跑 lint；回合结束前跑快速检查（类型 + lint + 相关测试），不通过就不让结束；注意防死循环 | 计算型传感器；工作过程中 | Claude Code 最佳实践与 hooks 文档；Codex hooks [官方/原文] |
| B3 | **只跑相关测试做快速反馈，完整测试留给推送前**：用测试运行器自带的选择（按文件或按覆盖率） | 计算型传感器；工作过程中 | Vitest `related`/`--changed`、pytest-testmon [官方/原文] |
| B4 | **测试确定**：时钟、随机数、网络从参数注入；lint 禁止 `.only`/`.skip`；**重试不进门禁** | 引导（规则）+ 计算型传感器；集成之前 | Anthropic 博客（agent 会被错误信号误导）[推断]；Biome 规则 [官方/原文] |
| B5 | **行为验证"像用户一样"**：每个 session 开始先跑一次端到端冒烟；有界面的产品给 agent 一个浏览器 CLI（无障碍树 + 引用）去实际操作；要求 agent 贴出证据（命令输出、截图） | 计算型传感器；工作过程中 | Anthropic 长时 agent 博客；Claude Code 最佳实践；Playwright CLI README [官方/原文] |
| B6 | **测试不归实现 agent 所有**：受保护的测试和检查配置用 agent 工具的 deny 规则或 PreToolUse hook 拦截；验收时列出被修改或删除的测试文件（`git diff --name-status`）并逐条说明 | 引导 + 计算型传感器；工作过程中 + 集成之前 | Anthropic 博客（不允许删改测试）；Claude Code 权限文档 [官方/原文]；git 检查 [推断] |
| B7 | **完成前在新上下文中独立审查**：审查者只看 diff 和验收标准，只报告影响正确性和需求的问题 | 推理型传感器；集成之前 | Claude Code 最佳实践（对抗式审查、避免过度工程）[官方/原文] |
| B8 | **服务端强制**：本地 hook 可被跳过，所以同样的检查做成 required status checks；受保护的测试路径要求 Code Owners 审查 | 计算型传感器 + 人工；集成之前 | GitHub rulesets [官方/原文·摘要]；Fowler（集成前再跑一遍快速检查）[官方/原文] |
| B9 | **生成的测试必须证明能失败**：先写失败的测试再实现；修 bug 先写复现测试 | 计算型传感器；工作过程中 | Claude Code 最佳实践示例（"写一个失败测试复现问题，再修"）[官方/原文]；Meta ACH 思路 [官方/原文·摘要] |

### Nice to have（中大型项目值得做）

| # | 做法 | harness 位置 | 依据 |
|---|---|---|---|
| N1 | **增量或按 diff 的变异测试**，只报告趋势和存活变异体，用来检验测试和其他传感器是否真的会触发 | 计算型传感器；集成之后 / 持续 | Fowler（变异测试；评估 harness 覆盖度）；Stryker、mutmut、cargo-mutants 文档 [官方/原文] |
| N2 | **测试影响分析**，缩短大套件的流水线 | 计算型或统计型；集成之后 | Nx、Datadog、Launchable、Develocity 文档 [官方/原文] |
| N3 | **flaky 检测与隔离**：基于 JUnit 结果，隔离后自动开工单；隔离不等于删除，要有处理时限 | 持续传感器；集成之后 | Trunk 文档（隔离通过覆盖退出码实现，未写入 JUnit 的失败可能被误放行）[官方/原文] |
| N4 | **密闭的集成测试**：一次性容器、网络层 mock；能定义成端口的依赖优先写 fake 并通过端口一致性测试 | 计算型传感器；集成之前 / 之后 | Testcontainers、MSW、WireMock 文档 [官方/原文] |
| N5 | **契约与 schema 测试**：有 OpenAPI 时用基于性质的 schema 测试；内部服务之间用消费者驱动的契约 | 计算型传感器；集成之前 | Schemathesis、Pact 文档（Pact 不适合公开 API）[官方/原文] |
| N6 | **视觉回归**：截图基线进仓库，**基线只能由人或专门流程更新**，agent 不能自己 `--update` | 计算型传感器；集成之前 / 之后 | Playwright、Vitest 视觉回归文档 [官方/原文] |
| N7 | **托管 AI PR 审查**，保持"只评论、不阻止"，统计有用和误报的比例再决定是否保留或升级为门禁 | 推理型传感器；集成之前 | Claude Code Code Review（中性 check run）、Copilot（默认不计入批准）文档 [官方/原文]；缺少独立评测 [推断] |
| N8 | **LLM 功能评测**（产品含 LLM 时）：确定性断言优先；模型评分固定评分模型和版本；运行时抽样评分作为持续传感器 | 计算型 + 推理型；集成之后 / 持续 | promptfoo、Inspect、DeepEval 文档；Fowler（运行时 AI judge 抽样）[官方/原文] |
| N9 | **长时 agent 的完成判定交给独立评估者**：用可证明的条件（命令和退出码）加约束（不改其他测试），而不是让实现者自己判断完成 | 推理型传感器；工作过程中 | Claude Code `/goal` 文档（评估器不运行命令，只看对话中的证据）[官方/原文] |
| N10 | **定期复查 harness 本身**：哪些传感器从不触发、哪些规则总被绕过，据此加强或删除 | 持续；引导与传感器的反馈回路 | Fowler（只有反馈或只有前馈都不行；评估 harness 覆盖度）[官方/原文] |

---

## 八、尚未核实

1. **Playwright test agents 是否支持 Python 和 .NET 测试**：文档只展示 `npx` 和 TypeScript 测试。
2. **Playwright MCP 的 `testing` cap**：README 的选项列表只写 vision、pdf、devtools，工具一节又提到 testing，两处不一致。
3. **agent-browser 的 Windows 支持程度**：README 有 Windows 相关说明，但没有完整的平台列表；README 后 18% 的内容没有读。
4. **Diffblue Cover 的定价和是否有免费版**；Keploy 的测试文件格式（页面没写，印象中是 YAML，未核实）。
5. **StrykerJS 在 Node 26 直接运行 `.ts`（strip types）、Vitest 5、pnpm 12 下能否工作**：只看了 peer 依赖声明；TypeScript checker 在 TS 7 下能否工作也未实测（本文推断不能）。
6. **StrykerJS 是否有类似 Stryker.NET `--since` 的按 git diff 运行选项**：读到的配置页只有 `--incremental` 和 `--mutate` 行范围。
7. **mutmut `export-cicd-stats` 的输出格式**。
8. **Datadog 的 flaky 测试管理与隔离功能**：读到的 TIA 页面没写。
9. **Launchable / CloudBees Smart Tests 的定价、支持的测试运行器**：帮助首页没列。
10. **promptfoo 被 OpenAI 收购的一手公告**：openai.com 返回 403；只有 promptfoo README 的一句"现在是 OpenAI 的一部分"（一手）和新闻（二手）。
11. **npm 上的 `deepeval` 包是否为 Confident AI 官方发布**。
12. **Python 的视觉回归**：Playwright Python 是否有内置截图对比断言没有查；pytest-randomly 没有查；xUnit v3 的测试顺序随机化没有查。
13. **GitHub rulesets 在公开仓库、免费计划下的可用性**：读到的页面写"面向 Team 和 Enterprise"，没写公开仓库的情况。
14. **Pact 的 `can-i-deploy` 和 Pact Broker**：首页没写，没有继续读。
15. **结论 A 的 hook 设计（A3）在 Windows 上的表现**：hook 输入的路径在 Windows 上是反斜杠（官方文档），脚本需要处理；没有实测。
16. **CodeRabbit 免费层的具体额度**、Cursor Bugbot 的价格数字：页面只给了计费方式。
17. **各托管 AI 审查工具的效果**：没有找到独立评测，所有数字都是厂商说法。

---

## 九、需要用户决定的事

只列查不到答案、属于偏好的问题：

1. **本项目的实现 agent 是否固定为 Claude Code**：A3、A4、A9 的 `.claude/settings.json` 只对 Claude Code 生效；如果也会用 Codex 等其他工具，要么为每个工具各写一份（Codex 用 `.codex/hooks.json`），要么只保留 git 层面的检查（A5）。
2. **Stop hook 跑多少**（A3）：只跑类型检查和 lint（快），还是加上相关测试（慢一些但更可靠），还是干脆跑完整的 `pnpm check`（最可靠，每轮都慢）。
3. **变异测试是否引入、什么时候引入**（A7）：本文建议在 #71 只报告不设门槛；也可以推迟到 V1，或者完全不引入。
4. **完成前的独立审查用哪个**（A8）：Claude Code 自带的 `/code-review`，还是已有的"标准 + 需求"双轴审查 skill；是否每个 story 都做（增加 token 成本），还是只在整理 story 做。
5. **是否用 `/goal` 驱动实现 agent 的 story**：可以把 issue 的验收标准写成 `/goal` 条件，让 agent 自动迭代到满足为止；这是工作方式的选择。
6. **托管 AI PR 审查**（决策关卡之后）：Claude Code Code Review 需要 Team/Enterprise 且按用量计费（平均每次 $15–25）；Copilot、CodeRabbit、Bugbot 各有计费方式。选哪个、是否要，届时决定。

---

## 十、来源

以下页面均在 2026-10-14 实际打开过。

框架：
- [Harness engineering for coding agent users（Birgitta Böckeler，martinfowler.com）](https://martinfowler.com/articles/harness-engineering.html)：引导/传感器、计算型/推理型、四个时间点
- [Effective harnesses for long-running agents（Anthropic Engineering）](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)：功能清单 JSON、不删改测试、浏览器自动化验证
- [Claude Code 最佳实践](https://code.claude.com/docs/en/best-practices)：验证方式、`/goal`、Stop hook、对抗式审查

浏览器与 E2E：
- [Playwright Test Agents](https://playwright.dev/docs/test-agents)：planner、generator、healer
- [microsoft/playwright-mcp README](https://github.com/microsoft/playwright-mcp)：无障碍快照；CLI 对 coding agent 更合适
- [microsoft/playwright-cli README](https://github.com/microsoft/playwright-cli)：命令、skills、会话
- [vercel-labs/agent-browser README](https://github.com/vercel-labs/agent-browser)：Rust CLI、引用、`--json`
- [ChromeDevTools/chrome-devtools-mcp README](https://github.com/ChromeDevTools/chrome-devtools-mcp)：调试和性能
- [browserbase/stagehand README](https://github.com/browserbase/stagehand)：act/observe/extract
- [browser-use/browser-use README](https://github.com/browser-use/browser-use)：浏览器 agent 和 CLI
- [Playwright 视觉对比](https://playwright.dev/docs/test-snapshots)：`toHaveScreenshot`
- [Vitest 视觉回归](https://vitest.dev/guide/browser/visual-regression-testing)：`toMatchScreenshot`、基线更新建议

测试生成：
- [Meta 工程博客：ACH](https://engineering.fb.com/2025/02/05/security/revolutionizing-software-testing-llm-powered-bug-catchers-meta-ach/)：变异引导的 LLM 测试生成
- [arXiv 2501.12862 摘要](https://arxiv.org/abs/2501.12862)：ACH 的数字
- [qodo-ai/qodo-cover README](https://github.com/qodo-ai/qodo-cover)：不再维护的声明
- [Diffblue 文档首页](https://docs.diffblue.com/)、[Diffblue Cover 文档](https://cover-docs.diffblue.com/)、[diffblue.com](https://www.diffblue.com/)：Cover 只 Java、强化学习
- [Keploy 文档](https://keploy.io/docs/)、[keploy/keploy README](https://github.com/keploy/keploy)、[Keploy 安装](https://keploy.io/docs/server/installation/)：eBPF 录制、平台要求

变异测试：
- [StrykerJS 增量模式](https://stryker-mutator.io/docs/stryker-js/incremental/)、[StrykerJS 配置](https://stryker-mutator.io/docs/stryker-js/configuration/)
- [Stryker.NET 配置](https://stryker-mutator.io/docs/stryker-net/configuration/)：`since`、`with-baseline`、MTP
- [boxed/mutmut README](https://github.com/boxed/mutmut)：WSL、增量、类型过滤
- [cosmic-ray 文档首页](https://cosmic-ray.readthedocs.io/en/latest/)、[cosmic-ray 入门教程](https://cosmic-ray.readthedocs.io/en/latest/tutorials/intro/index.html)、[cosmic-ray 过滤器](https://cosmic-ray.readthedocs.io/en/latest/how-tos/filters.html)；README 通过 `gh api repos/sixty-north/cosmic-ray/readme` 读取（Windows 徽章）
- [PIT Maven 快速入门](https://pitest.org/quickstart/maven/)：`withHistory`、输出格式
- [cargo-mutants：--in-diff](https://mutants.rs/in-diff.html)

测试选择与 flaky：
- [Vitest CLI](https://vitest.dev/guide/cli)：`related`、`--changed`、`--sequence.shuffle.*`、`--repeats`
- [Vitest reporters](https://vitest.dev/guide/reporters)：agent reporter 自动启用
- [pytest-testmon](https://testmon.org/)
- [Nx affected](https://nx.dev/docs/features/ci-features/affected)
- [Datadog Test Impact Analysis](https://docs.datadoghq.com/tests/test_impact_analysis/)
- [Launchable 帮助首页](https://help.launchableinc.com/)
- [Develocity Predictive Test Selection](https://docs.develocity.ai/predictive-test-selection/)
- [Trunk Flaky Tests](https://docs.trunk.io/flaky-tests)、[Trunk 隔离](https://docs.trunk.io/flaky-tests/quarantining)
- [BuildPulse](https://buildpulse.io/)

密闭测试与契约：
- [Testcontainers](https://testcontainers.com/)
- [MSW 文档](https://mswjs.io/docs/)
- [WireMock 文档](https://wiremock.org/docs/)
- [Pact 文档首页](https://docs.pact.io/)、[Pact 适合什么](https://docs.pact.io/getting_started/what_is_pact_good_for)
- [Schemathesis 文档](https://schemathesis.readthedocs.io/en/stable/)
- [specmatic/specmatic README](https://github.com/specmatic/specmatic)；[Specmatic 文档](https://docs.specmatic.io/)（页面只返回标题）

视觉回归 SaaS：
- [Chromatic 价格](https://www.chromatic.com/pricing)
- [Percy 文档](https://www.browserstack.com/docs/percy)
- [Applitools Eyes](https://applitools.com/platform/eyes/)

AI 代码审查：
- [Claude Code Code Review 与 /code-review](https://code.claude.com/docs/en/code-review)
- [GitHub Copilot code review](https://docs.github.com/en/copilot/concepts/agents/code-review)
- [Cursor Bugbot](https://cursor.com/docs/bugbot)
- [CodeRabbit 文档首页](https://docs.coderabbit.ai/)、[CodeRabbit CLI](https://docs.coderabbit.ai/cli/overview)

LLM 评测：
- [promptfoo 简介](https://www.promptfoo.dev/docs/intro/)、[promptfoo 断言](https://www.promptfoo.dev/docs/configuration/expected-outputs/)、[promptfoo 命令行](https://www.promptfoo.dev/docs/usage/command-line/)；README 通过 `gh api repos/promptfoo/promptfoo/readme` 读取（"现在是 OpenAI 的一部分，仍为 MIT"）
- 收购新闻（[二手]，用于定位日期）：[Security Boulevard](https://securityboulevard.com/2026/03/openai-acquires-security-startup-promptfoo-to-fortify-ai-agents)；OpenAI 公告页 `openai.com/index/openai-to-acquire-promptfoo/` 返回 403，未读到
- [confident-ai/deepeval README](https://github.com/confident-ai/deepeval)
- [Inspect AI](https://inspect.aisi.org.uk/)
- [Braintrust 文档](https://www.braintrust.dev/docs)

agent 工具配置：
- [Claude Code hooks 参考](https://code.claude.com/docs/en/hooks)：事件、PreToolUse/PostToolUse/Stop 决策、`stop_hook_active`、8 次上限
- [Claude Code /goal](https://code.claude.com/docs/en/goal)
- [Claude Code 权限](https://code.claude.com/docs/en/permissions)：`Edit(path)` 规则的覆盖范围
- [Claude Code 沙箱](https://code.claude.com/docs/en/sandboxing)：`denyWrite`、平台支持
- [Codex hooks](https://learn.chatgpt.com/docs/hooks)（由 developers.openai.com/codex/hooks 重定向）
- [GitHub rulesets 可用规则](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)、[关于 rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Biome noSkippedTests](https://biomejs.dev/linter/rules/no-skipped-tests/)、[Biome noFocusedTests](https://biomejs.dev/linter/rules/no-focused-tests/)

版本号（[实测]，2026-10-14）：
- npm：`npm view <包> version time.modified`，涉及 @playwright/test、@playwright/mcp、@playwright/cli、playwright-cli、chrome-devtools-mcp、agent-browser、@browserbasehq/stagehand、@stryker-mutator/core、@stryker-mutator/vitest-runner、@stryker-mutator/typescript-checker、msw、testcontainers、@pact-foundation/pact、specmatic、promptfoo、chromatic、@percy/cli、@applitools/eyes-playwright、nx、autoevals、braintrust、deepeval、@anthropic-ai/claude-code、@openai/codex、backstopjs、vitest、fast-check、@biomejs/biome、knip、dependency-cruiser、ink-testing-library
- PyPI：`https://pypi.org/pypi/<包>/json`，涉及 mutmut、cosmic-ray、playwright、pytest-playwright、testcontainers、schemathesis、pact-python、deepeval、inspect-ai、braintrust、browser-use、stagehand、pytest-testmon、pytest-rerunfailures、launchable、smart-tests-cli、specmatic、keploy、wiremock、ddtrace
- NuGet：`https://api.nuget.org/v3-flatcontainer/<id>/index.json`，涉及 dotnet-stryker、microsoft.playwright、microsoft.playwright.xunit.v3、testcontainers、wiremock.net、pactnet、datadog.trace
- GitHub：`gh api repos/<owner>/<repo>/releases/latest` 和 `gh api repos/<owner>/<repo>`，涉及 microsoft/playwright、microsoft/playwright-mcp、microsoft/playwright-cli、ChromeDevTools/chrome-devtools-mcp、vercel-labs/agent-browser、browserbase/stagehand、browser-use/browser-use、qodo-ai/qodo-cover、keploy/keploy、stryker-mutator/stryker-js、stryker-mutator/stryker-net、hcoles/pitest、boxed/mutmut、sixty-north/cosmic-ray、sourcefrog/cargo-mutants、wiremock/wiremock、wiremock/WireMock.Net、mswjs/msw、testcontainers/testcontainers-{node,python,dotnet}、pact-foundation/pact-js、specmatic/specmatic、schemathesis/schemathesis、promptfoo/promptfoo、confident-ai/deepeval、UKGovernmentBEIS/inspect_ai、openai/codex、launchableinc/cli、trunk-io/analytics-cli
- 本仓库：`gh issue list -R ClydeShen/memex` 和 `gh issue view <编号>`（#42–#45、#51–#53、#55、#62、#64–#71，只读）
