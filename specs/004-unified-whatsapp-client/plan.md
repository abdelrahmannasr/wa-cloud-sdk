# Implementation Plan: Unified WhatsApp Client

**Branch**: `004-unified-whatsapp-client` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-unified-whatsapp-client/spec.md`

## Summary

Implement a `WhatsApp` facade class that wires all existing SDK modules (Messages, Media, Templates, Webhooks) under a single entry point, plus a new `Webhooks` class that wraps the existing standalone webhook functions with pre-bound configuration. The unified client accepts `WhatsAppConfig`, validates required fields at construction, creates a shared `HttpClient`, and exposes module accessors via getters with lazy initialization for optional modules (templates, webhooks).

Key design decisions from research:
- `WhatsApp` class in `src/whatsapp.ts` (top-level facade)
- `Webhooks` class in `src/webhooks/webhooks.ts` (wraps standalone functions)
- Messages/Media are eager; Templates/Webhooks are lazy
- Constructor validates only `accessToken` and `phoneNumberId`
- Deferred errors for `businessAccountId`, `appSecret`, `webhookVerifyToken`
- `TemplateBuilder` remains independently importable (no wrapper needed)

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode
**Primary Dependencies**: Zero runtime dependencies (Node.js built-in APIs only)
**Storage**: N/A (stateless SDK library)
**Testing**: Vitest 3 with v8 coverage, 80% minimum threshold
**Target Platform**: Node.js 18+ (ESM + CJS dual export via tsup)
**Project Type**: Single library package
**Performance Goals**: N/A (thin facade, performance determined by underlying modules and Meta's API)
**Constraints**: Zero runtime dependencies, all public APIs must have TSDoc with @example, named exports only
**Scale/Scope**: 2 new source files (whatsapp.ts, webhooks/webhooks.ts), 2 test files, barrel export updates, webhooks barrel update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is not yet configured for this project (template placeholder only). No gates to enforce. Proceeding with project conventions from CLAUDE.md:

- [x] Zero runtime dependencies
- [x] Named exports only (no default exports)
- [x] `unknown` over `any`
- [x] Typed error classes (ValidationError for config validation)
- [x] Constructor injection pattern (HttpClient shared across modules)
- [x] `readonly` on interface properties
- [x] kebab-case file naming
- [x] TSDoc with @example on all public APIs

**Post-Phase 1 re-check**: Design artifacts (data-model, contracts, quickstart) all comply. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-unified-whatsapp-client/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Research decisions
├── data-model.md        # Phase 1: Entity definitions (WhatsApp class, Webhooks class)
├── quickstart.md        # Phase 1: Usage examples (before/after comparison)
├── contracts/
│   └── whatsapp-api.md  # Phase 1: SDK API contract + error contract
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── whatsapp.ts           # NEW: WhatsApp facade class (entry point)
├── webhooks/
│   ├── webhooks.ts       # NEW: Webhooks class wrapping standalone functions
│   └── index.ts          # UPDATED: add Webhooks class re-export
└── index.ts              # UPDATED: add WhatsApp + Webhooks re-exports

tests/
├── whatsapp.test.ts      # NEW: WhatsApp class unit tests
└── webhooks/
    └── webhooks.test.ts  # NEW: Webhooks class unit tests
```

**Structure Decision**: Follows the existing project layout. The `WhatsApp` class lives at `src/whatsapp.ts` (top-level, not in a subdirectory) because it's the root facade across all modules. The `Webhooks` class lives inside `src/webhooks/` because it's part of the webhooks module, wrapping that module's functions.

## Complexity Tracking

No constitution violations — no entries needed.
