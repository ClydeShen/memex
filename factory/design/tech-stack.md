# 技术栈推荐

本文件列出 Memex 的工程技术栈：每样东西的作用、依赖分类，以及在哪个里程碑引入。依赖分类的定义见 [dependencies.md](./dependencies.md)，里程碑见 [roadmap.md](./roadmap.md)，这些工具要检查的代码风格见 [code-style.md](./code-style.md)。

- **状态**：推荐（2026-10-11 用户确认；Git hooks 和 TUI 两部分于同日补充，hook 的分工 2026-10-12 用户确认）。版本号是当天 `npm view <包名> version` 的结果，引入时再取当时的最新版。
- **都可以替换**：这里的选择都是工程选择，不是架构决定（roadmap 第四部分："测试框架和 lint 工具按当时的主流选择"）。更换某个工具只需要修改本文件，不需要写 ADR。
- **硬依赖除外**：已经在 ADR 中定下的硬依赖（Node.js / TypeScript、Zod、JSONL + CloudEvents 等）照旧，要换需要先写 ADR。

## 选型原则

1. **Node 自带的功能够用，就不装包。** Node 26 能直接运行 `.ts`、自带 UUIDv7、`fetch`、`util.parseArgs`、`child_process`，这些都不需要第三方包。
2. **到需要的里程碑才引入**（P5）。默认值不等于承诺。
3. **每个依赖都要登记分类**（A3）。本文件的"分类"一列就是登记。
4. **运行时核心不使用原生扩展**（E1），只用纯 TypeScript 和 WASM。

## 两个影响选型的事实（2026-10-11 核实）

- **TypeScript 7.0 已正式发布，但还没有编程接口（API）。** 接口要等到 7.1，目前 7.1 还是开发版。typescript-eslint 的最新版 8.71.1 要求 TypeScript 低于 6.1，所以"TS 7 + ESLint"现在装不到一起。本栈因此用 Biome 做 lint，Biome 不依赖 TypeScript 的接口。
- **Node 26 默认会去掉类型后直接运行 `.ts` 文件**（`process.features.typescript === "strip"`），所以实验阶段不需要构建步骤。代价是只能使用可以直接去掉的类型语法：开启 `erasableSyntaxOnly`，不用 `enum`、参数属性和带运行时代码的 `namespace`，用 `as const` 对象代替 `enum`。

---

## 一、语言与运行时

| 工具 | 版本 | 分类 | 作用 | 何时引入 |
|---|---|---|---|---|
| Node.js | 26.x（`.nvmrc`） | 硬依赖 | 运行时；直接运行 `.ts`，不需要构建。按官方发布计划，Node 26 在 2026-10-28 进入 Active LTS，此前是 Current；它也是旧的单双数发布模式下的最后一个版本，从 Node 27 起每年只发一个大版本 | 已就绪 |
| TypeScript | 7.0.x | 硬依赖 | 只做类型检查（`tsc --noEmit`），不负责产出代码。开启 `strict` 和 `erasableSyntaxOnly` | V0.1 |
| pnpm | 12.x（`packageManager` 字段固定） | 开发工具 | 包管理和 monorepo（pnpm workspaces）。选它而不是 npm 的理由是安全（用户决定，2026-10-11）：默认阻止依赖包的安装脚本，只放行 `allowBuilds` 中列出的包；`minimumReleaseAge` 默认推迟安装刚发布的版本；`trustPolicy` 可以拒绝发布可信度下降的版本；`node_modules` 结构严格，代码无法使用没有声明的依赖。另外安装更快，也更省磁盘空间 | V0.1 |

## 二、代码质量

