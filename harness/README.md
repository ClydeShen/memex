# harness: configuration for the delivery agents

The harness drives how the agents work: which instructions they read, which skills they use, which standards and workflows they follow, and which checks their output must pass. It is independent of the product. Codex and Claude Code share the same copy. For the three zones of the repository, see [ADR 0028](../factory/records/decisions/0028-harness-factory-product.md).

To decide whether something belongs here, ask: would it still be useful for a different product? Content that only makes sense for Memex goes in `factory/`. Content that is shipped goes in `memex/`.

## Subdirectories

Create a subdirectory the first time it is needed. Do not create empty directories in advance.

| Subdirectory | Content |
|---|---|
| `agents/` | Shared agent instructions: commands, ways of working, what to read first |
| `skills/` | Shared skills, one directory for each skill, with a `SKILL.md` (Agent Skills format) |
| `standards/` | Standards that can be taken to other products |
| `workflow/` | Copies of checklists selected from the playbook, team conventions, states and gates, release process |
| `templates/` | Templates for issues, PRs, ADRs, research, as-built documents and handoffs |
| `sensors/` | Check scripts and check rules: zone boundaries, package contents, marker words in `memex/`, front matter, as-built freshness, consistency of generated copies |
| `tools/` | Scripts that help the agents work but check nothing, for example `pnpm plan:order` |

## Relation to the playbook

`playbook/` is a general cross-team standard. It will move to a different repository later. When you build the harness, you can read it and write the practices you adopt here, in your own words. Do not link to playbook files.

## Who can change it

- The user and the agents manage it together.
- An agent submits a change as a proposal. The change takes effect after the user approves it.
- `agents/`, `skills/`, `sensors/` and `workflow/` are protected: the implementing agent must not change them to make its own output pass a check.

## How to write

- Write only the current state. When something changes, rewrite it. Do not keep "what it was before".
- The rules do not depend on Memex domain content. When a rule needs Memex-specific information, refer to a file in `factory/`. Do not copy the content here.

## How each tool reads this directory

| Tool | Instructions | Skills |
|---|---|---|
| Codex | Root `AGENTS.md` | `.agents/skills/` |
| Claude Code | Root `AGENTS.md` (read directly when there is no `CLAUDE.md`, from v2.1.277) | `.claude/skills/` |

- Keep the root `AGENTS.md` thin. It only points to `agents/`. The repository has no `CLAUDE.md`.
- A sync script generates `.agents/skills/` and `.claude/skills/` from `skills/`. Do not edit them by hand. A check makes sure that the generated copies agree with the source. Do not use symbolic links, because git on Windows does not create them by default.
- Configuration files whose location a tool fixes (`package.json`, `tsconfig.base.json`, `biome.json`, `.dependency-cruiser.cjs`) stay in the root. If a file can refer to an external file, put the rules in `sensors/`.
- Personal preferences do not go here. Put them in each tool's local files, which are not committed.
