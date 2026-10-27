# Directory layout and naming rules

This file sets the directory layout of the Memex repository, the internal organization of packages, and the naming rules. For how to write code, see [code-style.md](./code-style.md). For dependency rules, see ADR 0008 and [dependencies.md](./dependencies.md).

- **Status**: accepted (2026-10-11). For the three zones, see ADR 0028.
- **Principles**:
  - The directory layout shows the dependency direction directly: from the directories alone, you can tell who can depend on whom.
  - Directory names say what is in the system. This is the same idea as "self-explaining code" (code-style.md section 10).
- **Checks**: dependency-cruiser checks the dependency direction and "import only through the public entry point". Biome `useFilenamingConvention` checks file name case. The configuration lands in V0.1.

---

## 1. Repository top level

The repository has three zones (ADR 0028): `harness/` drives how the agents work, `factory/` is the workshop that builds Memex, and `memex/` is the shipped product. In addition, `playbook/` is a general cross-team standard and does not belong to Memex.

```
(repository root)
├─ memex/                    the product: only this directory is shipped
│  ├─ packages/
│  │  ├─ contracts/          @memex/contracts: contracts, schemas, Result, pipe
│  │  ├─ runtime/            @memex/runtime: Event Log, Composition Root, cognitive loop, Projector
│  │  └─ fakes/              @memex/fakes: Fake Providers for product tests; test-only, not shipped
│  ├─ providers/             real Providers, each a separate package (from V1)
│  │  └─ intuition-tev1/     example: the Provider with type intuition.tev1
│  └─ apps/                  product executables: the `memex` CLI, later the Web interface (from P1)
├─ factory/                  the workshop: meaningful only for Memex, not shipped; agents manage it as the harness directs
│  ├─ design/                design documents, current state only: VISION, GLOSSARY, HANDOFF, roadmap, architecture, contracts and the standards
│  ├─ records/               accumulated records, not changed after they are written: decisions/ (ADRs), research/, plans/, implementation-notes.md
│  ├─ validation/            validation tools; removed as a whole or turned into regression evaluation at the decision gate
│  │  ├─ lab/                @memex/lab: Runner, Worker, `pnpm lab`
│  │  ├─ worlds/             @memex/worlds: Micro World, Ground Truth and Oracle, polluting Provider
│  │  ├─ experiments/        experiment configuration YAML, synthetic data only
│  │  └─ runs/               experiment output (not committed)
│  └─ as-built/              the current state of the product code, one page per package (ADR 0026)
├─ harness/                  the driver: configuration of the delivery agents, shared by Codex and Claude Code
│  ├─ README.md              the map: what each subdirectory holds, who can change it, how it syncs to each tool
│  ├─ agents/                shared agent instructions
│  ├─ skills/                shared skills (Agent Skills format)
│  ├─ standards/             standards that can be taken to other products
│  ├─ workflow/              checklist copies, team conventions, release process
│  ├─ templates/             templates for issues, PRs, ADRs, research, as-built documents and handoffs
│  └─ sensors/               check scripts and check rules: boundaries, package contents, marker words, front matter, as-built freshness, CJK text
├─ playbook/                 general cross-team engineering standards; not part of the three zones; will move to another repository
├─ AGENTS.md                 a thin entry point that points to harness/agents/; read by both Codex and Claude Code
├─ .agents/skills/           generated from harness/skills/ for Codex; do not edit by hand
├─ .claude/skills/           generated from harness/skills/ for Claude Code; do not edit by hand
├─ .github/workflows/        CI: the CJK check on pull requests and on pushes to main and epic branches
├─ package.json              root configuration: the shared script entry points; `packageManager` fixes the pnpm version
├─ pnpm-workspace.yaml       pnpm workspaces and dependency security settings (factory/design/security-and-data.md section 5)
├─ pnpm-lock.yaml            locked dependency versions; must be committed
├─ tsconfig.base.json        shared TypeScript settings, inherited by each package
├─ biome.json                lint and formatting
├─ .githooks/                git hook scripts, turned on with `core.hooksPath` (tech-stack.md)
├─ .dependency-cruiser.cjs   architecture boundary rules
├─ knip.json                 unused code check
├─ vitest.config.ts          tests
└─ .gitignore  .gitattributes  .editorconfig  .nvmrc  .env.example
```

