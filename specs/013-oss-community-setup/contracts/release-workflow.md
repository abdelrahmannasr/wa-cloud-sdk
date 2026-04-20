# Contract: `.github/workflows/release.yml`

**Satisfies**: FR-016, FR-017, FR-018, FR-019, FR-020, FR-035

## Trigger

| Event | Branches |
|---|---|
| `push` | `main` (only) |

## Workflow-level settings

### Permissions (required)

```yaml
permissions:
  contents: write        # semantic-release commits CHANGELOG + package.json, creates tags
  issues: write          # semantic-release can comment on closed issues
  pull-requests: write   # semantic-release can comment on released PRs
  id-token: write        # npm provenance — OIDC token for sigstore attestation
```

### Concurrency (FR-035)

```yaml
concurrency:
  group: release
  cancel-in-progress: false
```

Queued runs wait for the active run to complete. `cancel-in-progress: false` is mandatory — cancelling would risk dropping commits from the version being published.

## Single job — `release`

- `runs-on: ubuntu-latest`
- Steps (order is significant):
  1. `actions/checkout@v4` with:
     - `fetch-depth: 0` (semantic-release needs full commit history to analyze)
     - `persist-credentials: false` (the default GITHUB_TOKEN scope would conflict with the token semantic-release uses for its release commit)
  2. `pnpm/action-setup@v4` with `version: 9`
  3. `actions/setup-node@v4` with:
     - `node-version: 22`
     - `cache: pnpm`
     - **NO `registry-url`** — semantic-release's npm plugin handles registry auth via `NPM_TOKEN` directly; setting `registry-url` would create an `.npmrc` that overrides semantic-release's auth.
  4. `pnpm install --frozen-lockfile`
  5. `pnpm lint`
  6. `pnpm test`
  7. `pnpm build`
  8. Named step `Semantic Release`:
     - `run: npx semantic-release`
     - `env:`
       - `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` (provided automatically by GitHub Actions)
       - `NPM_TOKEN: ${{ secrets.NPM_TOKEN }}` (must be provisioned by maintainer — see quickstart.md)

## Outputs on successful release

- New git tag `v<major>.<minor>.<patch>` pushed to main.
- New commit on main: `chore(release): <version> [skip ci]\n\n<release notes>` — signed (branch protection requirement).
- New GitHub Release with the generated notes.
- New npm version published with provenance attestation.
- `CHANGELOG.md` updated with the new version section.
- `package.json` `version` field bumped.

## Outputs on no-release commit set

- `semantic-release` exits with code 0 and logs `There are no relevant changes, so no new version is released.`
- No tag, commit, release, or npm publish occurs.

## Failure modes

| Failure | Behavior |
|---|---|
| `pnpm lint` / `pnpm test` / `pnpm build` fails | Release aborted; no npm publish; maintainer alerted via workflow failure |
| `NPM_TOKEN` missing or invalid | `semantic-release` fails at the npm publish step with a 401 error |
| Branch protection blocks the automated release commit | semantic-release's git plugin needs a PAT or app token with bypass — documented in quickstart.md |
| Two pushes in quick succession | Second run queues (concurrency group); executes after first completes |
