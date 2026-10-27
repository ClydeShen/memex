# Python 与 C#（.NET）工程工具链调研（语言工具矩阵）

日期：2026-10-13。对象：给"agent 驱动项目的通用启动框架"补上 Python 和 C# 两列，逐个角色找出与 Memex 现有 Node/TS 选择（[tech-stack.md](../../design/tech-stack.md)、[code-style.md](../../design/code-style.md)、[security-and-data.md](../../design/security-and-data.md) 第五节）作用相同的工具。

可信度标记（沿用仓库约定）：
- **[官方/原文]**：读过官方文档、规范（PEP）、工具 README 的相关段落。
- **[官方/原文·摘要]**：只读到概述、目录或命令列表，细节没有读到。
- **[二手]**：第三方描述，没有追到一手来源。
- **[推断]**：本文作者的判断，没有直接证据。
- **[实测]**：2026-10-13 亲自运行命令或调用包仓库 API 得到。版本号和发布日期都来自 PyPI JSON API（`pypi.org/pypi/<包>/json`）或 NuGet 注册 API（`api.nuget.org/v3/registration5-gz-semver2/<包>/index.json`，取最新的稳定版）。

**范围提醒**：Python 一列在临时目录里搭了一个最小项目，用 uv 0.13.0 实际跑过 ruff、ty、import-linter（见 2.5 节）；vulture、deptry、`uv audit`、pip-audit 以及 C# 一列都没有实际运行，只读了文档，第六节列出。

---

## 一、总览矩阵

单元格内的版本号均为 [实测]（日期是该版本上传或发布的日期）。

| 角色 | Node/TS（对照，取自仓库文档） | Python 首选 / 备选 | C# 首选 / 备选 |
|---|---|---|---|
| 1. 版本和包管理 | Node 26（`.nvmrc`）；pnpm 12（`packageManager`）；pnpm workspaces；`pnpm-lock.yaml` | **uv 0.13.0**（2026-10-09）：`.python-version`、`uv.lock`、workspaces / 备选：pip + `pylock.toml`（PEP 751） | **.NET SDK 10（LTS，10.0.12）+ `global.json`**；Central Package Management（`Directory.Packages.props`）；`packages.lock.json` / 备选：不用 CPM，每个项目各自写版本 |
| 2. 格式化 + lint | Biome 2.5（一个工具） | **Ruff 0.17.0**（lint 和格式化用同一个程序）/ 备选：同一工具，经 `uv format` 调用（预览功能） | **`dotnet format` + SDK 自带分析器**（`EnforceCodeStyleInBuild`）/ 备选：CSharpier 1.3.0 负责格式化，分析器负责 lint |
| 3. 类型 / 空值安全 | TypeScript 7.0 `strict` | **Pyright 1.1.414** 或 **Pyrefly 1.3.2**（已发布稳定版）/ 备选：ty 0.0.86（beta，速度最快）、mypy 2.4.0 | **`<Nullable>enable</Nullable>` + `TreatWarningsAsErrors`** + `AnalysisMode` / 备选：再加 Meziantou.Analyzer 3.0.302、Roslynator.Analyzers 5.0.1 |
| 4. 测试 + 性质测试 | Vitest 5；fast-check 4.10 | **pytest 9.1.1 + Hypothesis 6.169.0** / 备选：无（这两个就是事实标准） | **xUnit.net v3（xunit.v3 4.0.2）+ FsCheck 3.4.0** / 备选：MSTest 4.5.1、NUnit 5.0.0、TUnit 1.74.0；CsCheck 4.9.1 |
| 5. 架构边界 | dependency-cruiser 18.5 | **import-linter 2.15**（`forbidden`、`protected`、`layers` 契约）/ 备选：Tach 0.35.3（beta） | **ArchUnitNET 0.13.4**（写成测试）/ 备选：BannedApiAnalyzers 5.6.0（编译期禁用 API）；NetArchTest.Rules 1.3.2 已经 5 年没有发版 |
| 6. 未使用代码 | knip 6.41 | **Ruff F401（未使用的 import）+ vulture 2.16（未使用的代码）+ deptry 0.25.1（未使用或缺失的依赖）** / 备选：Tach `check-external` 只查依赖 | **IDE0051 / IDE0052 / IDE0060 / IDE0005，在构建时启用** / 备选：ReSharper InspectCode（JetBrains.ReSharper.GlobalTools 2026.2.3.1，输出 SARIF） |
| 7. 供应链 | 锁文件 + frozen-lockfile；默认不运行安装脚本；`minimumReleaseAge`；`trustPolicy`；`pnpm audit`；Dependabot | `uv sync --locked`；`no-build = true`；`exclude-newer = "3 days"`；`[tool.uv.sources]` + `explicit = true` 的包源；pip-audit 2.10.1 / `uv audit`（预览）；Dependabot | `dotnet restore --locked-mode`；NuGetAudit（.NET 10 默认审计全部依赖）；`packageSourceMapping`；`signatureValidationMode=require`；**推迟安装新版本：没有对应设置**；Dependabot（默认冷却 3 天） |
| 8. schema → 文档；API 文档；依赖图 | `z.toJSONSchema()`；`depcruise -T mermaid` | **Pydantic 2.14.1** `Field(description=…)` + `model_json_schema()`；API 文档 **mkdocstrings 1.0.7 / griffe 2.3.2**（静态分析）；依赖图 **`tach show --mermaid`** 或 `import-linter drawgraph`（DOT） | **`System.Text.Json` 的 `JsonSchemaExporter`**（.NET 9 起）+ `[Description]`；API 文档 **docfx 2.81.0**（需要编译）；依赖图：**没有官方工具能输出 mermaid 或 DOT**（见第四节） |
| 9. 一条命令检查全部 | `pnpm check` | **`uv run` + 一个任务运行器**：nox 2026.8.17 / just（rust-just 1.58.0）/ poethepoet 0.48.0 | **`Directory.Build.props`（警告视为错误）+ `dotnet build && dotnet test && dotnet format --verify-no-changes`**，外面用一个脚本包起来 |
| 10. Git hooks | `core.hooksPath` + `.githooks/` | **`core.hooksPath`**（通用）/ 备选：prek 0.5.5、pre-commit 4.7.0、lefthook 2.2.2 | **`core.hooksPath`** / 备选：Husky.Net 0.9.1（在 restore 时挂上 hook） |
| 11. CodeQL | 支持 JS / TS | 支持；官方列出的 Python 版本到 3.14 | 支持；C# 到 14，.NET 到 10；默认设置用 `none` 构建模式 |
| 12. 结构与命名 | code-style.md | PEP 8；Packaging Guide 介绍的 src layout；PEP 735 dependency groups | Framework Design Guidelines；C# 标识符命名规范；`.editorconfig` |

