# Contract: `package.json` (modifications)

**Satisfies**: FR-021, FR-022, FR-023, FR-029

Only fields changed by this feature are listed. All other fields (`name`, `description`, `exports`, `scripts`, `devDependencies`, etc.) are preserved verbatim.

## Required changes

| Field | New value | Notes |
|---|---|---|
| `version` | `"0.0.0-development"` | semantic-release overwrites on every release; the "development" literal is the convention semantic-release recognizes. |
| `repository` | `{ "type": "git", "url": "https://github.com/abdelrahmannasr/wa-cloud-sdk.git" }` | Strip the `git+` prefix that was in the pre-feature value — npm accepts both, but the bare https form is cleaner on the registry page. |
| `publishConfig` | `{ "access": "public", "provenance": true }` | `access: public` is required for scoped packages on the public registry. `provenance: true` opts into npm provenance attestation (FR-022). |

## Required additions (new devDependencies)

| Dependency | Version | Purpose |
|---|---|---|
| `semantic-release` | `^24.x` (latest major) | Core release orchestrator. |
| `@semantic-release/changelog` | `^6.x` | Plugin: updates `CHANGELOG.md`. |
| `@semantic-release/git` | `^10.x` | Plugin: commits CHANGELOG + package.json bump back to main. |

All three land in `devDependencies`. The existing `@semantic-release/commit-analyzer`, `@semantic-release/release-notes-generator`, `@semantic-release/npm`, `@semantic-release/github` plugins are bundled transitively with `semantic-release` core and do NOT need separate entries.

## Unchanged (validation — must still hold)

| Field | Expected value (preserved) |
|---|---|
| `engines.node` | `">=18.0.0"` — matches README badge + CI matrix floor (FR-029) |
| `files` | `["dist", "README.md", "LICENSE", "CHANGELOG.md"]` |
| `bugs.url` | `"https://github.com/abdelrahmannasr/wa-cloud-sdk/issues"` |
| `homepage` | `"https://github.com/abdelrahmannasr/wa-cloud-sdk#readme"` |
| `prepublishOnly` | leave in place — harmless during semantic-release flow |

## Validation

- `engines.node` minimum MUST equal the lowest CI matrix Node version (currently 18).
- `files` array MUST NOT include source/test/internal directories (defence-in-depth with `.npmignore`).
- `publishConfig.access` MUST be `"public"` (scoped packages default to private).
- `publishConfig.provenance` MUST be `true` alongside `id-token: write` permission in `release.yml`.
