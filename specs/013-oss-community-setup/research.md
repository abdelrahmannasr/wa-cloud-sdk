# Research & Design Decisions: Open-Source Community Publishing

**Feature**: 013-oss-community-setup
**Date**: 2026-04-20

The Technical Context in `plan.md` contains no `NEEDS CLARIFICATION` markers (the two open questions were resolved in the `/speckit.clarify` session on 2026-04-20). This document captures the design decisions that underlie the plan, with rationale and rejected alternatives.

---

## R1: Release automation tool

**Decision**: [semantic-release](https://github.com/semantic-release/semantic-release) with the default Angular convention (via `@semantic-release/commit-analyzer` default preset).

**Rationale**:
- Fully automated: analyzes commits, bumps version, generates notes, publishes to npm, creates GitHub Release, commits the bump back — satisfies FR-016, FR-017, FR-020.
- First-class npm provenance support (publishes with `--provenance` when `id-token: write` is in workflow permissions) — satisfies FR-019 and FR-022.
- Angular convention maps directly to the version-bump rules declared in the spec's FR-017 (feat→minor, fix/perf→patch, BREAKING CHANGE→major).
- Zero runtime footprint: installed as a devDependency, invoked only in the release workflow.

**Alternatives considered**:
- **release-please** (Google): newer, uses release PRs instead of push-triggered releases. Rejected: release-PR flow is an extra click for the maintainer; push-triggered is the simpler mental model for a solo maintainer.
- **changesets**: popular in monorepos. Rejected: this is a single package; `changesets` adds per-PR ceremony that doesn't pay back for a single-library repo.
- **Manual `npm version` + GitHub Release**: rejected — violates FR-016 (full automation) and is error-prone at low release cadence.

---

## R2: npm authentication — `NPM_TOKEN` vs OIDC Trusted Publishing

**Decision**: Classic `NPM_TOKEN` (npm automation token), stored as a GitHub Actions secret.

**Rationale**:
- Explicit choice in the source task ("NPM_TOKEN in release workflow env vars", "do NOT set registry-url — semantic-release handles auth").
- semantic-release's npm plugin handles `NPM_TOKEN` transparently; no additional wiring required.
- Provenance (FR-022) is independent of auth method — works with both `NPM_TOKEN` and OIDC. Provenance is enabled via `publishConfig.provenance: true` in `package.json` plus `id-token: write` permission in the workflow.

**Alternatives considered**:
- **OIDC Trusted Publishing** (npm's 2024+ feature): token-less publishing using GitHub OIDC. More secure (no long-lived secret to rotate/leak). Rejected for this iteration: requires a one-time trusted-publisher registration on npm, and the source task locked in `NPM_TOKEN`. Documented as a future migration candidate in `quickstart.md`.

---

## R3: CI job decomposition — monolith vs. three parallel jobs

**Decision**: Three parallel jobs — `quality`, `test` (matrix), `build`.

**Rationale**:
- Parallel execution reduces wall-clock (FR-012). On GitHub-hosted runners, queue time dominates for short jobs — running three in parallel is measurably faster than sequential.
- Failure isolation: a lint failure doesn't cancel a long-running test matrix; the maintainer sees both failure signals at once.
- Matches the spec's FR-012 exactly ("three independent jobs").
- Required-status-checks list on branch protection becomes explicit: three checks (quality, test, build) — discoverable and auditable.

**Alternatives considered**:
- **Single job with sequential steps** (current `ci.yml` shape): rejected — loses parallelism and fails fast on the wrong signal.
- **One job per module** (messages, webhooks, …): rejected — unnecessary fragmentation; existing test suite runs ~<10s locally and the matrix already covers Node versions, which is the real variance source.

---

## R4: Coverage reporting destination

**Decision**: Codecov, with `fail_ci_if_error: false`, uploaded only from the Node 22 matrix leg.

**Rationale**:
- Codecov is the source task's chosen destination and already referenced by the README badge in the spec (FR-024).
- `fail_ci_if_error: false` satisfies FR-013 (coverage is advisory, not blocking).
- Uploading from one matrix leg avoids duplicate/conflicting uploads when Node 18/20/22 all finish and race to upload — Codecov deduplicates by run ID, but single-upload is simpler.
- Node 22 is the "primary" leg per the spec (the quality job and release job both use Node 22).

**Alternatives considered**:
- **Coveralls**: fine alternative, but Codecov is what the source task and spec badges require. Switching would mean re-pinning the README badge URL.
- **Upload coverage from all matrix legs**: rejected — adds noise and race risk for no information gain.

---

## R5: Node LTS matrix — which versions

**Decision**: `[18, 20, 22]` — minimum supported (declared in `engines.node`) + two active LTS above it.

**Rationale**:
- Matches the clarification assumption in `spec.md` and FR-014.
- 18 is the floor declared in `package.json`. 20 and 22 are the active LTS lines at the time of setup. 
- Keeping the floor (18) in the matrix prevents silent regressions that only surface in 20+.

**Alternatives considered**:
- **`[20, 22]` only** (drop 18): rejected — contradicts the declared `engines.node: >=18.0.0`. If/when 18 goes fully end-of-life, drop it from the matrix *and* bump `engines.node` in lockstep (FR-029).
- **`[18, 20, 22, latest]`**: rejected — "latest" is a moving target that breaks CI unpredictably when Node cuts a new release.

---

## R6: Branch protection — rule set

**Decision**: Strict (Clarification Q1, Option A):
- Block direct push to `main`.
- Require pull request before merging.
- Require 1 approving review.
- Require all three CI status checks to pass (`quality`, `test (18)`, `test (20)`, `test (22)`, `build` — five checks if GitHub lists matrix legs separately; see note below).
- Require linear history (no merge commits; squash or rebase-merge only).
- Require signed commits.

**Rationale**:
- Explicit user choice in clarification Q1.
- Signed commits (FR-034) is the combined-option outcome; documented as a hard requirement.
- Linear history (FR-033) ensures semantic-release's commit-analyzer sees a clean linear log — no merge-commit noise.

**Note on matrix leg status-check names**: GitHub publishes one check per matrix leg (e.g. `test (18)`, `test (20)`, `test (22)`). The branch protection UI must list all of them explicitly or the matrix leg whose name was selected will be the only gate. FR-012 (as updated) distinguishes "three job kinds" from "status checks": three job kinds (`quality`, `test`, `build`) expand into five status checks (`quality`, `test (18)`, `test (20)`, `test (22)`, `build`). FR-032 (as updated) requires enumerating every individual name in branch protection; `quickstart.md` documents the exact list.

**Alternatives considered**:
- **Standard** (block direct push + require CI, no review): simpler for a solo maintainer. Rejected by explicit user choice. Acceptable to downgrade later if review requirement becomes operationally blocking.
- **Light** (CI advisory only): rejected.
- **No protection**: rejected — accidental direct push to main would trigger an unwanted release.

---

## R7: Concurrent release workflow runs

**Decision**: `concurrency: { group: release, cancel-in-progress: false }` on the release workflow (Clarification Q2, Option A).

**Rationale**:
- Serializes sequential runs; the second waits for the first.
- Prevents the npm `409 conflict` race that happens when two semantic-release runs try to publish the next patch simultaneously.
- Preserves all commits: every run still analyzes the full commit history since the last tag, so nothing is dropped.

**Alternatives considered**:
- **cancel-in-progress: true**: rejected — dropping an in-progress release means its commits never get a tagged release (they'd roll into the next one, but the changelog narrative gets muddled and the `[skip ci]` release commit from the cancelled run may still land, creating an inconsistent state).
- **No concurrency control**: rejected — race condition is real; semantic-release's npm plugin retries but fails eventually, requiring manual cleanup.

---

## R8: CHANGELOG.md strategy — amend vs. rewrite

**Decision**: Rewrite with `[Unreleased]` content; delete the existing `[0.1.0] - 2026-02-17` entry.

**Rationale**:
- The `0.1.0` entry was never actually published to npm (`pnpm view @abdelrahmannasr-wa/cloud-api` returns 404 as of 2026-04-20); it was an aspirational entry.
- semantic-release's `@semantic-release/changelog` plugin expects to own the file from the first release onward; leaving an orphaned `0.1.0` section creates a confusing commit diff on first real release.
- The `[Unreleased]` section documents what exists in the codebase today — honest and useful for the first automatic release notes to anchor against.

**Alternatives considered**:
- **Prepend `[Unreleased]` above `[0.1.0]`**: rejected — leaves the orphan `0.1.0` entry forever.
- **Delete CHANGELOG and let semantic-release create it fresh**: rejected — the file is referenced in `package.json` `files` and the README; deleting it breaks links and the published tarball.

---

## R9: .npmignore vs. `files` in package.json

**Decision**: Both — `files` array as the positive allowlist; `.npmignore` as a defence-in-depth negative list.

**Rationale**:
- `files: ["dist", "README.md", "LICENSE", "CHANGELOG.md"]` is the primary mechanism (npm honors this if present and ignores `.npmignore`). But if someone later edits `files` carelessly, `.npmignore` ensures things like `src/`, `tests/`, `.claude/`, `.env*` never leak.
- `.npmignore` also excludes files that `files: ["dist"]` wouldn't pick up anyway (examples/, specs/, .github/) — defence-in-depth costs nothing and guards against future drift.
- Verification (SC-002) is `pnpm publish --dry-run` / `pnpm pack --dry-run`, which respects both.

**Alternatives considered**:
- **`files` only**: simpler; rejected for defence-in-depth reasons above.
- **`.npmignore` only**: rejected — less explicit than a positive allowlist; npm's default inclusion rules can surprise you.

---

## R10: Dependabot — update scope and commit prefixes

**Decision**: Two ecosystems — `npm` (directory `/`) and `github-actions` (directory `/`), both weekly, with distinct labels and distinct `chore(…)` commit prefixes.

**Rationale**:
- Matches FR-026, FR-027, FR-028 exactly.
- `chore(deps):` / `chore(ci):` are non-releasing prefixes for the Angular convention → semantic-release correctly treats dep bumps as non-releasing (FR-028).
- Weekly cadence keeps noise manageable for a solo maintainer.
- `open-pull-requests-limit: 10` on npm side prevents a storm; github-actions updates are rarer, so no cap.

**Alternatives considered**:
- **Daily updates**: rejected — noisy.
- **Grouped updates** (Dependabot's `groups` feature): tempting for dev-dep cleanup, but rejected for this iteration — keep PRs atomic for easier triage and bisecting.
- **Renovate Bot** (alternative to Dependabot): more configurable, but Dependabot is built into GitHub and requires no external setup; good enough for this repo's needs.

---

## R11: README badge set

**Decision**: Nine badges as specified in FR-024 — npm version, CI status, Codecov, license (MIT), Node ≥18, TypeScript 5.x, npm monthly downloads, PRs Welcome, semantic-release (Angular).

**Rationale**:
- Each badge answers a specific question a consumer or contributor asks within the first 5 seconds of landing on the README (SC-008).
- Order is roughly "trustworthiness signals first" (version, CI, coverage, license) → "technical fit" (Node, TS) → "social signals" (downloads, PRs welcome, release mechanism).

**Alternatives considered**:
- **Fewer badges**: rejected — each carries unique information per SC-008.
- **More badges** (bundlephobia, snyk, etc.): rejected for v1 — diminishing returns and noisy.

---

## Summary — no open clarifications

All `NEEDS CLARIFICATION` markers from the spec's clarification session were resolved. This research document locks the decisions that feed Phase 1 (contracts, data model, quickstart). Re-evaluation of the Constitution Check after Phase 1 is expected to remain **PASS** (no runtime code added, zero runtime deps preserved).