---

## 二、Python

运行时：Python 3.15.0 按 PEP 790 的计划在 2026-10-09 发布正式版，python.org 下载目录里已经有 `Python-3.15.0.tgz` [实测]；3.14 系列最新是 3.14.8 [实测]。CodeQL 支持列表目前写到 3.14 [官方/原文]，所以新项目建议先固定在 3.14，等 CodeQL 列出 3.15 再升级 [推断]。

### 2.1 版本管理和包管理

- **首选 uv 0.13.0**（MIT OR Apache-2.0）[实测]。
  - Python 版本：`uv python pin` 生成 `.python-version`，uv 会从当前目录往上查找这个文件 [官方/原文]。
  - 锁文件：`uv run` 和 `uv sync` 会自动更新锁文件；`--locked` 在锁文件过期时报错，不会去改它（等价于 pnpm 的 `--frozen-lockfile`）；`--frozen` 直接用锁文件，不检查是否过期 [官方/原文]。
  - 多项目：用 uv workspaces，文档里有 "When (not) to use workspaces" 一节 [官方/原文·摘要]。
  - 依赖分组：开发依赖放在 PEP 735 的 `[dependency-groups]` 里（已接受，2024-10-10）[官方/原文·摘要]。
- **备选**：pip 加 PEP 751 定义的 `pylock.toml`（标准锁文件格式，2025-03-31 接受）[官方/原文·摘要]。适用条件：团队不能用 uv（例如公司内网只允许 pip）。
- 命令：`uv sync --locked`

### 2.2 格式化和 lint

- **首选 Ruff 0.17.0**（MIT）[实测]。一个程序同时替代 Flake8（加几十个插件）、Black、isort、pyupgrade 等 [官方/原文]；`ruff format` 的设计目标是直接替换 Black [官方/原文]。输出里标明哪些问题能用 `--fix` 自动修复 [实测]。
- uv 0.13 新增了 `uv format`（"与在项目根目录运行 `ruff format` 行为相同"）[官方/原文]，但它在 uv 的预览功能列表里（`format-command`）[官方/原文·摘要]，所以先直接调用 ruff。
- 命令：`ruff check . && ruff format --check .`（两条，但同一个工具）

### 2.3 类型检查

这一块近两年变化最大，现在有四个活跃的检查器：

| 工具 | 版本（日期） | 状态 | 许可证 |
|---|---|---|---|
| Pyright | 1.1.414（2026-09-10） | 成熟；VS Code Pylance 用的就是它 | MIT [实测] |
| Pyrefly（Meta） | 1.3.2（2026-09-28） | README 写明已发布稳定版（1.0.0）；Instagram 用它做默认检查器，每月发一个小版本 [官方/原文] | MIT [官方/原文] |
| ty（Astral） | 0.0.86（2026-10-09） | README："ty is currently in beta"，采用 0.0.x 版本号，还没有稳定的接口 [官方/原文]；号称比 mypy 和 Pyright 快 10–100 倍 [官方/原文] | MIT（PyPI 分类）[实测] |
| mypy | 2.4.0（2026-10-01） | 成熟，`--strict` [官方/原文·摘要] | MIT [实测] |

- **首选**：Pyright（最稳）或 Pyrefly（稳定且快）。两者都是 MIT，都能在命令行运行 [推断]。
- **备选**：ty。它和 uv、Ruff 出自同一家，`uv check` 就是调用 ty（"Currently, this type checks Python code using ty"），而且支持 `--fix` [官方/原文]，对 agent 最友好；但 ty 还在 beta，`uv check` 也是预览功能（`check-command`）[官方/原文·摘要]。等 ty 发布稳定版，就可以换成 ty [推断]。
- 不建议：zuban 0.10.1 使用 AGPL-3.0 许可证 [实测]。
- 最小项目中 `ty check` 输出 "All checks passed!" [实测]。

### 2.4 测试和基于性质的测试

- **pytest 9.1.1**（MIT，2026-06-19）[实测]；覆盖率用 pytest-cov 7.1.0 / coverage 7.16.2 [实测]。
- **Hypothesis 6.169.0**（MPL-2.0，2026-10-11）[实测]，它自称"the property-based testing library for Python"[官方/原文]，作用相当于 fast-check。MPL-2.0 是文件级 copyleft；只作为开发依赖使用、不修改它的源码时，再分发没有问题 [推断]。
- 命令：`uv run pytest`

### 2.5 架构边界检查

- **首选 import-linter 2.15**（BSD-2，Production/Stable，2026-09-04）[实测]。用 `pyproject.toml` 的 `[tool.importlinter]` 配置 [官方/原文]。契约类型有 Forbidden、Protected、Layers、Independence、Acyclic siblings [官方/原文]，其中：
  - `forbidden`："一组模块不能被另一组模块 import" [官方/原文]，对应"核心不能 import 实现"。
  - `protected`："除了允许列表里的模块，其他模块都不能直接 import 被保护的模块" [官方/原文]，正好对应"只有装配入口（Composition Root）能引用具体实现"。
  - **[实测]**：在最小项目里配置一条 `forbidden` 和一条 `protected` 契约。新增一个 `demo.core.bad` 去 import `demo.adapters` 后，`lint-imports` 报告两条契约都被破坏，并给出具体的文件和行号（`demo.core.bad -> demo.adapters (l.1)`）。import-linter 只做静态分析，不需要运行代码。
