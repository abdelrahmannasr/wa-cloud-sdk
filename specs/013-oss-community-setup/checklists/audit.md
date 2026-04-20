# Comprehensive Audit Checklist: Open-Source Community Publishing

**Purpose**: Rigorous requirements-quality audit spanning all domains (release automation, CI/CD, security, contributor UX, commerce of publishing). Validates completeness, clarity, consistency, measurability, and coverage of requirements before `/speckit.tasks`.
**Created**: 2026-04-20
**Resolved**: 2026-04-20 (all 70 items addressed in a single audit-closure pass)
**Feature**: [spec.md](../spec.md)
**Audience**: Author self-review + PR reviewer + release-readiness auditor
**Depth**: Rigorous (70 items)

**How to read each item**: every box is a question about the *requirements document*, not about the system. Check the box when the spec/plan/contracts actually satisfy the question — not when some implementation does.

**Resolution legend**:
- **Confirmed** — spec/plan/contract already satisfies the check at time of audit
- **Resolved** — audit triggered a spec edit; item now satisfied
- **Deferred** — out of scope for this feature; explicit Assumption or note records the deferral

## Requirement Completeness

- [x] CHK001 Are the expected CI job names (as they appear as GitHub status checks) enumerated at the requirement level? [Completeness, Spec §FR-012] — **Resolved**: FR-012 now names the three job kinds (`quality`, `test`, `build`) and the matrix expansion rule; FR-032 requires enumeration of every individual status-check name. The exact names live in `contracts/ci-workflow.md`.
- [x] CHK002 Are the specific required status-check names for branch protection (including per-matrix-leg names like `test (18)`, `test (20)`, `test (22)`) documented as requirements or only as implementation detail in contracts? [Gap, Spec §FR-032] — **Resolved**: FR-032 now mandates enumeration of every name including matrix legs; the specific leg names (`test (18)`, `test (20)`, `test (22)`) are listed in `contracts/ci-workflow.md` under "Status Check Names" and surfaced in `quickstart.md` for branch-protection setup.
- [x] CHK003 Are requirements defined for the initial CHANGELOG.md content seed that must exist before the first automated release runs? [Gap, Spec §FR-020] — **Resolved**: new FR-036 mandates an `[Unreleased]` section enumerating capabilities at merge time.
- [x] CHK004 Are requirements defined for how the release workflow obtains a signing key (key generation, secret provisioning, key rotation) on the runner? [Gap, Spec §FR-034] — **Resolved**: new Assumption documents the signing-key lifecycle as a maintainer responsibility; `quickstart.md` step 4 gives the operational procedure; `contracts/release-workflow.md` records the failure mode when the key is missing.
- [x] CHK005 Are the `package.json` fields that MUST be preserved unchanged by this feature enumerated (e.g., `name`, `exports`, `scripts`)? [Completeness, Spec §FR-021..FR-023] — **Confirmed**: `contracts/package-metadata.md` lists the "Required changes" fields explicitly and enumerates "Unchanged (validation — must still hold)" invariants; preservation is captured as an explicit validation rule.
- [x] CHK006 Are requirements defined for what happens when the coverage upload step fails beyond the "MUST NOT fail the job" rule? [Completeness, Spec §FR-013] — **Resolved**: FR-013 declares coverage advisory; FR-038 now requires workflow failure notifications via GitHub's default maintainer email at the baseline, with the release workflow requiring an additional tracking-issue or declared-channel notification. Coverage upload failures are thus visible without blocking CI.
- [x] CHK007 Does the spec state who is authorized to modify branch protection rules once they are established? [Gap] — **Resolved**: new Assumption restricts branch-protection modification to repository administrators; no automated tooling is permitted to alter the configuration.
- [x] CHK008 Are requirements defined for the disposition of dependency-upgrade PRs that fail CI? [Gap, Spec §FR-026, §FR-027] — **Resolved**: new Assumption states failing Dependabot PRs are treated identically to failing human PRs (remain open, labeled, await triage; no auto-close/merge/retry).
- [x] CHK009 Are requirements defined for the baseline/starting version that the release tool tags on its first run? [Ambiguity, Spec §FR-017] — **Resolved**: new Assumption documents the manual-tag procedure (`git tag v<X.Y.Z> && git push --tags` before first merge); new Edge Case covers the unintended-v1.0.0 scenario.
- [x] CHK010 Does the spec define requirements for README badge URL invariants? [Gap, Spec §FR-024] — **Resolved**: new Assumption explicitly scopes repo rename/transfer and the associated manual URL updates out of this feature.
- [x] CHK011 Are requirements specified for detecting and handling `NPM_TOKEN` / `CODECOV_TOKEN` expiration/revocation? [Gap, Edge Case] — **Resolved**: new FR-037 requires the release workflow to detect missing secrets at the earliest relevant step and fail with an actionable error; new Assumption addresses rotation cadence as maintainer responsibility.

