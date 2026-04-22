---
description: "Task list for 013-oss-community-setup"
---

# Tasks: Open-Source Community Publishing

**Input**: Design documents from `/specs/013-oss-community-setup/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: No new unit tests are generated. This feature adds **zero source code** to `src/`; existing unit tests continue to run unchanged through CI. Verification is pipeline-level (`pnpm pack --dry-run`, local `pnpm lint/test/build`, semantic-release `--dry-run`) and captured in the Polish phase.

**Organization**: Tasks are grouped by user story (US1..US6 from spec.md). Each story is independently deliverable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps to US1–US6 in spec.md
- File paths are absolute from repo root

## Path Conventions

Single-project repository layout (per plan.md). All new files land at the repo root or under `.github/`; no `src/` changes.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the release-tool devDependencies the feature needs.

- [X] T001 Install devDependencies at repo root: run `pnpm add -D semantic-release @semantic-release/changelog @semantic-release/git`, confirm `pnpm-lock.yaml` updates cleanly, confirm `pnpm install --frozen-lockfile` passes afterwards

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Files and metadata that every subsequent user story depends on. No user-story work starts until this phase is complete.

**⚠️ CRITICAL**: Phases 3–8 all depend on these four tasks.

- [X] T002 [P] Update `package.json` per `contracts/package-metadata.md`: set `version` to `"0.0.0-development"`, normalize `repository.url` to `"https://github.com/abdelrahmannasr/wa-cloud-sdk.git"` (drop `git+` prefix), add `"publishConfig": { "access": "public", "provenance": true }`. Preserve every other field (`name`, `exports`, `scripts`, `files`, `engines`, `bugs`, `homepage`, `devDependencies`, `packageManager`) exactly. (FR-021, FR-022, FR-023)
- [X] T003 [P] Create `.npmignore` at repo root containing the exact defence-in-depth exclusion list from `plan.md` (`src/`, `tests/`, `examples/`, `specs/`, `.specify/`, `.claude/`, `.github/`, `coverage/`, `.releaserc.json`, `eslint.config.js`, `tsup.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `.prettierrc`, `.npmrc`, `CLAUDE.md`, `.env*`). (FR-021)
- [X] T004 [P] Rewrite `CHANGELOG.md` at repo root with a Keep-a-Changelog header + SemVer note + `[Unreleased]` section enumerating all built modules (messages, media, templates, webhooks, phone-numbers, multi-account, catalog, flows, rate limiter, retry, typed errors, ESM+CJS, zero deps). Remove the existing `[0.1.0] - 2026-02-17` section. (FR-036)
- [X] T005 Replace `.github/workflows/ci.yml` per `contracts/ci-workflow.md`: three independent job kinds (`quality` on Node 22 with `pnpm lint` + `pnpm typecheck`; `test` matrix across Node 18/20/22 with `pnpm test:coverage` and a conditional `codecov/codecov-action@v4` upload gated by `matrix.node-version == 22` with `fail_ci_if_error: false`; `build` on Node 22 with `pnpm build` + `du -sh dist/`). The test job kind expands to one status check per matrix leg, so the workflow publishes five total status checks: `quality`, `test (18)`, `test (20)`, `test (22)`, `build`. Triggers: `push` to `[main, staging]` and `pull_request` to `[main, staging]`. All jobs use `pnpm/action-setup@v4` version 9, `actions/setup-node@v4` with pnpm cache, `pnpm install --frozen-lockfile`. (FR-012, FR-013, FR-014, FR-015)

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 — Contributor onboards and submits a PR (Priority: P1) 🎯 MVP

**Goal**: Give an external contributor a frictionless path from fresh clone to a merged PR — with conventions, templates, and behavior standards published at the repo root.

**Independent Test**: An external developer clones the repo, opens `CONTRIBUTING.md`, follows the install/branch/develop/commit/PR path, opens a draft PR, and sees the pre-populated template body with change-type selector + pre-merge checklist. The same contributor reading `CODE_OF_CONDUCT.md` finds an enforcement contact.

### Implementation for User Story 1