| 工具 | 版本 | 分类 | 作用 | 何时引入 |
|---|---|---|---|---|
| Biome | 2.5.x | 开发工具 | lint 和格式化合在一个工具里，带类型相关的规则，不依赖 TypeScript 的接口 | V0.1 |
| dependency-cruiser | 18.5.x | 开发工具 | 把架构约束写成自动检查：核心只依赖 `@memex/contracts`；Provider 之间不能互相 import；只有 Composition Root 能引用具体实现（A2，ADR 0008）。违反时检查失败 | V0.1 |
| knip | 6.41.x | 开发工具 | 找出没用到的文件、导出和依赖，原生支持 monorepo | V0.1 |
| markdownlint-cli2 | 0.23.x | 开发工具 | 检查 `factory/as-built/` 的 Markdown 格式（ADR 0026） | V0-28 |
| CodeQL | GitHub 提供 | 开发工具 | 安全扫描，公开仓库免费，支持 JS 和 TS。追踪不可信数据在代码中的流向，例如模型输出流进 `eval`、配置中的路径穿越、`child_process` 命令注入、overlay 合并时的原型污染（security-and-data.md X3、X5、C2）。用 GitHub 的默认设置（default setup）：在仓库的 Settings → Code security 中开启，不需要 workflow 文件；推送到 `main` 时和每周各扫描一次，只报告问题、不阻止合并，所以不增加 ADR 0012 想避免的流程负担。开启仓库设置由用户操作 | V0 首次合并进 `main` 时（用户确认，2026-10-13） |
| Dependabot、`pnpm audit` | GitHub 和 pnpm 提供 | 开发工具 | 提醒依赖包中的已知漏洞 | V0.1 起（不需要 CI，与 security-and-data.md S4 一致） |

备选：
- ESLint 10 加 typescript-eslint 8：规则更全，但需要把 TypeScript 降到 6.0。等 TS 7.1 发布、typescript-eslint 支持 TS 7 之后，可以重新评估。
- oxlint 1.x 加 oxfmt：速度最快，但 oxfmt 还在 0.x 版本。
- SonarQube Cloud：公开仓库可以免费使用，但它是云服务，而且和上面几个工具的功能重复，暂不引入。

### Git hooks

用途：提交之前在本机先跑一遍快速检查，把明显的问题挡在提交之前。hook 可以用 `git commit --no-verify` 跳过，所以它只是本机的便利，不是关卡：完整检查靠 `pnpm check`，决策关卡之后再由 CI 兜底（ADR 0012、0020）。

| 做法 | 版本 | 分类 | 作用 | 何时引入 |
|---|---|---|---|---|
| git 自带的 `core.hooksPath`（主选） | git 自带 | — | hook 脚本放在仓库的 `.githooks/` 目录里一起提交；根 `package.json` 的 `prepare` 脚本执行 `git config core.hooksPath .githooks`，`pnpm install` 时自动生效。不装任何包（选型原则 1、security-and-data.md S3）。pnpm 的 `allowBuilds` 只管依赖包的安装脚本，根项目自己的 `prepare` 照常运行 | V0.1 |
| Biome 的 `--staged` | Biome 自带 | — | pre-commit 中执行 `biome check --staged`，只检查已暂存的文件，不需要 lint-staged | V0.1 |

三个 hook 分工如下（用户确认，2026-10-12）：

| hook | 做什么 | 理由 |
|---|---|---|
| pre-commit | 只执行 `biome check --staged` | 要轻：Agent 在本地开发时频繁提交，不能拖慢速度 |
| commit-msg | 强制 Conventional Commits 格式（`type(scope): 描述`），用一个很短的 `.ts` 脚本检查，Node 26 直接运行 | 提交信息是重要的历史追溯依据；World 0 也会把 git 历史当作数据来源（ADR 0011） |
| pre-push | 执行完整的 `pnpm check`（类型检查、lint、架构检查、测试） | 推上去的代码必须是通过检查的代码 |

备选：
- lefthook 2.2.x：Go 写的单个程序，用一个 YAML 文件配置，可以并行运行多项检查。npm 包按平台带预编译的二进制；它自己的 postinstall 会被 pnpm 默认拦下，要在 `prepare` 里执行 `lefthook install`（specimens 中 iii 的 console 就是这样用的）。等 hook 里的检查变多、需要并行时再换。
- husky 9.1.x：零依赖，hook 是 `.husky/` 下的 shell 脚本。它做的事和 `core.hooksPath` 基本相同，只是多一个包。

## 三、测试

V0 的三条通过标准（可复现、不泄漏、可替换）都写成这里的测试。

| 工具 | 版本 | 分类 | 作用 | 何时引入 |
|---|---|---|---|---|
| Vitest | 5.0.x | 开发工具 | 单元测试和集成测试 | V0.1 |
| @vitest/coverage-v8 | 5.0.x | 开发工具 | 测试覆盖率 | V0.1 |
| fast-check | 4.10.x | 开发工具 | 基于性质的测试：自动生成大量随机输入，验证一些不变量，例如"重放日志后 Projection 完全一致""同一个种子结果相同"。比手写几个用例更有说服力 | V0.3 |

