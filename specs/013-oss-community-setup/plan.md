# Implementation Plan: Open-Source Community Publishing

**Branch**: `013-oss-community-setup` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-oss-community-setup/spec.md`

## Summary

Turn `wa-cloud-sdk` into a production-grade public OSS package. Two tracks in parallel:

1. **Community health & UX**: add CONTRIBUTING / CODE_OF_CONDUCT / SECURITY / CHANGELOG at the repo root, curated GitHub issue templates + a PR template, refreshed README with a badge row and Contributing/Security sections. These are pure documentation and YAML — no code changes.

2. **CI/CD & release automation**: replace the single-job CI workflow with three parallel jobs (quality / test-matrix / build), delete the legacy `publish.yml`, and add a `release.yml` that runs `semantic-release` on every push to `main`. Publish to npm with provenance. Add Dependabot for weekly dependency + CI action upgrades. Update `package.json` to `0.0.0-development` and declare provenance-enabled publish config.

Source-of-truth for the design is already captured in the approved plan file at `~/.claude/plans/claude-cowork-task-shiny-umbrella.md`; this document restates and refines it per the speckit template.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict); outputs ESM + CJS dual build via tsup 8
**Primary Dependencies**: Zero runtime dependencies (hard constraint — must not change). Added **devDependencies only**: `semantic-release`, `@semantic-release/changelog`, `@semantic-release/git`. Existing dev deps continue unchanged (`vitest`, `eslint`, `prettier`, `tsup`, `typescript-eslint`).
**Storage**: N/A
**Testing**: vitest 3 (existing), v8 coverage; unit tests unchanged. Feature has no new source code, therefore no new unit tests. Feature verification is pipeline-level (see quickstart.md).
**Target Platform**: Node.js ≥18 (runtime constraint declared in `package.json` engines). CI runs on ubuntu-latest, Node 18/20/22. Release runs on ubuntu-latest, Node 22.
**Project Type**: Library (single project — existing `src/` + `tests/` layout, no frontend/backend split).
**Performance Goals**: (infra-scope)
- CI wall-clock must stay ≤10 min per run end-to-end (observed, not enforced).
- Release workflow publishes within 10 min of merge to main (SC-003).
**Constraints**:
- Zero runtime deps (existing project constraint — MUST NOT be broken by any added tooling).
- Published tarball MUST contain only `dist/`, README, LICENSE, CHANGELOG, `package.json` (FR-021, SC-002).
- Commits on `main` MUST be signed (GPG or SSH) — including automated release commits (FR-034, clarification Q1).
- Release workflow runs MUST serialize via concurrency group (FR-035, clarification Q2).
**Scale/Scope**: 13 new files, 2 modified files, 1 deleted file. ~450 lines total. Single-maintainer repo, low PR volume (≤10/week projected).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repository's `.specify/memory/constitution.md` is an unpopulated template (all `[PRINCIPLE_N]` placeholders). No concrete principles are ratified, so there are no hard constitutional gates for this feature. Soft self-imposed gates from `CLAUDE.md` and the existing codebase conventions:

| Gate | Source | Status |
|---|---|---|
| Zero runtime dependencies | `CLAUDE.md` "Architecture Rules" | **PASS** — only devDependencies added (`semantic-release` + two plugins); no runtime import changes |
| Named exports only, no default exports | `CLAUDE.md` "Code Conventions" | **PASS (N/A)** — no source code changes |
| Node.js ≥18 built-ins only | `CLAUDE.md` "Zero Dependencies" | **PASS (N/A)** — no source code changes |
| File naming kebab-case | `CLAUDE.md` "Code Conventions" | **PASS** — new files (`CONTRIBUTING.md`, `release.yml`, etc.) follow idiomatic community-file naming; docs convention (uppercase root-level community files) takes precedence over kebab-case for GitHub auto-discovery |
| No test dependency on network calls | `CLAUDE.md` "Testing Strategy" | **PASS (N/A)** — no new tests |

**Result**: PASS. No `Complexity Tracking` entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/013-oss-community-setup/
├── plan.md              # This file
├── research.md          # Phase 0 output — design decisions + alternatives
├── data-model.md        # Phase 1 output — configuration artifacts inventory
├── quickstart.md        # Phase 1 output — maintainer bootstrap guide
├── contracts/
│   ├── ci-workflow.md           # CI workflow trigger/job contract
│   ├── release-workflow.md      # Release workflow trigger/output contract
│   ├── issue-templates.md       # GitHub issue template frontmatter contract
│   ├── pr-template.md           # PR template structure contract
│   ├── package-metadata.md      # package.json fields contract
│   └── semantic-release-config.md  # .releaserc.json plugin contract
├── checklists/
│   └── requirements.md  # From /speckit.specify — already present
└── tasks.md             # /speckit.tasks — NOT created here
```

### Source Code (repository root)

```text
# Existing source layout (unchanged)
src/
├── client/  errors/  messages/  webhooks/  media/
├── templates/  flows/  phone-numbers/  multi-account/  catalog/  utils/
├── index.ts  whatsapp.ts
tests/           # mirrors src/
examples/        # not published
specs/           # includes this feature

# NEW root-level community-health files (added by this feature)
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
CHANGELOG.md            # REWRITTEN (existing 0.1.0 entry replaced with [Unreleased])
.releaserc.json
.npmignore

# NEW .github/ files
.github/
├── dependabot.yml
├── PULL_REQUEST_TEMPLATE.md
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── config.yml
└── workflows/
    ├── ci.yml           # REPLACED — now three parallel jobs
    └── release.yml      # NEW — semantic-release, push-to-main only

# DELETED
.github/workflows/publish.yml   # superseded by release.yml

# MODIFIED
package.json            # version → 0.0.0-development; add publishConfig; fix repository.url
README.md               # badge row expanded; Contributing + Security sections added before License
```

**Structure Decision**: Single-project library layout preserved. All new artifacts live at the repo root or under `.github/` (community-health/CI convention) — no new `src/` code is added. The existing subpath export structure is untouched.

## Complexity Tracking

> No Constitution Check violations. Table omitted.

## Phase Outputs

- Phase 0 (`research.md`): design decisions with rationale and rejected alternatives.
- Phase 1 (`data-model.md`, `contracts/`, `quickstart.md`): configuration-artifact inventory, external-interface contracts, and the maintainer bootstrap guide (including required secret provisioning and branch-protection setup).
- Phase 2 (`tasks.md`) is produced by `/speckit.tasks` — not by this command.