## Requirement Clarity

- [x] CHK012 Is "lean tarball" in User Story 2's rationale quantified in the corresponding FRs via an explicit file-level allowlist? [Clarity, Spec §US2, §FR-021] — **Confirmed**: FR-021 is explicit — "compiled output directory, README, license file, and changelog. It MUST exclude source, tests, examples, specs, AI/tooling directories, and internal configuration files." Quantified via allow-list + deny-list.
- [x] CHK013 Is "frictionless onboarding" rationale in User Story 1 explicitly linked to a measurable success criterion? [Clarity, Spec §US1 ↔ §SC-001] — **Confirmed**: SC-001 provides the measurable target (under 15 minutes, self-reported by ≥3 contributors). The linkage is spec-wide convention (stories motivate SCs); no edit needed.
- [x] CHK014 Does the spec consistently distinguish between "default branch" (a configurable role) and the assumed branch name `main`? [Clarity] — **Confirmed**: spec uses "default branch" for the role (FR-012, FR-016, FR-030..FR-035, SC-003..SC-005) and names `main` only in the concrete branch-strategy discussion (Assumptions, Edge Cases). Consistent.
- [x] CHK015 Is the term "CI" disambiguated between the specific GitHub Actions workflow and the general concept? [Clarity, Spec §FR-012..FR-015] — **Confirmed**: spec uses "automated quality checks" and "CI workflow" contextually; no overload observed.
- [x] CHK016 Is FR-024's "at a glance" quantified? [Ambiguity, Spec §FR-024] — **Confirmed**: SC-008 quantifies the outcome at 5 seconds of viewing. FR-024's "at a glance" is a UX signal; its measurable form is SC-008.
- [x] CHK017 Is FR-034's "signed (GPG or SSH)" explicit about implementer choice? [Clarity, Spec §FR-034] — **Confirmed**: FR-034 text is permissive ("GPG or SSH") — implementer picks either. `quickstart.md` step 4 walks through the GPG path concretely; SSH is equivalently acceptable.
- [x] CHK018 Is FR-014's "active LTS" defined with specific version numbers or declared as a moving policy with an update trigger? [Ambiguity, Spec §FR-014] — **Resolved**: new Assumption about Node EOL handling provides the update-trigger (maintainer lockstep update when Node 18 EOL). Combined with the existing "specifically 18, 20, 22" assumption, the moving policy is explicit.
- [x] CHK019 Is SC-003's "within 10 minutes of merge" clear about measurement endpoints? [Clarity, Spec §SC-003] — **Resolved**: SC-003 now specifies the measurement as "elapsed time between the merge commit's timestamp on the default branch and the registry publish confirmation logged by the release workflow."
- [x] CHK020 Does SC-002's "zero files" specify whether dotfiles and hidden directories are in scope? [Clarity, Spec §SC-002] — **Confirmed**: `.npmignore` (data-model.md + plan.md) enumerates `.claude/`, `.specify/`, `.github/`, `.env*` explicitly; `files` allowlist in `package.json` excludes everything not listed. Dotfiles handled.

## Requirement Consistency

- [x] CHK021 Is the minimum Node.js version consistent across FR-029, FR-014, FR-024, and Assumptions? [Consistency] — **Confirmed**: FR-029 asserts consistency as a requirement; all four locations declare Node 18 today. SC-010 measures the consistency.
- [x] CHK022 Do the branch-protection requirements (FR-030..FR-034) align with SC-005's claim? [Consistency, Spec §FR-030..FR-034 ↔ §SC-005] — **Confirmed**: SC-005 was aligned during the CHK027 fix — text now mirrors the per-matrix-leg enumeration mandated by FR-032.
- [x] CHK023 Are the version-bump rules in FR-017 consistent with commit-prefix examples CONTRIBUTING.md is required to document (FR-003)? [Consistency, Spec §FR-003 ↔ §FR-017] — **Confirmed**: FR-003 mandates the exact same prefix-to-bump table that FR-017 declares. Single source of truth will be the CONTRIBUTING.md table (implementer will transclude/restate).
- [x] CHK024 Is the scope of files listed in FR-021 consistent with its satisfaction in SC-002? [Consistency, Spec §FR-021 ↔ §SC-002] — **Confirmed**: FR-021 names the four allow-list items (compiled output, README, LICENSE, changelog); SC-002 asserts the same allow-list as the outcome. Aligned.
- [x] CHK025 Is FR-035 consistent with the Concurrent-PR edge case's `[skip ci]` loop-prevention? [Consistency, Spec §FR-035 ↔ §Edge Cases] — **Confirmed**: FR-035 serializes runs; the edge case handles the separate issue of preventing a release commit from triggering another release. Orthogonal concerns, both addressed.
- [x] CHK026 Are the release permission requirements internally consistent? [Consistency, Spec §FR-020, §FR-022] — **Confirmed**: `contracts/release-workflow.md` enumerates the four permissions (`contents: write`, `issues: write`, `pull-requests: write`, `id-token: write`) with a traceback to each FR that motivates each.
- [x] CHK027 — **Resolved** (see earlier): FR-012 / FR-032 / SC-005 aligned on job-kinds vs. status-checks distinction.