- [X] T006 [P] [US1] Create `CONTRIBUTING.md` at repo root with: (a) Quick-start section (fork → clone → `pnpm install` → branch → develop → `pnpm test:watch` → lint/format → commit → push → PR); (b) Conventional Commits table mapping `feat:`→minor, `fix:`/`perf:`→patch, `docs:`/`test:`/`chore:`/`refactor:`→none, `BREAKING CHANGE:`→major, with four realistic examples (`feat: add sendCatalog message type`, `fix: handle 503 response in retry logic`, `docs: add webhook setup guide`, `feat!: rename WhatsAppMulti to WhatsAppMultiAccount`); (c) PR guidelines (focused scope, tests included, README update for API changes, all checks must pass, PR template); (d) Dev commands table (`pnpm test`, `pnpm test:watch`, `pnpm test:coverage`, `pnpm lint`, `pnpm lint:fix`, `pnpm format`, `pnpm typecheck`, `pnpm build`); (e) Code style rules (TypeScript strict, TSDoc on public APIs, named exports, errors extend `WhatsAppError`, no `any`); (f) Links to bug/feature templates; (g) Closing footer "By contributing, you agree your contributions are licensed under MIT." (FR-002, FR-003, FR-004, FR-005)
- [X] T007 [P] [US1] Create `CODE_OF_CONDUCT.md` at repo root using the full Contributor Covenant v2.1 text from https://www.contributor-covenant.org/version/2/1/code_of_conduct/. Set enforcement contact email to `a.nasr.yocto@gmail.com`. Include all standard sections: Our Pledge, Our Standards, Enforcement Responsibilities, Scope, Enforcement, Enforcement Guidelines (Correction, Warning, Temporary Ban, Permanent Ban), Attribution link back to Contributor Covenant. (FR-006)
- [X] T008 [P] [US1] Create `.github/PULL_REQUEST_TEMPLATE.md` per `contracts/pr-template.md`: H2 sections "Description", "Type of Change" (7 emoji-prefixed checkboxes: 🐛 Bug fix, ✨ New feature, 💥 Breaking change, 📝 Docs, ♻️ Refactor, 🧪 Test, 🔧 Chore), "Checklist" (8 unchecked items referencing the exact `pnpm test`/`pnpm lint`/`pnpm typecheck`/`pnpm build` script names plus Conventional Commits link), "Related Issues" for `Closes #`. (FR-011)

**Checkpoint**: Contributor-facing materials are published. Cloning the repo now yields clear onboarding; opening a PR produces the template body.

---

## Phase 4: User Story 2 — Consumer installs a trustworthy package (Priority: P1) 🎯 MVP

**Goal**: Ship a lean, provenance-attested package and a README whose badges communicate package health at a glance.

**Independent Test**: Running `pnpm pack --dry-run` lists only `dist/**`, `README.md`, `LICENSE`, `CHANGELOG.md`, `package.json` — no source/tests/examples/specs/internal tooling leak. Visiting the README surfaces nine badges across the top row and Contributing/Security sections above the License footer.

### Implementation for User Story 2

- [X] T009 [US2] Edit `README.md` top badge block (lines 3–5 today): replace the three existing badges with the nine-badge row from `plan.md` / spec FR-024 — npm version, CI, codecov, MIT, Node≥18, TypeScript 5.x, npm downloads, PRs Welcome, semantic-release (Angular). Use the exact shield.io URLs documented in the source task. (FR-024)
- [X] T010 [US2] Edit `README.md` to insert `## Contributing` and `## Security` sections immediately before the existing `## License` section at the bottom. Contributing section links to `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`; Security section links to `SECURITY.md`. (FR-025)

**Checkpoint**: Published-package expectations are wired. README badges depend on Phase 2 artifacts (package.json + ci.yml + CHANGELOG) existing — verify cross-link integrity after commit.

---

## Phase 5: User Story 3 — Maintainer ships releases hands-off (Priority: P1) 🎯 MVP

**Goal**: Merges to the default branch automatically analyze commits, bump the version, publish to npm with provenance, generate release notes, update CHANGELOG, create a GitHub Release, and commit version metadata back — zero manual intervention.

**Independent Test**: A dry-run of `npx semantic-release --dry-run --no-ci` (with `NPM_TOKEN` set to a dummy value and `GITHUB_TOKEN` set) parses `.releaserc.json` without error and reports the commits it would release with the derived next version.

### Implementation for User Story 3

