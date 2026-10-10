---
status: proposed
---

# 模块之间依赖倒置；组件由配置在唯一的组合根中装配

高层的认知运行时只依赖 `contracts` 包里的抽象（Cognitive Contract），从不依赖具体实现。每个 Provider 实现一个契约，并且只依赖契约。唯一知道具体实现类的地方是组合根：它读取并校验配置，从 Provider 注册表里按 `type` 找到工厂函数，实例化组件，再装配起来。这样无论换本地模型、换云端 Provider，还是换存储或检索方式，都只需要改配置。

模型分为两层：

- **模型连接**：在配置中登记有别名的模型，例如 `local-qwen`、`cloud-x`，由各 Provider 适配器负责具体连接（OpenAI 兼容接口、Vercel AI SDK 等）。
- **认知角色**：Reasoning、Intuition、Embedding 等角色只引用模型的别名。

换模型时只改别名的定义，角色绑定不用动。

## Considered Options

- **由插件自己动态 import 任意模块路径**：灵活，但配置文件就能执行任意代码，被否决。只能实例化注册表里登记过的类型。
- **直接把 Vercel AI SDK 或 LiteLLM 当作核心抽象**：省事，但会让核心依赖第三方 API 的形状，违背依赖倒置。它们只作为 ReasoningProvider 的一种适配器实现。

## Consequences

配置的写法见 docs/research/standards-and-config.md：`{type, config}` 组件模式、命名实例、带版本号的配置格式、按层次合并的覆盖规则，以及每次运行都保存最终生效的配置。
