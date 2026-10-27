# harness：deliver agent 的配置

harness 驱动 agent 怎样工作：它们读什么指令、用什么 skill、按什么规范和工作流做事、产出要通过哪些检查。它独立于产品，Codex 和 Claude Code 共用同一份。仓库三个区的划分见 [ADR 0028](../factory/records/decisions/0028-harness-factory-product.md)。

判断一样东西是否属于这里：换一个产品，它还用得上。只对 Memex 有意义的内容放在 `factory/`，发布出去的内容放在 `product/`。

## 子目录

子目录在第一次需要时建立，不提前建空目录。

| 子目录 | 放什么 |
|---|---|
| `agents/` | 共享的 agent 指令正文：命令、工作方式、先读哪里 |
| `skills/` | 共享 skill 的正文，每个 skill 一个目录，内含 `SKILL.md`（Agent Skills 格式） |
| `standards/` | 可以带到其他产品的规范 |
| `workflow/` | 从 playbook 挑选的 checklist 副本、团队约定、状态与关卡、发布流程 |
| `templates/` | issue、PR、ADR、调研、as-built、交接的模板 |
| `sensors/` | 检查脚本和检查规则：三区边界、打包内容、`product/` 的标记词、front matter、as-built 新鲜度、生成副本是否一致 |

## 谁能改

- 用户和 agent 共同管理。
- agent 的改动以提议的形式提交，用户批准后生效。
- `agents/`、`skills/`、`sensors/`、`workflow/` 是受保护的部分：实现 agent 不能为了让自己的产出通过检查而修改它们。

## 写法

- 只写当前状态。改动时直接改写，不留"原来是什么"。
- 规则本身不依赖 Memex 的领域内容。需要用到 Memex 的具体信息时，引用 `factory/` 中的文件，不把内容抄进来。

## 各工具怎样读到这里

| 工具 | 指令 | skill |
|---|---|---|
| Codex | 根目录 `AGENTS.md` | `.agents/skills/` |
| Claude Code | 根目录 `AGENTS.md`（v2.1.277 起，在没有 `CLAUDE.md` 时直接读取） | `.claude/skills/` |

- 根目录 `AGENTS.md` 保持很薄，只指向 `agents/`。仓库不放 `CLAUDE.md`。
- `.agents/skills/` 和 `.claude/skills/` 由同步脚本从 `skills/` 生成，不手改；检查会确认生成的副本和正文一致。不用符号链接，因为 Windows 上的 git 默认不建立符号链接。
- 工具规定了位置的配置文件（`package.json`、`tsconfig.base.json`、`biome.json`、`.dependency-cruiser.cjs`）留在根目录；能引用外部文件的，规则写在 `sensors/`。
- 个人偏好不放在这里，放在各自工具的本地文件里，不提交。