- **备选 Tach 0.35.3**（MIT，Beta，2026-10-06；仓库已改名为 tach-org/tach，没有归档）[实测]。用 Rust 写，能检查"只从声明过的依赖 import""跨模块调用只走公开接口""没有循环依赖"三件事 [官方/原文]，还有 `check-external`（检查第三方依赖是否已声明）和 `show --mermaid` [官方/原文]。适用条件：需要"公开接口"检查，或者需要输出 mermaid 图。
- 最轻的补充：Ruff 的 `TID251 banned-api` 可以禁止某个模块被 import，并给出自定义的提示消息 [实测]。但它是全局禁止，不区分"谁可以 import"，所以只能作为补充 [推断]。
- 配置示例：见第五节。

### 2.6 未使用代码

Python 没有一个工具能像 knip 那样一次查完文件、导出和依赖，需要组合三个工具：
- **Ruff F401**：未使用的 import（部分可以自动修复）[官方/原文·摘要]，[实测]。
- **vulture 2.16**（MIT，2026-03-25）：查找未使用的代码；README 自己承认，由于 Python 是动态语言，会漏报，也会把隐式调用的代码误报为未使用 [官方/原文]。需要维护一个白名单 [推断]。
- **deptry 0.25.1**（MIT，2026-03-18）：查找未使用或缺失的依赖，支持 uv 和 PEP 621 [官方/原文]。注意 PyPI 上的分类仍然是 "3 - Alpha" [实测]。

### 2.7 依赖供应链安全

| Node/pnpm 的设置 | Python 等价物 | 可信度 |
|---|---|---|
| 提交锁文件 + `--frozen-lockfile` | 提交 `uv.lock`，CI 中用 `uv sync --locked` | [官方/原文] |
| 默认不运行安装脚本（`allowBuilds`） | wheel 安装时不运行任何代码；只有从源码包（sdist）构建时才运行构建后端的代码。`[tool.uv] no-build = true` 禁止构建源码包（工作区内自己的包仍然会构建）；`no-build-package` 可以只禁止某些包 | [官方/原文]（uv 设置）；"wheel 安装时不运行代码"是 [推断] |
| `minimumReleaseAge` | `[tool.uv] exclude-newer = "3 days"`：按每个文件的上传时间过滤，支持 "24 hours"、"1 week"、`P7D` 这样的时长；`exclude-newer-package` 可以单独设置某个包。pip 有 `--uploaded-prior-to P3D` | [官方/原文]；`uv sync` 在设置了 `"3 days"` 时正常完成 [实测] |
| `trustPolicy: no-downgrade` | **没有对应项**（第四节） | [推断]（没有找到） |
| 已知漏洞审计 | **pip-audit 2.10.1**（PyPA 维护，Apache-2.0）：`pip-audit --locked .` 审计项目锁文件，数据来自 PyPI 或 OSV，支持 `--fix`。uv 0.13 的 `uv audit` 除了已知漏洞，还会检查 "deprecation and quarantine" 等状态，但它是预览功能（`audit-command`） | [官方/原文]；[实测]（`uv audit --help` 在 0.13.0 中存在） |
| 恶意包检查 | uv 的 `audit.malware-check = true`：同步时用 OSV 的 MAL 公告检查锁文件，命中就中止（预览功能） | [官方/原文] |
| 限定包来源 | 在 `[[tool.uv.index]]` 里设置 `explicit = true`，再用 `[tool.uv.sources]` 把某个包绑定到这个源；绑定只能写在项目的 `pyproject.toml` 里 | [官方/原文] |
| Dependabot | 支持 `uv` 生态（文档写的是 uv v0.11）；`cooldown` 默认 3 天（只对版本更新生效，安全更新不受影响） | [官方/原文] |

### 2.8 schema 导出、API 文档、依赖图

- **schema**：Pydantic 2.14.1 [实测]。`BaseModel.model_json_schema()` 生成 JSON Schema（Draft 2020-12），`Field(description=…)` 会写进 schema [官方/原文]。相当于 Zod 的 `.describe()` 加 `toJSONSchema`。
- **API 文档（不依赖构建）**：首选 mkdocstrings 1.0.7 + griffe 2.3.2（ISC 许可证）。griffe 的示例输出里写明 `"analysis": "static"`，也就是不 import 代码 [官方/原文·摘要]。备选 pdoc 16.0.0（MIT-0，最后一次发布在 2025-10-27），零配置 [实测]，但它是否需要 import 被文档化的模块没有核实。注意 mkdocs 本体最后一次发布是 1.6.1（2024-08-30）[实测]；mkdocs-material 9.7.7（2026-07）仍在发布；它的作者推出了 Zensical（0.0.70，还在 0.0.x）[实测]。用 Sphinx 9.1.0 加 sphinx-autoapi 3.8.1 也行 [实测]。
- **依赖图**：首选 `tach show --mermaid`（不加 `--mermaid` 时输出 DOT）[官方/原文]；或者 `import-linter drawgraph <包>`，向标准输出写 DOT [官方/原文]。备选 pydeps 3.0.9（`--show-dot`、`--dot-output`，需要 Graphviz）[官方/原文·摘要]。

### 2.9 一条命令检查全部

uv 自己没有任务运行器 [推断：命令列表里没有]。常见做法：
- **首选 nox 2026.8.17**（Apache-2.0）：在 `noxfile.py` 里用 Python 定义各个检查（session）[官方/原文]。也可以把所有检查写进一个 session，用 `uv run nox -s check` 一次跑完 [推断]。
- **备选 just**（PyPI 上的包名是 rust-just 1.58.0）：语言无关，Node、Python、C# 三列可以共用同一种写法 [推断]。或者用 poethepoet 0.48.0（MIT），把任务写在 `pyproject.toml` 里 [实测：版本]。tox 4.65.4 + tox-uv 1.37.0 适合需要测多个 Python 版本的库 [实测：版本]。
- 示例见第五节。

