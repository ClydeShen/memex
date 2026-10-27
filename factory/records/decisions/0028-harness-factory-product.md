---
status: accepted
---

# 仓库分三区：harness 驱动，factory 由 agent 自治，memex/ 孤立存在

负责人担心：从验证到产品的过程中，产品里会残留实验内容、过程文件，以及提示词和注释里对过去的解释。负责人要求产品始终只包含当前版本的内容，完全孤立存在；记录、历史等其他内容用统一的方式管理，边界要严格（2026-10-27）。

ADR 0020 已经把实验工具和产品分开，ADR 0026 规定 as-built 文档只写现状。但还有几处没有覆盖：产品代码、实验代码和开发文档混在同一层目录里；代码注释可以写"见 ADR"（code-style 第十节）；实验数据和产品实例的数据放在同一个 `.memex/` 下；驱动 agent 工作的配置没有固定的位置，也没有考虑多个 agent 工具共用。

## 决定

### 一、三个区，每个区一个顶层目录

| 区 | 是什么 | 谁管理 | 写法 |
|---|---|---|---|
| `harness/` | 驱动：deliver agent 怎样工作的配置。agent 指令、共享 skill、规范、工作流、模板、检查 | 用户和 agent 共同管理。agent 的修改以提议的形式提交，由用户批准 | 只写当前状态 |
| `factory/` | 生产 Memex 的车间：图纸（设计文档）、工单和日志（决策、调研、计划）、试验台（验证工具）、检验记录（as-built） | 按 harness 配置好的 agent 自治管理。需要负责人确认的事项（例如 ADR、VISION 的原则）由 harness 的工作流规定，负责人不直接维护 factory | 按子目录分：当前状态，或者累积 |
| `memex/` | 成品：发布出去的全部内容，包括代码、Provider、提示词、产品配置、schema、用户文档 | 实现 agent 按 story 交付 | 只写当前状态，自己说明自己 |

判断一个文件放在哪里：换一个产品，它还用得上，放 `harness/`；只对 Memex 有意义但不发布，放 `factory/`；发布出去的，放 `memex/`。

从其他团队通用的标准（`playbook/`）里挑选出来、配置成本团队做法的部分，放在 `harness/`。playbook 本身不是 Memex 的 harness，单独放在顶层，以后可以拆成独立仓库。

### 二、factory 的子目录

| 子目录 | 放什么 | 写法 |
|---|---|---|
| `factory/design/` | VISION、GLOSSARY、HANDOFF、roadmap、架构、契约、依赖、技术栈、安全与数据、目录结构、代码风格、open-questions | 当前状态：改动时直接改写 |
| `factory/records/` | `decisions/`（ADR）、`research/`、`plans/`，以后的交接记录、反馈、复盘 | 累积：写完不再改内容；要变就写一份新的，取代旧的 |
| `factory/validation/` | Lab、Micro World、Oracle、污染 Provider、实验配置、Baseline | 够用即可。决策关卡时整体删除，或者整体改成回归评测，不拆开留 |
| `factory/as-built/` | 产品代码的现状说明（ADR 0026） | 当前状态 |

### 三、边界规则

1. **依赖只能单向。** `factory` 可以引用 `memex/`，因为被验证的就是产品组件（ADR 0020）。`memex/` 不能引用 `factory` 和 `harness`：不 import、不写路径。由 dependency-cruiser 检查。
2. **只发布 `memex/`。** 打包测试列出发布产物的全部文件，不在 `memex/` 下的一律报错。
3. **产品不引用开发记录。** 产品的代码注释、提示词、错误信息不写 ADR 编号，不提实验、Baseline 和版本沿革。需要解释的约束，在原地用现在时写清楚。引用的方向反过来：由 ADR 和 as-built 指向产品代码。这修订了 code-style 第十节"注释可以写对应的 ADR"。
4. **提示词只写指令**：现在怎么做，不解释为什么改过。
5. **数据分开。** 实验输出放在 `factory/validation/runs/`（不提交）。产品实例的数据目录（默认 `.memex/`）只给产品用，产品从空白开始，不导入任何实验数据。
6. **标记词扫描**：对 `memex/` 扫一组标记词（例如"以前""原来""已修订""legacy""previously""deprecated""baseline""实验"），扫到就报错。只用来兜底，最终靠审查。

