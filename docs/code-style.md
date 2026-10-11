# 代码风格与约束

本文件约定 Memex 代码的统一风格。工具链见 [tech-stack.md](./tech-stack.md)，架构约束见 [roadmap.md](./roadmap.md) 第一部分和各 ADR。

- **状态**：已确认（2026-10-11）。
- **定位**：这些是风格指引，不是教条。具体情况按最佳实践判断；如果某条规则在某个地方明显让代码更差，就不要套用，并在代码旁边写一行"为什么"的注释（见第十节）。**最重要的是整个代码库风格统一。**
- **如何保证**：每条规则都标明了怎么检查——
  - **[自动]**：由工具检查，违反时检查不通过。规则名列在括号里。
  - **[审查]**：工具查不了，靠代码审查。
- 自动检查的配置在 V0.1 落地。如果配置时发现某条规则不可行，就修改本文件。

---

## 一、依赖倒置与 SOLID

依赖倒置（DIP）是最重要的一条，它就是 ADR 0008 和约束 A2 在代码层面的体现。

1. **只依赖契约。** Provider 只能 import `@memex/contracts`；核心代码不 import 任何具体的 Provider。具体实现只在**装配入口**被 import 并登记到注册表（GLOSSARY：Composition Root；依赖方向见 project-structure.md）。Provider 之间不能互相 import。**[自动]**（dependency-cruiser）
2. **依赖从外面传进来。** 函数和 Provider 需要的东西都通过参数或 `init` 时的上下文传入，不在内部 import 具体实现，也不读取全局状态。**[审查]**
3. **只有 Composition Root 可以读取环境变量。** 其他地方需要的配置，由 Composition Root 读取后传进来。**[自动]**（`noProcessEnv`，Composition Root 除外）
4. **用工厂函数代替 class。** Provider 和其他组件写成"接收依赖、返回对象"的工厂函数。这样没有 `this`，也就不会出现 `this` 指向错误；还和第二节的箭头函数风格一致。**[审查]**
5. **SOLID 的其余四条作为设计参考，不机械套用。** 例如单一职责不等于"一个文件只放一个函数"；接口隔离意味着端口要小，Provider 只拿到它真正需要的 `services`。**[审查]**

```ts
// 推荐：工厂函数，依赖通过参数传入，只引用契约中的类型
import type { IntuitionProvider, Judgement } from "@memex/contracts";

export const createFakeIntuition = (config: FakeIntuitionConfig): IntuitionProvider => ({
  kind: "intuition",
  type: "intuition.fake",
  capabilities: { supportsLogprobs: false },
  judge: async (state, questions) => judgeWithSeed(config.seed, state, questions),
  dispose: async () => {},
});
```

## 二、函数写法

1. **默认使用箭头函数**，写成 `const name = (...) => ...`。**[自动]**（`useArrowFunction`，只覆盖函数表达式）**[审查]**（函数声明）
2. **以下情况可以用 `function`**：
   - 函数重载：TypeScript 的重载签名只能写在 `function` 声明上；
   - 确实需要提升（hoisting）的场景。
3. **导出的函数要写明返回类型。** 返回类型是接口的一部分，写明了，签名变化时能更早发现。**[自动]**（`useExplicitType`）
4. **不修改传进来的参数。** **[自动]**（`noParameterAssign`）

> 是否用 Biome 2 的 GritQL 插件禁止 `function` 声明，在 V0.1 时实测后再决定。

## 三、控制流：提前 return

1. **先处理特殊情况和失败情况，然后立即 return**，主流程放在最后，不要嵌套在 `if` 里面。
2. **`if` 里已经 return 了，后面就不要再写 `else`。** **[自动]**（`noUselessElse`）
3. **嵌套过深就拆分函数。** **[自动]**（`noExcessiveCognitiveComplexity`）
4. **不要嵌套三元表达式。** **[自动]**（`noNestedTernary`）

```ts
// 推荐
const authorize = (action: ActionRequest, actor: Actor): Decision => {
  if (!isKnownAction(action.name)) return deny("unknown action");
  if (!canExecute(actor, action)) return deny("actor lacks permission");
  return allow();
};
```

## 四、pipe / compose