### 2.10 Git hooks

- **`core.hooksPath` 对任何语言都通用**：git 官方文档说明它可以是相对路径，相对于运行 hook 的目录 [官方/原文]。Python 项目里没有 `prepare` 这种生命周期脚本，需要在 README 或 `just setup` 里提示执行一次 `git config core.hooksPath .githooks` [推断]。
- **备选 prek 0.5.5**（MIT，Production/Stable）[实测]：兼容 pre-commit 的配置和 hook，支持 monorepo，与 uv 集成；`prek update --cooldown-days` 可以推迟采用刚发布的 hook 版本，并能把 hook 固定到 commit SHA [官方/原文]。pre-commit 4.7.0 是原版 [实测]。lefthook 2.2.2 也发布在 PyPI 上 [实测]。

### 2.11 CodeQL

支持 Python 2.7 和 3.5–3.14，不需要构建 [官方/原文]。

### 2.12 项目结构和命名

- **src layout**：Packaging User Guide 指出，src layout 要求先安装项目才能运行代码，这样可以避免误用当前目录下的开发副本（Python 会把当前目录放在 import 路径的第一位），也能保证可编辑安装只能 import 本来就应该能 import 的文件 [官方/原文]。uv 的 `uv_build` 后端默认就用这种布局 [推断]。
- 命名：PEP 8 的 Naming Conventions 一节 [官方/原文·摘要]。类型信息的发布方式以 typing spec 为准，PEP 561 已经标为历史文档 [官方/原文]。

### 2.13 与 AI agent 协作的注意点

- Astral 为 uv、Ruff、ty 提供了 `llms.txt`（`docs.astral.sh/{uv,ruff,ty}/llms.txt` 都返回 200）[实测]。
- Ruff、ty、import-linter 的输出都带文件和行号，Ruff 还标明哪些问题可以 `--fix` [实测]，适合 agent 修了再检查、反复循环 [推断]。
- vulture 有误报（见 2.6），不要让 agent 按它的结果直接删除代码，应该先把误报加进白名单 [推断]。

---

## 三、C#（.NET）

运行时：.NET 10 是 LTS，最新 10.0.12（2026-09-08），支持到 2028-11-14；.NET 11 处于 rc.1（go-live）；.NET 8 和 9 都在 2026-11-10 结束支持 [实测：releases-index.json]。新项目选 .NET 10 [推断]。

### 3.1 版本管理和包管理

- **SDK 版本**：用 `global.json` 固定。`rollForward` 控制可以接受的版本范围 [官方/原文]。NuGet 文档提醒，SDK 版本变化会改变隐式包引用的版本，导致 locked mode 下的 restore 失败；可以把 `rollForward` 设为 `disable`，代价是所有人和 CI 必须用同一个 SDK [官方/原文]。
- **集中管理版本**：根目录放 `Directory.Packages.props`，设置 `ManagePackageVersionsCentrally=true`，用 `<PackageVersion>` 列出版本（`dotnet new packagesprops` 可以生成）[官方/原文]；`CentralPackageTransitivePinningEnabled` 可以连间接依赖的版本一起固定 [官方/原文]。
- **锁文件**：`RestorePackagesWithLockFile=true` 会生成 `packages.lock.json`；CI 中用 `dotnet restore --locked-mode`（或 `RestoreLockedMode=true`），依赖和锁文件不一致时 restore 失败 [官方/原文]。注意锁文件是每个项目一份，不是整个仓库一份 [官方/原文·摘要]。
- **工具**：本地工具的版本记在 `.config/dotnet-tools.json`；从 .NET 10 起，第一次安装本地工具时会自动创建这个清单 [官方/原文]。
- 命令：`dotnet restore --locked-mode`

### 3.2 格式化和 lint

- **首选：SDK 自带的 `dotnet format` 加分析器**。`dotnet format` 按 `.editorconfig` 的设置调整代码风格，并应用分析器的建议；`--verify-no-changes` 用来做检查 [官方/原文]。代码风格规则（IDE 开头的规则）默认不在构建时检查，需要设置 `EnforceCodeStyleInBuild=true`，再在 `.editorconfig` 里把规则的严重性设为 warning 或 error [官方/原文]。
- **备选 CSharpier 1.3.0**（MIT，2026-06-07）[实测]：有固定风格的格式化工具，算法移植自 prettier，原则上不接受新增配置项的请求 [官方/原文]。适用条件：希望格式化完全没有争论（像 Biome、Prettier 那样）。此时 lint 仍然交给分析器 [推断]。
- 两条命令：`dotnet build`（运行分析器）+ `dotnet format --verify-no-changes`。

### 3.3 类型和空值安全

- `<Nullable>enable</Nullable>`（编译器选项，开启可空引用类型的检查）[官方/原文]，加上 `TreatWarningsAsErrors`（`-warnaserror`）[官方/原文]，空值警告就会让构建失败。
- `AnalysisMode` 可以设为 None / Default / Minimum / Recommended / All；Default 只把少量规则作为构建警告 [官方/原文]。Microsoft.CodeAnalysis.NetAnalyzers 10.0.401 随 SDK 提供 [实测：版本]。
- 补充分析器（可选）：Meziantou.Analyzer 3.0.302（MIT，2026-10-13）、Roslynator.Analyzers 5.0.1（Apache-2.0，2026-10-04）[实测]。StyleCop.Analyzers 的最新稳定版还是 1.1.118（2019 年）[实测]，不推荐使用。

### 3.4 测试和基于性质的测试

