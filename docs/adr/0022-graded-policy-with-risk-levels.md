---
status: accepted
---

# Policy 分档：Action 带风险等级，结果多一个"等待审批"，执行者由核心记录

2026-10-11 的一致性审阅发现一处冲突：ADR 0014、contracts.md 和 dependencies.md 都写默认 Policy"全部允许"，而 ADR 0011 和约束 S3 要求修改 Memex 自身必须由用户批准。"批准"本身也是一个 Action，全部放行的 Policy 不看执行者，Agent 自己提交"批准"也能通过。另外，`ActionRequest { name, params, actor }` 中的执行者由请求方自己填写，被提示注入的模型可以自称是用户。

具体放开多少限制，到产品阶段才需要决定（open-questions.md 第 4 条）。但契约要在决策关卡冻结，所以现在要先把以后调整强度所需的口子留在契约里（用户确认，2026-10-13）。

## 决定

思路类似日志级别：每条日志自带级别，全局设一个阈值；调阈值只改配置，不改写日志的代码。这里，每种 Action 自带风险等级，Policy 设一个档位。参照 Claude Code 的权限模式（逐项询问、自动接受编辑、用分类模型判断的 auto 模式）和 allow / ask / deny 规则。

1. **每种 Action 的定义带风险等级。** 初始等级：只读、可撤销、不可撤销、对外发送、修改自身（本体、配置、代码、部署）。等级可以在契约冻结前增加。V0 中只有 Micro World 的动作和形成 Claim 的动作，标为"可撤销"。
2. **Policy 的结果有三种**：`allow`、`deny`、`ask`（等待用户审批）。结果为 `ask` 时，Action Executor 把"待审批"写入 Event Log，这个 Action 暂不执行；用户通过 Communication 入口批准或拒绝之后，再执行或放弃，并记录审批人。长时间运行的目标因此要能暂停、等审批后接着做，靠 Event Log 和回放恢复状态。
3. **执行者由核心记录，不由请求填写。** Strategy 提交的 Action，Action Executor 一律记为 `agent`；只有经过认证的用户入口（CLI，以后的 Web 界面）发起的 Action 才记为 `user`；其他 Agent 经 A2A 发起的记为 `agent` 并带上对方标识。`ActionRequest` 中不再有 `actor` 字段。
4. **"修改自身必须由用户批准"是核心不变量，不属于 Policy。** 风险等级为"修改自身"的 Action，只有执行者是 `user` 时才能执行，由 Action Executor 在调用 Policy 之前检查。Agent 只能提交"提议"（ADR 0011）。替换或配错 Policy 都不能放开这一条，相当于 Claude Code 中永远优先的 deny 规则。
5. **档位分阶段：**
   - 验证阶段：Policy 默认全部放行（V0.4 的 Fake Policy）。这时没有修改自身的 Action，也不接触真实世界。
   - 产品阶段：默认档位以谨慎为主，随着功能完善逐步放开。有几档、默认是哪一档、是否用快速分类模型判断哪些 Action 需要审批，在决策关卡确定（open-questions.md 第 4 条）。分类模型只是一种 Policy Provider（例如 `policy.classifier`），在配置中引用一个模型即可，不需要另外的接口。

## Considered Options

- **只把默认 Policy 改成"修改自身需要用户，其余放行"**：S3 仍然只靠配置保障，换一个 Policy 实现就丢了；执行者自己填写的漏洞也还在。被否决。
- **保持现状，注明"V0 没有修改自身的 Action"**：契约形状要在 V0.2 定下，冻结后再加风险等级和 `ask` 代价更高。被否决。

## Consequences

- contracts.md：`ActionRequest` 去掉 `actor`；Action 定义带风险等级；Policy 的 `Decision` 增加 `ask`；Action Executor 先检查第 4 条不变量，再调用 Policy。
- 修订 ADR 0014 中"默认实现是全部允许"：只适用于验证阶段。
- GLOSSARY 新增"风险等级"；roadmap 新增约束 A14；open-questions 第 4 条改为"方向已定，具体档位在决策关卡确定"。
- 日志类比的限度：日志级别设错只是多打或少打几行，Policy 档位设错 Agent 就会真的执行，所以第 4 条不变量不随档位变化。
