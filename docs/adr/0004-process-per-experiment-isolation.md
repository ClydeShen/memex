---
status: accepted
---

# 每个 Experiment 运行在独立进程里，Cordis 不作为隔离手段

Experiment 之间不允许有任何状态泄漏。Cordis 的 dispose 和 `ctx.isolate` 都只在进程内起作用：后者还是实验性 API，一次只隔离一个服务。它们清不掉插件里的模块级变量、单例和原生资源。所以隔离靠进程边界来保证。Cordis 的 README 也说明它的 API 还不稳定，因此 M0 先用一个很薄的工厂函数来组装组件；Cordis 以后作为可选的组合层单独评估，并放在组合抽象层的后面。

一个纵向（长期积累经验）的实验本身就是一个隔离单元：它内部可以保留状态，但不能接触其他 Experiment 的状态。
