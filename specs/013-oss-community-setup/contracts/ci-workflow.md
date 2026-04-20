# Contract: `.github/workflows/ci.yml`

**Satisfies**: FR-012, FR-013, FR-014, FR-015

## Triggers

| Event | Branches |
|---|---|
| `push` | `main`, `staging` |
| `pull_request` | `main`, `staging` |

## Jobs

Three independent jobs run in parallel (no `needs:` dependencies between them).

### Job 1 — `quality` (Lint & Typecheck)

- `runs-on: ubuntu-latest`
- Steps:
  1. `actions/checkout@v4`
  2. `pnpm/action-setup@v4` with `version: 9`
  3. `actions/setup-node@v4` with `node-version: 22`, `cache: pnpm`
  4. `pnpm install --frozen-lockfile`
  5. `pnpm lint`
  6. `pnpm typecheck`

### Job 2 — `test` (Test matrix)

- `runs-on: ubuntu-latest`
- `strategy.matrix.node-version: [18, 20, 22]`
- Steps:
  1. `actions/checkout@v4`
  2. `pnpm/action-setup@v4` with `version: 9`
  3. `actions/setup-node@v4` with `node-version: ${{ matrix.node-version }}`, `cache: pnpm`
  4. `pnpm install --frozen-lockfile`
  5. `pnpm test:coverage`
  6. Conditional step `if: matrix.node-version == 22`:
     - `codecov/codecov-action@v4` with:
       - `token: ${{ secrets.CODECOV_TOKEN }}`
       - `fail_ci_if_error: false`

### Job 3 — `build`

- `runs-on: ubuntu-latest`
- Steps:
  1. `actions/checkout@v4`
  2. `pnpm/action-setup@v4` with `version: 9`
  3. `actions/setup-node@v4` with `node-version: 22`, `cache: pnpm`
  4. `pnpm install --frozen-lockfile`
  5. `pnpm build`
  6. `run: du -sh dist/`

## Status Check Names

GitHub publishes one status check per job, and one per matrix leg. Expected names:

- `quality`
- `test (18)`
- `test (20)`
- `test (22)`
- `build`

All five are set as required status checks on the default branch's protection rule (R6).

## Non-requirements (explicit)

- NO `prettier --check` step (formatting is enforced by `pnpm lint` through eslint-config-prettier).
- NO integration tests (marked `*.integration.test.ts` in `CLAUDE.md`; excluded from CI).
- NO coverage threshold gate — upload only, per FR-013.
