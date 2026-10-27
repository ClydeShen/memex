# 目录结构与命名规范

本文件约定 Memex 仓库的目录结构、包的内部组织方式和命名规则。代码写法见 [code-style.md](./code-style.md)，依赖规则见 ADR 0008 和 [dependencies.md](./dependencies.md)。

- **状态**：已确认（2026-10-11）；三个区的划分见 ADR 0028。
- **原则**：
  - 目录结构要直接体现依赖方向：只看目录，就能知道谁可以依赖谁。
  - 目录名要说明系统里有什么，与"代码自解释"（code-style.md 第十节）是同一个思路。
- **检查方式**：依赖方向和"只能通过公开入口 import"由 dependency-cruiser 自动检查；文件名大小写由 Biome 的 `useFilenamingConvention` 检查。配置在 V0.1 落地。

---

## 一、仓库顶层

仓库分三个区（ADR 0028）：`harness/` 驱动 agent 怎样工作，`factory/` 是生产 Memex 的车间，`memex/` 是发布出去的成品。另外，`playbook/` 是跨团队通用的标准，不属于 Memex。

```
（仓库根目录）
├─ memex/                  成品：只有这个目录会发布
│  ├─ packages/
│  │  ├─ contracts/          @memex/contracts：契约、schema、Result、pipe
│  │  ├─ runtime/            @memex/runtime：Event Log、Composition Root、认知循环、Projector
│  │  └─ fakes/              @memex/fakes：产品测试用的 Fake Provider，只用于测试，不发布
│  ├─ providers/             真实的 Provider，每个都是独立的包（V1 起）
│  │  └─ intuition-tev1/     例：type 为 intuition.tev1 的 Provider
│  └─ apps/                  产品的可执行程序：`memex` 命令行、以后的 Web 界面（P1 起）
├─ factory/                  车间：只对 Memex 有意义，不发布；由 agent 按 harness 自治管理
│  ├─ design/                设计文档，只写当前状态：VISION、GLOSSARY、HANDOFF、roadmap、架构、契约和各份规范
│  ├─ records/               累积的记录，写完不再改：decisions/（ADR）、research/、plans/
│  ├─ validation/            验证工具，决策关卡时整体删除或改成回归评测
│  │  ├─ lab/                @memex/lab：Runner、Worker、`pnpm lab`
│  │  ├─ worlds/             @memex/worlds：Micro World、Ground Truth 与 Oracle、污染 Provider
│  │  ├─ experiments/        实验配置 YAML，只包含合成数据
│  │  └─ runs/               实验输出（不提交）
│  └─ as-built/              产品代码的现状说明，每个包一页（ADR 0026）
├─ harness/                  驱动：deliver agent 的配置，Codex 和 Claude Code 共用
│  ├─ README.md              地图：每个子目录放什么、谁能改、怎样同步到各工具
│  ├─ agents/                共享的 agent 指令正文
│  ├─ skills/                共享 skill 的正文（Agent Skills 格式）
│  ├─ standards/             可以带到其他产品的规范
│  ├─ workflow/              checklist 副本、团队约定、发布流程
│  ├─ templates/             issue、PR、ADR、调研、as-built、交接的模板
│  └─ sensors/               检查脚本和检查规则：边界、打包内容、标记词、front matter、as-built 新鲜度
├─ playbook/                 跨团队通用的工程标准（英文），可以复制到其他项目
├─ AGENTS.md                 很薄的入口，指向 harness/agents/；Codex 和 Claude Code 都读它
├─ .agents/skills/           由 harness/skills/ 生成，给 Codex 用；不手改
├─ .claude/skills/           由 harness/skills/ 生成，给 Claude Code 用；不手改
├─ package.json              根配置：统一的脚本入口，`packageManager` 固定 pnpm 版本
├─ pnpm-workspace.yaml       pnpm workspaces 与依赖安全设置（factory/design/security-and-data.md 第五节）
├─ pnpm-lock.yaml            锁定依赖版本，必须提交
├─ tsconfig.base.json        共用的 TypeScript 设置，各包继承
├─ biome.json                lint 和格式化
├─ .githooks/                git hooks 脚本，由 `prepare` 设置 `core.hooksPath` 生效（tech-stack.md）
├─ .dependency-cruiser.cjs   架构边界规则
├─ knip.json                 未使用代码检查
├─ vitest.config.ts          测试
└─ .gitignore  .gitattributes  .editorconfig  .nvmrc  .env.example
```