`playbook/` is only a source of knowledge: when the factory is built, agents can read it and write the practices they adopt into `harness/`. `harness/`, `factory/design/` and `memex/` do not link to its files, because it will move away later.

To decide where a file goes: if a different product could still use it, put it in `harness/`; if it is meaningful only for Memex but not shipped, put it in `factory/`; if it is shipped, put it in `memex/`. The root holds only files whose location a tool fixes, and stays thin.

pnpm workspaces include `memex/packages/*`, `memex/providers/*`, `memex/apps/*` and `factory/validation/*`.

### Boundaries between the three zones

1. **Dependencies go one way only**: `factory` can refer to `memex/`; `memex/` cannot refer to `factory` or `harness`, neither by import nor by writing their paths.
2. **Only `memex/` is shipped**: the packaging test lists all files of the shipped artifact and reports an error for any file outside `memex/`. `memex/packages/fakes` is also excluded.
3. **The product does not refer to development records**: comments, prompts and error messages in `memex/` do not mention ADR numbers, experiments, Baselines or version history (code-style section 10).
4. **Generated copies are not edited by hand**: a sync script generates `.agents/skills/` and `.claude/skills/` from `harness/skills/`, and a check makes sure that the two sides agree.

### Packages and dependency direction

| Directory | What it is | Can depend on | Cannot depend on |
|---|---|---|---|
| `memex/packages/contracts` | The only stable boundary (Cognitive Contract) | Only a few recorded libraries such as Zod | All other packages |
| `memex/packages/runtime` | The core components of the framework, including the registry and assembly logic of the Composition Root | `contracts` | All other packages |
| `memex/packages/fakes`, `memex/providers/*` | Provider implementations (the "adapters" in ports and adapters) | `contracts` | Other Providers, `runtime`, `apps/*`, everything under `factory` |
| `memex/apps/*` | The product composition entry points (from P1): import concrete Providers and record them in the Composition Root registry | Everything under `memex/` except `fakes` | `fakes`, everything under `factory` |
| `factory/validation/worlds` | Environments and Providers for experiments: Micro World, Oracle, polluting Provider | `contracts` | `runtime`, `lab`, `apps/*` |
| `factory/validation/lab` | Validation tools (Runner, Worker) | `contracts`, `runtime`; **only the Worker startup file** (the composition entry point of the validation stage) can import `fakes`, `worlds` and `providers/*` | `apps/*` |

Notes:
- **Each real Provider is its own package.** It declares the dependencies it needs, and they do not enter the core. Replacing a Provider means swapping a package (ADR 0008).
- **Fakes are in two places**: the Fakes that the product's own tests need are in `memex/packages/fakes`; the Micro World, Oracle and polluting Provider, which exist only for experiments, are in `factory/validation/worlds`. So the product tests do not need to refer to the workshop.
- **How the Lab gets concrete Providers**: the Lab business code does not import Providers. It gets them only through the Composition Root registry. During the whole validation stage (V0–V2), the startup file of the Lab Worker is the composition entry point: in V0 it imports the Fake Providers and the Micro World and records them; from V1 it also adds the real Providers in `memex/providers/*`. From P1, the product composition entry point is in `memex/apps/`. The principle is "only the composition entry point knows the concrete implementations" (GLOSSARY: Composition Root).

## 2. Package internal structure

```
memex/packages/runtime/
├─ package.json              "exports" exposes only ./src/index.ts
├─ tsconfig.json             extends ../../../tsconfig.base.json
└─ src/
   ├─ index.ts               the only public entry point
   ├─ event-log/             directories by domain concept
   │  ├─ append-event.ts
   │  ├─ append-event.test.ts
   │  ├─ replay-events.ts
   │  └─ fixtures/           test data, synthetic only (ADR 0016)
   ├─ composition-root/
   ├─ action-executor/
   └─ projectors/
```

