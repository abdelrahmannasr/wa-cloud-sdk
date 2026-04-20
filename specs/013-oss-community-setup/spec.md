# Feature Specification: Open-Source Community Publishing

**Feature Branch**: `013-oss-community-setup`
**Created**: 2026-04-20
**Status**: Draft
**Input**: User description: "Prepare wa-cloud-sdk for open-source community publishing: add community health files, GitHub Actions CI/CD workflows, issue/PR templates, semantic-release automation, and npm provenance-signed publishing."

## Clarifications

### Session 2026-04-20

- Q: What is the default-branch protection scope? → A: Strict — block direct push, require 1+ PR review, require all three CI status checks (quality, test, build), require linear history, require signed commits.
- Q: How should concurrent release workflow runs be handled when multiple PRs merge to the default branch within seconds? → A: Serialize — use a concurrency group on the release workflow with cancel-in-progress disabled so queued runs wait for the active run to finish.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Contributor onboards and submits a PR (Priority: P1)

A first-time external contributor discovers the repository, wants to fix a bug or propose a feature, and needs a clear path from "fresh clone" to "merged PR" without asking for help. They read the root-level guidance, set up locally, follow the conventions, and open a PR that is immediately reviewable.

**Why this priority**: The primary premise of making the package open-source is attracting outside contributions. Without a frictionless onboarding path, the OSS designation is cosmetic and no contributions will arrive.

**Independent Test**: Can be fully tested by having a developer unfamiliar with the repo clone it, follow only the CONTRIBUTING.md instructions, and open a trivial PR — success means the PR opens with all automated checks running and the contributor knew what was expected (commit format, tests, documentation updates) without asking.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository, **When** the contributor opens `CONTRIBUTING.md`, **Then** they find an ordered setup path (fork → clone → install → branch → develop → commit → PR) and a command reference.
2. **Given** the contributor is ready to commit, **When** they consult the commit guidance, **Then** they see the full list of conventional prefixes, each mapped to the version impact, with realistic examples drawn from this SDK.
3. **Given** a draft pull request, **When** the contributor opens it, **Then** the body is pre-populated with a change-type selector and a pre-merge checklist they must check off.
4. **Given** a newly opened PR, **When** CI runs, **Then** three independent checks report status (quality, test matrix across supported runtimes, build).
5. **Given** a contributor unsure of tone or behavior expectations, **When** they look at the repo root, **Then** a code of conduct is clearly published with an enforcement contact.

---

### User Story 2 - Consumer installs a trustworthy package (Priority: P1)

A developer building a WhatsApp integration runs a single install command and receives a production-grade package: lean tarball (no source, tests, or internal configs), supply-chain provenance attestation, and a README whose badges communicate the package's current health at a glance.

**Why this priority**: Consumer trust is the prerequisite for adoption. Provenance, lean packaging, and transparent badges are what differentiate a "real" OSS package from a hobby experiment.

**Independent Test**: Can be fully tested by running the package installation into a clean project and inspecting the installed tarball — success means it contains only distributable artifacts and documented metadata (compiled output, README, LICENSE, changelog) with no leaked source, tests, examples, or internal tooling, and the npm registry page shows a provenance badge.

**Acceptance Scenarios**:

1. **Given** a consumer runs the package install command, **When** the package is unpacked, **Then** only compiled distribution output and the four documentation files (README, LICENSE, CHANGELOG, package.json) are present.
2. **Given** the package has been published via the release pipeline, **When** the consumer visits the npm registry listing, **Then** a provenance attestation is displayed linking the tarball to its source commit and build workflow.
3. **Given** a consumer lands on the repository README, **When** they look at the top of the file, **Then** badges show: latest version, CI status, coverage percentage, license, supported runtime, language, download volume, contribution openness, and release automation.
4. **Given** a consumer wants to evaluate the package's release cadence, **When** they open the CHANGELOG, **Then** an automated, semver-compliant history is available.

---

### User Story 3 - Maintainer ships releases hands-off (Priority: P1)

The maintainer merges an accepted PR to the default branch and walks away. Automation analyzes the commits, decides whether to release, bumps the version, publishes to the registry with provenance, generates release notes, updates the changelog, creates a GitHub Release entry, and commits the version metadata back — with zero manual version editing or changelog curation.

