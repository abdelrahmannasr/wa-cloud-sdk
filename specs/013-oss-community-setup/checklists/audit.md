# Comprehensive Audit Checklist: Open-Source Community Publishing

**Purpose**: Rigorous requirements-quality audit spanning all domains (release automation, CI/CD, security, contributor UX, commerce of publishing). Validates completeness, clarity, consistency, measurability, and coverage of requirements before `/speckit.tasks`.
**Created**: 2026-04-20
**Feature**: [spec.md](../spec.md)
**Audience**: Author self-review + PR reviewer + release-readiness auditor
**Depth**: Rigorous (70 items)

**How to read each item**: every box is a question about the *requirements document*, not about the system. Check the box when the spec/plan/contracts actually satisfy the question — not when some implementation does.

## Requirement Completeness

- [ ] CHK001 Are the expected CI job names (as they appear as GitHub status checks) enumerated at the requirement level? [Completeness, Spec §FR-012]
- [ ] CHK002 Are the specific required status-check names for branch protection (including per-matrix-leg names like `test (18)`, `test (20)`, `test (22)`) documented as requirements or only as implementation detail in contracts? [Gap, Spec §FR-032]
- [ ] CHK003 Are requirements defined for the initial CHANGELOG.md content seed that must exist before the first automated release runs? [Gap, Spec §FR-020]
- [ ] CHK004 Are requirements defined for how the release workflow obtains a signing key (key generation, secret provisioning, key rotation) on the runner? [Gap, Spec §FR-034]
- [ ] CHK005 Are the `package.json` fields that MUST be preserved unchanged by this feature enumerated (e.g., `name`, `exports`, `scripts`)? [Completeness, Spec §FR-021..FR-023]
- [ ] CHK006 Are requirements defined for what happens when the coverage upload step fails beyond the "MUST NOT fail the job" rule (surface a warning? open an issue?)? [Completeness, Spec §FR-013]
- [ ] CHK007 Does the spec state who is authorized to modify branch protection rules once they are established? [Gap]
- [ ] CHK008 Are requirements defined for the disposition of dependency-upgrade PRs that fail CI (auto-close? auto-retry? manual triage?)? [Gap, Spec §FR-026, §FR-027]
- [ ] CHK009 Are requirements defined for the baseline/starting version that semantic-release should tag on its first release run (e.g., force v1.0.0, or accept the commit-history-derived default)? [Ambiguity, Spec §FR-017]
- [ ] CHK010 Does the spec define requirements for README badge URL invariants (what happens if the package name, scope, or repo owner changes)? [Gap, Spec §FR-024]
- [ ] CHK011 Are requirements specified for detecting and handling `NPM_TOKEN` or `CODECOV_TOKEN` expiration/revocation after initial provisioning? [Gap, Edge Case]

## Requirement Clarity

- [ ] CHK012 Is "lean tarball" in User Story 2's rationale quantified in the corresponding FRs via an explicit file-level allowlist? [Clarity, Spec §US2, §FR-021]
- [ ] CHK013 Is "frictionless onboarding" rationale in User Story 1 explicitly linked to a measurable success criterion? [Clarity, Spec §US1 ↔ §SC-001]
- [ ] CHK014 Does the spec consistently distinguish between "default branch" (a configurable role) and the assumed branch name `main` (the current value)? [Clarity]
- [ ] CHK015 Is the term "CI" disambiguated between the specific GitHub Actions workflow and the general concept in FRs that use it? [Clarity, Spec §FR-012..FR-015]
- [ ] CHK016 Is FR-024's "at a glance" quantified (e.g., above the fold at default browser width, within the first N scroll units)? [Ambiguity, Spec §FR-024]
- [ ] CHK017 Is FR-034's "signed (GPG or SSH)" explicit about whether implementers may pick either method or must support both? [Clarity, Spec §FR-034]
- [ ] CHK018 Is FR-014's "active LTS" defined with specific version numbers or explicitly declared as a moving policy with an update trigger? [Ambiguity, Spec §FR-014]
- [ ] CHK019 Is SC-003's "within 10 minutes of merge" clear about the measurement endpoints (merge commit timestamp → npm publish confirmation, or → workflow start)? [Clarity, Spec §SC-003]
- [ ] CHK020 Does SC-002's "zero files from source/tests/examples/specs/internal tooling" specify whether dotfiles and hidden directories at the repo root are in scope? [Clarity, Spec §SC-002]