## 四、契约与数据（运行时依赖）

| 工具 | 版本 | 分类 | 作用 | 何时引入 |
|---|---|---|---|---|
| Zod | 4.6.x | 硬依赖（只在契约包内部使用） | 定义 schema，并用 `z.toJSONSchema()` 导出 JSON Schema（ADR 0009） | V0.2 |
| yaml | 2.9.x | 可替换的实现细节 | 读取多文档的资源 YAML（KRM 格式） | V0.2 |
| canonicalize | 5.1.x | 可替换的实现细节 | RFC 8785 规范化 JSON。先规范化、再算哈希，Trace 哈希才稳定，"可复现"标准依赖它 | V0.3 |
| `node:crypto` | Node 自带 | — | 用 sha256 算哈希；用 `randomUUIDv7()` 生成按时间排序的事件 id，不需要 `uuid` 包 | V0.3 |
| `node:child_process` | Node 自带 | — | 每个 Experiment 一个子进程，用 JSONL 通信（ADR 0004），不需要 `execa` | V0.5 |
| `node:util` 的 `parseArgs` | Node 自带 | — | 解析 `pnpm lab run` 的命令行参数，验证工具够用 | V0.5 |

不使用 CloudEvents 官方 SDK：我们只需要它的 JSON 结构格式，用 Zod 定义就够了，而且这个 SDK 一年多没有更新（最新版 10.0.0 发布于 2025-06）。

注意：事件 id 和时间戳每次运行都会不同，所以比较 Trace 哈希之前要先去掉或替换这些字段（V0 通过标准中说的"规范化之后"）。

## 五、工具函数

| 工具 | 版本 | 分类 | 作用 | 何时引入 |
|---|---|---|---|---|
| es-toolkit | 1.52.x | 可替换的实现细节 | lodash 的现代替代品，体积小，类型完整 | **用到时再引入**。Node 26 已经内置了 `structuredClone`、`Object.groupBy`、Set 的集合运算、`Array.prototype.toSorted` 等，V0 很可能用不到。需要时选它，不选 lodash |

## 六、后续里程碑

| 工具 | 版本 | 分类 | 作用 | 何时引入 |
|---|---|---|---|---|
| 内置 `fetch` | Node 自带 | — | 调用兼容 OpenAI 接口的 Model Backend。需要传 `logprobs`、`top_logprobs`、`chat_template_kwargs` 等非标准参数，直接发请求最简单。AI SDK 或 openai SDK 只作为某个 Provider 内部的可选实现（ADR 0008） | V1 |
| commander | 15.x | 可替换的实现细节 | 产品命令（`memex ...`）的命令行解析；产品命令在决策关卡后设计 | P1 |
| pino | 10.x | 可替换的实现细节 | 高性能日志。ADR 0015 要求使用 OpenTelemetry 日志数据模型的字段名，pino 的默认字段名不同，需要转换。所以 V0 先写一个很薄的函数直接输出这些字段，性能不够时再换 pino | V1 之后视需要 |
| Docker Compose | — | 可选依赖 | 一键启动（产品命令的候选） | P4 |
| oxigraph | 0.5.x | 可配依赖的默认实现（Knowledge 存储） | 进程内运行的 WASM 图存储（ADR 0010） | V2 |
| jsonld | 9.x | 可替换的实现细节 | 把数据导出为 RDF（ADR 0007） | V2 或 P1 |
| OpenTelemetry SDK | — | 可选依赖 | 可选的 OTLP 导出（ADR 0015） | 产品阶段 |
| tsdown | 0.23.x | 开发工具 | 打包发布 npm 命令行工具。实验阶段直接运行 `.ts`，不需要它 | P4 |
| changesets | 3.x | 开发工具 | 版本号和更新日志 | P4 |

### 终端交互界面（TUI）

产品命令（`memex ...`）在决策关卡之后设计（ADR 0020），TUI 到 P1 才需要。验证阶段的 `pnpm lab` 只输出文本和 JSON 报告，不需要 TUI。