**Why this priority**: Manual releases are error-prone and infrequent. Automation is what makes "publish weekly or on-demand" sustainable and keeps the CHANGELOG credible.

**Independent Test**: Can be fully tested by merging a single `fix:` commit to the default branch and observing that, without any further human action, the patch version is incremented, a new release appears on the registry with provenance, the CHANGELOG gains a new entry, a GitHub Release is published, and a follow-up `chore(release): …` commit appears on the default branch.

**Acceptance Scenarios**:

1. **Given** a commit with `feat:` prefix is merged to the default branch, **When** the release pipeline runs, **Then** a minor version is published.
2. **Given** a commit with `fix:` prefix is merged to the default branch, **When** the release pipeline runs, **Then** a patch version is published.
3. **Given** a commit with `BREAKING CHANGE:` in its body is merged, **When** the release pipeline runs, **Then** a major version is published.
4. **Given** only `docs:` or `chore:` commits are merged since the last release, **When** the release pipeline runs, **Then** no new release is produced and the pipeline exits cleanly.
5. **Given** a successful release, **When** the default branch is inspected, **Then** a single `chore(release): <version> [skip ci]` commit has been appended with CHANGELOG and `package.json` version updates.

---

### User Story 4 - Security researcher reports privately (Priority: P2)

A security researcher discovers a vulnerability in the SDK, needs to report it confidentially (not via a public issue), and expects defined response SLAs before public disclosure.

**Why this priority**: Responsible disclosure is table-stakes for any package that handles credentials and third-party API calls. Without a private channel, reporters will either publicly disclose (bad) or not disclose at all (worse).

**Independent Test**: Can be fully tested by simulating a disclosure email to the published contact — success means the reporter has a clear private channel documented at the repo root, explicit SLAs for acknowledgment and detailed response, and a stated scope boundary.

**Acceptance Scenarios**:

1. **Given** a researcher visits the repository, **When** they search for a vulnerability reporting process, **Then** a `SECURITY.md` at the repo root explicitly directs them to a private email channel and warns against public issues.
2. **Given** a disclosure email is sent, **When** the maintainer receives it, **Then** the documented commitment is acknowledgment within 48 hours and a detailed response within 7 days.
3. **Given** an ambiguous report, **When** the researcher checks the policy scope, **Then** the scope explicitly covers the SDK package and explicitly excludes upstream Meta API vulnerabilities.

---

### User Story 5 - Community member files a structured issue (Priority: P2)

A user hits a bug or has an idea for a feature. When they click "New issue," they are guided into a curated template that prompts for the right context (reproduction, environment, proposed API shape) rather than filing a one-liner that wastes reviewer time.

**Why this priority**: Structured issues dramatically reduce triage cost and increase the chance a bug gets fixed. Questions (non-issues) are siphoned to Discussions so the issue tracker stays signal-rich.

**Independent Test**: Can be fully tested by clicking "New issue" on GitHub — success means blank issues are impossible, two clearly-labeled templates (bug/feature) are offered, and a Discussions link appears for questions.

**Acceptance Scenarios**:

1. **Given** a user clicks "New issue," **When** the issue creation page loads, **Then** the blank-issue option is disabled and only curated templates plus a Discussions link are shown.
2. **Given** a user picks the bug template, **When** the form renders, **Then** it requires (or prompts for) a reproduction code snippet, expected vs. actual behavior, and environment details.
3. **Given** a user picks the feature template, **When** the form renders, **Then** it prompts for the problem, proposed API usage, alternatives considered, and additional context.

---

### User Story 6 - Dependencies stay current without manual chasing (Priority: P3)

Upstream dependencies (runtime packages and CI action versions) stay patched automatically, with labeled PRs arriving on a predictable cadence, without the maintainer watching every registry for updates.

**Why this priority**: Stale dependencies erode security and compatibility over time. Automation prevents drift without requiring discipline.

**Independent Test**: Can be fully tested by introducing a contrived outdated dependency — success means a labeled PR arrives within the scheduled interval with a commit message prefix that is compatible with the release automation (does not trigger spurious version bumps).

**Acceptance Scenarios**:

