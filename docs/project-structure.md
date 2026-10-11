# 目录结构与命名规范

本文件约定 Memex 仓库的目录结构、包的内部组织方式和命名规则。代码写法见 [code-style.md](./code-style.md)，依赖规则见 ADR 0008 和 [dependencies.md](./dependencies.md)。

- **状态**：已确认（2026-10-11）。
- **原则**：
  - 目录结构要直接体现依赖方向：只看目录，就能知道谁可以依赖谁。
  - 目录名要说明系统里有什么，与"代码自解释"（code-style.md 第十节）是同一个思路。
- **检查方式**：依赖方向和"只能通过公开入口 import"由 dependency-cruiser 自动检查；文件名大小写由 Biome 的 `useFilenamingConvention` 检查。配置在 M0.1 落地。

---

## 一、仓库顶层

```
memex/
├─ packages/                 Framework 本身
│  ├─ contracts/             @memex/contracts：契约、schema、Result、pipe
│  ├─ runtime/               @memex/runtime：Event Log、Composition Root、认知循环、Projector
│  ├─ fakes/                 @memex/fakes：Fake Provider、最小 Micro World、污染 Provider
│  └─ lab/                   @memex/lab：Runner、Worker、录制与回放、`memex lab run`
├─ providers/                真实的 Provider，每个都是独立的包（M1 起）
│  └─ intuition-tev1/        例：type 为 intuition.tev1 的 Provider
├─ apps/                     可执行程序：`memex` 命令行、以后的 Web 界面（M1 起）
├─ examples/                 示例资源 YAML（Experiment、Model、Provider），只包含合成数据
├─ docs/                     文档：adr/、architecture/、research/ 和各份规范
├─ package.json              根配置：统一的脚本入口，`packageManager` 固定 pnpm 版本
├─ pnpm-workspace.yaml       pnpm workspaces 与依赖安全设置（docs/security-and-data.md 第五节）
├─ pnpm-lock.yaml            锁定依赖版本，必须提交
├─ tsconfig.base.json        共用的 TypeScript 设置，各包继承
├─ biome.json                lint 和格式化
├─ .dependency-cruiser.cjs   架构边界规则
├─ knip.json                 未使用代码检查
├─ vitest.config.ts          测试
└─ .gitignore  .gitattributes  .editorconfig  .nvmrc  .env.example
```

### 顶层目录与依赖方向

| 目录 | 是什么 | 可以依赖 | 不能依赖 |
|---|---|---|---|
| `packages/contracts` | 唯一稳定的边界（Cognitive Contract） | 只有 Zod 等少量登记过的库 | 其他所有包 |
| `packages/runtime`、`packages/lab` | Framework 的核心组件 | `contracts` | `providers/*`、`apps/*`、`fakes` |
| `packages/fakes`、`providers/*` | Provider 实现（端口与适配器中的"适配器"） | `contracts` | 其他 Provider、`runtime`、`lab`、`apps/*` |
| `apps/*` | 装配和入口：在 Composition Root 中注册具体的 Provider | 全部 | — |

说明：
- **每个真实的 Provider 单独成包。** 它自己声明需要的依赖，这些依赖不会进入核心。替换一个 Provider，就是换掉一个包（ADR 0008）。
- **`fakes` 放在 `packages/`**，因为 M0 按 HANDOFF 的约定只有这四个包，而且 Fake 主要用于测试。
- **Lab 怎样拿到具体的 Provider**：Lab 不直接 import Provider。它和 `apps/` 一样，通过 Composition Root 的注册表拿到 Provider。M0 中注册 Fake Provider 的位置在 M0.5 实现时确定，原则是"只有装配的地方知道具体实现"。

## 二、包的内部结构

```
packages/runtime/
├─ package.json              用 "exports" 只公开 ./src/index.ts
├─ tsconfig.json             继承 ../../tsconfig.base.json
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

运行时产生的数据属于 Instance，不属于仓库内容：

- **默认目录 `.memex/`**，可以通过配置修改。它被 `.gitignore` 忽略。
- **每次 Experiment 的输出**放在 `.memex/runs/<experiment 名称>/<运行 id>/`，包括 Event Log、录制、快照和报告。具体的文件格式在 M0.5 时确定。
- 真实领域的数据只能放在这里，不能放进仓库（ADR 0016）。

## 五、什么时候建什么

| 目录 | 何时建立 |
|---|---|
| `packages/contracts`、`runtime`、`fakes`、`lab`，以及根目录的配置文件 | M0.1 |
| `examples/` | M0.5（第一个示例 Experiment） |
| `providers/` | M1（第一个真实 Provider） |
| `apps/` | M1（`memex` 命令行，提供 `up`、`doctor`、`models pull`） |

不要为了"以后可能会用"提前建立空目录。
