# Language Profiles

This file maps each tooling **role** to concrete tools for each language. The roles are the same for every language; only the tools change. Pick one tool per role for your project, write the choice in the project's tech stack document, and record the date.

- **Versions**: checked on **2026-10-13** against the package registries (npm, PyPI, NuGet); roles 13 and 14 on **2026-10-14**. They will go stale. Check them again before you use them (see "How to check a version" below).
- **Maturity**: in the maturity table of [README.md](./README.md). In the Python column, a minimal project ran Ruff, ty, and import-linter on the check date; the other Python tools and all C# tools were read from their docs, not run.

---

## 1. The roles

| # | Role | What it must do |
|---|---|---|
| 1 | Runtime and package management | Pin the runtime version; lock dependencies; organize several packages or projects in one repository |
| 2 | Formatting and lint | Format code and find problems; ideally one tool and one command; automatic fixes |
| 3 | Type and null safety | Static types; null safety; warnings treated as errors |
| 4 | Tests and property-based tests | Unit and integration tests; tests that generate many random inputs to check invariants |
| 5 | Architecture boundaries | Turn "layer A must not import layer B" and "only the composition entry point references implementations" into an automatic check |
| 6 | Unused code | Find unused files, exports, and dependencies |
| 7 | Supply chain | Lock file in CI; known-vulnerability audit; delay newly published versions; do not run dependency install scripts by default; restrict package sources |
| 8 | Schemas, API docs, dependency graph | Export type or schema descriptions as JSON Schema; generate API docs; output a dependency graph as Mermaid or DOT (for as-built docs) |
| 9 | One command checks everything | A single entry point that runs roles 2–6 and the tests |
| 10 | Git hooks | Light pre-commit check, commit message check, full check before push |
| 11 | Code security scanning | CodeQL or an equivalent |
| 12 | Structure and naming | Official guidance on directory layout and naming |
| 13 | Telemetry and logging | The OpenTelemetry API and SDK; a structured logger that writes the OpenTelemetry log data model with trace context |
| 14 | Mutation testing | Change the code on purpose and check that a test fails; incremental or by diff, so it can run in cleanup stories; report only (see [testing.md](./testing.md)) |

---

## 2. Matrix

Format: **first choice** / alternatives. Versions as checked on 2026-10-13.