- [X] T011 [P] [US3] Create `.releaserc.json` at repo root with the exact JSON content from `contracts/semantic-release-config.md`: `branches: ["main"]`; plugins in this exact order: `@semantic-release/commit-analyzer`, `@semantic-release/release-notes-generator`, `[@semantic-release/changelog, { changelogFile: "CHANGELOG.md" }]`, `[@semantic-release/npm, { npmPublish: true }]`, `[@semantic-release/github, { assets: [] }]`, `[@semantic-release/git, { assets: ["CHANGELOG.md", "package.json"], message: "chore(release): ${nextRelease.version} [skip ci]\\n\\n${nextRelease.notes}" }]`. (FR-016, FR-017, FR-019, FR-020)
- [X] T012 [P] [US3] Create `.github/workflows/release.yml` per `contracts/release-workflow.md`: trigger `push` to `[main]` only; workflow-level `permissions` (`contents: write`, `issues: write`, `pull-requests: write`, `id-token: write`); workflow-level `concurrency: { group: release, cancel-in-progress: false }`; single `release` job on ubuntu-latest with steps (in order) — `actions/checkout@v4` with `fetch-depth: 0` and `persist-credentials: false`; `pnpm/action-setup@v4` version 9; `actions/setup-node@v4` Node 22 with pnpm cache **(no `registry-url`)**; a pre-flight "Check required secrets" step that exits non-zero with an actionable message if `NPM_TOKEN` or signing-key material is missing (FR-037); `pnpm install --frozen-lockfile`; `pnpm lint`; `pnpm test`; `pnpm build`; GPG key import step (`crazy-max/ghaction-import-gpg` with `GPG_PRIVATE_KEY` + `GPG_PASSPHRASE`, setting `user.signingkey` and `commit.gpgsign=true` in git config) (FR-034); named step `Semantic Release` running `npx semantic-release` with env `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` and `NPM_TOKEN: ${{ secrets.NPM_TOKEN }}`; an `if: failure()` step that opens or updates a tracking issue labeled `release-failure` with the run URL and the commit SHA (FR-038). (FR-016, FR-018, FR-019, FR-020, FR-035, FR-037, FR-038, FR-039)
- [X] T013 [P] [US3] Delete `.github/workflows/publish.yml` (superseded by `release.yml`). Confirm no other references to it exist in the repo.

**Checkpoint**: All three P1 user stories (US1 + US2 + US3) are now shippable — the MVP surface. Stop here for the initial deploy if desired.

---

## Phase 6: User Story 4 — Security researcher reports privately (Priority: P2)

**Goal**: Provide a private reporting channel with explicit SLAs and a bounded scope that excludes upstream third-party API issues.

**Independent Test**: Visiting the repo, a researcher finds `SECURITY.md` at the root, sees the private contact (`a.nasr.yocto@gmail.com`), a clear "do NOT open a public issue for vulnerabilities" warning, 48-hour acknowledgment + 7-day detailed-response SLAs, and explicit scope limitation excluding Meta's WhatsApp Cloud API.

### Implementation for User Story 4

- [X] T014 [US4] Create `SECURITY.md` at repo root with: (a) Supported Versions table — `1.x` = ✅ Active support, `< 1.0` = ❌ No support; (b) bold warning "Please do NOT open a public GitHub issue for security vulnerabilities"; (c) email reporting section directing researchers to `a.nasr.yocto@gmail.com` with the required report fields (description, reproduction steps, potential impact, suggested fix); (d) response commitment — 48-hour acknowledgment, 7-day detailed response; (e) responsible-disclosure policy (coordinated fix before public announcement); (f) scope — covers `@abdelrahmannasr-wa/cloud-api` only and explicitly excludes the Meta WhatsApp Cloud API; (g) fallback channel note for unacknowledged reports (GitHub private security advisory). (FR-007, FR-008)

**Checkpoint**: Responsible-disclosure path is published.

---

## Phase 7: User Story 5 — Community member files a structured issue (Priority: P2)

**Goal**: Present curated issue templates (bug/feature), disable blank issues, and redirect questions to Discussions.

**Independent Test**: Clicking "New issue" on the GitHub UI shows exactly two templates (Bug/Feature) plus contact links (Discussions + Meta API docs) — blank-issue creation is not possible.

### Implementation for User Story 5