1. **纯数据转换用 `pipe` 串起来**，让每一步都是一个小的纯函数。适合的地方有：
   - Projector 根据事件生成视图；
   - Trace 先规范化再算哈希；
   - 配置先合并 overlay 再做校验。
2. **有副作用或需要按条件分支的流程，不用 `pipe`。** 例如调用模型、写日志、执行 Action，用普通的顺序代码加提前 return 更清楚，出错时的调用栈也更容易看懂。**[审查]**
3. **管道不要太长。** 超过五六步，就把其中几步合并成一个有名字的函数，否则类型推断和可读性都会变差。**[审查]**
4. **`pipe` 自己实现**：放在一个共享的工具模块里，十几行，带完整类型。不引入 fp-ts、Effect 这类函数式框架。JavaScript 原生的管道运算符（`|>`）仍处于提案阶段，不能使用。

```ts
const traceHash = (events: readonly Event[]): string =>
  pipe(events, stripVolatileFields, canonicalize, sha256);
```

## 五、错误处理：控制爆炸范围

Memex 有三层天然的隔离边界，由内到外：

| 边界 | 做法 |
|---|---|
| 单次 Provider 调用 | 预期之内的失败（模型超时、返回格式不对、能力不足）**作为返回值**，用 `Result` 表示，不抛出异常。失败也会作为事件写入 Event Log，所以可以重放 |
| Composition Root 启动时 | 配置错误、能力不匹配时**立刻失败**，并说明原因（契约中的 `CapabilityMismatch`），不要拖到运行时 |
| 单个 Experiment 进程 | 最外层的保险：一个 Experiment 崩溃，不影响其他 Experiment（ADR 0004） |

规则：
1. **`throw` 只用于"程序写错了"**，即理论上不可能发生的情况，例如违反了不变量。**[审查]**
2. **预期之内的失败返回 `Result`**：`{ ok: true, value } | { ok: false, error }`。错误类型使用带判别字段的联合类型，调用方用 `switch` 分别处理每一种错误。**[审查]**
3. **`Result` 类型自己实现**，放在 `@memex/contracts` 中，因为它是契约的一部分。不引入 neverthrow 这类库。
4. **每个 Promise 都必须被处理。** **[自动]**（Biome 的 `noFloatingPromises`，V0.1 时确认这条规则可用）
5. **外部调用要在边界上收住。** 调用 Model Backend 或其他外部系统时，在调用的地方就把异常转换成 `Result`，不让第三方抛出的异常传进核心代码。**[审查]**

## 六、数据与不可变

1. **默认不可变。** 用 `const`、`readonly` 和 `ReadonlyArray`；需要改变时返回新对象，不在原对象上修改。这和 Event Sourcing "只追加、不修改"的做法一致。**[审查]**
2. **类型从 schema 推导。** 契约里的数据类型由 Zod schema 推导（`z.infer`），不另写一份同样的类型定义。**[审查]**
3. **数据都要能序列化为 JSON**（契约 v0 的要求）：契约中的数据类型不放函数、`Date`、`Map` 或 class 实例。时间用 ISO 8601 字符串。**[审查]**

## 七、TypeScript 与模块

1. **开启 `strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`。** **[自动]**（tsc）
2. **只使用可以直接去掉的类型语法**，这样 Node 才能直接运行 `.ts`：开启 `erasableSyntaxOnly`，不使用 `enum`、`namespace` 和参数属性；用 `as const` 对象加联合类型代替 `enum`。**[自动]**（tsc，以及 `noEnum`、`noNamespace`、`noParameterProperties`）
3. **不用 `any`**；类型确实未知时用 `unknown`，再做校验或收窄。**[自动]**（`noExplicitAny`）
4. **不用非空断言 `!`。** **[自动]**（`noNonNullAssertion`）
5. **只用具名导出**，不用默认导出。**[自动]**（`noDefaultExport`）
6. **只用 ES 模块**（ESM），不用 CommonJS。**[自动]**（`noCommonJs`）

## 八、命名

