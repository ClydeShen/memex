---
status: accepted
---

# 实现 agent 自行做出的重要决定写成 implementation note，默认不写

实现 agent 按 spec 或 ticket 工作时，会遇到 spec 和 ticket 都没写到、但它有权自己决定的情况。其中一部分决定重要到负责人应该知道。这类知识现在没有固定的落脚点：issue 评论在仓库之外，agent 在仓库里搜不到；提交信息太短；as-built 每个 epic 才更新一次，只写现状；ADR 只收架构层面的决定；ADR 0028 又规定 `memex/` 中的注释不讲来龙去脉。负责人要求这类决定写成 implementation note，但要"lazy"地记录（2026-10-27）。

## 决定

### 一、什么时候写

同时满足三个条件才写：

1. spec 和 ticket 都没有写到这种情况；
2. 实现 agent 自己做了决定，没有停下来问；
3. 这个决定重要到负责人应该知道，也就是至少满足下面一条：
   - 改变了产品的行为，或者契约、schema、数据格式；
   - 涉及安全、数据或成本；
   - 扩大或缩小了 ticket 的范围；
   - 事后很难撤回。

默认不写。一个 story 一条 note 都没有是正常的。

不写的情况：ticket 已经写明的；日常的实现选择（命名、写法、拆函数）；看代码或 diff 就能看出来的。

只有负责人能做的决定，不写 note，而是停下来问（ADR 0022 和 playbook 的既有规则）。note 只用于"实现 agent 有权决定、但要让负责人知道"的决定。

### 二、写什么

- 每条 note 一个文件，放在 `factory/records/implementation-notes/`，写法是"累积"（ADR 0028）：写完不改正文。
- front matter：`story`（issue 编号）、`date`、`status`。
- 正文只有四行：**情况**、**决定**、**理由**、**怎么撤回**。不加其他必填章节。

### 三、怎样让负责人知道，以及之后怎样处理

- story 的完成报告末尾加一行"需要你知道的决定"，链接到对应的 note；没有 note 就不写这一行。
- 会话开始时的状态报告列出 `status` 为 `open` 的 note。
- 负责人看过以后，只改 `status` 一个字段：
  - `acknowledged`：同意；
  - `promoted`：由规划 agent 升级成 ADR，或者写回 spec；
  - `reverted`：不同意，撤回这个决定。
- `status` 是这个目录中唯一允许修改的字段，由"记录只增不改"的检查守住。

## 考虑过的选项

- **每个 story 都写实现记录**：记录变多以后没人读，真正重要的决定被埋掉。没有采用。
- **只写在 issue 评论里**：在仓库之外，agent 在仓库里搜不到，以后也不好查。没有采用。
- **写进代码注释**：违反 ADR 0028 第三节第 3 条，产品中的注释不讲来龙去脉。没有采用。

## 后果

- `harness/agents/` 中给实现 agent 的指令加入第一节的三个条件和"默认不写"（#69）。
- `harness/sensors/zones.yaml` 登记 `factory/records/implementation-notes/`，写法是"累积"，可变字段是 `status`（#73）。
- 会话开始的状态报告列出 `open` 的 note（#78）。
- 共享 skill 增加"写 implementation note"（#79）。
- GLOSSARY 新增 Implementation Note；factory/design/project-structure.md 的目录树加入这个目录。

- **补充（2026-10-27，负责人要求简化）**：#73、#78、#79 已关闭，不做目录属性检查、状态报告和专门的 skill。implementation note 的规则只写进给实现 agent 的指令（#69），漏写由 #93 的独立检查发现。
