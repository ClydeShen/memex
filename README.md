# Memex

> **Give it a goal, and let it get there on its own.**

Memex is a framework for cognitive agents. After it connects to the data of a domain, the agent builds and keeps correcting its own Worldview of that domain (made of Claims with provenance and time). It uses two speeds of thinking (Intuition and Reasoning) together with off-the-shelf models to solve problems, and keeps learning from verified experience.

This is a personal research and learning project. It is not for commercial use.

> **Central hypothesis**: for a long-running agent, the main way to become more effective is to improve what it attends to, what it believes, what it generalizes, and when it chooses to reason deeply, rather than to keep putting more information into the reasoning context.

This hypothesis is not yet verified. The roadmap has two stages (ADR 0020). First, the **validation stage** answers the hypothesis with experiments and sets the direction and core capabilities of the product. After validation, we build **the real product**. The experiment tools are not the product.

## Status

- **The design stage is complete. There is no code yet.** The next milestone is V0: the product core (contracts, Event Log, Action, runtime) and the validation tools (Lab, Fake Provider, the simplest Micro World).
- Roadmap: validation stage V0 skeleton → V1 baseline → V2 dual system → **decision gate** → product stage P1 first usable version → P2 learning loop → P3 external extension → P4 distribution, and P5 cross-domain transfer. See [factory/design/roadmap.md](factory/design/roadmap.md).

## Repository layout

The repository has three zones ([ADR 0028](factory/records/decisions/0028-harness-factory-product.md)):

| Directory | What it is |
|---|---|
| `memex/` | The product. Only this directory is shipped, and it contains only the current state (created from V0). |
| [factory/](factory/) | The workshop that builds Memex: design documents, decision and research records, validation tools, as-built documents. Agents manage it on their own, as the harness directs. |
| [harness/](harness/) | The driver: configuration for how the delivery agents work, shared by Codex and Claude Code. |
| [playbook/](playbook/) | General engineering patterns extracted from this project. You can copy them to other projects. |

## Documents

| Document | Content |
|---|---|
| [VISION.md](factory/design/VISION.md) | Purpose, central hypothesis, first principles, core modules |
| [GLOSSARY.md](factory/design/GLOSSARY.md) | Domain terms (use them consistently in code and documents) |
| [HANDOFF.md](factory/design/HANDOFF.md) | Start here for a new development session |
| [roadmap.md](factory/design/roadmap.md) | Global constraints, milestones and the current task breakdown |
| [architecture/](factory/design/architecture/) | C4 architecture diagrams and integration contracts |
| [tech-stack.md](factory/design/tech-stack.md) | Tech stack: role, category, when each part is introduced |
| [code-style.md](factory/design/code-style.md) | Shared code style and constraints |
| [project-structure.md](factory/design/project-structure.md) | Directory layout and naming rules |
| [security-and-data.md](factory/design/security-and-data.md) | Security and data requirements |
| [dependencies.md](factory/design/dependencies.md) | Dependency categories |
| [open-questions.md](factory/design/open-questions.md) | Open questions |
| [decisions/](factory/records/decisions/) | Accepted architecture decisions (ADRs) |
| [plans/](factory/records/plans/) | Integration design for each milestone: components, seams, gates and stories |
| [research/](factory/records/research/) | Evidence from research and checks (selection, standards, algorithms, measurements) |

## Requirements

- Node.js 26 (see `.nvmrc`)
- pnpm 12
- Machine-specific settings go in `.env`, which is not committed. See `.env.example` for the keys to fill in.
- After you clone, run `git config core.hooksPath harness/sensors/git-hooks` once. This turns on the pre-commit check that rejects CJK text. CI runs the same check on every push to `main` and every pull request.

## License

Not decided yet.