1. **使用 GLOSSARY.md 中的术语**，避开它在 `_Avoid_` 中列出的词。例如写 `Claim`，不写 `fact`；写 `Capability`，不写 `tool`；写 `Observation`，不写 `input`。**[审查]**
2. **大小写**：变量和函数用 camelCase，类型用 PascalCase，文件名用 kebab-case。**[自动]**（`useNamingConvention`、`useFilenamingConvention`）目录和包的命名见 [project-structure.md](./project-structure.md)。
3. **工厂函数以 `create` 开头**，例如 `createEventLog`；返回布尔值的函数以 `is`、`has`、`can` 开头。**[审查]**

## 九、测试：少而准

测试的数量不是目标，测得准才是。

1. **重点测关键节点。** 下面这些必须有测试：
   - **契约**：schema 能否正确接受合法输入、拒绝非法输入；生成的 JSON Schema 能否校验示例配置。
   - **V0 的三条通过标准**：可复现、不泄漏、可替换。
   - **不变量**：例如"重放日志后 Projection 完全一致""同一个种子结果相同"。用 fast-check 自动生成大量随机输入来验证。
   - **安全关口**：Policy 检查、Composition Root 的能力检查。
2. **修复错误时，先写一个能复现这个错误的测试**，确认它失败，再修代码。这个测试保留下来，作为回归测试。
3. **不设覆盖率指标。** 覆盖率报告只用来发现漏测的关键路径，不作为通过门槛。
4. **测行为，不测实现细节。** 测试通过公开接口（端口）进行；内部重构时，测试不应该需要跟着修改。
5. **测试要确定。** 不依赖真实时间、网络或随机数；需要时通过参数传入时钟和种子（与第一节"依赖从外面传进来"是同一个原则）。
6. **测试文件和被测代码放在一起**，命名为 `*.test.ts`。

## 十、代码自解释，少写注释

代码本身要说清楚它在做什么；注释只解释代码说不出来的东西。

1. **名字表达意图。** 名字读起来要像一句话，例如 `isExpired(claim, now)`，不要写成 `check(c, t)`。使用 GLOSSARY.md 中的术语（第八节）。**[审查]**
2. **想写"这里在做什么"的注释时，改为提取函数。** 把那段代码提取成一个小函数，用那句注释的意思来给它命名。**[审查]**
3. **不写没有名字的常量。** 例如 `2` 写成 `const MIN_CHOICE_OPTIONS = 2`。可以调整的值（例如快路径的把握度阈值属于 Calibration）不写成常量，而是放进配置，从配置读取。**[自动]**（`noMagicNumbers`）**[审查]**
4. **让类型说明含义。** **[审查]**
   - 用带判别字段的联合类型代替一组布尔字段。例如用 `{ status: "refuted" }`，不要用 `isRefuted: true, isContested: false`。
   - 参数不要直接传布尔值，改用选项对象。例如写 `run(config, { replay: true })`，不要写 `run(config, true)`。
5. **函数短小、只做一件事**，配合第三节的提前 return，读一遍就能看懂。**[自动]**（`noExcessiveCognitiveComplexity`）**[审查]**
6. **注释只写"为什么"，不写"做了什么"。** 应该写注释的情况：
   - 不明显的取舍，例如"这里不用 X，因为 Y"；
   - 外部系统的约束或怪癖，例如"llama.cpp b9354 会把 `B` 和 ` B` 返回成两个不同的 token，见 docs/research/llama-cpp-backend.md"；
   - 对应的 ADR，例如"见 ADR 0005"；
   - 有意不遵守本文件某条规则时，说明理由。

   不要写的注释：复述代码、被注释掉的旧代码、没有负责人和期限的 TODO。**[审查]**
7. **契约的说明写在 schema 里，不写在注释里。** 用 Zod 的 `.describe()` 给字段加说明。这些说明会随 `z.toJSONSchema()` 导出到 JSON Schema，编辑器补全和文档都能看到，而且说明和代码是同一样东西，不会过时。**[审查]**

```ts
// 不推荐：注释在复述代码
// check if certainty is high enough
if (j.certainty > 0.8) { ... }

// 推荐：名字本身就说明了意图；阈值属于 Calibration，从配置读取
const canTakeFastPath = (judgement: Judgement, calibration: Calibration): boolean =>
  judgement.certainty >= calibration.fastPathThreshold;

if (canTakeFastPath(judgement, calibration)) { ... }
```