| Role | Node / TypeScript | Python | C# (.NET) |
|---|---|---|---|
| 1. Runtime and packages | Node 26 (`.nvmrc`); **pnpm 12** with `packageManager` pinned; pnpm workspaces; `pnpm-lock.yaml` | **uv 0.13.0**: `.python-version`, `uv.lock`, workspaces / pip with `pylock.toml` (PEP 751) | **.NET 10 SDK (LTS)** pinned in `global.json`; **Central Package Management** (`Directory.Packages.props`); `packages.lock.json` / per-project versions |
| 2. Format and lint | **Biome 2.5** (one tool for both) | **Ruff 0.17.0** (one tool for both) | **`dotnet format` + the SDK analyzers** (`EnforceCodeStyleInBuild`) / CSharpier 1.3 for formatting |
| 3. Types and nulls | **TypeScript 7.0**, `strict`, `erasableSyntaxOnly` | **Pyright 1.1.414** or **Pyrefly 1.3.2** (stable) / ty 0.0.86 (beta), mypy 2.4 | **`<Nullable>enable</Nullable>` + `TreatWarningsAsErrors` + `AnalysisMode`** / add Meziantou.Analyzer, Roslynator |
| 4. Tests and property tests | **Vitest 5** + **fast-check 4.10** | **pytest 9.1.1** + **Hypothesis 6.169.0** | **xUnit v3 (xunit.v3 4.0.2)** + **FsCheck 3.4.0** / MSTest 4.5, NUnit 5.0, TUnit 1.74; CsCheck 4.9 |
| 5. Architecture boundaries | **dependency-cruiser 18.5** | **import-linter 2.15** (`forbidden`, `protected`, `layers` contracts) / Tach 0.35 (beta) | **ArchUnitNET 0.13.4** (written as tests; needs a build) / BannedApiAnalyzers (compile-time banned APIs). NetArchTest.Rules has had no release for about five years |
| 6. Unused code | **knip 6.41** | **Ruff F401** (unused imports) + **vulture 2.16** (unused code) + **deptry 0.25** (unused or missing dependencies) | **IDE0051 / IDE0052 / IDE0060 / IDE0005 enforced in the build** / ReSharper InspectCode (SARIF output) |
| 7. Supply chain | `pnpm install --frozen-lockfile`; install scripts blocked unless listed in `allowBuilds`; `minimumReleaseAge`; `trustPolicy`; `pnpm audit`; Dependabot | `uv sync --locked`; `no-build = true`; `exclude-newer = "3 days"`; `[tool.uv.sources]` with `explicit = true`; **pip-audit 2.10** (`uv audit` is a preview); Dependabot | `dotnet restore --locked-mode`; **NuGetAudit** (audits all dependencies by default on .NET 10); `packageSourceMapping`; `signatureValidationMode=require`; Dependabot (default 3-day cooldown). **No setting to delay new versions** |
| 8. Schemas, docs, graph | Zod 4 `.describe()` + `z.toJSONSchema()`; `depcruise -T mermaid` | **Pydantic 2.14** `Field(description=...)` + `model_json_schema()`; API docs: **mkdocstrings 1.0 / griffe 2.3** (static analysis); graph: `tach show --mermaid` or `import-linter drawgraph` (DOT) | **`System.Text.Json` `JsonSchemaExporter`** (.NET 9+) with `[Description]`; API docs: **docfx 2.81** (needs a build); graph: **no official Mermaid or DOT tool** |
| 9. One command | `pnpm check` | `uv run` + a task runner: **nox** / just / poethepoet | `Directory.Build.props` (warnings as errors) + `dotnet build && dotnet test && dotnet format --verify-no-changes`, wrapped in one script or a just recipe |
| 10. Git hooks | **`core.hooksPath` + `.githooks/`** (no package) | **`core.hooksPath`** / prek 0.5, pre-commit 4.7, lefthook 2.2 | **`core.hooksPath`** / Husky.Net 0.9 (hooks installed on restore) |
| 11. Security scanning | CodeQL (JavaScript/TypeScript) | CodeQL; officially lists Python up to 3.14 | CodeQL; C# up to 14 and .NET up to 10; default setup uses build mode `none` |
| 12. Structure and naming | Project rules (see the code style and project structure docs) | PEP 8; the src layout from the Python Packaging User Guide; PEP 735 dependency groups | Framework Design Guidelines; C# identifier naming rules; `.editorconfig` |
| 13. Telemetry and logging | **@opentelemetry/api 1.9.1**, **@opentelemetry/sdk-node 0.223.0** (the logs API and SDK are still 0.x) / a thin JSON writer of the log data model, or **pino 10.4** with field mapping | **opentelemetry-api / opentelemetry-sdk 1.45.1** with the standard `logging` module / **structlog 26.1** | **OpenTelemetry 1.19.1** with `OpenTelemetry.Extensions.Hosting` and `Microsoft.Extensions.Logging` (fills `TraceId` and `SpanId` from the current activity) / **Serilog 4.4** |
| 14. Mutation testing | **StrykerJS 10.0** + `@stryker-mutator/vitest-runner` (`incremental: true`; `thresholds.break` defaults to no failure) | **mutmut 3.8** (incremental by changed function; on Windows runs only in WSL) / **cosmic-ray 8.7** (native Windows, any test command, `cr-filter-git` for changed lines) | **Stryker.NET 5.0** (`--with-baseline` or `--since`) |

`core.hooksPath` works the same in every language: put the hook scripts in `.githooks/` and run `git config core.hooksPath .githooks` once per clone. Node runs it from the root `prepare` script. Python and C# have no root lifecycle script, so put it in a setup command (for example, `just setup`) and say so in the README.

---

## 3. Gaps and workarounds

| Capability | Node / TS | Python | C# | Workaround |
|---|---|---|---|---|
| Delay newly published versions | `minimumReleaseAge` | `exclude-newer` (uv), `--uploaded-prior-to` (pip) | **None** | C#: upgrade dependencies only through Dependabot with a cooldown; use locked mode; review lock file changes [inference] |
| Reject versions whose trust level dropped | `trustPolicy` | **None** | **None** (`signatureValidationMode=require` only checks that a signature exists) | Lock files plus review; in Python, `explicit` sources plus `exclude-newer` lower the risk [inference] |
| Allow-list for install scripts | `allowBuilds` | Different granularity: `no-build` blocks all source builds, `no-build-package` per package | **None**: MSBuild targets and analyzers run at build time | C#: restrict sources with Package Source Mapping, require signatures, keep dependencies few [inference] |
| One tool for all unused things | knip | Three tools (Ruff F401, vulture, deptry) | Member-level analyzer rules only; **no official tool for unused NuGet dependencies** | Accept the combination; review C# dependencies by hand [inference] |
| Architecture check without a build | dependency-cruiser | import-linter (static) | **None**: ArchUnitNET reads compiled assemblies | C#: draw the main boundaries with project references; ArchUnitNET tests are the second line [inference] |
| Mermaid or DOT dependency graph | `depcruise -T mermaid` | `tach show --mermaid`, `import-linter drawgraph` | **No official tool** | Write a small script that reads `ProjectReference` from each `.csproj` and prints a Mermaid graph [inference; not written yet] |
| Descriptions copied into the schema | Zod `.describe()` | Pydantic `Field(description=...)` | Needs a `TransformSchemaNode` step for `[Description]` | Write one exporter helper in the contracts project [inference] |

---

## 4. Minimal skeletons

### Python