- **首选 xUnit.net v3**（xunit.v3 4.0.2，Apache-2.0，2026-10-09）[实测]，内置支持 Microsoft Testing Platform（MTP）[官方/原文]。从 .NET 10 SDK 开始，可以在 `global.json` 里写 `"test": { "runner": "Microsoft.Testing.Platform" }` 来选择测试运行器；不写时默认仍是 VSTest [官方/原文]。
- 备选：MSTest 4.5.1、NUnit 5.0.0（2026-09-27）、TUnit 1.74.0，都是 MIT [实测]。ArchUnitNET 为 xUnit v3、NUnit、MSTest 都提供了扩展包 [官方/原文]，换哪个框架都不影响架构测试。
- **性质测试**：首选 FsCheck 3.4.0（BSD-3，2026-08-20），并有 FsCheck.Xunit.v3 3.4.0 [实测]；备选 CsCheck 4.9.1（Apache-2.0，2026-09-17）[实测]。两者在 C# 中用起来顺不顺手没有比较（第六节）。

### 3.5 架构边界检查

- **首选 ArchUnitNET 0.13.4**（Apache-2.0，2026-08-20；仓库 2026-10-12 仍有提交）[实测]。它分析编译好的程序集，可以检查类、成员、接口之间的依赖，规则写成单元测试，在 `dotnet test` 中运行 [官方/原文]。所以它**依赖构建**，这一点与 import-linter、dependency-cruiser 不同 [推断]。
- **备选 1：Microsoft.CodeAnalysis.BannedApiAnalyzers 5.6.0**（MIT）[实测]。在编译期禁止使用指定的 API，可以在 `Contracts` 或核心项目里禁止引用实现类 [推断：用法没有读文档]。不过 C# 本身最强的边界是**项目引用**：核心项目只要不引用实现项目，就根本无法使用实现类型 [推断]。
- **不推荐 NetArchTest.Rules 1.3.2**：最后一次发版是 2021-05-23，仓库最后一次提交是 2024-07 [实测]。它的分支 NetArchTest.eNhancedEdition 1.4.5 最后一次发版是 2025-06 [实测]。

### 3.6 未使用代码

- 代码风格规则：IDE0051（未使用的私有成员）、IDE0052（未读取的私有成员）、IDE0060（未使用的参数）、IDE0005（不必要的 using）[官方/原文·摘要]。设置 `EnforceCodeStyleInBuild` 后，在 `.editorconfig` 中设为 warning，构建时就会检查 [官方/原文]。
- 跨项目的"未使用的公开类型或成员"：SDK 没有这种检查。备选 ReSharper InspectCode（JetBrains.ReSharper.GlobalTools 2026.2.3.1，可作为 .NET 工具安装，从 2024.1 起默认输出 SARIF）[官方/原文]，[实测：版本]；许可证条款没有核实。
- "未使用的 NuGet 依赖"：没有找到官方工具（第四节）。

### 3.7 依赖供应链安全

| Node/pnpm 的设置 | .NET 等价物 | 可信度 |
|---|---|---|
| 锁文件 + frozen | `packages.lock.json` + `dotnet restore --locked-mode` | [官方/原文] |
| 默认不运行安装脚本 | 用 PackageReference 时，包里的 `install.ps1` 和 `uninstall.ps1` **不会被执行** [官方/原文]。但包里可以带 MSBuild 的 `.props`/`.targets` 文件和分析器，它们会在**构建时**运行，**没有类似 `allowBuilds` 的放行列表** | 前半句 [官方/原文]；后半句 [推断] |
| `minimumReleaseAge` | **NuGet 没有这个设置**。只能靠 Dependabot 的 `cooldown`（版本更新默认推迟 3 天） | [推断]（NuGet 文档中没有找到）；Dependabot 部分 [官方/原文] |
| `trustPolicy` | 最接近的是 NuGet.Config 的 `signatureValidationMode`：可选 `accept`（默认）或 `require`，设为 `require` 后只接受有签名的包 [官方/原文]；指定可信签名者用 `trustedSigners`（细节没有读）。这个设置只看包有没有签名，**不比较**新版本的可信度是否低于旧版本 | [官方/原文] / [推断] |
| 已知漏洞审计 | **NuGetAudit**：restore 时自动审计。`NuGetAuditMode` 在目标框架为 net10.0 及以上时默认是 `all`（包括间接依赖），否则默认是 `direct`；`NuGetAuditLevel` 默认是 `low`。可以用 `WarningsAsErrors` 把 NU1903/NU1904（高危/严重）设为错误；如果已经开了 `TreatWarningsAsErrors`，文档建议用 `WarningsNotAsErrors` 排除 NU1901–NU1904，免得以后新公布的漏洞让构建突然失败。.NET 10 起有 `dotnet package update --vulnerable` | [官方/原文] |
| 限定包来源 | **Package Source Mapping**：在 NuGet.Config 中先用 `<clear/>` 清空继承来的源，再用 `<packageSourceMapping>` 按包名模式把包绑定到指定的源 | [官方/原文] |
| Dependabot | 支持 `nuget` 生态（文档写的是 nuget <=6.12.0） | [官方/原文] |

### 3.8 schema 导出、API 文档、依赖图

- **schema**：`System.Text.Json.Schema.JsonSchemaExporter`（.NET 9 起），`options.GetJsonSchemaAsNode(typeof(T))` [官方/原文]。描述文字**不会自动写入 schema**：官方示例用 `TransformSchemaNode` 回调读取 `[Description]` 特性，再自己写进去 [官方/原文]。也可以用第三方的 JsonSchema.Net 9.4.1、NJsonSchema 11.6.1 [实测：版本]。
- **API 文档**：docfx 2.81.0（MIT，2026-09-25）[实测]，能把程序集、XML 文档注释、Swagger 和 Markdown 转成 HTML、JSON 或 PDF [官方/原文]。它需要编译或读取程序集，**没有找到不依赖构建的 C# API 文档工具** [推断]。
- **依赖图**：**没有官方工具能输出 mermaid 或 DOT**。dotnet-depends 0.8.0 最后一次发布在 2024-09 [实测]。替代办法见第四节。