## Requirement Consistency

- [ ] CHK021 Is the minimum Node.js version consistent across FR-029 (engine), FR-014 (matrix floor), FR-024 (README badge), and the Assumptions section? [Consistency, Spec §FR-029, §FR-014, §FR-024]
- [ ] CHK022 Do the branch-protection requirements (FR-030..FR-034) align with SC-005's claim "no documented path for bypassing automated checks"? [Consistency, Spec §FR-030..FR-034 ↔ §SC-005]
- [ ] CHK023 Are the version-bump rules in FR-017 consistent with the commit-prefix examples that CONTRIBUTING.md is required to document in FR-003? [Consistency, Spec §FR-003 ↔ §FR-017]
- [ ] CHK024 Is the scope of files listed in FR-021 (published artifacts) consistent between the FR text and its satisfaction in SC-002? [Consistency, Spec §FR-021 ↔ §SC-002]
- [ ] CHK025 Is FR-035's "serialize via concurrency group" consistent with the `[skip ci]` loop-prevention described in the Concurrent-PR edge case? [Consistency, Spec §FR-035 ↔ §Edge Cases]
- [ ] CHK026 Are the release permission requirements (FR-022 provenance, FR-020 version-metadata commit) internally consistent (e.g., `id-token: write` + `contents: write` are both implied)? [Consistency, Spec §FR-020, §FR-022]
- [x] CHK027 — **Resolved**: FR-012 updated to distinguish "job kinds" from "status checks" (three kinds expand to 2 + N status checks where N = test-matrix legs). FR-032 updated to require enumeration of every individual status-check name in branch protection, prohibiting job-kind wildcards. SC-005 aligned. [Potential Conflict, Spec §FR-012 ↔ §FR-032]

## Acceptance Criteria Quality

- [ ] CHK028 Is SC-001's "under 15 minutes" measurable via a documented data-collection method (self-report, telemetry, time-to-first-PR metric)? [Measurability, Spec §SC-001]
- [ ] CHK029 Is SC-002's "zero files leak" objectively verifiable via a specific, reproducible command at the requirement level? [Measurability, Spec §SC-002]
- [ ] CHK030 Is SC-003's "within 10 minutes" bounded to a specific measurement (workflow start vs. publish confirmation) rather than leaving interpretation to implementers? [Measurability, Spec §SC-003]
- [ ] CHK031 Is SC-006's "acknowledged within 48 hours" measurable without ambiguity about what counts as acknowledgment (any reply? substantive reply? triage decision?)? [Measurability, Spec §SC-006]
- [ ] CHK032 Is SC-008's "within 5 seconds of viewing" specified in terms that can be verified (viewport size, scroll position, reader type)? [Measurability, Spec §SC-008]
- [x] CHK033 — **Resolved**: SC-009 relaxed from 7 days to 14 days to align with the weekly Dependabot cadence. Rationale appended to SC-009 (worst case ≈ 7 days scan latency + processing headroom). FR-026/FR-027 unchanged. [Potential Conflict, Spec §SC-009 ↔ §FR-026]
- [ ] CHK034 Is SC-010's "no drift between the three" enforceable via automation, or does the spec leave it to manual review? [Measurability, Spec §SC-010]
- [ ] CHK035 Are all acceptance scenarios in User Stories 1–6 written in strict Given/When/Then form and verifiable as independently testable per the story-header claim? [Acceptance Criteria, Spec §US1..§US6]

## Scenario Coverage