判断一个文件放在哪里：换一个产品它还用得上，放 `harness/`；只对 Memex 有意义但不发布，放 `factory/`；发布出去的，放 `memex/`。根目录只放工具规定了位置的文件，并且保持很薄。

pnpm workspaces 包含 `memex/packages/*`、`memex/providers/*`、`memex/apps/*` 和 `factory/validation/*`。

### 三个区之间的边界

1. **依赖只能单向**：`factory` 可以引用 `memex/`；`memex/` 不能引用 `factory` 和 `harness`，既不 import，也不写它们的路径。
2. **只发布 `memex/`**：打包测试列出发布产物的全部文件，不在 `memex/` 下的一律报错；`memex/packages/fakes` 也被排除。
3. **产品不引用开发记录**：`memex/` 里的注释、提示词、错误信息不写 ADR 编号，不提实验、Baseline 和版本沿革（code-style 第十节）。
4. **生成的副本不手改**：`.agents/skills/` 和 `.claude/skills/` 由同步脚本从 `harness/skills/` 生成，检查确认两边一致。

### 包与依赖方向

| 目录 | 是什么 | 可以依赖 | 不能依赖 |
|---|---|---|---|
| `memex/packages/contracts` | 唯一稳定的边界（Cognitive Contract） | 只有 Zod 等少量登记过的库 | 其他所有包 |
| `memex/packages/runtime` | Framework 的核心组件，包括 Composition Root 的注册表和装配逻辑 | `contracts` | 其他所有包 |
| `memex/packages/fakes`、`memex/providers/*` | Provider 实现（端口与适配器中的"适配器"） | `contracts` | 其他 Provider、`runtime`、`apps/*`、`factory` 下的一切 |
| `memex/apps/*` | 产品的装配入口（P1 起）：import 具体的 Provider 并登记到 Composition Root 的注册表 | `memex/` 下除 `fakes` 以外的全部 | `fakes`、`factory` 下的一切 |
| `factory/validation/worlds` | 实验用的 Environment 和 Provider：Micro World、Oracle、污染 Provider | `contracts` | `runtime`、`lab`、`apps/*` |
| `factory/validation/lab` | 验证工具（Runner、Worker） | `contracts`、`runtime`；**只有 Worker 的启动文件**（验证阶段的装配入口）可以 import `fakes`、`worlds` 和 `providers/*` | `apps/*` |

说明：
- **每个真实的 Provider 单独成包。** 它自己声明需要的依赖，这些依赖不会进入核心。替换一个 Provider，就是换掉一个包（ADR 0008）。
- **Fake 分两处**：产品自己的测试需要的 Fake 在 `memex/packages/fakes`；只为实验存在的 Micro World、Oracle 和污染 Provider 在 `factory/validation/worlds`。这样产品的测试不需要引用车间。
- **Lab 怎样拿到具体的 Provider**：Lab 的业务代码不 import Provider，只通过 Composition Root 的注册表拿到它们。整个验证阶段（V0–V2），Lab Worker 的启动文件都是装配入口：V0 中由它 import Fake Provider 和 Micro World 并登记，V1 起再加上 `memex/providers/*` 中的真实 Provider。P1 起，产品的装配入口在 `memex/apps/`。原则是"只有装配入口知道具体实现"（GLOSSARY：Composition Root）。

## 二、包的内部结构

```
memex/packages/runtime/
├─ package.json              用 "exports" 只公开 ./src/index.ts
├─ tsconfig.json             继承 ../../../tsconfig.base.json
└─ src/
   ├─ index.ts               唯一的公开入口
   ├─ event-log/             按领域概念分目录
   │  ├─ append-event.ts
   │  ├─ append-event.test.ts
   │  ├─ replay-events.ts
   │  └─ fixtures/           测试数据，只能是合成数据（ADR 0016）
   ├─ composition-root/
   ├─ action-executor/
   └─ projectors/
```

