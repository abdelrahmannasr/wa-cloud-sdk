# Implementation Plan: Commerce & Catalogs

**Branch**: `011-commerce-catalogs` | **Date**: 2026-04-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-commerce-catalogs/spec.md`

## Summary

Add full WhatsApp Commerce & Catalogs support to `wa-cloud-sdk`: (1) three new send methods on the existing `Messages` class — `sendProduct()`, `sendProductList()`, `sendCatalogMessage()` — covering Meta's `interactive.action.product`, `product_list`, and `catalog_message` types; (2) a new `Catalog` class providing per-product CRUD (`listCatalogs`, `getCatalog`, `listProducts`, `getProduct`, `createProduct`, `upsertProduct`, `updateProduct`, `deleteProduct`); (3) a new `OrderEvent` webhook event plus an `onOrder` callback that routes incoming `messages[].order` payloads separately from regular message events. The feature ships as a new `src/catalog/` module with its own subpath export (`@abdelrahmannasr-wa/cloud-api/catalog`), integrates into the unified `WhatsApp` client via a lazy `catalog` getter (mirroring the existing `templates` and `flows` getters), and preserves the SDK's zero-runtime-dependency guarantee. Three spec clarifications shape the design: (a) bulk catalog mutation endpoints are explicitly out of scope for this release — consumers compose per-product calls with the existing rate limiter; (b) `createProduct` is strict (fails on duplicate retailer ID with a typed conflict error) and a separate `upsertProduct` method exists for the create-or-update use case; (c) outbound order acknowledgement / status messages are out of scope — consumers acknowledge orders by replying with `sendText` until a future release adds dedicated order-status types. Two earlier clarifications also stand: product images are consumer-hosted (no dependency on the existing `media` module), and the SDK never logs product attributes or order line items at any logger level.

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode enabled, compiling to ES2022 target for both ESM and CJS dual output
**Primary Dependencies**: Zero runtime dependencies. Uses only Node.js 18+ built-in APIs (`fetch`, `URL`, `URLSearchParams`)
**Storage**: N/A — library, stateless
**Testing**: Vitest 3 with v8 coverage (minimum 80% thresholds on lines/functions/branches/statements), mock `HttpClient` via `vi.fn()` for unit tests, optional `*.integration.test.ts` files for Meta sandbox calls (skipped in CI)
**Target Platform**: Node.js 18+ (server-side library). ESM + CJS dual export via tsup 8
**Project Type**: Zero-dependency TypeScript library (single project, no frontend/backend split)
**Performance Goals**: No new latency targets. Inherits the existing rate limiter (80 messages/second token bucket, default) and retry policy (3 retries, exponential backoff with jitter). Catalog CRUD operations share the same rate-limit envelope as template / flow CRUD (no separate bucket). Bulk product synchronization is deliberately the consumer's responsibility per spec clarification — pacing is the existing token bucket.
**Constraints**:
- MUST preserve zero runtime dependencies
- MUST NOT introduce any `any` usage (strict mode + project ESLint config bans it)
- MUST NOT use default exports (project convention)
- MUST NOT depend on the `src/media/` module from `src/catalog/` (FR-028 — image hosting is consumer responsibility)
- MUST NOT emit product attributes (price, name, description, image URL) or full order line-item arrays to the logger at any level (FR-027)
- MUST NOT break any existing public API
- MUST maintain ≥ 80% code coverage across new code
- MUST add new tsup entry, new package.json subpath export, and extend the existing test suite for exports verification
**Scale/Scope**: ~3 new source files (`src/catalog/{types.ts,catalog.ts,index.ts}`), ~7 edited source files (`src/messages/{types,messages,index}.ts`, `src/webhooks/{types,parser,handler,index}.ts`, `src/whatsapp.ts`, `src/index.ts`), ~5 edited config files (`package.json`, `tsup.config.ts`, `CLAUDE.md`, `README.md`, plus 1 new example), ~6 new or edited test files (`tests/catalog/catalog.test.ts`, `tests/messages/messages.test.ts` extensions, `tests/webhooks/parser.test.ts` extensions, `tests/webhooks/handler.test.ts` extensions, `tests/whatsapp.test.ts` extensions, `tests/exports/*` extensions). Estimated ~55 new test cases across ~11 catalog methods, 3 send methods, and the new webhook event path.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution status**: The project's `.specify/memory/constitution.md` is an unfilled template with placeholder principle names. There is no ratified constitution to gate against at this time.

**Fallback governance**: The authoritative project guide is `CLAUDE.md` at the repo root. This feature MUST comply with the rules encoded there:

| CLAUDE.md rule | Compliance status |
|---|---|
| Zero runtime dependencies | Uses only native `fetch`, `URL`, `URLSearchParams`. No new `dependencies` entries. |
| No `any` — use `unknown` and narrow | All new types use `interface` or `type` with `readonly` properties. `unknown` used only at parse boundaries (malformed JSON fallback for order line items). |
| No default exports | All new files use named exports only (barrel re-exports via `export { X } from './x.js'`). |
| Throw typed error classes, never plain `Error()` | Reuses `ValidationError` and `ApiError` from `src/errors/`. Adds one new typed error class, `ConflictError extends WhatsAppError`, for the strict-create duplicate-retailer-ID case (FR-019); no other new error classes required. |
| File naming: kebab-case | `src/catalog/catalog.ts`, `src/catalog/types.ts`, `src/catalog/index.ts` |
| All classes accept `HttpClient` via constructor injection | `Catalog` constructor takes `(client: HttpClient, businessAccountId: string)` mirroring `Templates` and `Flows` |
| API methods return `Promise<ApiResponse<T>>` or typed result | All `Catalog` methods return `Promise<ApiResponse<T>>`; new `Messages` methods return `Promise<ApiResponse<MessageResponse>>` |
| Methods with >2 params use a config object | `sendProduct(options)`, `sendProductList(options)`, `sendCatalogMessage(options)`, `createProduct(catalogId, request, requestOptions?)` |
| TSDoc on all public APIs with `@example` blocks | Will be enforced during implementation |
| Tests in `tests/` mirroring `src/` structure | Will be enforced: new `tests/catalog/` directory |
| NO network in unit tests — mock `fetch` / `HttpClient` | Will be enforced: use `vi.fn()` mock client |
| Don't hardcode API version — always use `config.apiVersion` | All calls route through `HttpClient` which already respects `apiVersion` |
| Don't `console.log` — use the configurable logger | The feature mandates *not* logging product attributes or order line items at all (FR-027); no new logger calls in commerce code paths |

**Gate result**: PASS. No violations. No entries needed in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/011-commerce-catalogs/
├── plan.md                    # This file (/speckit.plan output)
├── spec.md                    # Feature specification (from /speckit.specify + /speckit.clarify)
├── research.md                # Phase 0 output — research findings and decisions
├── data-model.md              # Phase 1 output — entity shapes and relationships
├── quickstart.md              # Phase 1 output — consumer-facing integration guide
├── contracts/                 # Phase 1 output — public API contracts
│   ├── catalog-class.md           # Catalog CRUD class public methods
│   ├── send-commerce.md           # Messages.sendProduct/sendProductList/sendCatalogMessage public contracts
│   ├── webhook-events.md          # OrderEvent + onOrder callback contract
│   └── public-exports.md          # Main barrel + subpath export + unified client getter
├── checklists/
│   └── requirements.md        # Spec quality checklist (from /speckit.specify)
└── tasks.md                   # Phase 2 output — NOT created by /speckit.plan
```

### Source Code (repository root)

```text
src/
├── catalog/                       # NEW — feature module
│   ├── types.ts                   # NEW — Product, Catalog, ProductAvailability, request/response types, CATALOG_VALIDATION (NOT MULTI_PRODUCT_LIMITS — that lives in src/messages/types.ts; NOT OrderItem — canonical in src/webhooks/types.ts)
│   ├── catalog.ts                 # NEW — Catalog class (listCatalogs, getCatalog, listProducts, getProduct, createProduct, upsertProduct, updateProduct, deleteProduct)
│   └── index.ts                   # NEW — barrel export
├── errors/
│   ├── errors.ts                  # EDIT — add ConflictError class (for strict createProduct on duplicate retailer ID)
│   └── index.ts                   # EDIT — re-export ConflictError
├── messages/
│   ├── types.ts                   # EDIT — add ProductMessageOptions, ProductListMessageOptions, CatalogMessageOptions, ProductSection, MULTI_PRODUCT_LIMITS, plus interactive sub-shapes (action.sections, action.catalog_id, etc.)
│   ├── messages.ts                # EDIT — add sendProduct(), sendProductList(), sendCatalogMessage() methods
│   └── index.ts                   # EDIT — export new option types
├── webhooks/
│   ├── types.ts                   # EDIT — add WebhookOrderPayload, OrderEvent, extend WebhookMessage union, extend WebhookEvent union, extend WebhookHandlerCallbacks with onOrder
│   ├── parser.ts                  # EDIT — divert messages[].type === 'order' to OrderEvent (parse product_items, surface raw)
│   ├── handler.ts                 # EDIT — add 'order' case to dispatch switch
│   └── index.ts                   # EDIT — re-export OrderEvent, WebhookOrderPayload
├── whatsapp.ts                    # EDIT — add lazy `catalog` getter
└── index.ts                       # EDIT — main barrel adds Catalog class and types

tests/
├── catalog/                       # NEW
│   └── catalog.test.ts            # NEW — ~32 unit tests for Catalog CRUD (list catalogs, list products, get, create strict, create-conflict, upsert (insert), upsert (update), update partial, delete, missing-WABA error, validation errors)
├── messages/
│   └── messages.test.ts           # EDIT — add sendProduct (~5), sendProductList (~6 incl. 30/10 limit validation), sendCatalogMessage (~4) test suites
├── webhooks/
│   ├── parser.test.ts             # EDIT — add order routing tests (~5 cases incl. malformed product_items)
│   └── handler.test.ts            # EDIT — add onOrder dispatch tests (~3 cases)
├── multi-account/
│   └── multi-account.test.ts      # EDIT — add one broadcast-with-product scenario (FR-009)
├── whatsapp.test.ts               # EDIT — add catalog lazy-init tests (~3 cases)
└── exports/
    └── subpath-exports.test.ts    # EDIT — add ./catalog subpath resolution test

examples/
└── commerce.ts                    # NEW — runnable example: list catalogs → list products → create/upsert/update/delete a product → send single product, multi-product, catalog message → handle incoming order

package.json                       # EDIT — add "./catalog" subpath export, bump version to 0.4.0
tsup.config.ts                     # EDIT — add "catalog/index": "src/catalog/index.ts" entry
CLAUDE.md                          # EDIT — add src/catalog/ to module structure, update Implemented status, add Catalog/Commerce endpoints to Meta API Reference
README.md                          # EDIT — add Commerce section with usage examples
```

**Structure Decision**: Single-project TypeScript library (Option 1 — default). The `src/catalog/` directory is a new peer of the existing `src/templates/` and `src/flows/` modules and follows the same internal structure (`types.ts` + class file + `index.ts` barrel). No services, models, CLI, or UI subdirectories — this is a zero-dependency library. All cross-cutting integrations (webhooks, unified client, subpath exports, new Messages methods) edit existing files in place rather than introducing new top-level directories. The module deliberately does NOT depend on `src/media/` per spec FR-028 (image hosting is consumer responsibility); product image URLs are passed through as opaque strings.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations — constitution unratified and all CLAUDE.md rules satisfied. Table intentionally empty.*
