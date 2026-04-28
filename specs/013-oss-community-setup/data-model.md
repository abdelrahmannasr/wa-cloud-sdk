# Data Model: Open-Source Community Publishing

**Feature**: 013-oss-community-setup
**Date**: 2026-04-20

This feature has no runtime data model (the spec's Key Entities section marked this explicitly as N/A). What follows is the **configuration-artifact inventory** — each file the feature introduces or modifies, its purpose, its required fields/sections, and the spec FRs it satisfies. This is the structural contract between the plan and the tasks that will implement it.

## Artifact Inventory

| Artifact | Kind | Purpose | Satisfies |
|---|---|---|---|
| `CONTRIBUTING.md` | markdown (root) | Contributor onboarding + conventions | FR-002 … FR-005 |
| `CODE_OF_CONDUCT.md` | markdown (root) | Community behavior standards | FR-006 |
| `SECURITY.md` | markdown (root) | Private vulnerability reporting | FR-007, FR-008 |
| `CHANGELOG.md` | markdown (root) — **rewritten** | Release history seed for semantic-release | FR-020 (indirect) |
| `.releaserc.json` | JSON config (root) | semantic-release plugin pipeline | FR-016 … FR-020 |
| `.npmignore` | newline-delimited list (root) | Publish-tarball exclusions (defence-in-depth) | FR-021 |
| `.github/dependabot.yml` | YAML config | Weekly dep + CI-action update PRs | FR-026 … FR-028 |
| `.github/PULL_REQUEST_TEMPLATE.md` | markdown template | Auto-populated PR body | FR-011 |
| `.github/ISSUE_TEMPLATE/bug_report.md` | markdown template w/ YAML frontmatter | Bug report form | FR-009 |
| `.github/ISSUE_TEMPLATE/feature_request.md` | markdown template w/ YAML frontmatter | Feature request form | FR-009 |
| `.github/ISSUE_TEMPLATE/config.yml` | YAML config | Disable blank issues + Discussions link | FR-010 |
| `.github/workflows/ci.yml` | GitHub Actions YAML — **replaced** | 3-job parallel CI | FR-012 … FR-015 |
| `.github/workflows/release.yml` | GitHub Actions YAML — **new** | Automated release on push to main | FR-016 … FR-020, FR-035 |
| `package.json` | JSON — **modified** | Package metadata | FR-022, FR-023, FR-029 |
| `README.md` | markdown — **modified** | Badges + contribution/security links | FR-024, FR-025 |
| `.github/workflows/publish.yml` | **deleted** | Legacy release-triggered publish | superseded by `release.yml` |

15 new/modified + 1 deleted = **16 filesystem changes**.

## Required Fields per Artifact

Each artifact's formal contract (required sections, fields, YAML keys) lives in `contracts/` as a separate document — one contract per shape category. Summary:

- **`contracts/ci-workflow.md`** — CI workflow triggers, jobs, matrix, conditionals.
- **`contracts/release-workflow.md`** — Release workflow trigger, permissions, steps, concurrency, env vars.
- **`contracts/issue-templates.md`** — Frontmatter keys + body sections for bug & feature templates; structure of `config.yml`.
- **`contracts/pr-template.md`** — Sections + checklist keys for PR template.
- **`contracts/package-metadata.md`** — `package.json` field set that this feature touches (version, engines, publishConfig, files, repository, bugs, homepage).
- **`contracts/semantic-release-config.md`** — `.releaserc.json` plugin ordering + option keys.

## Lifecycle / State

There is no persistent state model. Two implicit state machines do run:

### Package version state (managed by semantic-release)

```
┌─────────────────────┐
│ 0.0.0-development   │  initial state after this feature merges
└──────────┬──────────┘
           │ first release-worthy merge to main
           ▼
┌─────────────────────┐
│ 1.0.0 (or 0.1.0)    │  first published version — bump derived from
└──────────┬──────────┘   commit history since repo inception
           │ every subsequent merge
           ▼
    semver-advanced version (patch / minor / major based on commits)
```

Note: whether the first release is `1.0.0` or `0.1.0` depends on whether semantic-release encounters a BREAKING CHANGE in history. Maintainer may force-tag `v1.0.0` before the first run if a stable API commitment is desired.

### PR → main → release lifecycle

```
draft PR ─→ PR open ─→ CI runs (quality + test matrix + build) ─→ review approval
                                                                        │
                                                     (branch protection)│
                                                                        ▼
                                         merge (squash/rebase, signed commit)
                                                                        │
                                                                        ▼
                                         release.yml fires (concurrency group)
                                                                        │
                                          semantic-release analyzes commits
                                                          │             │
                                           no release     ▼  release    ▼
                                      ◀── exit clean        bump → publish npm
                                                               → GitHub Release
                                                               → commit CHANGELOG+version back
                                                               → tag vX.Y.Z
```

## Validation Rules

- `CONTRIBUTING.md` MUST reference the exact command names declared in `package.json` scripts (`pnpm test`, `pnpm lint`, etc.).
- `package.json` `engines.node` MUST equal the minimum version in the CI test matrix and the README badge (FR-029).
- `files` array MUST NOT include any of: `src`, `tests`, `examples`, `specs`, `.github`, `.claude`, `.specify` (FR-021).
- `.releaserc.json` `branches` MUST contain only `"main"` (FR-016 — releases only from default branch).
- `release.yml` on:push branches MUST be `[main]` only.
- `release.yml` permissions MUST include `contents: write`, `issues: write`, `pull-requests: write`, `id-token: write` (last one required for npm provenance).
- `ci.yml` on: MUST include `push` to `[main, staging]` and `pull_request` to `[main, staging]` (FR-012).
- Every dependabot commit prefix MUST be non-releasing in Angular convention (`chore(deps):`, `chore(ci):`) (FR-028).