- [ ] CHK036 Are primary-flow requirements for User Story 3 (maintainer ships releases) complete for both releasing and non-releasing merges (not just the releasing happy path)? [Coverage, Spec §US3]
- [ ] CHK037 Are alternate-flow requirements defined for contributors whose local environment cannot run the required commands (e.g., Windows-specific issues, missing pnpm)? [Gap, Alternate Flow]
- [ ] CHK038 Are exception-flow requirements defined for the release workflow when a transitive CI dependency (Codecov, npm registry) is degraded? [Gap, Exception Flow, Spec §US3]
- [ ] CHK039 Are recovery-flow requirements defined for the case where a published version is later discovered broken (yank, deprecate, hotfix path)? [Gap, Recovery Flow]
- [ ] CHK040 Are recovery-flow requirements defined for the specific case "the release commit landed on main but the npm publish step failed"? [Gap, Recovery Flow]
- [ ] CHK041 Are scenarios addressed where a security researcher's report does not receive the 48h acknowledgment (maintainer unreachable, email bounces)? [Coverage, Spec §US4]
- [ ] CHK042 Are scenarios addressed where a single contributor PR touches both source code and an issue/PR template (cross-cutting change approval path)? [Coverage, Gap]
- [ ] CHK043 Are requirements defined for routing user-reported issues that are actually upstream Meta API issues (hand-off guidance, template field, auto-label)? [Coverage, Spec §FR-008]

## Edge Case Coverage

- [ ] CHK044 Is the Edge Cases section exhaustive for the domains the feature introduces, or are there known-unknown boundaries left out? [Coverage, Spec §Edge Cases]
- [ ] CHK045 Is the edge case "first automated release lands on v1.0.0 unintentionally because commit history contains a BREAKING CHANGE" addressed in requirements? [Gap, Edge Case, Spec §FR-017]
- [ ] CHK046 Is the edge case "Dependabot opens a PR bumping `semantic-release` itself" addressed (ordering, re-release consequences, version-drift risk)? [Gap, Edge Case, Spec §FR-026]
- [ ] CHK047 Is the edge case "repository renamed or transferred ownership after badge URLs are set" addressed (URL update procedure, badge breakage warning)? [Gap, Edge Case, Spec §FR-024]
- [ ] CHK048 Is the edge case "`staging` branch deleted but `ci.yml` still triggers on it" addressed? [Gap, Edge Case, Spec §FR-012]
- [x] CHK049 — **Resolved**: new Assumption added explicitly acknowledging the solo-maintainer tension. Resolution requires one of two paths: (a) add a trusted reviewer, or (b) waive only the "Require approvals" rule while keeping every other strict protection rule in place. The waiver is explicitly documented, not silent. [Potential Conflict, Edge Case, Spec §FR-031 ↔ §Assumptions]
- [ ] CHK050 Is the edge case "release workflow runs while the platform (GitHub Actions, npm registry) is in a read-only or degraded state for hours" addressed? [Gap, Edge Case, NFR Availability]
- [ ] CHK051 Is the edge case "contributor submits an issue form with all template fields left empty" addressed (server-side enforcement, template required fields, review burden)? [Coverage, Spec §FR-009]

## Non-Functional Requirements

- [ ] CHK052 Are performance requirements for CI wall-clock duration elevated to the requirement level, or do they live only in Technical Context notes? [Gap, NFR Performance]
- [ ] CHK053 Are observability requirements defined (workflow-failure notifications, release-success notifications, paging channel, delivery SLA)? [Gap, NFR Observability]
- [ ] CHK054 Are availability requirements defined for the release workflow dependency graph (e.g., acceptable downtime when GitHub or npm is degraded)? [Gap, NFR Availability]
- [ ] CHK055 Are data-retention requirements specified for CI workflow logs, coverage reports, and release artifacts? [Gap, NFR Retention]
- [ ] CHK056 Are security requirements specified for rotating `NPM_TOKEN`, `CODECOV_TOKEN`, and any signing secrets on a defined cadence? [Gap, NFR Security]
- [ ] CHK057 Are requirements for the signing key lifecycle (generation environment, storage, rotation, revocation, compromise response) defined? [Gap, NFR Security, Spec §FR-034]

