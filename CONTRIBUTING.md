# Contributing to wa-cloud-sdk

Thank you for your interest in contributing! This guide covers everything you need to go from fresh clone to a merged PR.

## Quick Start

1. **Fork** the repo and **clone** your fork
2. Install dependencies: `pnpm install`
3. Create a branch: `git checkout -b feat/my-change`
4. Develop and test: `pnpm test:watch`
5. Lint and format: `pnpm lint:fix && pnpm format`
6. Commit using Conventional Commits (see below)
7. Push and open a Pull Request — the template will guide you

## Conventional Commits

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This drives automated versioning and changelog generation.

| Prefix | Version bump | When to use |
|---|---|---|
| `feat:` | **minor** | New backward-compatible feature |
| `fix:` | **patch** | Bug fix |
| `perf:` | **patch** | Performance improvement |
| `docs:` | none | Documentation only |
| `test:` | none | Adding or refactoring tests |
| `chore:` | none | Maintenance (deps, tooling, CI) |
| `refactor:` | none | Code restructure with no behavior change |
| `BREAKING CHANGE:` in body | **major** | Any change that breaks the public API |

### Examples

```
feat: add sendCatalog message type
fix: handle 503 response in retry logic
docs: add webhook setup guide
feat!: rename WhatsAppMulti to WhatsAppMultiAccount
```

> **Note:** `feat!` (exclamation mark) is shorthand for a feat commit with a breaking change footer.

## PR Guidelines

- **Focused scope** — one logical change per PR; avoid mixing refactors with features
- **Tests included** — add or update tests for any behavior change
- **README updated** — if you add or change a public API, update the README
- **All checks must pass** — CI runs lint, typecheck, tests, and build
- **Fill the PR template** — describe the change, tick the type, complete the checklist

## Dev Commands

| Command | Description |
|---|---|
| `pnpm test` | Run the full test suite (single pass) |
| `pnpm test:watch` | Run tests in watch mode during development |
| `pnpm test:coverage` | Run tests with v8 coverage report (min 80%) |
| `pnpm lint` | Check code with ESLint |
| `pnpm lint:fix` | Auto-fix ESLint issues |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | TypeScript type check (no emit) |
| `pnpm build` | Compile ESM + CJS output via tsup |

## Code Style

- **TypeScript strict mode** — `strict: true` is non-negotiable; never use `any`
- **TSDoc on all public APIs** — include `@example` blocks
- **Named exports only** — no default exports anywhere
- **Errors extend `WhatsAppError`** — never throw plain `Error()` or strings
- **Zero runtime dependencies** — only Node.js built-ins (`fetch`, `crypto`, `Buffer`, `URL`)
- **Interfaces for public shapes, types for unions** — follow the existing naming pattern

## Issue & PR Templates

- [Bug report](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature request](.github/ISSUE_TEMPLATE/feature_request.md)
- [Pull request template](.github/PULL_REQUEST_TEMPLATE.md)

---

By contributing, you agree your contributions are licensed under **MIT**.