1. **Given** a package dependency has a newer version available, **When** the scheduled check runs, **Then** a labeled PR (`dependencies`) is opened with a `chore(deps):` commit.
2. **Given** a CI action has a newer version available, **When** the scheduled check runs, **Then** a labeled PR (`ci`) is opened with a `chore(ci):` commit.
3. **Given** multiple upgrades are pending, **When** open dependency PRs exceed the configured cap, **Then** new PRs are queued rather than flooding the tracker.

---

### Edge Cases

- **Non-conforming commits merged to default**: if a contributor bypasses the PR template checklist or uses a non-conventional commit style, the release pipeline still runs — the release tool treats it as a non-releasing change. No spurious versions get published, but the commit is absent from the auto-generated changelog. (Commit message enforcement is out of scope for this feature.)
- **Missing release secrets**: on the first merge to the default branch, if `NPM_TOKEN` or `CODECOV_TOKEN` are not provisioned, the release or coverage step fails loudly with a clear error. The maintainer must provision secrets as a pre-release step.
- **Test-only commit batches**: `test:`, `docs:`, `chore:`, `refactor:` commits in isolation trigger no release — the pipeline exits with a "no release published" log line.
- **Concurrent PR activity and a release**: the release commit from the release tool carries `[skip ci]` to avoid triggering an infinite CI/release loop; this must be honored. When multiple PRs land on the default branch within seconds of each other, the release workflow's concurrency group serializes the resulting runs — the second run waits for the first to complete, so no commits are skipped and no two runs race on the registry publish step.
- **Pre-1.0 consumers**: the security policy explicitly treats versions below 1.0 as unsupported, so consumers on 0.x will not receive security patches unless they upgrade.
- **Blank-issue bypass**: users who attempt to file blank issues are blocked by the issue template config and steered to Discussions.
- **Dependency PR storm**: the dependency scanner is capped (application updates: 10 open PRs; CI updates: uncapped but weekly) so a single bad week doesn't drown the tracker.
- **Questions vs. bugs**: users asking "how do I…?" are steered to Discussions by the issue template config, keeping the issue tracker focused on defects and proposals.
- **First automated release produces an unintended major version (v1.0.0)**: if commit history contains a pre-existing `feat!:` or `BREAKING CHANGE:`, the first release may jump straight to v1.0.0. The maintainer is expected to manually tag the desired baseline version (`git tag v<X.Y.Z> && git push --tags`) BEFORE merging this feature to main if a specific starting version is required; once a tag exists, the release tool derives subsequent versions from it.
- **Dependabot opens a PR bumping the release tool itself**: treated as a normal dependency PR (`dependencies` label, `chore(deps):` prefix, non-releasing). After merge, the next release run uses the newer release-tool version. No special ordering required.
- **`staging` branch deleted**: `ci.yml` still references `staging` in its trigger list; the trigger quietly no-ops when the branch does not exist. Acceptable — no spec-level remediation required.
- **Release workflow runs during a platform incident (GitHub Actions degraded, npm registry down, Codecov 5xx)**: the workflow fails loudly at the affected step. No auto-retry; the maintainer re-runs the workflow once the platform recovers. The release tool is idempotent — re-running analyzes the same commit range and produces the same release.
- **A published version is later discovered broken**: the maintainer uses `npm deprecate @abdelrahmannasr-wa/cloud-api@<version> "<reason>"` to deprecate the bad version, then lands a `fix:` commit to trigger the next patch release. `npm unpublish` (nuclear option, allowed within 72 hours of publish) is discouraged in favor of `deprecate`.
- **Partial release state** (release commit landed on main but `npm publish` failed): plugin ordering in `.releaserc.json` places `@semantic-release/git` AFTER `@semantic-release/npm`, so a failed npm publish aborts the run BEFORE the commit/tag are pushed. If the workflow is force-killed between plugin steps, the maintainer re-runs the release workflow — the tool is idempotent.
- **A contributor submits an issue form with template fields left empty**: GitHub's classic markdown issue templates do not enforce required fields at submission time; the submitted issue contains the template skeleton with placeholder prompts. Maintainer triage closes such issues with a request to fill the template. Migrating to YAML-based GitHub issue forms (required-field capable) is a future enhancement, out of scope for this feature.
- **A security researcher's disclosure email receives no acknowledgment within 48 hours** (maintainer unreachable, email bounces): `SECURITY.md` directs researchers to GitHub's private security advisory channel as a fallback. If both channels fail for >72 hours, the researcher may escalate per industry norms.
- **A reported issue is actually a Meta WhatsApp Cloud API defect**: the bug report template prompts reporters to verify SDK vs. API scope; maintainer triage closes mis-filed issues with a redirect to Meta's support channels. No automation required.
- **A PR touches both source code AND an issue/PR template**: follows the normal PR flow — CI runs on source changes; template changes take effect after merge. No cross-cutting special-case needed.
- **Contributor's local environment cannot run the required commands** (e.g., Windows-specific pnpm issue, missing Node version): CONTRIBUTING.md directs the contributor to the issue tracker to request environment-specific help, OR to run the CI workflow on a fork to validate changes without a working local setup.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST publish community health files at the root that GitHub auto-discovers: contributing guide, code of conduct, security policy, changelog, license.
- **FR-002**: The contributing guide MUST document the end-to-end contributor workflow (fork, clone, install, branch, develop, test, commit, PR).
- **FR-003**: The contributing guide MUST document the commit message convention with an explicit mapping from commit prefix to version-bump impact, illustrated with realistic examples drawn from this SDK's domain.
- **FR-004**: The contributing guide MUST document pull-request expectations (focused scope, tests required, README updates for public-API changes, all automated checks must pass).
- **FR-005**: The contributing guide MUST document the project's code-style expectations (strict typing, public-API documentation, named exports, typed error hierarchy) and MUST conclude with a contributor-licensing notice consistent with the repository license.
- **FR-006**: The code of conduct MUST be based on an industry-standard framework (Contributor Covenant v2.1) and MUST include an enforcement contact address and the full enforcement-ladder guidance.
- **FR-007**: The security policy MUST declare supported version ranges, require private reporting via a documented contact address, explicitly warn against filing public issues for vulnerabilities, and define response SLAs (acknowledgment within 48 hours, detailed response within 7 days).
- **FR-008**: The security policy MUST bound its scope to the SDK package and MUST explicitly exclude upstream third-party API vulnerabilities (Meta WhatsApp Cloud API).
- **FR-009**: The issue tracker MUST offer two curated templates — bug report and feature request — each with a labeled category, a title prefix, and fields for the context required to triage efficiently (reproduction snippet, environment, proposed API usage, alternatives).
- **FR-010**: The issue tracker MUST disable blank/unstructured issues and MUST redirect conversational or support questions to a Discussions channel.
- **FR-011**: Pull requests MUST open with a pre-populated template offering a change-type selector (bug fix / feature / breaking / docs / refactor / test / chore) and a pre-merge checklist covering code style, tests, lint, type safety, build, documentation updates for API changes, and commit conventions.
- **FR-012**: Every push to the default and staging branches, and every pull request targeting them, MUST trigger automated quality checks that must pass before merge. The checks MUST be organized as three independent job kinds: a lint + type check job, a test job that runs across all supported runtime versions (one matrix leg per version), and a build job that reports built artifact size. The three job kinds expand to one status check per matrix leg — so if the test job runs across N runtime versions, the total number of status checks is 2 + N.
- **FR-013**: The test job MUST collect coverage, and on the primary runtime version MUST upload coverage to a public coverage-reporting service; the job MUST NOT fail if the coverage upload fails (coverage is advisory, not blocking).
- **FR-014**: The test matrix MUST include the minimum declared supported runtime version and all currently-active LTS versions above it.
- **FR-015**: The build job MUST emit the built artifact size during the run so bloat regressions are visible in logs.
- **FR-016**: Releases MUST be fully automated — triggered only by merges to the default branch, with no manual version selection, changelog editing, tag creation, or registry upload required.
- **FR-017**: The release automation MUST derive the version bump from commit message conventions (`feat:` → minor, `fix:`/`perf:` → patch, `BREAKING CHANGE:` → major; `docs:`/`test:`/`chore:`/`refactor:` → no release).
- **FR-018**: The release pipeline MUST run quality checks (lint, tests, build) before publishing; a failure MUST abort the release.
- **FR-019**: The release automation MUST publish to the public package registry with supply-chain provenance attestation enabled.
- **FR-020**: The release automation MUST generate release notes, update the changelog, create a tag, create a repository Release entry, and commit the version-metadata update back to the default branch using a commit message that prevents CI/release loops.
- **FR-021**: The published package MUST include only distributable artifacts and required metadata — compiled output directory, README, license file, and changelog. It MUST exclude source, tests, examples, specs, AI/tooling directories, and internal configuration files.
- **FR-022**: The package metadata MUST declare public registry visibility and MUST enable provenance attestation.
- **FR-023**: The package metadata MUST accurately point consumers to the source repository, issue tracker, and project homepage.
- **FR-024**: The repository README MUST display a badge row that communicates, at a glance: latest published version, continuous-integration status, coverage, license, minimum runtime support, implementation language, download volume, contribution openness, and release-automation mechanism.
- **FR-025**: The repository README MUST link consumers to the contributing guide, code of conduct, and security policy from visible sections at the document end.
- **FR-026**: Application dependencies MUST be monitored on a weekly schedule with automated upgrade pull requests; those PRs MUST be labeled for triage visibility.
- **FR-027**: CI action/workflow dependencies MUST be monitored on the same weekly schedule with separately-labeled automated upgrade pull requests.
- **FR-028**: Automated dependency-upgrade commit messages MUST use prefixes that the release automation treats as non-releasing (e.g., `chore(deps):`, `chore(ci):`), so they never trigger spurious version bumps.
- **FR-029**: The package MUST declare the same minimum supported runtime version across all locations it is advertised (engine constraint, README badge, CI matrix) so consumers, contributors, and automation see consistent expectations.
- **FR-030**: The default branch MUST be protected such that direct pushes are blocked; all changes MUST land via pull request.
- **FR-031**: Pull requests targeting the default branch MUST require at least one approving review before merge.
- **FR-032**: Pull requests targeting the default branch MUST require every CI status check — including every matrix leg of the test job, not just the job kind — to report success before merge. Branch protection MUST enumerate each individual status-check name; it MUST NOT rely on a job-kind wildcard.
- **FR-033**: The default branch MUST enforce linear history (no merge commits), so the commit log remains cleanly analyzable by the release automation.
- **FR-034**: Commits landing on the default branch MUST be signed (GPG or SSH), including automated release commits produced by the release pipeline.
- **FR-035**: The release pipeline MUST serialize concurrent runs — when multiple pushes reach the default branch in rapid succession, the second run MUST wait for the first to complete rather than run in parallel or cancel the earlier run, so that no commits are skipped from the published version and no two runs race on the registry publish step.
- **FR-036**: The initial `CHANGELOG.md` content MUST contain a `[Unreleased]` section enumerating the capabilities present at the time of this feature's merge, to seed release-note history before the first automated release runs.
- **FR-037**: The release workflow MUST detect missing required secrets (`NPM_TOKEN`, signing-key material, `CODECOV_TOKEN` where relevant) at the earliest step that needs each secret and MUST fail with an actionable error message identifying which secret is missing. The workflow MUST NOT proceed silently past a missing secret.
- **FR-038**: Workflow failures MUST surface to the maintainer through at least one notification channel. GitHub's default on-failure email notification for the repository owner satisfies the baseline; the release workflow MUST additionally include an on-failure step that either opens (or updates) a tracking issue labeled `release-failure` or posts to a declared notification channel, so release-path failures are not lost in email noise.
- **FR-039**: The release workflow MUST be idempotent: a re-run on the same commit range MUST produce the same released version (or the same clean "no release" outcome) without creating duplicate tags, duplicate GitHub Releases, duplicate changelog entries, or duplicate registry versions. Plugin ordering and registry-state checks MUST be arranged so a re-run after partial failure is safe.
- **FR-040**: CI and release workflow logs MUST remain accessible for audit for at least 90 days, and released tarball provenance attestations MUST remain verifiable for the lifetime of the published version. GitHub Actions' default 90-day log retention satisfies the CI/release log minimum; Codecov coverage report retention follows the paid plan in use.
- **FR-041**: Repository secrets (`NPM_TOKEN`, `CODECOV_TOKEN`, signing-key material) MUST be rotated at least once every 90 days, with the rotation event recorded in an auditable way (maintainer-kept log, password-manager entry, or equivalent). Rotation MUST not leave the release workflow broken — the new secret MUST be provisioned before the old one is revoked.