```
.python-version          # 3.14
pyproject.toml           # dependencies, dependency groups, ruff / type checker / importlinter config
uv.lock                  # committed
noxfile.py               # or justfile
.githooks/pre-commit     # ruff check + ruff format --check
src/<pkg>/
  contracts/  core/  adapters/  main.py   # main.py is the only composition entry point
tests/
```

`pyproject.toml` excerpt. The `[tool.uv]` and `[tool.importlinter]` parts ran in a minimal project on 2026-10-13; violations were reported with file and line.

```toml
[dependency-groups]
dev = ["pytest", "hypothesis", "ruff", "pyright", "import-linter", "vulture", "deptry", "pip-audit", "nox"]

[tool.uv]
exclude-newer = "3 days"   # delay newly published versions
no-build = true            # do not build third-party source packages

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "TID"]

[tool.importlinter]
root_package = "pkg"

[[tool.importlinter.contracts]]
name = "core does not import adapters"
type = "forbidden"
source_modules = ["pkg.core"]
forbidden_modules = ["pkg.adapters"]

[[tool.importlinter.contracts]]
name = "adapters only imported by the composition root"
type = "protected"
protected_modules = ["pkg.adapters"]
allowed_importers = ["pkg.main"]
```

One command: `uv run nox -s check`, with a nox session that runs `ruff check`, `ruff format --check`, the type checker, `lint-imports`, `vulture`, `deptry`, and `pytest` in sequence (not run on the check date). CI: `uv sync --locked`, then the same command, then `pip-audit`.

### C#

```
global.json              # SDK version; test runner Microsoft.Testing.Platform
Directory.Build.props    # shared build rules
Directory.Packages.props # central package versions
NuGet.config             # <clear/> + packageSourceMapping
.editorconfig            # root = true; style and naming rules
.config/dotnet-tools.json
App.slnx
src/App.Contracts/  src/App.Core/  src/App.Adapters.X/  src/App.Host/   # Host is the only composition entry point
tests/App.Tests/  tests/App.ArchTests/                                 # ArchTests use ArchUnitNET
```

`Directory.Build.props` excerpt. Each property comes from the official docs; the combination has not been built.

```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <WarningsNotAsErrors>$(WarningsNotAsErrors);NU1901;NU1902;NU1903;NU1904</WarningsNotAsErrors>
    <AnalysisMode>Recommended</AnalysisMode>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>
    <RestoreLockedMode Condition="'$(CI)' == 'true'">true</RestoreLockedMode>
  </PropertyGroup>
</Project>
```

One command:

```sh
dotnet restore --locked-mode && dotnet build --no-restore && dotnet test --no-build && dotnet format --verify-no-changes --no-restore
```

---

## 5. Decide per project

These are preferences. Decide them when you adopt the playbook, and record the choice in the project's tech stack document.

| Language | Decision | Options and trade-off |
|---|---|---|
| Python | Type checker | Pyright (most established), Pyrefly (stable and fast), ty (beta; from the makers of uv and Ruff, with automatic fixes) |
| Python | Task runner for the one command | nox (written in Python), just (one runner for every language) |
| C# | Formatter | `dotnet format` (configurable, ships with the SDK), CSharpier (fixed style, one more tool) |
| C# | Test framework | xUnit v3 (community default), MSTest, TUnit |
| C# | Supply-chain gaps | Accept the gaps and rely on Dependabot cooldown plus lock file review, or add another tool (Renovate's `minimumReleaseAge` may cover NuGet; not verified) |
| C# | Dependency graph | Write the small Mermaid script, or leave the graph out of the as-built docs |

---

## 6. Not verified (as of 2026-10-13)

- Python: whether `uv audit`, `uv check`, and `uv format` need a preview flag at run time; vulture, deptry, `pip-audit` against `uv.lock`, `model_json_schema()`, and `import-linter drawgraph` were not run.
- Node/TS: whether dependency-cruiser and knip work under TypeScript 7.
- C#: the skeleton was not built; how many warnings `AnalysisMode=Recommended` produces on an empty project is unknown.
- C#: whether NuGet has any setting like `minimumReleaseAge` (three relevant doc pages had none, but not every page was checked).
- Dependabot: whether the `nuget` ecosystem updates `Directory.Packages.props` and `packages.lock.json` correctly; whether the `uv` ecosystem supports the uv 0.13 lock file.
- The license terms of the ReSharper command-line tools.

---

## 7. How to check a version

Check each version on the day you adopt it, and write the date:

- npm: `npm view <package> version time.modified`
- PyPI: `https://pypi.org/pypi/<package>/json` (field `info.version`)
- NuGet: `https://api.nuget.org/v3-flatcontainer/<lowercase package id>/index.json` (the last stable entry)

## 8. How to add a language

1. Copy the roles table (section 1).
2. For each role, find the first choice and one alternative from official docs and the package registry.
3. Check each version with the registry and write the date.
4. Run the one-command check, the architecture check, and the hooks in a minimal project.
5. Write the gaps in section 3, with a workaround for each.
6. Write a minimal skeleton in section 4.
7. Mark the column as **researched** until a real project uses it.