| 工具 | 版本 | 分类 | 作用 | 何时引入 |
|---|---|---|---|---|
| `node:util` 的 `styleText`、`node:readline` | Node 自带 | — | 终端颜色和简单的行输入，不需要 chalk | 用到时 |
| Ink | 8.0.x | 可替换的实现细节 | 用 React 组件写终端界面，例如对话、查看目标进度、审批。纯 JavaScript，布局引擎 yoga-layout 是 WASM，不违反 E1。Claude Code、GitHub Copilot CLI，以及 Hermes 的新 TUI（specimens/hermes-agent/ui-tui）都用它；生态最大，有 ink-testing-library 可以测试界面 | P1 |
| @clack/prompts | 1.8.x | 可替换的实现细节 | 向导式问答，例如 `memex init` 这类首次配置流程。OpenClaw 的向导流程也用 Clack | P1 |

备选：
- pi-tui（`@earendil-works/pi-tui` 1.1.x）：命令式组件，差分渲染加同步输出（CSI 2026），专为流式输出的 Agent 界面设计，只有 2 个依赖。OpenClaw 的 `openclaw tui` 基于它。比较年轻：包名在 2026 年从 `@mariozechner/pi-tui` 改成现在的名字，旧包停在 0.73.1。如果 Ink 在长时间流式输出时卡顿（Ink 有帧率上限），换它。
- 不选 OpenTUI（0.6.x）：渲染核心是 Zig，按平台带预编译的原生库，与 E1 和 ADR 0013"各平台行为一致"的取向相反；而且还在 0.x。

## 明确不引入

| 工具 | 原因 |
|---|---|
| turbo、nx | pnpm workspaces 加 `pnpm -r` 就够了，不需要额外的任务编排 |
| npm、yarn（作为包管理器） | 选 pnpm，理由见第一节 |
| lodash | 选 es-toolkit |
| uuid | Node 26 自带 `crypto.randomUUIDv7()` |
| execa | `node:child_process` 够用 |
| Prettier | Biome 已包含格式化 |
| lint-staged | Biome 自带 `--staged` |
| commitlint | 只为检查一行提交信息格式，引入一套解析器和配置包太重；需要时写一个很短的脚本 |
| simple-git-hooks | 靠自身的 postinstall 安装 hook，pnpm 默认会拦下；`core.hooksPath` 不需要安装脚本 |
| chalk | Node 26 自带 `util.styleText` |
| TypeDoc、madge | 声明的 TypeScript 依赖不含 TS 7（2026-10-13 `npm view`），见 ADR 0026 |
| api-extractor | 需要 `.d.ts`，与"不构建"的栈不合（ADR 0026） |
| CloudEvents SDK | 见第四节 |
| tsup | tsdown 是它的后继，而且实验阶段不需要打包 |

## 尚未核实（V0.1 开工时先实测）

1. **dependency-cruiser 和 knip 在 TypeScript 7 下能否正常工作。** 它们可能用到 TypeScript 的接口。如果不能，退路是在开发依赖里另装一份 TypeScript 6 给它们用，类型检查仍然用 TS 7。
2. **Vitest 5 相比 4 有哪些变化。** 版本号是从 npm 查到的，更新说明还没有看过。
3. **Biome 的类型相关规则比 typescript-eslint 少多少。** 尚未逐条比对。
4. **pnpm 12 的安全设置名称。** `allowBuilds`、`minimumReleaseAge`、`trustPolicy` 是按 pnpm 11 的文档核实的；pnpm 12 是用 Rust 重写的版本（2026-08 发布），这些设置在 12 中是否完全相同，要在 V0.1 写 `pnpm-workspace.yaml` 时对照 12 的文档确认。

5. **Ink 8 相比 7 有哪些变化。** Ink 8.0.0 于 2026-10-03 发布，要求 React 19.3 以上，更新说明还没有看过；P1 引入时再核对。
6. **`core.hooksPath` 下的 hook 在 Windows 上的表现。** git for Windows 用自带的 sh 运行 hook，按理和其他平台一致，V0.1 落地时在本机实测一次。

## 来源

