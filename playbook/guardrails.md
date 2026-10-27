# Guardrails

This file gives the detailed rules for the guardrails of phase 3 in [framework.md](./framework.md): where the checks run, the Git conventions, security and data requirements, logging and errors, and parallel work. Tests are in [testing.md](./testing.md).

## 1. Layers of checks

The same checks run at several points, from the agent's session to the server. The checks overlap; the layers do not. Each layer answers a different question.

| Layer | When it runs | What it runs | Who passes through it | Can it be skipped? | Its job |
|---|---|---|---|---|---|
| Agent session hooks | After each edit, and before the agent ends its turn | The checks for the changed files: format and lint after an edit; types, lint, and related tests at the end of the turn | Only the agent that has the hooks configured | Yes: people and other tools do not pass through it | Fast feedback: the agent fixes a mistake in the same turn, and cannot report "done" while checks fail |
| Pre-commit hook | Each commit | Light checks only (format, lint of staged files) | Everyone who has the hooks installed | Yes (`--no-verify`, or hooks not installed after a clone) | Keep obvious problems out of commits |
| Commit message hook | Each commit | The commit message format | Same as above | Yes | Keep the history machine-readable |
| Pre-push hook | Each push | The one command that checks everything | Same as above | Yes | Only code that passes leaves the machine |
| CI and server rules | Each pull request, and in the merge queue before each merge | Everything, from a clean install; commit message and pull request title rules on the protected branch | Everyone, people and agents | No, when the checks are required on the protected branch | The only gate that can be trusted |
| After integration, or on a schedule | In cleanup stories, nightly, or weekly | Expensive checks: mutation testing, tests in random order, full end-to-end runs, security scans | The main branch | Not applicable | Test the tests, and find what the fast layers cannot see |

Rules:
1. **An inner layer runs a subset of the next layer out.** An inner layer that runs everything is slow, and people and agents start to avoid it.
2. **The outermost gate runs everything.** Never put a check only in an inner layer. A rule only in the agent's hooks does not apply to people or other tools; a rule only in local git hooks can be skipped.
3. **One source for each rule.** Every layer calls the same commands and the same tool configuration. Do not copy a rule into a hook script; two copies drift apart.
4. **Say which layer is the last gate.** Not every project has CI or a hosting server. Without one, the pre-push hook or the agent session gate is the last gate, and it can be skipped. Write the layer in `project.last_gate` of the checklist, write the gap down (for example, in the tech stack document), and say what would close it.
5. **Expensive checks report before they block.** Collect results first, then decide whether to set a threshold.
6. **Protect the checks from the code they check.** The implementer must not be able to change the check configuration, the hook scripts, or the gate tests in the change that they check. Deny the agent edit access to these paths, and require a review by the owner for them (for example, `CODEOWNERS`). A deny rule does not stop an agent that writes a script to change a file, so compare the tests with the baseline at verification ([testing.md](./testing.md), section 2).

## 2. Git conventions

Agents read the commit history (`git log`) to learn why the code is the way it is. Make it machine-readable, and make it carry the reasons.