### Key Entities

*(Not applicable — this feature concerns project infrastructure, documentation, and automation policies rather than user-visible data.)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new contributor, using only the published documentation, can go from fresh clone to opening a first pull request with all CI checks green in under 15 minutes on their initial attempt (measured against self-reported times from at least three external contributors).
- **SC-002**: The installed package tarball contains only distributable artifacts and metadata — zero files from source, tests, examples, specs, or internal tooling directories leak into the published archive.
- **SC-003**: 100% of merges to the default branch that include release-worthy commits result in an automatic release published to the registry within 10 minutes of merge, without human intervention (given required secrets are provisioned). "Within 10 minutes of merge" measures elapsed time between the merge commit's timestamp on the default branch and the registry `publish` confirmation logged by the release workflow.
- **SC-004**: 100% of merges to the default branch that contain no release-worthy commits produce a clean "no release" outcome (no failed pipelines, no spurious versions, no empty changelog entries).
- **SC-005**: Every pull request merged to the default branch passes every enumerated automated status check (one per CI job kind, plus one per test-matrix leg) before merge and has received at least one approving review — branch protection rejects any merge attempt that lacks either, and direct pushes to the default branch are rejected at the platform layer.
- **SC-006**: Reported security vulnerabilities are acknowledged within 48 hours and receive a detailed response within 7 days; measured quarterly across all received disclosures.
- **SC-007**: 100% of new issues opened via the repository use one of the curated templates or are redirected to Discussions — zero blank issues created.
- **SC-008**: Any visitor to the repository README can determine, within 5 seconds of viewing the top of the file, the package's current version, CI health, coverage, license, and supported runtime.
- **SC-009**: Dependency-upgrade pull requests arrive within 14 days of an upstream release for both application dependencies and CI actions, and are labeled for triage. (The 14-day window aligns with the weekly Dependabot cadence in FR-026/FR-027 — worst case is roughly 7 days until the next scheduled scan plus a few days of processing latency, comfortably inside the window.)
- **SC-010**: The published package, the README badge, and the CI runtime matrix all advertise the same minimum supported runtime version — no drift between the three.
- **SC-011**: Every published package version on the registry carries a provenance attestation linking the tarball to its source commit and build workflow.
- **SC-012**: CI workflow wall-clock duration (fresh runner, cold cache) completes under 10 minutes at the 95th percentile across a rolling 30-day window, and under 6 minutes at the median. Measured from workflow start to all three job kinds reporting final status.
- **SC-013**: 100% of release-workflow failures on the default branch produce a maintainer-visible notification (tracking issue or declared channel post) within the same workflow run — zero release failures go unnoticed in an audit sample.
- **SC-014**: A release workflow re-run on the same commit range produces byte-identical release metadata (tag, changelog entry, GitHub Release body) to the original run — verified by spot-check in quarterly audits.
- **SC-015**: Workflow logs for CI and release runs remain accessible for audit for a minimum of 90 days from the run date — verified by spot-check in quarterly audits.
- **SC-016**: Every repository secret (`NPM_TOKEN`, `CODECOV_TOKEN`, signing-key material) shows a rotation event within the last 90 days — verified quarterly against the maintainer's rotation log.