规则：

1. **按领域概念分目录**（例如 `event-log/`、`projectors/`、`composition-root/`），不按技术层分目录（例如 `services/`、`models/`、`controllers/`）。
2. **不建 `utils/`、`helpers/`、`common/`、`misc/` 这类万能目录。** 真正通用的小工具（`pipe`、`Result`）放进 `@memex/contracts`；其他工具放在用到它的那个概念目录里。
3. **每个包只有一个公开入口 `src/index.ts`**，由 `package.json` 的 `exports` 字段限定。其他包不能 import 某个包内部的文件。
4. **包内不建 `index.ts` 汇总导出**（只有包的公开入口例外）。汇总导出的文件会拖慢工具，也容易造成循环依赖。包内互相 import 时，直接引用具体文件。
5. **一个文件只有一个主要职责**，文件名说明它做什么，通常以动词开头，例如 `append-event.ts`、`check-capabilities.ts`。只定义类型或 schema 的文件用名词命名，例如 `claim.ts`。
6. **测试文件和被测文件放在同一目录**，命名为 `<被测文件名>.test.ts`。
7. **测试数据放在旁边的 `fixtures/` 目录中**，只能是合成数据。

## 三、命名规范

| 对象 | 规则 | 例子 |
|---|---|---|
| 目录、源文件 | kebab-case | `composition-root/`、`append-event.ts` |
| 表示一个概念的目录 | 单数 | `event-log/`、`composition-root/`、`claim/` |
| 装同类东西的目录 | 复数 | `projectors/`、`fixtures/`、`examples/` |
| npm 包名 | `@memex/` 加 kebab-case；包之间互相引用时用 `workspace:*` | `@memex/contracts`、`@memex/intuition-tev1` |
| Provider 包的目录 | 把 `type` 中的点换成连字符 | `intuition.tev1` → `providers/intuition-tev1/` |
| 测试文件 | `*.test.ts` | `append-event.test.ts` |
| 资源 YAML | kebab-case 名字加 `kind` 后缀 | `local-qwen.model.yaml`、`smoke.experiment.yaml` |
| 领域术语 | 使用 GLOSSARY.md 中的词，避开 `_Avoid_` 列出的词 | 用 `claim/`，不用 `fact/`；用 `capability/`，不用 `tool/` |

代码中标识符的命名（camelCase、PascalCase、`create` 前缀等）见 code-style.md 第八节。

## 四、运行时数据的位置

运行时产生的数据不属于仓库内容，实验数据和产品数据分开存放（ADR 0028）：

- **实验输出**放在 `factory/validation/runs/<experiment 名称>/<运行 id>/`，被 `.gitignore` 忽略。内容包括 Event Log、按 sha256 存放录制原文的内容存储（`blobs/`，ADR 0024）、快照和报告。具体的文件格式在 V0.5 时确定。
- **产品实例的数据**默认放在 `.memex/`，可以通过配置修改，被 `.gitignore` 忽略。产品实例从空白开始，不导入任何实验数据。
- 真实领域的数据只能放在产品实例的数据目录里，不能放进仓库（ADR 0016）。

## 五、什么时候建什么

| 目录 | 何时建立 |
|---|---|
| `memex/packages/contracts`、`runtime`、`fakes`，`factory/validation/lab`、`worlds`，以及根目录的配置文件 | V0.1 |
| `factory/validation/experiments/` | V0.5（第一个示例 Experiment） |
| `harness/sensors/`、根目录 `AGENTS.md`、`harness/agents/`、`factory/as-built/TEMPLATE.md` 和 `index.md` | V0-28 |
| `factory/as-built/` 的各包页面 | V0-29（第一次整理） |
| `harness/skills/` 和同步脚本 | 第一个共享 skill 出现时 |
| `memex/providers/` | V1（第一个真实 Provider） |
| `memex/apps/` | P1（产品命令在决策关卡后设计） |

不要为了"以后可能会用"提前建立空目录。