### 3.9 一条命令检查全部

- 把规则集中写在根目录的 `Directory.Build.props`，它会作用于该目录及所有子目录下的项目 [官方/原文]。也可以用 `Directory.Build.rsp` 给 `dotnet build` 设置默认的命令行参数 [官方/原文]。
- 惯用组合：`dotnet restore --locked-mode && dotnet build --no-restore && dotnet test --no-build && dotnet format --verify-no-changes --no-restore`。外面用 `just check` 或 `check.ps1` / `check.sh` 包一层 [推断]。示例见第五节。

### 3.10 Git hooks

- **首选 `core.hooksPath`**（同 2.10 节，与语言无关）[官方/原文]。
- 备选 Husky.Net 0.9.1（MIT，2026-03-13）[实测]：`dotnet husky install`，hook 放在 `.husky/` 下；自动安装的方式是在 `.csproj` 里加一个 `AfterTargets="Restore"` 的 MSBuild Target，CI 中可以设 `HUSKY=0` 关闭 [官方/原文]。这等于让 restore 运行一段脚本，与"安装时不运行代码"的原则相反，所以只把它列为备选 [推断]。

### 3.11 CodeQL

支持 C# 到 14、.NET 5–10，支持 `.slnx` [官方/原文]。默认设置下 C# 用 `none` 构建模式（不需要构建；对生成的代码不做分析）[官方/原文]。

### 3.12 项目结构和命名

- Framework Design Guidelines（Microsoft Learn）[官方/原文·摘要]。C# 标识符命名规范：类型、命名空间和所有公开成员用 PascalCase；接口以 `I` 开头等；编译器不强制这些规范 [官方/原文]。命名规则可以写进 `.editorconfig`（`dotnet_naming_rule`），在构建时检查 [推断]。
- `.editorconfig` 中加 `root = true`，就不再向上读取更高层目录的设置 [官方/原文]。
- 目录布局：`src/` 加 `tests/` 加根目录的 `.slnx`，这是社区惯例 [推断]，没有找到官方规定。

### 3.13 与 AI agent 协作的注意点

- **dotnet/skills**：.NET 团队维护的 agent skills 和 custom agent 集合，遵循 Agent Skills 标准，按插件分为 dotnet、dotnet-advanced、dotnet-data、dotnet-diag 等，并带 C# LSP 集成 [官方/原文]。启动 C# 项目时可以考虑引入。
- Roslynator 仓库里的 `.claude/skills/` 是给**它自己的贡献者**用的 [官方/原文]，与使用 Roslynator 的项目无关。
- C# 的架构测试、未使用代码检查和 docfx 都依赖构建，agent 的检查循环比 Python 慢。建议 pre-commit 只跑 `dotnet format --verify-no-changes`，完整检查放到 pre-push [推断]。

---

## 四、没有等价物或有差距的地方

| 能力 | Python | C# | 补救办法 |
|---|---|---|---|
| 推迟安装刚发布的版本 | 有（uv `exclude-newer` 时长、pip `--uploaded-prior-to`） | **没有** | C#：依赖只通过 Dependabot 升级（冷却期默认 3 天，可以调长），开 `--locked-mode`，审查锁文件的变化 [推断] |
| 拒绝可信度下降的版本（`trustPolicy`） | **没有** | **没有**（只有 `signatureValidationMode=require`，只看有没有签名） | 两种语言都靠锁文件加人工审查。Python 可以用 `explicit` 包源加 `exclude-newer` 降低风险 [推断] |
| 安装脚本的放行列表 | 粒度不同：用 `no-build` 全局禁止构建源码包，再用 `no-build-package` 精确控制 | **没有**：MSBuild targets 和分析器在构建时运行，无法逐个放行 | C#：用 Package Source Mapping 限定包来源，用签名校验，并减少依赖 [推断] |
| 一个工具查完所有未使用的东西（knip） | 需要三个工具（Ruff F401 + vulture + deptry） | 只有成员级的分析器规则；跨项目检查要用 ReSharper InspectCode；**未使用的 NuGet 依赖没有官方工具** | 接受组合方案；C# 的未使用依赖靠审查 [推断] |
| 不依赖构建的架构检查 | 有（import-linter 静态分析） | **没有**：ArchUnitNET 分析编译后的程序集 | C# 主要靠项目引用划边界，ArchUnitNET 测试作为第二道检查 [推断] |
| 输出 mermaid/DOT 依赖图 | 有（`tach show --mermaid`、`import-linter drawgraph`） | **没有官方工具** | 写一个小脚本：从 `.slnx` 和各 `.csproj` 的 `ProjectReference` 生成项目级 mermaid 图 [推断]。这个脚本还没有写，也没有验证 |
| 描述文字自动写入 schema（像 Zod `.describe()`） | 有（Pydantic `Field(description=)`） | 需要在 `TransformSchemaNode` 里自己处理 `[Description]` | 在契约项目里写一个统一的 exporter 辅助函数 [推断] |
| 根项目的生命周期脚本（像 `prepare`） | 没有 | 没有（Husky.Net 用 MSBuild Target 实现，不推荐） | 在 `just setup` 里执行 `git config core.hooksPath .githooks`，README 中写明 [推断] |

---

## 五、最小工程骨架

### 5.1 Python

```
.python-version          # 3.14
pyproject.toml           # 依赖、dependency-groups、ruff/ty/importlinter 配置
uv.lock                  # 提交
noxfile.py               # 或 justfile
.githooks/pre-commit     # ruff check + ruff format --check
src/<pkg>/
  contracts/  core/  adapters/  main.py   # main.py 是唯一的装配入口
tests/
```

`pyproject.toml` 片段（`[tool.uv]` 和 `[tool.importlinter]` 两段已在最小项目中验证 [实测]）：