- [ ] T015 [P] [US5] Create `.github/ISSUE_TEMPLATE/bug_report.md` per `contracts/issue-templates.md`: frontmatter (`name: "🐛 Bug Report"`, `about: "Report a bug to help us improve"`, `title: "[Bug]: "`, `labels: bug`, `assignees: ""`); H2 body sections — "Describe the Bug", "To Reproduce" (with fenced `typescript` code block importing from `@abdelrahmannasr-wa/cloud-api`), "Expected Behavior", "Actual Behavior", "Environment" (SDK version, Node.js version, package manager, OS, TypeScript version), "Additional Context". Include a prompt in the bug body reminding reporters to verify SDK-vs-upstream-Meta-API scope. (FR-009, supports spec Meta API hand-off edge case)
- [ ] T016 [P] [US5] Create `.github/ISSUE_TEMPLATE/feature_request.md` per `contracts/issue-templates.md`: frontmatter (`name: "✨ Feature Request"`, `about: "Suggest a new feature or improvement"`, `title: "[Feature]: "`, `labels: enhancement`, `assignees: ""`); H2 body sections — "Problem", "Proposed Solution" (with fenced `typescript` code block), "Alternatives Considered", "Additional Context". (FR-009)
- [ ] T017 [P] [US5] Create `.github/ISSUE_TEMPLATE/config.yml` per `contracts/issue-templates.md`: exact content `blank_issues_enabled: false` + two `contact_links` entries (💬 Questions & Discussion → `https://github.com/abdelrahmannasr/wa-cloud-sdk/discussions`; 📖 Meta WhatsApp Cloud API Docs → `https://developers.facebook.com/docs/whatsapp/cloud-api`). **Rollout order**: for a clean zero-404 launch, enable Discussions (T019) BEFORE this PR merges to main — otherwise the 💬 contact link 404s until T019 runs. (FR-010)

**Checkpoint**: Issue tracker is curated.

---

## Phase 8: User Story 6 — Dependencies stay current (Priority: P3)

**Goal**: Weekly automated dependency and CI-action upgrade PRs with non-releasing commit prefixes and distinct labels.

**Independent Test**: Pushing `.github/dependabot.yml` and waiting one week produces at least one labeled PR using `chore(deps):` or `chore(ci):` prefix.

### Implementation for User Story 6

- [ ] T018 [US6] Create `.github/dependabot.yml` with exact content: `version: 2`, two `updates:` entries — first entry `package-ecosystem: "npm"` with `directory: "/"`, `schedule.interval: "weekly"`, `labels: ["dependencies"]`, `commit-message.prefix: "chore(deps):"`, `open-pull-requests-limit: 10`; second entry `package-ecosystem: "github-actions"` with `directory: "/"`, `schedule.interval: "weekly"`, `labels: ["ci"]`, `commit-message.prefix: "chore(ci):"` (no PR limit). (FR-026, FR-027, FR-028)

**Checkpoint**: Dependency hygiene is automated.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Operational prerequisites (repository settings, secrets, branch protection) and end-to-end verification. Most items here require maintainer GitHub-UI actions rather than code edits.

### Maintainer operational setup (per `quickstart.md`)

- [ ] T019 [P] Enable GitHub Discussions: repo **Settings → Features → Discussions → Enable**. Required before the `config.yml` Discussions link from T017 resolves. **Run this operational step BEFORE T017's PR merges** for a zero-404 rollout; technically Phase 9 by task ID, but rollout-order-wise it precedes T017. (quickstart step 2)
- [ ] T020 [P] Provision repository secrets via **Settings → Secrets and variables → Actions → New repository secret**: `NPM_TOKEN` (npm Automation token for `@abdelrahmannasr-wa` scope with publish access), `CODECOV_TOKEN` (from codecov.io after adding the repo). (quickstart step 1; required for FR-037)
- [ ] T021 Generate a dedicated GPG key for release signing and provision signing secrets: run `gpg --full-generate-key` (RSA 4096), export the secret key via `gpg --armor --export-secret-keys <KEY_ID>`, store in GitHub secret `GPG_PRIVATE_KEY`; store the passphrase (if any) in `GPG_PASSPHRASE`. Add the public key to the release bot / maintainer GitHub account's verified GPG keys. After provisioning, create the initial entry in the maintainer's rotation log (personal password manager such as 1Password/Bitwarden secure note, or equivalent) recording: (a) key ID, (b) provisioning date, (c) 90-day rotation due date. Repeat for `NPM_TOKEN` and `CODECOV_TOKEN` entries provisioned in T020 — a single consolidated rotation log covering all three secrets is acceptable and preferred. (quickstart step 4; required for FR-034 and bootstraps FR-041 / SC-016)
- [ ] T022 Configure branch protection on `main` per `quickstart.md` step 3: Require pull request, Require 1 approval, Require status checks (list all five: `quality`, `test (18)`, `test (20)`, `test (22)`, `build`), Require branches up-to-date, Require linear history, Require signed commits, Include administrators, disallow force-push, disallow deletion. (FR-030, FR-031, FR-032, FR-033, FR-034)