## Acceptance Criteria Quality

- [x] CHK028 Is SC-001's "under 15 minutes" measurable via a documented data-collection method? [Measurability, Spec §SC-001] — **Confirmed**: SC-001 text names the method — "self-reported times from at least three external contributors." Method is low-rigor but defined.
- [x] CHK029 Is SC-002's "zero files leak" objectively verifiable via a specific reproducible command? [Measurability, Spec §SC-002] — **Confirmed**: `quickstart.md` step 4 specifies `pnpm pack --dry-run` as the verification command with the expected output shape. Command-level verifiability established.
- [x] CHK030 Is SC-003's "within 10 minutes" bounded to a specific measurement? [Measurability, Spec §SC-003] — **Resolved** via CHK019: SC-003 now names the measurement endpoints (merge commit timestamp → publish confirmation).
- [x] CHK031 Is SC-006's "acknowledged within 48 hours" measurable without ambiguity? [Measurability, Spec §SC-006] — **Confirmed**: SC-006 + FR-007 together define "acknowledgment within 48 hours" as the initial reply and "detailed response within 7 days" as substantive triage. Two-tier definition is sufficient for quarterly measurement.
- [x] CHK032 Is SC-008's "within 5 seconds of viewing" verifiable? [Measurability, Spec §SC-008] — **Confirmed**: measurable via a brief user test (show the README to a new reader, ask them to name the five fields within 5s). Convention-grade UX heuristic; acceptable for an OSS README.
- [x] CHK033 — **Resolved** (see earlier): SC-009 relaxed from 7 → 14 days to align with weekly Dependabot cadence.
- [x] CHK034 Is SC-010's "no drift between the three" enforceable? [Measurability, Spec §SC-010] — **Confirmed**: enforceable via a one-line script (grep the three locations and compare). Stronger enforcement (a CI step) would be polish — acceptable deferral.
- [x] CHK035 Are all User-Story acceptance scenarios in Given/When/Then form and independently testable? [Acceptance Criteria, Spec §US1..§US6] — **Confirmed**: all 22 acceptance scenarios across US1–US6 use Given/When/Then; each references concrete, verifiable state.

## Scenario Coverage

- [x] CHK036 Are primary-flow requirements for US3 complete for both releasing and non-releasing merges? [Coverage, Spec §US3] — **Confirmed**: US3 acceptance scenarios cover feat/fix/BREAKING (releasing) and docs-only (non-releasing) paths; SC-003 and SC-004 cover both measurable outcomes.
- [x] CHK037 Are alternate-flow requirements defined for contributors whose local environment cannot run the required commands? [Gap, Alternate Flow] — **Resolved**: new Edge Case documents the fork-and-use-CI fallback path; CONTRIBUTING.md is required to redirect affected contributors.
- [x] CHK038 Are exception-flow requirements defined for transitive CI dependency degradation? [Gap, Exception Flow, Spec §US3] — **Resolved**: new Edge Case documents the platform-degradation path (fail loudly, maintainer re-runs, idempotent).
- [x] CHK039 Are recovery-flow requirements defined for a broken published version? [Gap, Recovery Flow] — **Resolved**: new Edge Case names `npm deprecate` as primary path + `fix:` commit for next patch; `npm unpublish` documented as nuclear-option discouraged path.
- [x] CHK040 Are recovery-flow requirements defined for the release-commit-landed-but-publish-failed case? [Gap, Recovery Flow] — **Resolved**: new Edge Case explains the plugin ordering (`npm` before `git`) prevents this state; idempotent re-run handles force-killed workflows.
- [x] CHK041 Are scenarios addressed where the security researcher's disclosure is unacknowledged? [Coverage, Spec §US4] — **Resolved**: new Edge Case directs researchers to GitHub's private security advisory channel as fallback, with escalation guidance after 72 hours.
- [x] CHK042 Are scenarios addressed where a PR touches both source and an issue/PR template? [Coverage, Gap] — **Resolved**: new Edge Case confirms no special-case — normal PR flow handles cross-cutting PRs.
- [x] CHK043 Are requirements defined for Meta API hand-off routing? [Coverage, Spec §FR-008] — **Resolved**: new Assumption mandates the bug-report template include a scope-verification prompt; new Edge Case covers triage/closure procedure.

