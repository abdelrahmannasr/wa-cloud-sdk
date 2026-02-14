# Implementation Plan: Template Management

**Branch**: `003-template-management` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-template-management/spec.md`

## Summary

Implement a Templates module for the WhatsApp Cloud API SDK providing full CRUD operations (list, get, create, update, delete) for message templates, plus a fluent `TemplateBuilder` class for constructing creation payloads with client-side validation. The module follows the established SDK patterns from Messages and Media modules — constructor injection of `HttpClient`, `ApiResponse<T>` return types, `RequestOptions` passthrough, and `ValidationError` for pre-network validation.

Key design decisions from research:
- Templates uses `businessAccountId` (WABA ID) instead of `phoneNumberId`
- No single-template GET endpoint exists; `get()` filters the list endpoint by name
- `TemplateBuilder` validates name format, text lengths, and button counts client-side
- Authentication template special constraints are deferred (server-side enforced)

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode
**Primary Dependencies**: Zero runtime dependencies (Node.js built-in APIs only)
**Storage**: N/A (stateless SDK library)
**Testing**: Vitest 3 with v8 coverage, 80% minimum threshold
**Target Platform**: Node.js 18+ (ESM + CJS dual export via tsup)
**Project Type**: Single library package
**Performance Goals**: N/A (thin API wrapper, performance determined by Meta's API)
**Constraints**: Zero runtime dependencies, all public APIs must have TSDoc with @example
**Scale/Scope**: 3 new source files (types.ts, templates.ts, builder.ts), 2 test files, barrel exports update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is not yet configured for this project (template placeholder only). No gates to enforce. Proceeding with project conventions from CLAUDE.md:

- [x] Zero runtime dependencies
- [x] Named exports only (no default exports)
- [x] `unknown` over `any`
- [x] Typed error classes (ValidationError for client-side, ApiError from platform)
- [x] Constructor injection pattern (HttpClient)
- [x] `readonly` on interface properties
- [x] kebab-case file naming
- [x] TSDoc with @example on all public APIs

**Post-Phase 1 re-check**: Design artifacts (data-model, contracts, quickstart) all comply. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-template-management/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Research decisions
├── data-model.md        # Phase 1: Entity definitions and constraints
├── quickstart.md        # Phase 1: Usage examples
├── contracts/
│   └── templates-api.md # Phase 1: SDK API contract + Meta API mapping
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
└── templates/
    ├── types.ts          # All type definitions, enums, constants, validation constraints
    ├── templates.ts      # Templates class (CRUD: list, get, create, update, delete)
    ├── builder.ts        # TemplateBuilder fluent API with validation
    └── index.ts          # Barrel export (class + types + builder)

src/index.ts              # Update: add templates re-exports

tests/
└── templates/
    ├── templates.test.ts # Templates class unit tests (mock HttpClient)
    └── builder.test.ts   # TemplateBuilder unit tests (validation, output shape)
```

**Structure Decision**: Follows the existing module-per-directory pattern established by `src/messages/` and `src/media/`. The builder is a separate file (`builder.ts`) because it's a distinct concern from the CRUD class, keeping each file focused. Tests mirror `src/` structure under `tests/`.

## Complexity Tracking

No constitution violations — no entries needed.