### Local verification (per `quickstart.md` step 5)

- [ ] T023 [P] Run `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the repo root; confirm all four pass with the new package.json. Verifies the devDependency additions from T001 did not break the existing toolchain.
- [ ] T024 [P] Run `pnpm pack --dry-run` and inspect the output: confirm it lists only `dist/**`, `README.md`, `LICENSE`, `CHANGELOG.md`, `package.json`. Fail if any of `src/`, `tests/`, `examples/`, `specs/`, `.github/`, `.claude/`, `.specify/`, `.env*` appear. (Validates SC-002)
- [ ] T025 [P] Run `NPM_TOKEN=placeholder GITHUB_TOKEN=$(gh auth token) npx semantic-release --dry-run --no-ci` at repo root; confirm the dry-run parses `.releaserc.json`, reports the commits it would release, and prints the computed next version without errors. Then invoke the same command a second time and diff the computed next-version and release-notes output — both runs MUST produce identical values. (Validates FR-017 and the `.releaserc.json` plugin ordering; second run validates FR-039 idempotency at the local level before first real release.)

### Consistency & final checks

- [ ] T026 Verify three-way minimum-Node-version consistency (SC-010) by grepping `engines.node` in `package.json`, the Node ≥18 badge alt-text in `README.md`, and the matrix entry in `.github/workflows/ci.yml` — confirm all three advertise the same minimum version (`18.0.0`).
- [ ] T027 [P] Final README pass: render `README.md` locally or on a PR preview, verify all nine badges resolve, the Contributing/Security section links open the correct files, and no internal-tooling references (`.claude/`, `specs/`) leak into the rendered document.
- [ ] T028 Once merged to `main`, monitor the first real release workflow run: confirm semantic-release picks a starting version, publishes to npm with a provenance badge on the registry page, generates release notes, appends to `CHANGELOG.md`, creates a `vX.Y.Z` tag, creates a signed GitHub Release, and commits the `chore(release): X.Y.Z [skip ci]` back to main. (Validates US3, FR-020, FR-039, SC-003, SC-011)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup. **Blocks all user stories.**
- **User Stories (Phases 3–8)**: All depend on Foundational. Once Phase 2 is complete, any or all user stories may proceed in parallel.
- **Polish (Phase 9)**: Operational tasks (T019–T022) can start once their prerequisite phase is done (e.g., T019 once T017 lands; T022 once T005 lands). Verification tasks (T023–T028) depend on all previous phases being complete.

### User Story Dependencies

- **US1 (Phase 3)**: Depends only on Phase 2. Fully independent of US2–US6.
- **US2 (Phase 4)**: Depends on Phase 2 — the badges reference artifacts from T002 (package.json), T004 (CHANGELOG), and T005 (ci.yml). T010's Contributing/Security section links resolve after US1 (T006–T007) and US4 (T014) land, but the sections themselves can be written before those files exist.
- **US3 (Phase 5)**: Depends on Phase 2. The release workflow requires ci.yml from T005 to exist (workflow re-uses the same lint/test/build). Independent of US1/US2/US4–US6 as code but operationally depends on T020 (secrets) and T022 (branch protection) from Polish to actually run.
- **US4 (Phase 6)**: Depends only on Phase 2. Independent of all other stories.
- **US5 (Phase 7)**: Depends only on Phase 2. T017's Discussions link doesn't resolve until T019 enables Discussions, but the file can ship first.
- **US6 (Phase 8)**: Depends only on Phase 2. Fully independent.

### Within Each User Story

- No TDD tests required (this feature adds no runtime code). Verification is pipeline-level in Polish.
- Within US2: T009 (badges) before T010 (sections) — same file (`README.md`), sequential.
- Within US3: T011/T012/T013 are independent files — all [P].

### Parallel Opportunities

- **Phase 2**: T002, T003, T004 are all [P] (different files). T005 is separate file, also [P].
- **Phase 3**: T006, T007, T008 all [P] (different files).
- **Phase 5**: T011, T012, T013 all [P] (different files).
- **Phase 7**: T015, T016, T017 all [P] (different files).
- **Cross-phase parallelism**: With multiple contributors, after Phase 2 completes, Phases 3, 4, 6, 7, 8 can run simultaneously; Phase 5 benefits from Phase 4's README being merged first (for badge URLs to resolve during verification).

---

## Parallel Example: Phase 2 Foundational

```bash
# With four contributors, run these in parallel once T001 is done:
Task: "T002 Update package.json metadata (version, publishConfig, repository.url)"
Task: "T003 Create .npmignore defence-in-depth exclusion list"
Task: "T004 Rewrite CHANGELOG.md with [Unreleased] seed"
Task: "T005 Replace ci.yml with three-job parallel structure"
```

## Parallel Example: All P1 User Stories

```bash
# After Phase 2 completes, a three-person team can split the three P1 stories:
Developer A: Phase 3 (US1 — contributor onboarding) T006+T007+T008
Developer B: Phase 4 (US2 — consumer trust) T009→T010 sequential
Developer C: Phase 5 (US3 — release automation) T011+T012+T013
```

---

## Implementation Strategy

### MVP First (three P1 stories)

1. **Phase 1 (Setup)** — T001: install devDependencies.
2. **Phase 2 (Foundational)** — T002–T005 in parallel.
3. **Phase 3 (US1 Contributor)** — T006–T008 in parallel.
4. **Phase 4 (US2 Consumer)** — T009 then T010.
5. **Phase 5 (US3 Release)** — T011–T013 in parallel.
6. **STOP and VALIDATE**: run T023 (local CI equivalent) and T024 (pack dry-run).
7. **Merge to main** once all P1 acceptance scenarios pass.

### Incremental Delivery

1. **Setup + Foundational** → foundation ready.
2. **+ US1** → contributors have onboarding. Merge, demo.
3. **+ US2** → consumers see a trustworthy README. Merge, demo.
4. **+ US3** → first automated release publishes. **🚀 MVP shipped.**
5. **+ US4** → security disclosure channel live.
6. **+ US5** → curated issue tracker live.
7. **+ US6** → dependency automation live.
8. **Polish** → operational setup + end-to-end validation (T019–T028).

### Parallel Team Strategy

With three to four contributors:

1. One sprint: Phase 1 + Phase 2 together (all four Phase-2 tasks in parallel).
2. Second sprint: split Phases 3, 4, 5, 7 across the team (each developer picks one).
3. Third sprint: Phases 6, 8 + all of Polish; verification happens at the end.
4. Merge order prefers Phase 4 (README badges) before Phase 5's release verification so the README's CI badge resolves during validation.

---

## Task Count Summary

| Phase | Story | Count | Parallel |
|---|---|---|---|
| 1 Setup | — | 1 (T001) | — |
| 2 Foundational | — | 4 (T002–T005) | 4 [P] |
| 3 US1 Contributor | US1 | 3 (T006–T008) | 3 [P] |
| 4 US2 Consumer | US2 | 2 (T009–T010) | 0 (same file) |
| 5 US3 Release | US3 | 3 (T011–T013) | 3 [P] |
| 6 US4 Security | US4 | 1 (T014) | — |
| 7 US5 Issues | US5 | 3 (T015–T017) | 3 [P] |
| 8 US6 Deps | US6 | 1 (T018) | — |
| 9 Polish | — | 10 (T019–T028) | 7 [P] |
| **Total** | | **28** | **20 [P]** |

## Notes

- `[P]` = different files, no dependencies — safe for parallel execution.
- `[Story]` label appears on US1..US6 tasks only. Setup, Foundational, and Polish tasks have no story label.
- No new unit tests (this feature adds zero source code). The existing vitest suite runs unchanged through CI; verification is pipeline-level.
- Commit cadence: per the project's `/gen-commit-msg` memory preference, commit each phase atomically — one phase = one commit minimum, finer-grained commits are encouraged for logical sub-steps.
- MVP ships after Phase 5 completes + T023/T024/T025 pass. T028 (first-release monitoring) closes the loop on SC-003 and SC-011.
