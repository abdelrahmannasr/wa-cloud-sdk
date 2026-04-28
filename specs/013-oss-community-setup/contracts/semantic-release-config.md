# Contract: `.releaserc.json`

**Satisfies**: FR-016, FR-017, FR-019, FR-020

## Exact content

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
    ["@semantic-release/npm", { "npmPublish": true }],
    ["@semantic-release/github", { "assets": [] }],
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }]
  ]
}
```

## Plugin ordering — why it matters

The order in the `plugins` array is the execution order. This specific order is load-bearing:

1. **`commit-analyzer`** — parses commits, decides the bump level.
2. **`release-notes-generator`** — builds the release-notes string from the same commits.
3. **`changelog`** — prepends the release notes to `CHANGELOG.md` (file modified, not committed yet).
4. **`npm`** — bumps `package.json` version (modified, not committed), then runs `npm publish --provenance` (publish happens here).
5. **`github`** — creates the GitHub Release with the generated notes (assets empty — no tarball upload).
6. **`git`** — commits the modified `CHANGELOG.md` + `package.json` back to main with the `chore(release): …` message.

If `git` ran before `npm`, the commit would happen before the registry publish — if publish failed, the version commit would be orphaned. If `changelog` ran after `git`, the changelog update would not be in the release commit.

## Field contract

- `branches: ["main"]` — only `main` produces releases (FR-016).
- `plugins[2]` `changelogFile: "CHANGELOG.md"` — must match the file that exists and is in `package.json` `files`.
- `plugins[3]` `npmPublish: true` — explicit publish (default is also true, but explicit guards against future default changes).
- `plugins[4]` `assets: []` — no release assets uploaded to GitHub (the npm tarball is the distribution; GitHub Release body is notes only).
- `plugins[5]` `message` — the `[skip ci]` token MUST be present so CI/release does not loop.
- `plugins[5]` `assets` — exactly `["CHANGELOG.md", "package.json"]`; no other files should be committed by the release step.

## Non-requirements (explicit)

- NO custom `preset` key for commit-analyzer / release-notes-generator — default (Angular) is correct per FR-017.
- NO `dryRun` key — the workflow runs real releases; `--dry-run` is used only in local verification (see quickstart.md).