```toml
[dependency-groups]
dev = ["pytest", "hypothesis", "ruff", "pyright", "import-linter", "vulture", "deptry", "pip-audit", "nox"]

[tool.uv]
exclude-newer = "3 days"   # 推迟安装刚发布的版本
no-build = true            # 不构建第三方源码包

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "TID"]

[tool.importlinter]
root_package = "pkg"

[[tool.importlinter.contracts]]
name = "core does not import adapters"
type = "forbidden"
source_modules = ["pkg.core"]
forbidden_modules = ["pkg.adapters"]

[[tool.importlinter.contracts]]
name = "adapters only imported by the composition root"
type = "protected"
protected_modules = ["pkg.adapters"]
allowed_importers = ["pkg.main"]
```

`noxfile.py`（一条命令：`uv run nox -s check`）[推断：没有运行过]：

```python
import nox

@nox.session(venv_backend="none")
def check(s: nox.Session) -> None:
    for cmd in (["ruff", "check", "."], ["ruff", "format", "--check", "."],
                ["pyright"], ["lint-imports"], ["vulture", "src"],
                ["deptry", "."], ["pytest", "-q"]):
        s.run(*cmd, external=True)
```

CI：`uv sync --locked && uv run nox -s check && uv run pip-audit --locked .`

### 5.2 C#

```
global.json              # SDK 版本 + "test": {"runner": "Microsoft.Testing.Platform"}
Directory.Build.props    # 统一的编译规则
Directory.Packages.props # 集中管理包版本
NuGet.config             # <clear/> + packageSourceMapping
.editorconfig            # root = true；代码风格和命名规则
.config/dotnet-tools.json
App.slnx
src/App.Contracts/  src/App.Core/  src/App.Adapters.X/  src/App.Host/   # Host 是唯一的装配入口
tests/App.Tests/  tests/App.ArchTests/                                 # ArchTests 用 ArchUnitNET
```

`Directory.Build.props` 片段（各项属性的含义都读过官方文档，组合起来没有构建过）：

```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <WarningsNotAsErrors>$(WarningsNotAsErrors);NU1901;NU1902;NU1903;NU1904</WarningsNotAsErrors>
    <AnalysisMode>Recommended</AnalysisMode>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>
    <RestoreLockedMode Condition="'$(CI)' == 'true'">true</RestoreLockedMode>
  </PropertyGroup>
</Project>
```

一条命令（`check.sh`，或者 just 的一个 recipe）：

```sh
dotnet restore --locked-mode && dotnet build --no-restore && dotnet test --no-build && dotnet format --verify-no-changes --no-restore
```

---

## 六、尚未核实

- uv 0.13 的 `uv audit`、`uv check`、`uv format` 在实际运行时是否必须加 `--preview` 或 `--preview-features`：只确认了它们出现在预览功能列表里，并且 `--help` 能显示 [实测]，没有实际运行。
- vulture、deptry、`pip-audit --locked`（能否读取 `uv.lock`）、`pydantic.model_json_schema()`、`import-linter drawgraph` 都没有在最小项目里运行。
- C# 骨架（第五节的 `Directory.Build.props` 组合）没有构建过；`AnalysisMode=Recommended` 对一个空项目会产生多少警告不知道。
- Husky.Net 是否通过 `core.hooksPath` 实现，没有读到原文。
- ReSharper 命令行工具（InspectCode）的许可证条款。
- Dependabot 的 `nuget` 生态能否正确更新 `Directory.Packages.props` 和 `packages.lock.json`；`uv` 生态写的版本（v0.11）是否支持 uv 0.13 的锁文件。
- NuGet 有没有类似 `minimumReleaseAge` 的设置：在审计、源映射、NuGet.Config 三页都没有找到，但没有逐页查遍。
- pdoc 是否需要 import 被文档化的模块；griffe "静态分析"只看到示例输出。
- BannedApiAnalyzers 的具体配置方法（`BannedSymbols.txt`）。
- FsCheck 与 CsCheck 在 C# 中用起来是否顺手，没有比较。
- `dotnet list package --include-transitive --format json` 能否作为自写依赖图脚本的数据来源。
- Renovate 的 `minimumReleaseAge` 对 NuGet 是否有效（可能可以弥补 C# 的空缺），没有查。

## 七、需要用户决定的事

1. Python 类型检查器选哪个：Pyright（最稳）、Pyrefly（稳定且快），还是现在就用 beta 的 ty（与 uv、Ruff 同一家，`uv check` 原生调用，支持 `--fix`）。
2. Python 一条命令的运行器选 nox（Python 写）还是 just（三种语言统一）。
3. C# 格式化用 `dotnet format`（可以配置，SDK 自带）还是 CSharpier（固定风格，多一个工具）。
4. C# 测试框架用 xUnit v3（社区默认）还是 MSTest 或 TUnit。
5. 是否接受 C# 在"推迟安装新版本""安装脚本放行列表"两项上的空缺，只用 Dependabot 冷却期加锁文件审查来弥补。
6. 是否值得为 C# 自己写一个输出 mermaid 的项目依赖图脚本。

## 八、来源