Rules:

1. **Organize directories by domain concept** (for example `event-log/`, `projectors/`, `composition-root/`), not by technical layer (for example `services/`, `models/`, `controllers/`).
2. **Do not create catch-all directories such as `utils/`, `helpers/`, `common/` or `misc/`.** Truly general small tools (`pipe`, `Result`) go in `@memex/contracts`. Other tools go in the concept directory that uses them.
3. **Each package has only one public entry point, `src/index.ts`**, enforced by the `exports` field of `package.json`. Other packages cannot import internal files of a package.
4. **Do not create `index.ts` barrel files inside a package** (the public entry point of the package is the only exception). Barrel files slow down tools and easily cause circular dependencies. Inside a package, import the specific file directly.
5. **One file has one main responsibility**, and its name says what it does, usually starting with a verb, for example `append-event.ts`, `check-capabilities.ts`. Files that only define types or schemas use nouns, for example `claim.ts`.
6. **Put test files next to the files they test**, named `<file under test>.test.ts`.
7. **Put test data in a `fixtures/` directory next to them**, synthetic only.

## 3. Naming rules

| Item | Rule | Example |
|---|---|---|
| Directories, source files | kebab-case | `composition-root/`, `append-event.ts` |
| A directory for one concept | Singular | `event-log/`, `composition-root/`, `claim/` |
| A directory for items of the same kind | Plural | `projectors/`, `fixtures/`, `examples/` |
| npm package names | `@memex/` plus kebab-case; packages refer to each other with `workspace:*` | `@memex/contracts`, `@memex/intuition-tev1` |
| Provider package directories | Replace the dots in `type` with hyphens | `intuition.tev1` → `providers/intuition-tev1/` |
| Test files | `*.test.ts` | `append-event.test.ts` |
| Resource YAML | kebab-case name plus a `kind` suffix | `local-qwen.model.yaml`, `smoke.experiment.yaml` |
| Domain terms | Use the words in GLOSSARY.md, and avoid the words listed under `_Avoid_` | Use `claim/`, not `fact/`; use `capability/`, not `tool/` |

For identifier naming in code (camelCase, PascalCase, the `create` prefix and others), see code-style.md section 8.

## 4. Where runtime data goes

Data produced at runtime is not repository content. Experiment data and product data are stored separately (ADR 0028):

- **Experiment output** goes in `factory/validation/runs/<experiment name>/<run id>/`, ignored by `.gitignore`. It contains the Event Log, the content store with recorded full text by sha256 (`blobs/`, ADR 0024), snapshots and reports. The exact file format is set in V0.5.
- **Product instance data** goes in `.memex/` by default. The configuration can change it. It is ignored by `.gitignore`. A product instance starts empty and imports no experiment data.
- Data from a real domain can go only in the data directory of a product instance, never in the repository (ADR 0016).

## 5. When to create what

| Directory | When |
|---|---|
| `memex/packages/contracts`, `runtime`, `fakes`, `factory/validation/lab`, `worlds`, and the root configuration files | V0.1 |
| `factory/validation/experiments/` | V0.5 (the first example Experiment) |
| `harness/sensors/` (the CJK check, from 2026-10-27), `.githooks/`, `.github/workflows/` | Exist now |
| The other checks in `harness/sensors/`, `harness/agents/`, `factory/as-built/TEMPLATE.md` and `index.md` | V0-28 |
| The per-package pages of `factory/as-built/` | V0-29 (the first cleanup) |
| `harness/skills/` and the sync script | When the first shared skill appears |
| `memex/providers/` | V1 (the first real Provider) |
| `memex/apps/` | P1 (product commands are designed after the decision gate) |

Do not create empty directories in advance "because they may be used later".