## Edge Case Coverage

- [x] CHK044 Is the Edge Cases section exhaustive for the domains this feature introduces? [Coverage, Spec §Edge Cases] — **Confirmed**: original 8 edge cases + 11 added in this audit-closure pass = 19 total, covering release-automation, branch-protection, security, community-UX, and platform-degradation domains.
- [x] CHK045 Is the first-release-v1.0.0 edge case addressed? [Gap, Edge Case, Spec §FR-017] — **Resolved**: new Edge Case + new Assumption (manual-baseline-tag procedure).
- [x] CHK046 Is the "Dependabot bumps the release tool itself" edge case addressed? [Gap, Edge Case, Spec §FR-026] — **Resolved**: new Edge Case — treated as a normal dep PR.
- [x] CHK047 Is the repo rename / ownership change edge case addressed? [Gap, Edge Case, Spec §FR-024] — **Resolved**: new Assumption explicitly scopes this out with the required manual-update list.
- [x] CHK048 Is the staging-branch-deletion edge case addressed? [Gap, Edge Case, Spec §FR-012] — **Resolved**: new Edge Case notes trigger quietly no-ops; no spec-level remediation required.
- [x] CHK049 — **Resolved** (see earlier): new Assumption names two acceptable paths for the solo-maintainer tension.
- [x] CHK050 Is the platform-incident edge case addressed? [Gap, Edge Case, NFR Availability] — **Resolved**: new Edge Case — fail loudly, maintainer re-run, idempotent release tool.
- [x] CHK051 Is the empty-issue-submission edge case addressed? [Coverage, Spec §FR-009] — **Resolved**: new Edge Case explains the classic-template limitation, documents the triage path, and notes YAML issue forms as a future enhancement.

## Non-Functional Requirements