- TypeScript 7：[InfoQ：TypeScript 7 发布](https://infoq.com/news/2026/08/typescript-7-released/) · [VS Magazine：7.0 RC](https://visualstudiomagazine.com/articles/2026/06/22/typescript-7-0-rc-moves-microsofts-go-rewrite-into-the-mainline-compiler.aspx) · [为什么 ESLint 还不能用 TS 7](https://dev.to/the-modern-web/why-angular-vue-and-eslint-cant-upgrade-to-typescript-70-yet-and-why-ts-71-changes-441g) · [TS 7 迁移就绪度](https://www.digitalapplied.com/blog/typescript-7-native-compiler-early-adopter-migration-readiness)
- Node 原生 TypeScript：[Node.js 文档：TypeScript](https://nodejs.org/api/typescript.md) · [原生运行 TypeScript](https://nodejs.org/zh-cn/learn/typescript/run-natively)
- Lint：[InfoQ：ESLint 10](https://infoq.com/news/2026/04/eslint-10-release) · [Oxfmt Beta](https://oxc.rs/blog/2026-02-24-oxfmt-beta) · [Biome vs Oxc 2026](https://www.pkgpulse.com/guides/biome-vs-oxc-2026) · [Biome vs ESLint vs Oxlint 2026](https://www.pkgpulse.com/guides/biome-vs-eslint-vs-oxlint-2026)
- 架构检查：[lastminute.com：用 dependency-cruiser 守住架构边界](https://technology.lastminute.com/how-we-enforce-architecture-boundaries-at-scale-on-our-app/) · [knip](https://www.npmjs.com/package/knip)
- 安全扫描：[CodeQL code scanning](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-code-scanning) · [CodeQL 默认设置](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning) · [SonarQube Cloud 订阅计划](https://docs.sonarsource.com/sonarcloud/administering-sonarcloud/managing-subscription/subscription-plans)
- 测试：[Vitest 博客](https://main.vitest.dev/blog)
- 构建：[tsdown 基准](https://tsdown.dev/advanced/benchmark) · [从 tsup 换到 tsdown](https://alan.norbauer.com/articles/tsdown-bundler)
- 工具函数：[es-toolkit vs lodash](https://blog.logrocket.com/es-toolkit-lodash-alternative)
- 日志：[Pino vs Winston](https://betterstack.com/community/comparisons/pino-vs-winston) · [Pino 与 OpenTelemetry](https://1xapi.com/blog/structured-logging-nodejs-pino-opentelemetry-2026)
- CLI：[2026 Node CLI 框架](https://www.pkgpulse.com/guides/best-cli-frameworks-nodejs-2026)
- Git hooks：[git-config：core.hooksPath](https://git-scm.com/docs/git-config#Documentation/git-config.txt-corehooksPath) · [Biome CLI（`--staged`）](https://biomejs.dev/reference/cli/) · [pnpm 构建设置（allowBuilds 只管依赖）](https://pnpm.io/settings/build) · [husky](https://typicode.github.io/husky/get-started.html) · [Husky vs Lefthook vs lint-staged 2026](https://www.pkgpulse.com/guides/husky-vs-lefthook-vs-lint-staged-git-hooks-nodejs-2026) · [用 Lefthook 代替 Husky](https://recca0120.github.io/en/2026/03/08/lefthook-git-hooks/)
- TUI：[OpenTUI（Better Stack）](https://betterstack.com/community/guides/scaling-nodejs/opentui-react/) · [OpenTUI 与 Ink 对比](https://blog.openreplay.com/opentui-alternative-ink/) · [Node 终端界面](https://blog.openreplay.com/building-terminal-interfaces-nodejs/) · [OpenClaw TUI 文档](https://docs.openclaw.ai/de/cli/tui.md) · [pi-tui（depscope）](https://mcp.depscope.dev/pkg/npm/@mariozechner/pi-tui)；版本号和依赖来自 2026-10-11 的 `npm view`
- Node 发布计划：[nodejs/Release schedule.json](https://github.com/nodejs/Release/blob/main/schedule.json)
- 规范化 JSON 与 UUID：[canonicalize](https://npmjs.com/package/canonicalize) · [Node 原生 UUID](https://dev.to/pierre/you-should-ditch-uuid-node-has-you-covered-10i3)
- Oxigraph：[DepScope：oxigraph](https://mcp.depscope.dev/pkg/npm/oxigraph)