- https://docs.astral.sh/uv/concepts/projects/sync/ — uv 锁文件 `--locked`/`--frozen`、恶意包检查（预览）
- https://docs.astral.sh/uv/reference/settings/ — `exclude-newer`（时长格式）、`no-build`
- https://docs.astral.sh/uv/reference/cli/ — `uv check`（调用 ty）、`uv audit`、`uv format` 的说明
- https://docs.astral.sh/uv/concepts/preview/ — 预览功能列表（audit-command、check-command、format-command、malware-check）
- https://docs.astral.sh/uv/concepts/indexes/ — `explicit = true` 和 `tool.uv.sources` 绑定包源
- https://docs.astral.sh/uv/concepts/python-versions/ — `.python-version`
- https://docs.astral.sh/uv/concepts/projects/workspaces/ — uv workspaces（目录）
- https://docs.astral.sh/uv/llms.txt — Astral 提供给 LLM 的文档索引
- https://docs.astral.sh/ruff/ 、https://docs.astral.sh/ruff/formatter/ — Ruff 替代的工具、与 Black 的关系
- https://docs.astral.sh/ruff/rules/banned-api/ 、https://docs.astral.sh/ruff/rules/unused-import/ — TID251、F401
- https://docs.astral.sh/ty/ 、https://raw.githubusercontent.com/astral-sh/ty/main/README.md — ty 的定位和 beta 状态
- https://raw.githubusercontent.com/facebook/pyrefly/main/README.md 、…/LICENSE — Pyrefly 稳定版状态、MIT 许可证
- https://mypy.readthedocs.io/en/stable/command_line.html — mypy 的 strict 系列选项
- https://hypothesis.readthedocs.io/en/latest/ — Hypothesis 介绍
- https://import-linter.readthedocs.io/en/stable/ 及 contract_types/forbidden、protected、layers，get_started/configure，ui — import-linter 契约类型、pyproject 配置、drawgraph
- https://raw.githubusercontent.com/gauge-sh/tach/main/README.md 、https://docs.gauge.sh/usage/commands — Tach 的能力，`show --mermaid`、`check-external`
- https://github.com/jendrikseipp/vulture — vulture 的定位和误报说明
- https://deptry.com/ — deptry 的定位
- https://raw.githubusercontent.com/pypa/pip-audit/main/README.md — pip-audit 的数据源、`--locked`、`--fix`
- https://pip.pypa.io/en/stable/cli/pip_install/ — `--uploaded-prior-to`
- https://pydantic.dev/docs/validation/latest/concepts/json_schema/ — `model_json_schema` 和 `Field(description=)`
- https://mkdocstrings.github.io/griffe/ — griffe 静态分析示例
- https://pdoc.dev/docs/pdoc.html — pdoc 文档
- https://github.com/thebjorn/pydeps — pydeps 命令行选项
- https://nox.thea.codes/en/stable/ — nox 配置方式
- https://prek.j178.dev/ — prek 的兼容性和 `--cooldown-days` 等安全措施
- https://lefthook.dev/ — lefthook 配置项目录
- https://git-scm.com/docs/git-config — `core.hooksPath`
- https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/ — src layout 的理由
- https://peps.python.org/pep-0008/ 、pep-0561/、pep-0735/、pep-0751/、pep-0790/ — 风格、类型信息、依赖分组、锁文件、3.15 发布计划
- https://codeql.github.com/docs/codeql-overview/supported-languages-and-frameworks/ — CodeQL 支持的 Python 和 C# 版本
- https://docs.github.com/en/code-security/code-scanning/creating-an-advanced-setup-for-code-scanning/codeql-code-scanning-for-compiled-languages — C# 的 none 构建模式
- https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference — Dependabot `cooldown`（默认 3 天）
- https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories — 支持 uv 和 nuget 生态
- https://builds.dotnet.microsoft.com/dotnet/release-metadata/releases-index.json — .NET 各版本的支持状态
- https://learn.microsoft.com/en-us/nuget/consume-packages/package-references-in-project-files — `packages.lock.json`、locked mode、SDK 版本与锁文件
- https://learn.microsoft.com/en-us/nuget/consume-packages/central-package-management — CPM、传递依赖固定
- https://learn.microsoft.com/en-us/nuget/consume-packages/package-source-mapping — 包源映射
- https://learn.microsoft.com/en-us/nuget/concepts/auditing-packages — NuGetAudit 的设置项和默认值、警告视为错误的配置
- https://learn.microsoft.com/en-us/nuget/reference/nuget-config-file — `signatureValidationMode`
- https://learn.microsoft.com/en-us/nuget/consume-packages/migrate-packages-config-to-package-reference — PackageReference 不执行 install.ps1
- https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-format — `dotnet format`、`--verify-no-changes`
- https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/overview — AnalysisMode、EnforceCodeStyleInBuild
- https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-options/language 、…/errors-warnings — Nullable、TreatWarningsAsErrors
- https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/style-rules/ide0005 、ide0051、ide0052、ide0060 — 未使用代码相关规则
- https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-test — 在 global.json 中选择 MTP 测试运行器
- https://learn.microsoft.com/en-us/dotnet/core/tools/global-json — SDK 版本固定和 rollForward
- https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-tool-install — 本地工具清单
- https://learn.microsoft.com/en-us/visualstudio/msbuild/customize-by-directory — Directory.Build.props/.rsp
- https://learn.microsoft.com/en-us/visualstudio/ide/create-portable-custom-editor-options — `.editorconfig` 的 root
- https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/extract-schema — JsonSchemaExporter 和处理 Description 的示例
- https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/ — Framework Design Guidelines
- https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/identifier-names — C# 命名规范
- https://xunit.net/docs/getting-started/v3/microsoft-testing-platform — xUnit v3 内置支持 MTP
- https://raw.githubusercontent.com/TNG/ArchUnitNET/main/README.md — ArchUnitNET 的能力和测试框架扩展
- https://raw.githubusercontent.com/BenMorris/NetArchTest/master/README.md — NetArchTest 的定位
- https://csharpier.com/docs/About — CSharpier 的定位
- https://alirezanet.github.io/Husky.Net/guide/getting-started.html 、…/automate.html — Husky.Net 安装和 restore 时自动挂载
- https://dotnet.github.io/docfx/index.html — docfx 能力
- https://www.jetbrains.com/help/resharper/InspectCode.html — InspectCode 输出 SARIF
- https://raw.githubusercontent.com/dotnet/roslynator/main/README.md — Roslynator 组成，以及给贡献者用的 agent skills
- https://raw.githubusercontent.com/dotnet/skills/main/README.md — .NET 团队的 agent skills
- 版本数据：https://pypi.org/pypi/&lt;包&gt;/json 、https://api.nuget.org/v3/registration5-gz-semver2/&lt;包&gt;/index.json 、https://azuresearch-usnc.nuget.org/query
