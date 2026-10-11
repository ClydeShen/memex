# llama.cpp 作为 Model Backend 的实测行为（2026-10-11）

HANDOFF 第 4 节 L5、L6 的结论。这里只记录**与机器无关的软件行为**；某台机器的环境信息写在该机器的 `.env` 中，不提交。

- 版本：llama.cpp `b9354`（`9777256c3`），响应中的 `system_fingerprint` 为 `b9354-9777256c3`。
- 测试模型：`Qwen3.6-35B-A3B`（Q5_K_M）。目标模型 Qwen3.5-9B 和 Tev1 4B 尚未测试，这里测的是**后端能力**。
- 启动参数：`llama-server -m <model> --host 127.0.0.1 --port 8080 -ngl 99 -c 8192 --jinja`

## 请求

Tev1 的系统提示原文，加一道三选一的题；`temperature: 0`、`max_tokens: 1`、`logprobs: true`、`top_logprobs: 5`、`chat_template_kwargs: {"enable_thinking": false}`。

## L5：返回 token 概率（通过）

格式与 OpenAI 兼容，位于 `choices[0].logprobs.content[]`：

```json
{"id":33,"token":"B","bytes":[66],"logprob":-0.0153,
 "top_logprobs":[
   {"id":33,"token":"B","bytes":[66],"logprob":-0.0153},
   {"id":417,"token":" B","bytes":[32,66],"logprob":-4.19},
   {"id":34,"token":"C","bytes":[67],"logprob":-10.43},
   {"id":32,"token":"A","bytes":[65],"logprob":-10.90},
   {"id":65,"token":"b","bytes":[98],"logprob":-11.46}]}
```

每个候选都带 `token`、`bytes`、`logprob`。

## L6：关闭思考模式（通过）

- 带 `enable_thinking: false`：第一个 token 就是答案 `B`。
- 不带这个参数（默认开启思考）：思考过程放在单独的 `message.reasoning_content` 字段中，`content` 为空。

## 对 Intuition 适配器的影响（M2 实现时处理）

1. **同一个选项字母会有多个 token 变体**，例如 `B` 和 ` B`（前面带空格）。读选项概率时，要把同一个字母的各个变体合并（概率相加），不能只看完全匹配的 token。
2. **小写变体**（如 `b`）是否算作同一个选项，要在适配器里明确规定。
3. 格式只在 b9354 上测过。HANDOFF 已提醒不同版本的格式可能不同，所以后端版本要写进 Experiment 快照，适配器要校验格式。

## 与 ADR 0005 相关

llama-server 默认开 **4 个并行槽位**。Issue #7052 报告的"多槽位下同一个提示词输出不同"正是这种配置。复现靠录制和回放，不影响设计；做实测对比时最好用 `--parallel 1`。