## Assumptions

- The maintainer will provision the required repository secrets (`NPM_TOKEN` for registry publishing, `CODECOV_TOKEN` for coverage reporting) before the first merge to the default branch. The platform-provided token used for repo writes is available automatically and does not require manual setup.
- The repository is hosted on GitHub, has Discussions enabled, and the package is published to the public npm registry under an existing scoped name the maintainer owns.
- The existing branch strategy — a staging integration branch merging into the default (main) publishing branch — is preserved. Releases are published only from the default branch.
- External contributors have baseline Git and GitHub familiarity. No contributor license agreement beyond the repository's MIT notice is required.
- The existing test suite, lint configuration, type-check command, and build command are already correctly configured and green on the current codebase; this feature wires automation around them but does not rewrite them.
- The current contributor base is small enough that a single enforcement contact address is sufficient; committee-based enforcement is out of scope.
- Satisfying FR-031 (1+ approving review) requires at least one trusted reviewer besides the PR author to be present on the repository (co-maintainer, collaborator, or delegated reviewer). When the repository is operated by a single individual with no co-maintainer, the maintainer is expected to resolve this tension in exactly one of two ways: (a) add at least one trusted reviewer before merging release-significant work, or (b) temporarily disable only the "Require approvals" rule in branch protection — all other strict protection rules (direct-push block, required CI status checks, linear history, signed commits) remain non-waivable. Option (b) is explicitly acknowledged as a reduction from the Strict protection baseline chosen in the Clarifications session; it is a scoped, reversible tradeoff, not a silent downgrade.
- Commit-message enforcement at the hook level (e.g., commitlint, Husky) is out of scope for this iteration; the release tool simply ignores non-conforming commits when analyzing the commit history.
- Pre-1.0 security support is intentionally not offered — the security policy states only 1.x is supported. This aligns with how breaking changes are expected to land before a stable 1.0 release.
- The upstream third-party API (Meta WhatsApp Cloud API) is explicitly out of scope for the security policy; vulnerabilities in Meta's service are reported to Meta, not to this project.
- "Active LTS runtime versions" is interpreted as the runtime's currently-active long-term-support releases at the time of setup (specifically, versions 18, 20, and 22). The matrix is expected to be updated over time as LTS versions enter and leave support; that maintenance is out of scope for this feature.
- The signing-key lifecycle (GPG/SSH key generation, secure storage, revocation on compromise) is the maintainer's responsibility. The release workflow consumes the key via a repository secret; the rotation cadence is a hard requirement (FR-041: every 90 days), not merely recommended. Key generation procedure and secure-storage guidance live in `quickstart.md`.
- Modification of branch-protection rules is restricted to repository administrators. No automated tooling in this feature alters protection configuration once established; changes are manual, audited via GitHub's security log.
- Dependency-upgrade pull requests that fail CI are treated identically to human-authored failing PRs — they remain open, labeled, and await maintainer triage. This feature does not prescribe auto-close, auto-merge, or auto-retry behavior for failed Dependabot PRs.
- When the release tool runs for the first time, the derived version may differ from the maintainer's intent (e.g., a `BREAKING CHANGE` in history produces v1.0.0 rather than a desired v0.1.0 baseline). The maintainer is expected to manually tag the desired baseline version BEFORE the first main-branch merge if a specific starting version is required; once a tag exists, the release tool derives subsequent versions from it.
- When the currently-declared minimum runtime (Node 18) reaches end-of-life, updating `engines.node`, the README badge, the CI matrix, and any related documentation is a maintainer responsibility and MUST happen as a single lockstep change per FR-029. This feature does not prescribe automation for that lifecycle event.
- Rotation cadence for `NPM_TOKEN`, `CODECOV_TOKEN`, and the signing-key secret is enforced at 90 days (FR-041); the maintainer keeps the rotation log. Evidence of rotation is verified quarterly against SC-016.
- Repository rename, transfer, or ownership change triggers manual updates to README badge URLs, `package.json` `repository`/`bugs`/`homepage` fields, and workflow trigger branches. Handling that lifecycle event is explicitly out of scope for this feature.
- External-service dependencies are explicitly: the npm registry (publish target), Codecov (coverage reports), GitHub Actions (workflow runtime), Dependabot (upgrade PRs), and public GPG keyservers or equivalent (signature verification). Degradation of any of these causes the related step to fail loudly; no fallback behavior is prescribed by this feature.
- CI wall-clock duration is now a tracked success criterion (SC-012: p95 ≤10 min, median ≤6 min over a 30-day rolling window). Achieving it leans on GitHub-provided runner capacity and pnpm cache — the maintainer is not responsible for building custom runners to meet the target, but must investigate if a regression persists across three rolling windows.
- Workflow-failure notification (FR-038) treats GitHub's default maintainer email as the baseline for CI failures; release-workflow failures additionally require a tracking issue or declared-channel post so release-path regressions cannot be lost in email triage. Platform availability during release windows relies on GitHub-provided uptime; idempotent re-runs (FR-039) handle transient incidents.
- Log retention (FR-040 / SC-015) adopts GitHub Actions' 90-day default as the required minimum. If GitHub changes its default, extending retention explicitly becomes a maintainer responsibility. Codecov coverage reports follow the plan in use; extending beyond the default is out of scope.
- The bug report issue template includes a prompt asking reporters to verify whether the defect is in the SDK or in the upstream Meta WhatsApp Cloud API; maintainer triage closes mis-filed issues with a redirect. No automated routing is prescribed.
