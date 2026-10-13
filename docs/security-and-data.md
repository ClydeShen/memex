# 安全与数据要求

本文件汇总 Memex 在安全和数据方面的要求。很多要求早已写在各个 ADR 里，这里把它们集中起来，并补上缺少的部分。代码层面的写法见 [code-style.md](./code-style.md)，依赖和工具见 [tech-stack.md](./tech-stack.md)。

- **状态**：已确认（2026-10-11）。
- **对照的标准**：OWASP Top 10 for LLM Applications 2026（编号 LLM01–LLM10），以及 OWASP Top 10 for Agentic Applications 2026（编号 ASI01–ASI10）。注意：2026 版 LLM 列表的编号和 2025 版不同，引用时要带上年份。
- **标记**：
  - **[已定]**：已经由某个 ADR 或约束确定，括号中注明出处。
  - **[新增]**：本文件新加的要求。
  - **[自动]** / **[审查]**：由工具检查，或者靠审查。
  - "何时"一列：从哪个里程碑开始生效。

---

## 一、数据

| # | 要求 | 来源 | 对应风险 | 何时 | 检查 |
|---|---|---|---|---|---|
| D1 | **外部内容一律当作数据，不当作指令。** Observation、World 0 读取的文档和 git 历史、Capability 的返回结果、其他 Agent 的话，只能以数据身份进入 Cognitive State，不能改变 Goal、Policy 或系统提示 | [新增] ADR 0016 | LLM01 提示注入；ASI01 目标劫持；ASI06 记忆与上下文投毒 | V0 起 | [审查]；V1 起加入注入用例测试 |
| D2 | **按来源可信度限制所占比例。** 在 Cognitive Budget 中限制每个可信等级最多占多少位置，不靠按可信度加权打分来防御。依据：交叉核对发现按来源加权与不防御没有统计差异（docs/research/cross-check-2026-10-10.md 第三部分第 3 条）。这是默认做法，效果由 Q2 实验验证（ADR 0010） | [新增] | LLM05 数据投毒；ASI06 | V2 | 实验 |
| D3 | **知识以 Claim 存储，带溯源和双时态**；其他 Agent 说的话作为 `sourceType: agent` 的 Claim，可信度低于直接观测 | [已定] ADR 0002、0006 | ASI06；ASI07 Agent 间通信不安全 | V0 起 | [自动]（schema） |
| D4 | **密钥不写入任何会落盘的数据**：Event Log、Experiment 快照、录制、运维日志、Trace 导出。密钥只用 `${env:NAME}` 引用；录制和回放层在写入前统一过滤 | [新增] ADR 0016 | LLM02 敏感信息泄露 | V0.3 起 | [自动]（过滤规则有测试） |
| D5 | **公开仓库只提交合成数据。** 测试、示例和录制只能来自 Micro World 这类合成来源；真实领域的数据属于 Instance 数据，不提交 | [新增] ADR 0016 | LLM02 | V0 起 | [审查] |
| D6 | **本机环境信息只写在 `.env`，不提交** | [已定] HANDOFF 第 4 节 | LLM02 | 已生效 | [自动]（`.gitignore`）[审查] |
| D7 | **数据归用户所有，可以导出和审计**；Event Log 是唯一的事实来源，可以完整重放 | [已定] VISION 原则 11、ADR 0005 | — | V0 起 | [自动]（重放一致性测试） |
| D8 | **个人数据的删除**与"只追加"的 Event Log 存在矛盾。待决，见 open-questions.md 第 3 条 | 待决 | LLM02 | P1 或对外分发之前决定 | — |

## 二、执行与权限

| # | 要求 | 来源 | 对应风险 | 何时 | 检查 |
|---|---|---|---|---|---|
| X1 | **所有改动都经过 Action**，记录执行者，并先经过 Policy 检查 | [已定] ADR 0014 | LLM03 过度授权；ASI02 工具滥用；ASI03 身份与权限滥用 | V0 起 | [自动]（测试 + dependency-cruiser 禁止绕过 Action Executor 直接写入） |
| X2 | **Agent 只能提议，用户批准。** 修改本体、配置、代码，以及部署，都需要用户批准。这是 Action Executor 中的核心不变量，不随 Policy 档位变化；执行者由核心记录，模型无法自称是用户 | [已定] ADR 0011、0022、S3 | ASI01；ASI10 失控 Agent | V0.3 起（契约和 Action Executor） | [自动]（Action Executor 测试） |
| X3 | **模型输出不能直接执行。** 模型的输出用约束解码限定格式（ADR 0019），再通过 schema 校验和 Verification，才能成为 Action；约束只保证格式、不保证内容；任何情况下都不对模型输出使用 `eval`、`new Function` 或动态 import | [新增] | LLM10 输出处理不当；ASI05 意外的代码执行 | V1 起 | [自动]（Biome `noGlobalEval`）[审查] |
| X4 | **资源设上限**：每个 Experiment 的最大步数、每次模型调用的超时、token 预算（Cognitive Budget）、Worker 进程的资源上限 | [新增]，部分属于 [已定] 的 Cognitive Budget | LLM06 无限制消耗；ASI08 级联失败 | V0.5 起 | [自动]（测试） |
| X5 | **每个 Experiment 一个进程**（验证工具），崩溃不会扩散 | [已定] ADR 0004 | ASI08 | V0.5 | [自动]（不泄漏测试） |
| X6 | **启动时立即失败**：配置错误、能力不匹配时立即报错，不拖到运行时 | [已定] 契约 v0、A4 | — | V0.3 | [自动] |