## Dependencies & Assumptions

- [ ] CHK058 Are all ten Assumptions stated in a way that is testable or verifiable (not as unfalsifiable claims)? [Assumption, Spec §Assumptions]
- [ ] CHK059 Is the assumption "current test suite, lint, type-check, and build are already correctly configured and green" validated as a hard prerequisite before this feature's implementation begins? [Assumption, Spec §Assumptions]
- [ ] CHK060 Are external-service dependencies (npm registry, Codecov, GitHub Actions, Dependabot, GPG keyservers) explicitly enumerated with stated failure-mode requirements? [Dependency, Gap]
- [ ] CHK061 Is the dependency on GitHub Discussions being enabled treated as a hard prerequisite (with a checklist item in the maintainer bootstrap) rather than a soft assumption? [Dependency, Spec §FR-010, §Assumptions]
- [ ] CHK062 Is the assumption "the maintainer will provision secrets" paired with a requirement to fail loudly and actionably when any secret is missing at workflow runtime? [Assumption, Spec §Assumptions ↔ §Edge Cases]

## Ambiguities & Conflicts

- [x] CHK063 — **Resolved** (same fix as CHK049): new Assumption explicitly names the two acceptable resolution paths and flags Option (b) as a documented, reversible tradeoff from the Strict baseline — not a silent downgrade. [Conflict, Spec §FR-031 ↔ §Assumptions]
- [ ] CHK064 Is the ambiguity about `engines.node >=18` after Node 18 end-of-life resolved (does the minimum auto-bump, or is maintainer action required)? [Ambiguity, Spec §FR-014 ↔ §FR-029]
- [ ] CHK065 Is the ambiguity between "supply-chain provenance attestation" (npm term, FR-019/FR-022) and "signed commits" (git term, FR-034) resolved clearly so implementers do not conflate them into one configuration? [Ambiguity, Spec §FR-019, §FR-022 ↔ §FR-034]
- [ ] CHK066 Is the ambiguity about "default branch" consistent with FR-016's implicit-assumed `main` and the release-workflow trigger on `[main]` only? [Consistency, Ambiguity, Spec §FR-016]

## Traceability

- [ ] CHK067 Is every Functional Requirement (FR-001..FR-035) traceable to at least one User Story and at least one Success Criterion? [Traceability]
- [ ] CHK068 Is every Success Criterion (SC-001..SC-011) traceable to at least one Functional Requirement whose satisfaction drives it? [Traceability]
- [ ] CHK069 Are the two entries in the Clarifications section (Q1 branch protection, Q2 concurrency) each traced into a dedicated FR (FR-030..FR-034 for Q1, FR-035 for Q2) and the Edge Cases section? [Traceability, Spec §Clarifications]
- [ ] CHK070 Is the requirement-ID scheme (`FR-###`, `SC-###`) stable enough to survive inserts and reorderings during future spec revisions, or is renumbering risk documented? [Traceability]

## Notes

- Items marked incomplete require spec updates before `/speckit.tasks`. Items in categories "Requirement Completeness", "Scenario Coverage", "Edge Case Coverage", and "Non-Functional Requirements" are the highest-leverage — gaps there cascade into missing implementation tasks.
- The deliberate scope exclusions (commit-message lint enforcement, pre-1.0 security support, CLA, committee enforcement, CI runtime-version policy) are out of scope for this feature and should NOT be remediated here — confirm they remain in Assumptions rather than promoted into FRs.
- Several items (CHK027, CHK033, CHK049, CHK063) flag *potential* conflicts that may have reasonable resolutions already implicit in the spec. Audit intent: force an explicit statement.
- Mark items with brief inline findings (e.g., `- [x] CHK001 — spec covers via contract but not FR text; upgrade FR or explicitly defer to contract`). Deferred items are acceptable; silent omissions are not.
