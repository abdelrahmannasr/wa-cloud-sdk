# Quickstart: Open-Source Community Publishing

**Feature**: 013-oss-community-setup
**Audience**: The maintainer, one-time, on the first deploy of this feature.

## What this feature gives you (once complete)

- A standards-compliant OSS GitHub repo (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, ISSUE_TEMPLATE, PULL_REQUEST_TEMPLATE).
- Three-job parallel CI across Node 18/20/22 with Codecov reporting.
- Push-to-main release automation via semantic-release with npm provenance.
- Weekly Dependabot upgrades for both application and CI-action dependencies.

## Prerequisites (one-time, before first release)

### 1. Provision repository secrets

In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | How to obtain | Required for |
|---|---|---|
| `NPM_TOKEN` | On npmjs.com: profile icon → Access Tokens → Generate New Token → "Automation" (bypasses 2FA for CI). Scope: publish for `@abdelrahmannasr` scope. | `release.yml` — npm publish step |
| `CODECOV_TOKEN` | On codecov.io: add the repo → copy the upload token. | `ci.yml` — `test` job Node 22 leg |

`GITHUB_TOKEN` is provided by Actions automatically; no manual setup required.

### 2. Enable GitHub Discussions

**Settings → Features → Discussions → Enable**. The issue-template `config.yml` links to `/discussions`; without this, the link 404s.

### 3. Configure branch protection on `main` (FR-030 … FR-034)

**Settings → Branches → Add rule** for `main`:

- [x] Require a pull request before merging
  - [x] Require approvals: **1**
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - Add required checks: `quality`, `test (18)`, `test (20)`, `test (22)`, `build`
- [x] Require linear history
- [x] Require signed commits
- [x] Include administrators (tick this — it's the whole point of "strict" protection)
- [ ] Allow force pushes — **leave unchecked**
- [ ] Allow deletions — **leave unchecked**

Note: the "Require a pull request" rule combined with signed commits means semantic-release's release commit must itself be signed. There are two ways to achieve this; pick one:

**Option A** — Use a GitHub App / PAT with "bypass branch protection" for the release workflow, and configure the signing key on the runner. Requires adding `GITHUB_TOKEN` override (a PAT) and a signing key secret. More setup.

**Option B** — Allow the release bot to bypass branch protection by adding a specific actor (e.g., a machine user or GitHub App) to the "bypass" list. Simpler, but requires creating a machine user.

The implementation tasks will set up Option A first (reuse existing `secrets.NPM_TOKEN` flow + add `GPG_PRIVATE_KEY` / `GPG_PASSPHRASE` secrets). If that proves operationally painful, fall back to Option B.

### 4. Configure npm package signing (for FR-034 on the automated release commit)

Generate a dedicated GPG key for CI:

```bash
gpg --full-generate-key              # RSA 4096, no passphrase is simpler for CI
gpg --armor --export-secret-keys <KEY_ID>  # copy output → GitHub secret GPG_PRIVATE_KEY
```

Import the public key to the GitHub actor that owns the release PAT (Settings → SSH and GPG keys → New GPG key).

Add the `crazy-max/ghaction-import-gpg` action to `release.yml` before the `npx semantic-release` step, and set `user.signingkey` + `commit.gpgsign=true` in the workflow git config.

## Local verification (before pushing anything)

```bash
# 1. Install the new devDependencies
pnpm install

# 2. Confirm no lockfile drift
pnpm install --frozen-lockfile

# 3. Run the local equivalent of CI
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# 4. Verify the publish manifest is lean (FR-021, SC-002)
pnpm pack --dry-run
# Expected output should list ONLY:
#   dist/...
#   README.md
#   LICENSE
#   CHANGELOG.md
#   package.json
# If any src/, tests/, .github/, .claude/, or specs/ appear → fix .npmignore / files array.

# 5. Dry-run semantic-release (optional, requires NPM_TOKEN + GITHUB_TOKEN env vars)
NPM_TOKEN=<fake-but-present> GITHUB_TOKEN=$(gh auth token) \
  npx semantic-release --dry-run --no-ci
# Expected: logs which commits would be released and the computed next version.
```

## First release (after merging this feature to main)

1. Merge the feature PR to `main` (signed commit, passing all checks).
2. `release.yml` fires automatically.
3. semantic-release analyzes the commit history since the repo's first commit and picks the first release version (likely `1.0.0` if there's a BREAKING CHANGE in history, otherwise `0.1.0` or similar — check the workflow log).
4. Verify in the workflow log: "Published package version X.Y.Z".
5. Verify on npmjs.com: the package listing shows a "Published with provenance" badge.
6. Verify on GitHub: a new tag `vX.Y.Z` exists; a new Release is published; `CHANGELOG.md` has a new entry; `package.json` shows the new version.

## Recovery — if the first release misbehaves

- **Wrong version computed**: manually tag the desired version (`git tag v1.0.0 && git push --tags`). semantic-release uses the most recent tag as the baseline for the next release. Do this BEFORE the first run if you want to force a specific starting version.
- **npm publish failed with 401**: verify `NPM_TOKEN` scope includes publish access for `@abdelrahmannasr`. Regenerate if needed.
- **Release commit blocked by branch protection**: semantic-release's token doesn't have bypass; add to bypass list or use a GitHub App with write access.
- **CHANGELOG shows an unwanted `[0.1.0]` entry**: confirm this feature's CHANGELOG rewrite actually landed (`git show HEAD -- CHANGELOG.md`). If the old entry snuck back in via a merge, delete the section and force a `chore:` commit.

## Future migration notes

- **OIDC Trusted Publishing** (R2): when comfortable, register the repo as a trusted publisher on npm and drop `NPM_TOKEN`. Set `publishConfig.access: public` stays; add `provenance: true` already present. Remove `NPM_TOKEN` secret and the env var from `release.yml`.
- **Commitlint enforcement**: add `@commitlint/cli` + a pre-commit hook via Husky to enforce Conventional Commits at commit time. Out of scope for this feature (assumption documented in spec).