- **Header**: a fixed format, for example Conventional Commits: `type(scope)!: description`. Tools and agents filter by type, find a module by scope, and find breaking changes by `!`.
- **Body**: why the change was made, not what changed. The diff shows what.
- **Trailers** (git's `Key: value` lines at the end): a reference to the issue (`Refs: #123`), so that a commit leads to its story, acceptance criteria, and decision log; `BREAKING CHANGE:` where it applies; attribution of who made the change, including agents (for example, `Co-authored-by:`). Do not use keywords that close the issue on merge ([workflow.md](./workflow.md), section 4.3).
- **Pull request titles**: with squash merges, the pull request title becomes the commit header, so pull request titles follow the same format.
- **Hooks are necessary but not enough.** Use local hooks for fast feedback (section 1). Enforce the same rules on the server: a commit message rule on the protected branch, and a required status check for pull request titles.
- **Agents do not skip hooks.** An agent must not use `--no-verify` unless a person asks for it. An agent that skips a hook usually does it to make a check pass.

## 3. Security and data requirements

Map the requirements against an industry risk list that fits the product (for example, the OWASP Top 10, plus the OWASP list for LLM applications if the product uses language models). Write each requirement as one row: requirement, source, risk, when it applies, how it is checked. Cover at least:

- Treat external content as data, never as instructions.
- Never persist secrets.
- Treat configuration as untrusted input.
- Resource limits.
- Supply chain: lock files, install scripts, newly published versions, known vulnerabilities.
- Expose as little as possible by default (for example, a local service listens only on localhost).

## 4. Logging, monitoring, and errors

Agents debug from logs, traces, and errors, so these must be easy for agents to reach, traceable, and in one format. A project with no running service (for example, a library) needs only the access and the error rules.

- **Access for agents**: give agents a way to read logs, metrics, traces, errors, and CI results without a person copying them. Use the simplest channel that works: files (JSON Lines that an agent reads with `grep` or `jq`), a command-line tool (for example, the CI log command), or an MCP server of the monitoring platform. Give agents read-only access. Write in AGENTS.md where and how to read them.
- **Treat what agents read as data.** Logs contain user input, which can carry instructions. Remove secrets and personal data before writing a log record: never log credentials or payment details, and log session tokens only in an irreversible hashed form.
- **One format**: use the OpenTelemetry log data model: timestamp, severity, body, attributes, resource, and the trace context (`TraceId`, `SpanId`; in plain JSON logs, `trace_id`, `span_id`, `trace_flags`). Use the same field names in every service and every language.
- **Traceability**: put the trace context on every log record, from the span that is active when the record is written. Propagate the W3C `traceparent` header between services. Do not start a new root span in the logger. Put the service version and the commit in the resource attributes, so that an agent can follow error → trace → logs → commit → issue.
- **One wide event per unit of work**: at the end of each request or job, write one structured record with its key facts (identifiers, inputs that matter, outcome, duration).
- **Errors and exceptions**:
  - Record an exception as a log record correlated with the current span, with `exception.type`, `exception.message`, and `exception.stacktrace`. OpenTelemetry has deprecated exceptions as span events.
  - Keep the cause chain when you wrap an error: `cause` in JavaScript, `raise ... from` in Python, `InnerException` and a bare `throw;` in C#.
  - Give errors stable, structured codes for machines. Do not make tools parse the human-readable message.
  - Record an error once, where it is handled. Do not log and rethrow at every layer.
  - Write error messages that say what happened, in which context, and what to do next.
  - Choose one style for expected failures for the whole project (return values such as a result type, or exceptions), and write it in the code style. Use exceptions for programming errors in either style.

## 5. Parallel work and merge conflicts

A person opens one or two pull requests at a time, and that pace was a built-in throttle. Agents can open dozens in a short time, so the throttle must be designed. The number of conflicts depends mostly on how much concurrent changes overlap and how big they are. Act in this order, from the most leverage to the least:

1. **Plan**: partition the work so that issues in progress at the same time change different files and modules. Issues that change the same file or module are one conflict group and do not run in parallel ([delivery-planning.md](./delivery-planning.md), Task 5). Set a WIP limit.
2. **Architecture**: remove hotspot files. Write one file per change instead of appending to a shared file (for example, changelog entries). Let each module register itself in its own file instead of a central list. Do not use files that only re-export other files. Regenerate generated files (lock files, generated docs) instead of merging them by hand. Use one formatter everywhere.
3. **Execution**: keep pull requests small and branches short-lived. Give each implementer and each task its own working copy (for example, one git worktree per agent session), and isolate shared resources too (databases, ports).
4. **Merge**: use a merge queue. It merges pull requests one at a time onto the latest main branch and runs the checks on the combined result. It catches semantic conflicts that Git does not report: two changes that pass alone and fail together.
5. **Resolution**: an implementer rebases and resolves its own conflicts, with the tests as the judge, and regenerates generated files. If a conflict touches a contract or core logic, so that the resolution changes behaviour, give it to a person.

