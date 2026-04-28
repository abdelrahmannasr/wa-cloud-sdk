# Contract: `.github/PULL_REQUEST_TEMPLATE.md`

**Satisfies**: FR-011

## Required H2 Sections

1. `## Description` — free-text summary of the change
2. `## Type of Change` — markdown checkboxes (unchecked by default)
3. `## Checklist` — markdown checkboxes (unchecked by default)
4. `## Related Issues` — free-text for "Closes #..."

## `## Type of Change` — required checkbox options

Each option prefixed with an emoji for scannability. Exact options:

- `- [ ] 🐛 Bug fix (non-breaking change fixing an issue)`
- `- [ ] ✨ New feature (non-breaking change adding functionality)`
- `- [ ] 💥 Breaking change (fix or feature causing existing functionality to change)`
- `- [ ] 📝 Documentation update`
- `- [ ] ♻️ Refactor (no feature change, no bug fix)`
- `- [ ] 🧪 Test update`
- `- [ ] 🔧 Chore (CI, deps, tooling)`

## `## Checklist` — required checkbox options

- `- [ ] My code follows the project's code style`
- `- [ ] I have added tests covering my changes`
- `- [ ] All new and existing tests pass (\`pnpm test\`)`
- `- [ ] Lint passes (\`pnpm lint\`)`
- `- [ ] Type check passes (\`pnpm typecheck\`)`
- `- [ ] Build succeeds (\`pnpm build\`)`
- `- [ ] I have updated the README if this changes the public API`
- `- [ ] My commits follow [Conventional Commits](https://www.conventionalcommits.org/) format`

## Validation

- Command names in the checklist (`pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`) MUST match the script names declared in `package.json`.
- The Conventional Commits link MUST point to the canonical https://www.conventionalcommits.org/ URL.
- Checkboxes MUST be unchecked — the contributor checks them as they complete each item.

## Non-requirements (explicit)

- NO auto-assignment logic (e.g., CODEOWNERS triggers) — out of scope for this feature.
- NO CLA checkbox — contribution is governed by the MIT notice in CONTRIBUTING.md, not a formal CLA.