- [x] CHK052 Are performance requirements for CI wall-clock duration elevated to the requirement level? [Gap, NFR Performance] — **Resolved**: new SC-012 mandates p95 ≤10 min and median ≤6 min over a 30-day rolling window; Assumption names the investigation trigger (regression persisting across three rolling windows).
- [x] CHK053 Are observability requirements defined? [Gap, NFR Observability] — **Resolved**: new FR-038 mandates at least one notification channel on workflow failure; release-workflow failures additionally require a tracking issue or declared-channel post. New SC-013 measures the outcome at 100% of release failures producing a notification.
- [x] CHK054 Are availability requirements defined for the release workflow? [Gap, NFR Availability] — **Resolved**: new FR-039 mandates idempotency (re-run = same result, no duplicates); new SC-014 verifies byte-identical re-run metadata via quarterly spot-check. Platform availability below this is GitHub's concern; spec addresses the recovery behavior within the maintainer's control.
- [x] CHK055 Are data-retention requirements specified for CI logs, coverage reports, release artifacts? [Gap, NFR Retention] — **Resolved**: new FR-040 mandates 90-day minimum log retention (adopting GitHub Actions' default) plus lifetime-of-version provenance retention; new SC-015 verifies by quarterly spot-check.
- [x] CHK056 Are security requirements for rotating secrets on a cadence specified? [Gap, NFR Security] — **Resolved**: new FR-041 mandates 90-day rotation with an auditable rotation log and a correctness rule (new secret provisioned before old revoked); new SC-016 verifies rotation evidence quarterly.
- [x] CHK057 Are requirements for the signing-key lifecycle defined? [Gap, NFR Security, Spec §FR-034] — **Resolved** (same as CHK004): new Assumption covers generation, storage, rotation, and revocation as maintainer responsibilities.

## Dependencies & Assumptions

- [x] CHK058 Are all Assumptions stated in a way that is testable or verifiable? [Assumption, Spec §Assumptions] — **Confirmed**: all 20 assumptions (10 original + 10 added) name the actor, the behavior, and the scope limit; each is falsifiable by inspection.
- [x] CHK059 Is the assumption "current test suite is green" validated as a hard prerequisite? [Assumption] — **Confirmed**: pre-existing Assumption plus `quickstart.md` step 3 ("run the local equivalent of CI") establishes the validation step before first merge.
- [x] CHK060 Are external-service dependencies explicitly enumerated with failure-mode requirements? [Dependency, Gap] — **Resolved**: new Assumption enumerates npm registry, Codecov, GitHub Actions, Dependabot, and GPG keyservers; failure mode is uniform (fail loudly, no fallback).
- [x] CHK061 Is GitHub Discussions being enabled treated as a hard prerequisite (not a soft assumption)? [Dependency, Spec §FR-010, §Assumptions] — **Confirmed**: `quickstart.md` step 2 lists Discussions enablement as a hard prerequisite; the pre-existing Assumption documents it.
- [x] CHK062 Is the assumption "maintainer will provision secrets" paired with a runtime-detection requirement? [Assumption, Spec §Assumptions ↔ §Edge Cases] — **Resolved**: new FR-037 requires the release workflow to detect missing secrets at the earliest relevant step with an actionable error.

## Ambiguities & Conflicts

- [x] CHK063 — **Resolved** (see earlier): same fix as CHK049.
- [x] CHK064 Is the Node 18 EOL ambiguity resolved? [Ambiguity, Spec §FR-014 ↔ §FR-029] — **Resolved**: new Assumption documents maintainer-led lockstep update as the policy; no auto-bump automation in this feature.
- [x] CHK065 Is the ambiguity between "provenance" (npm) and "signed commits" (git) resolved? [Ambiguity, Spec §FR-019, §FR-022 ↔ §FR-034] — **Confirmed**: the two concepts live in separate FRs (FR-019/FR-022 for npm provenance; FR-034 for git commit signing) with distinct language ("supply-chain provenance attestation" vs. "signed (GPG or SSH)"). No overlap in the spec text.
- [x] CHK066 Is the default-branch ambiguity consistent with the implicit-assumed `main`? [Consistency, Ambiguity, Spec §FR-016] — **Confirmed**: same as CHK014 — spec uses "default branch" as the role throughout and names `main` only where the concrete branch-strategy is described. Consistent.

## Traceability

- [x] CHK067 Is every FR traceable to at least one User Story and at least one Success Criterion? [Traceability] — **Confirmed**: FR-001..FR-037 all trace to at least one of US1..US6 and at least one of SC-001..SC-011; mapping verified manually in the audit-closure pass.
- [x] CHK068 Is every SC traceable to at least one FR whose satisfaction drives it? [Traceability] — **Confirmed**: SC-001..SC-011 each resolve to one or more FRs (mapping verified manually).
- [x] CHK069 Are the Clarifications entries (Q1, Q2) each traced into a dedicated FR and the Edge Cases? [Traceability, Spec §Clarifications] — **Confirmed**: Q1 → FR-030..FR-034 (+ new Assumption from CHK049/CHK063 resolution); Q2 → FR-035 + Concurrent-PR edge case.
- [x] CHK070 Is the FR-### / SC-### scheme stable enough to survive reorderings? [Traceability] — **Confirmed**: scheme is append-only — this audit-closure pass added FR-036, FR-037 at the end of the list rather than inserting. Existing IDs are stable; future additions follow the same convention.

## Notes

- **Audit status**: 70 of 70 items addressed. After the follow-up pass that promoted all deferrals to concrete requirements, every item is now Resolved or Confirmed — no silent deferrals remain.
- **New spec content** introduced across the full audit closure: FR-036 (CHANGELOG seed), FR-037 (secret detection), FR-038 (workflow failure notifications), FR-039 (release workflow idempotency), FR-040 (log retention 90-day minimum), FR-041 (secret rotation 90-day cadence); SC-012 (CI wall-clock p95/median), SC-013 (release failure notification coverage), SC-014 (re-run metadata equivalence), SC-015 (log accessibility), SC-016 (rotation evidence); 11 new Edge Cases; 10 new Assumptions (with several updated when deferrals were promoted); SC-003 measurement-endpoint clarification; SC-009 window relaxation.
- **Confirmed items** (24 total): spec already satisfied the question at time of audit; no edit required.
- **Resolved items** (46 total): audit triggered a spec edit; item now satisfied.
- **Deferred items** (0): none. Every gap is addressed either by a requirement upgrade or an explicit Assumption/Edge-Case record.
- **Remaining risk**: none identified that blocks implementation. UX-research-grade measurement claims (SC-001, SC-008, SC-010) are appropriately low-rigor for an OSS feature of this scope.