## 三、配置与输入

| # | 要求 | 来源 | 对应风险 | 何时 | 检查 |
|---|---|---|---|---|---|
| C1 | **配置只能引用注册表中登记过的类型**，不能通过配置 import 任意模块 | [已定] ADR 0008 | ASI05 | V0.3 | [自动]（测试） |
| C2 | **配置当作不可信输入处理**：加载时用 schema 校验；配置中引用的路径不能超出允许的目录；YAML 只解析为普通数据，不启用自定义标签 | [新增] | ASI05 | V0.2–V0.3 | [自动]（测试） |
| C3 | **密钥只能通过 `${env:NAME}` 引用**，不能直接写在配置文件里，也不写入 Experiment 快照 | [已定] 调研文档，ADR 0016 | LLM02 | V0.3 | [自动]（加载时检测并拒绝疑似密钥的值） |

## 四、网络与对外接口

| # | 要求 | 来源 | 对应风险 | 何时 | 检查 |
|---|---|---|---|---|---|
| N1 | **默认只监听 localhost**；对外开放时必须开启认证 | [已定] E5、ADR 0013 | ASI03 | P1 起 | [自动]（测试） |
| N2 | **遥测必须由用户主动开启**；默认不记录提示词和模型输出的内容 | [已定] E5、ADR 0015 | LLM02 | V0 起 | [审查] |
| N3 | **调用 Model Backend 时，不把密钥写进 URL 参数** | [新增] | LLM02 | V1 | [审查] |

## 五、供应链

| # | 要求 | 来源 | 对应风险 | 何时 | 检查 |
|---|---|---|---|---|---|
| S1 | **提交 `pnpm-lock.yaml`，CI 中安装一律用 `pnpm install --frozen-lockfile`**；审查时把 lockfile 的变化当作代码变化看待 | [新增] | LLM04 供应链；ASI04 | V0.1 | [审查] |
| S2 | **依赖包的安装脚本默认不运行**，只在 `pnpm-workspace.yaml` 的 `allowBuilds` 中逐个放行；**推迟安装刚发布的版本**（`minimumReleaseAge`，pnpm 默认 1 天）；**拒绝发布可信度下降的版本**（`trustPolicy: no-downgrade`） | [新增] | LLM04；ASI04 | V0.1 | [自动]（pnpm 设置） |
| S3 | **依赖尽量少**：Node 自带的功能够用就不装包；新增依赖先登记 | [已定] A3、tech-stack.md | LLM04 | 已生效 | [审查] |
| S4 | **开启 Dependabot**，定期运行 `pnpm audit` | [新增] | LLM04 | V0.1 起 | [自动] |
| S5 | **模型不打包**，按来源下载，并校验 sha256 | [已定] ADR 0013 | LLM04；LLM05 | 现在手动执行（ADR 0017）；P4 做成产品命令 | [审查]；P4 起 [自动] |
| S6 | **开启 GitHub 密钥扫描和推送保护**，阻止带密钥的提交被推送（公开仓库免费） | [新增] | LLM02 | 尽快 | [自动]（GitHub） |

## 六、外部工具与其他 Agent（P3 起）

| # | 要求 | 对应风险 |
|---|---|---|
| E1 | MCP 工具的描述、参数说明和返回结果都是不可信文本，按 D1 处理 | ASI02；ASI04 |
| E2 | 固定 MCP 服务器的版本；工具定义发生变化时需要重新审批 | ASI04 |
| E3 | 破坏性操作（不可撤销、对外发送）经过 Policy；在默认档位下由用户审批。放开到哪一档由用户选择（ADR 0022） | LLM03；ASI02 |
| E4 | 不把访问令牌原样转交给下游；令牌只用于签发它的那个目标 | ASI03 |
| E5 | 真实能力在沙箱中运行，并限制网络访问 | ASI05 |
| E6 | 其他 Agent 的话只作为低可信度的 Claim（D3），不能直接触发 Action | ASI07 |

---

## 来源

- [OWASP GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) · [2026 版的变化](https://aembit.io/blog/the-owasp-top-10-for-llm-applications-2026-what-changed-and-why-it-matters/)
- [OWASP Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications/) · [Cycode 解读](https://cycode.com/blog/owasp-top-10-agentic-applications/)
- pnpm 安全设置：[pnpm settings](https://pnpm.io/settings) · [构建脚本设置](https://pnpm.io/settings/build)
- npm 供应链：[Mondoo 2026](https://mondoo.com/blog/npm-supply-chain-security-package-manager-defenses-2026) · [OpenReplay：npm 安全最佳实践](https://blog.openreplay.com/npm-security-best-practices/)
- Event Sourcing 与数据删除：[Verraes：Crypto-Shredding](https://verraes.net/2019/05/eventsourcing-patterns-throw-away-the-key/) · [AxonIQ：事件溯源中的敏感数据](https://www.axoniq.io/blog/protect-sensitive-data-in-an-event-sourced-application)
- MCP：[CSA：MCP 安全白皮书（2026-05）](https://labs.cloudsecurityalliance.org/research-rb/csa-whitepaper-mcp-security-agentic-attack-surface-20260516/) · [Corgea：MCP 安全清单](https://corgea.com/learn/mcp-security-best-practices)