### 四、Fake 的位置

- 产品自己的测试需要的 Fake Provider，放在 `memex/packages/fakes`，只用于测试，不发布，由打包测试排除。
- 只为实验存在的 Micro World、Oracle 和污染 Provider，放在 `factory/validation/`。

### 五、多个 agent 工具共用 harness

- 指令正文写在 `harness/agents/`。根目录放一个很薄的 `AGENTS.md` 指向它，不放 `CLAUDE.md`：Codex 读 `AGENTS.md`；Claude Code v2.1.277 起，在没有 `CLAUDE.md` 时也直接读 `AGENTS.md`。
- skill 的正文写在 `harness/skills/`。Codex 读 `.agents/skills/`，Claude Code 读 `.claude/skills/`，并且不读 `.agents/`。所以用同步脚本从正文生成这两个目录，由检查确认生成的副本和正文一致。不用符号链接，因为 Windows 上的 git 默认不建立符号链接。
- 工具规定了位置的配置文件（package.json、tsconfig、biome.json、.dependency-cruiser.cjs）留在根目录，保持很薄；能引用外部文件的，把规则放在 `harness/sensors/`。

### 六、决策关卡加"产品化清理"

决策关卡时：删除落选方案的开关、备选代码路径和只为实验存在的配置项；`factory/validation/` 整体删除或者整体改成回归评测；按"当前状态"检查一遍 `memex/` 和 `factory/design/`；写一份记录，说明删了什么、为什么。

## 考虑过的选项

- **目录名用 `.harness/`**：一眼能看出不是产品，但 ripgrep 默认跳过隐藏目录（在本仓库实测：不加 `--hidden` 搜不到 `.editorconfig`），而且 Harness.io 用 `.harness/` 作为它的配置目录。没有采用。
- **保留 `docs/`，只新建 `memex/` 和 `validation/`**：开发记录和驱动 agent 的配置仍然混在一起，也看不出哪些属于"可以带走的做法"、哪些只属于 Memex。没有采用。
- **把产品测试用的 Fake 也放进 factory**：产品的测试就要引用车间，破坏第三节第 1 条。没有采用。

## 后果

- playbook 留在顶层，不属于三个区，负责人以后会把它迁到别的仓库（2026-10-27）。factory 构建时可以读取 playbook，把其中的做法作为知识，落实到 `harness/` 和 `factory/` 的配置中。落实时把采用的内容写进 `harness/`，不让 `harness/`、`factory/design/` 和 `memex/` 链接到 `playbook/` 中的文件，这样迁走之后不会断。
- 成品目录用产品自己的名字 `memex/`，不叫 `product/`（负责人确认，2026-10-27）。下文的"成品"都指 `memex/`。

- 目录搬迁（2026-10-27，此时还没有代码）：`docs/adr/` → `factory/records/decisions/`，`docs/research/` → `factory/records/research/`，`docs/plans/` → `factory/records/plans/`，其余设计文档和根目录的 VISION、GLOSSARY、HANDOFF → `factory/design/`，`docs/playbook/` → `playbook/`。所有文档里的路径引用按新位置机械更新，包括已有 ADR 中的路径；ADR 的内容不变。
- 修订 ADR 0020（Lab 的位置、实验数据的位置）、ADR 0026（as-built 的位置）、code-style 第十节、project-structure。
- V0 的 story 中，包的位置改为 `memex/packages/contracts`、`memex/packages/runtime`、`memex/packages/fakes`、`factory/validation/lab`；Micro World 和污染 Provider 从 `fakes` 移到 `factory/validation/`。
- playbook 是否采用三区模型，先起草给负责人看，再决定。
