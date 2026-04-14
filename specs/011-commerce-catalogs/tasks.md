---
description: "Task list for Commerce & Catalogs (011-commerce-catalogs)"
---

# Tasks: Commerce & Catalogs

**Input**: Design documents from `/specs/011-commerce-catalogs/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Branch**: `011-commerce-catalogs`

## Commit workflow (non-negotiable)

After completing each task below, run `/gen-commit-msg` and create **one commit** that contains only that task's changes. The commit message MUST NOT include the `Co-Authored-By: Claude …` footer. Tasks are sized deliberately so that one task == one atomic commit. Tasks labeled `[verify]` produce no commit — they are quality gates between commits.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`, `[US2]`, `[US3]`, `[US4]`, `[US5]` — maps to user stories in spec.md
- **[verify]**: Verification-only task (no commit, no code change)
- All file paths are rooted at the repo root `/Users/amn/Documents/Projects/SDK/wa-cloud-sdk/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new setup — branch `011-commerce-catalogs` is already checked out, specs are in place, scripts run.

- [ ] T001 [verify] Confirm working branch is `011-commerce-catalogs`, working tree is clean, and `specs/011-commerce-catalogs/{spec.md,plan.md,research.md,data-model.md,contracts/,quickstart.md,checklists/}` all exist (use `git status` and `ls`)

**Checkpoint**: Ready to begin foundational work. No commit produced.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the new `ConflictError` typed error class. Required by US5 (strict `createProduct`); no other US depends on it. Placed in foundational because it's a cross-cutting addition to the existing `errors` module rather than a story-local artifact.

- [ ] T002 Add `ConflictError extends WhatsAppError` class to `src/errors/errors.ts` with `code: 'CONFLICT'`, optional `resource` field, and TSDoc with `@example`. Follows shape documented in `specs/011-commerce-catalogs/research.md §9` and `specs/011-commerce-catalogs/data-model.md §17`.
- [ ] T003 Re-export `ConflictError` from `src/errors/index.ts` AND from main `src/index.ts` barrel.
- [ ] T004 Add `ConflictError` unit tests to `tests/errors/errors.test.ts` (instanceof checks, name field, code field, message preservation, optional resource field).

**Checkpoint**: Foundation ready — user story implementation can now begin in priority order.

---

## Phase 3: User Story 1 — Send a Single Product Message (Priority: P1) 🎯 MVP

**Goal**: A consumer can call `messages.sendProduct({ to, catalogId, productRetailerId, body?, footer?, context? })` and deliver a single-product interactive message to a recipient. Multi-account broadcast with `sendProduct` is documented and tested per FR-009 / US1 acceptance scenario 5.

**Independent Test**: Mock `HttpClient.post`, call `messages.sendProduct(...)`, and assert the exact JSON payload shape sent to `{phoneNumberId}/messages` matches the contract in `contracts/send-commerce.md`. Verify body, footer, context, and validation error paths. Separately, exercise `WhatsAppMultiAccount.broadcast()` with a factory that calls `sendProduct` across two mock accounts using a per-account `catalogIdMap`.

### Implementation for User Story 1

- [ ] T005 [US1] Add `ProductMessageOptions` interface to `src/messages/types.ts` (extends `BaseMessageOptions`; fields: `to`, `catalogId`, `productRetailerId`, `body?`, `footer?`, `context?`). Shape per `specs/011-commerce-catalogs/data-model.md §10` and `specs/011-commerce-catalogs/contracts/send-commerce.md`.
- [ ] T006 [US1] Re-export `ProductMessageOptions` type from `src/messages/index.ts` AND from main `src/index.ts` barrel.
- [ ] T007 [US1] Add `sendProduct(options, requestOptions?)` method to `src/messages/messages.ts`. Validate `to` (E.164), `catalogId` (non-empty), `productRetailerId` (non-empty) — throw `ValidationError` on failure. Reuse `buildBasePayload()` and `buildInteractiveOptionals()`. Emit JSON payload exactly as documented in `specs/011-commerce-catalogs/contracts/send-commerce.md §sendProduct`. Include TSDoc with `@example`. MUST NOT call `logger.*` with the body, footer, catalogId attribute values, or productRetailerId beyond minimal entry/exit signal.
- [ ] T008 [US1] Add `sendProduct` unit test suite to `tests/messages/messages.test.ts` (≥6 tests): minimal payload (no body, no footer), with body, with footer, with `context.message_id` reply-to, validation error on empty `catalogId`, validation error on empty `productRetailerId`, validation error on bad recipient phone. Follow mock pattern from existing `sendInteractiveCta` test suite.
- [ ] T009 [US1] Add broadcast-with-product scenario test to `tests/multi-account/multi-account.test.ts` — a factory that calls `messages.sendProduct` across two mock accounts with per-account `catalogIdMap`. Assert each recipient receives the correct per-account `catalog_id` on the wire. Satisfies FR-009 and US1 acceptance scenario 5.
- [ ] T010 [US1] [verify] Run `pnpm typecheck && pnpm lint && pnpm test -- tests/messages tests/multi-account` — must pass with zero errors. No commit.

**Checkpoint**: User Story 1 is fully functional and demo-ready as MVP. A consumer can send single-product messages directly or via multi-account broadcast.

---

## Phase 4: User Story 2 — Send a Multi-Product Message (Priority: P2)

**Goal**: A consumer can call `messages.sendProductList({ to, catalogId, header, body, footer?, sections, context? })` and deliver a curated multi-section product list to a recipient, with client-side validation of the 30-item / 10-section / 24-char-title limits before any API call.

**Independent Test**: Mock `HttpClient.post`, call `messages.sendProductList(...)` with a valid two-section payload and assert wire shape per `contracts/send-commerce.md §sendProductList`. Then call with 31 total items / 11 sections / 25-char title and assert `ValidationError` thrown BEFORE any network call (verify `HttpClient.post` was never invoked).

### Implementation for User Story 2

- [ ] T011 [US2] Add `ProductSection` interface, `ProductListMessageOptions` interface, and `MULTI_PRODUCT_LIMITS` const (`MAX_SECTIONS: 10`, `MAX_TOTAL_ITEMS: 30`, `MAX_SECTION_TITLE_LENGTH: 24`) to `src/messages/types.ts`. Shape per `specs/011-commerce-catalogs/data-model.md §9, §11, §16`.
- [ ] T012 [US2] Re-export `ProductSection`, `ProductListMessageOptions`, `MULTI_PRODUCT_LIMITS` from `src/messages/index.ts` AND main `src/index.ts` barrel.
- [ ] T013 [US2] Add `sendProductList(options, requestOptions?)` method to `src/messages/messages.ts`. Client-side validation in this order: E.164 `to`, non-empty `catalogId`, non-empty `header`, non-empty `body`, `sections.length` ∈ [1, 10], total items across sections ∈ [1, 30], each section `title` ∈ [1..24] chars, each section `product_items.length` ≥ 1, each `product_retailer_id` non-empty. Each `ValidationError` message MUST identify the specific limit breached. Emit JSON payload per `specs/011-commerce-catalogs/contracts/send-commerce.md §sendProductList`. Include TSDoc with `@example`. Logger guard same as T007.
- [ ] T014 [US2] Add `sendProductList` unit test suite to `tests/messages/messages.test.ts` (≥8 tests): minimal valid (1 section, 1 item), maximum valid (10 sections × 3 items = 30 total), with footer + context, validation: 0 sections, validation: 11 sections, validation: 31 items split across valid section count, validation: empty section title, validation: 25-char section title, validation: empty `product_retailer_id`. For every validation case assert `HttpClient.post` was NOT called.
- [ ] T015 [US2] [verify] Run `pnpm typecheck && pnpm lint && pnpm test -- tests/messages` — must pass. No commit.

**Checkpoint**: User Story 2 is fully functional. Consumers can send curated product lists with full client-side limit enforcement.

---

## Phase 5: User Story 3 — Receive Order Notifications from Customers (Priority: P3)

**Goal**: When the platform delivers a `messages[].type === 'order'` webhook, the SDK surfaces it as a dedicated typed `OrderEvent` to a registered `onOrder(event)` callback. The general `onMessage` callback MUST NOT receive order events. Consumers receive a stable `messageId` for idempotency. Malformed `product_items` arrays surface with `items: []` and `raw` preserved; webhook processing does not halt.

**Independent Test**: Build a synthetic webhook payload with one well-formed order event, invoke `parser.parseWebhook(payload)`, assert exactly one `OrderEvent` is returned with the documented shape. Build a payload mixing one order event with one text message, register both `onOrder` and `onMessage`, dispatch via the handler, assert `onOrder` fires once for the order, `onMessage` fires once for the text, no cross-talk. Build a payload with malformed `product_items` (missing required field) and assert the event still surfaces with `items: []` and `raw` preserved.

### Implementation for User Story 3

- [ ] T016 [US3] Add `WebhookOrderPayload`, `OrderItem`, and `OrderEvent` interfaces to `src/webhooks/types.ts`. Extend `WebhookMessage` union to include the `order` shape. Extend `WebhookEvent` union with the new event. Extend `WebhookHandlerCallbacks` interface with `onOrder?: (event: OrderEvent) => void | Promise<void>`. Shapes per `specs/011-commerce-catalogs/data-model.md §13, §14, §15` and `specs/011-commerce-catalogs/contracts/webhook-events.md`.
- [ ] T017 [US3] Update `src/webhooks/parser.ts` to detect `messages[i].type === 'order'` and emit an `OrderEvent` instead of routing through the generic message path. Best-effort parse `messages[i].order.product_items` into `OrderItem[]`; on any parse failure set `items: []` and continue. Always set `raw` to `JSON.stringify(messages[i].order)`. Resolve `contact` and `metadata` using existing helpers. MUST NOT log `items` or `raw` at any logger level — only `messageId` and `from` at debug.
- [ ] T018 [US3] Update `src/webhooks/handler.ts` dispatch switch to add an `'order'` case that invokes `callbacks.onOrder` and returns (mirrors the existing `'flow_completion'` branch). Order events MUST NOT fall through to the `onMessage` handler.
- [ ] T019 [US3] Add `onOrder(callback)` registration method to the `Webhooks` wrapper class in `src/webhooks/webhooks.ts`, following the same lazy-init pattern as `onFlowCompletion`.
- [ ] T020 [US3] Re-export `OrderEvent` and `WebhookOrderPayload` from `src/webhooks/index.ts` AND main `src/index.ts` barrel.
- [ ] T021 [US3] Add order-parsing test suite to `tests/webhooks/parser.test.ts` (≥6 tests): well-formed order with one item, well-formed order with multiple items, order with `text` field, order with `product_items: null` → `items: []` + `raw` preserved, order with malformed item (missing `quantity`) → `items: []` + `raw` preserved, mixed batch (order + text message) → both surface independently.
- [ ] T022 [US3] Add `onOrder` dispatch test suite to `tests/webhooks/handler.test.ts` (≥4 tests): order event with only `onOrder` registered → fires once, order event with both `onOrder` and `onMessage` registered → only `onOrder` fires (assert `onMessage` was never called), order event with no callback registered → no throw, async `onOrder` callback awaited correctly.
- [ ] T023 [US3] [verify] Run `pnpm typecheck && pnpm lint && pnpm test -- tests/webhooks` — must pass. No commit.

**Checkpoint**: User Story 3 is fully functional. Consumers can receive structured order events without any cross-talk with regular message handlers.

---

## Phase 6: User Story 4 — Send a Catalog Message (Priority: P4)

**Goal**: A consumer can call `messages.sendCatalogMessage({ to, body, footer?, thumbnailProductRetailerId?, context? })` and deliver a "browse the catalog" invitation to a recipient.

**Independent Test**: Mock `HttpClient.post`, call `messages.sendCatalogMessage(...)`, assert wire shape per `contracts/send-commerce.md §sendCatalogMessage` for both the with-thumbnail and without-thumbnail paths.

### Implementation for User Story 4

- [ ] T024 [US4] Add `CatalogMessageOptions` interface to `src/messages/types.ts`. Shape per `specs/011-commerce-catalogs/data-model.md §12`.
- [ ] T025 [US4] Re-export `CatalogMessageOptions` from `src/messages/index.ts` AND main `src/index.ts` barrel.
- [ ] T026 [US4] Add `sendCatalogMessage(options, requestOptions?)` method to `src/messages/messages.ts`. Validate `to` (E.164), `body` (non-empty), and `thumbnailProductRetailerId` (non-empty if present) — throw `ValidationError` on failure. Emit JSON payload per `specs/011-commerce-catalogs/contracts/send-commerce.md §sendCatalogMessage` with `parameters` object present iff `thumbnailProductRetailerId` provided. Include TSDoc with `@example`. Logger guard same as T007.
- [ ] T027 [US4] Add `sendCatalogMessage` unit test suite to `tests/messages/messages.test.ts` (≥5 tests): minimal (no thumbnail, no footer), with thumbnail, with footer, with context reply-to, validation error on empty body.
- [ ] T028 [US4] [verify] Run `pnpm typecheck && pnpm lint && pnpm test -- tests/messages` — must pass. No commit.

**Checkpoint**: User Story 4 is fully functional. Consumers can send catalog browse invitations.

---

## Phase 7: User Story 5 — Programmatically Manage the Product Catalog (Priority: P5)

**Goal**: A consumer can list catalogs, list products, fetch a product, strict-create a product (fails with `ConflictError` on duplicate retailer ID), upsert a product, partially update a product, and delete a product — all from code, with client-side validation and typed errors.

**Independent Test**: Mock `HttpClient.{get,post,delete}`, instantiate `new Catalog(client, 'WABA_ID')`, call each method and assert the exact REST path, query string, and body match `specs/011-commerce-catalogs/contracts/catalog-class.md`. Verify `ConflictError` is thrown on the strict-create path when the platform returns the duplicate-retailer-ID error code, and is NOT thrown by `upsertProduct`.

### Implementation for User Story 5

- [ ] T029 [US5] Create `src/catalog/types.ts` with `Catalog`, `Product`, `ProductAvailability`, `CreateProductRequest`, `UpdateProductRequest`, `ListProductsParams`, `ListProductsResponse`, `ListCatalogsResponse`, and `CATALOG_VALIDATION` const (`CURRENCY_PATTERN: /^[A-Z]{3}$/`). All fields `readonly`. **Do NOT define `OrderItem` here** — it is canonical in `src/webhooks/types.ts` (T016). **Do NOT define `MULTI_PRODUCT_LIMITS` or `ProductSection` here** — they live in `src/messages/types.ts` (T011). Shapes per `specs/011-commerce-catalogs/data-model.md §1–§8, §16`.
- [ ] T030 [US5] Create `src/catalog/catalog.ts` with the `Catalog` class. Constructor `(client: HttpClient, businessAccountId: string)` — throws `ValidationError` on empty `businessAccountId`. Implement methods in this order with TSDoc + `@example` on each: `listCatalogs(params?, requestOptions?)`, `getCatalog(catalogId, fields?, requestOptions?)`, `listProducts(catalogId, params?, requestOptions?)`, `getProduct(productId, fields?, requestOptions?)`, `createProduct(catalogId, request, requestOptions?)` (strict — maps Meta duplicate-retailer-ID error to `ConflictError`), `upsertProduct(catalogId, request, requestOptions?)` (POST with `?retailer_id={id}` query), `updateProduct(productId, updates, requestOptions?)` (rejects empty update), `deleteProduct(productId, requestOptions?)`. Client-side validation per `specs/011-commerce-catalogs/contracts/catalog-class.md`. MUST NOT log product attributes or update bodies — only IDs and outcome status.
- [ ] T031 [US5] Create `src/catalog/index.ts` barrel exporting the `Catalog` class and all types/constants from `./types.js` (named exports only; entity `Catalog` re-exported as `CatalogResource` to disambiguate from the class). See `specs/011-commerce-catalogs/contracts/public-exports.md §Module barrel`.
- [ ] T032 [US5] Add `"./catalog"` subpath export to `package.json` (mirrors existing `"./templates"`, `"./flows"` entries; targets `dist/catalog/index.{d.ts,mjs,js}`). See `specs/011-commerce-catalogs/contracts/public-exports.md §Subpath export`.
- [ ] T033 [US5] Add `"catalog/index": "src/catalog/index.ts"` entry to `tsup.config.ts` `entry` map. Confirm dist artifact paths match the subpath export.
- [ ] T034 [US5] Re-export `Catalog` (class), `CatalogResource` (type alias), `Product`, `ProductAvailability`, `CreateProductRequest`, `UpdateProductRequest`, `ListProductsParams`, `ListProductsResponse`, `ListCatalogsResponse`, `CATALOG_VALIDATION` from main `src/index.ts` barrel.
- [ ] T035 [US5] Add lazy `catalog` getter to `src/whatsapp.ts` (mirrors the existing `templates` and `flows` getters). Reuse the existing `requireBusinessAccountId()` private helper. Cache the instance in `_catalog`. No new helper extraction needed.
- [ ] T036 [US5] Create `tests/catalog/catalog.test.ts` with comprehensive unit suite (≥30 tests): constructor validation (empty WABA throws), `listCatalogs` (default + paginated), `getCatalog` (with default and custom fields), `listProducts` (default + paginated), `getProduct`, `createProduct` (success path), `createProduct` strict throws `ConflictError` when platform returns duplicate-retailer-ID error, `upsertProduct` (insert path → calls POST with `?retailer_id=`), `upsertProduct` (update-in-place path), `updateProduct` partial update, `updateProduct` empty-object validation error, `deleteProduct`, validation errors for empty IDs, validation errors for missing required fields (`name`, `retailer_id`, no `image_url` and no `url`), validation errors for bad currency (`'usd'` → fails, `'USDX'` → fails), missing-WABA constructor error, ApiError pass-through for non-conflict platform errors. Use the same mock-`HttpClient` pattern as `tests/templates/templates.test.ts`.
- [ ] T037 [US5] Add catalog lazy-init test suite to `tests/whatsapp.test.ts` (≥3 tests): `wa.catalog` returns same instance on repeated access (memoized), `wa.catalog` throws `ValidationError` when `businessAccountId` was not configured, `wa.catalog` instantiates only on first access (lazy).
- [ ] T038 [US5] Add `./catalog` subpath resolution test to `tests/subpath-exports.test.ts` (≥2 tests): `import { Catalog } from '@abdelrahmannasr-wa/cloud-api/catalog'` resolves to a constructor; `import * as catalogMod` exposes the documented key list (`Catalog`, `CatalogResource`, `Product`, `ProductAvailability`, `CreateProductRequest`, `UpdateProductRequest`, `ListProductsParams`, `ListProductsResponse`, `ListCatalogsResponse`, `CATALOG_VALIDATION`).
- [ ] T039 [US5] [verify] Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` — must pass with zero errors and the dist artifact must include `dist/catalog/index.{mjs,js,d.ts}`. Then verify FR-028 module isolation: `grep -rE "from ['\"]\\.\\.\\/media" src/catalog/` MUST return no matches (commerce module MUST NOT depend on the media module). No commit.

**Checkpoint**: User Story 5 is fully functional. Consumers can manage their product catalog programmatically. All 5 user stories now ship.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Runnable examples (one per user story per SC-006), documentation, version bump, requirement-audit gates, final coverage and regression verification.

- [ ] T040 [P] Create `examples/commerce-send-product.ts` — runnable example for US1: configure `WhatsApp`, send a single-product message with body + footer, log the resulting message ID. Append a multi-account broadcast snippet at the bottom showing the per-account `catalogIdMap` pattern.
- [ ] T041 [P] Create `examples/commerce-send-product-list.ts` — runnable example for US2: build 2 sections × 3 items (well under limits), send a multi-product message. Add a commented-out 31-item snippet demonstrating the client-side `ValidationError` path.
- [ ] T042 [P] Create `examples/commerce-on-order.ts` — runnable example for US3: register `onOrder`, mount the Express middleware via `wa.webhooks.express()`, log a parsed `OrderEvent`, demonstrate using `event.messageId` as a dedup key in a stub persistence call, reply to the customer with `wa.messages.sendText`.
- [ ] T043 [P] Create `examples/commerce-send-catalog.ts` — runnable example for US4: send a catalog invitation with body, footer, and `thumbnailProductRetailerId`.
- [ ] T044 [P] Create `examples/commerce-catalog-crud.ts` — runnable example for US5: list catalogs, list products with pagination, strict-create a product (with `ConflictError` catch demonstrating the fall-through to `upsertProduct`), upsert a product, partial update (price only), delete, list to confirm removal.
- [ ] T045 [P] Update `CLAUDE.md`: add `src/catalog/` to module structure (following the same depth as `src/flows/`), update Implemented status line to include catalog (list, get, create, upsert, update, delete + commerce send methods + onOrder), append `Catalog/Commerce` endpoints to Meta API Reference section, add `011-commerce-catalogs` line to Recent Changes footer.
- [ ] T046 [P] Update `README.md`: add a `## Commerce & Catalogs` section with subsections covering each user story (single product send, multi-product send, catalog message, order webhook handling, catalog CRUD). Mirror the structure used for the `## Flows` section added by spec 010. Surface the documented out-of-scope items (no bulk operations, no order-status messages, image hosting is consumer responsibility) prominently in a "Limitations" subsection.
- [ ] T047 Bump `package.json` `version` to `0.4.0` (additive minor — no breaking changes).
- [ ] T048 [verify] FR-027 logging audit. Run `grep -nE "logger\.(debug|info|warn|error|trace)" src/catalog/*.ts src/messages/messages.ts src/webhooks/parser.ts src/webhooks/handler.ts src/webhooks/webhooks.ts` and inspect every match. Confirm NO logger call passes any of: a `Product` body, a `CreateProductRequest` / `UpdateProductRequest` body, an `OrderEvent.items` array, an `OrderEvent.raw` payload, or any individual product attribute (`name`, `description`, `price`, `image_url`). Logger calls MAY pass: catalog ID, product retailer ID, `messageId`, `from` phone, outcome status. Document any intentional exception inline. No commit.
- [ ] T049 [verify] SC-008 bundle-size diff. (a) `git stash` the working changes, run `pnpm clean && pnpm build`, record the byte sizes of `dist/messages/index.mjs` and `dist/index.mjs` (call these `pre_messages` and `pre_main`); (b) `git stash pop`, rerun `pnpm clean && pnpm build`, record the new sizes (`post_messages`, `post_main`); (c) confirm `post_messages == pre_messages` (the messages-only entry MUST NOT grow from this feature beyond the new send-method additions, which add to its own bundle, not to consumers using only existing methods); (d) confirm `post_main` growth approximates the sum of new module weights (no duplicated code from re-exports). Document the measured numbers in the verify-task output for the PR description. No commit.
- [ ] T050 [verify] Final pass: run `pnpm clean && pnpm build && pnpm typecheck && pnpm lint && pnpm format:check && pnpm test:coverage`. Confirm: all checks pass; coverage thresholds met (≥80% lines/functions/branches/statements project-wide AND on the new `src/catalog/`); `dist/` contains the new subpath artifacts; existing test count plus all new tests pass; no regressions in the 410+ existing tests. No commit.

**Checkpoint**: Feature complete. Branch is merge-ready.

---

## Dependencies & Story Completion Order

```text
Phase 1 (Setup) — T001 [verify]
   │
   ▼
Phase 2 (Foundational) — T002 → T003 → T004
   │
   ▼
Phase 3 (US1, P1 MVP) — T005 → T006 → T007 → T008 → T009 → T010 [verify]
   │
   ▼  (US1 ships as MVP; following stories add more)
Phase 4 (US2, P2) — T011 → T012 → T013 → T014 → T015 [verify]
   │
   ▼
Phase 5 (US3, P3) — T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023 [verify]
   │
   ▼
Phase 6 (US4, P4) — T024 → T025 → T026 → T027 → T028 [verify]
   │
   ▼
Phase 7 (US5, P5) — T029 → T030 → T031 → T032 → T033 → T034 → T035 → T036 → T037 → T038 → T039 [verify]
   │
   ▼
Phase 8 (Polish) — T040 ∥ T041 ∥ T042 ∥ T043 ∥ T044 ∥ T045 ∥ T046 → T047 → T048 [verify] → T049 [verify] → T050 [verify]
```

**Inter-story independence**: US1, US2, US3, and US4 are fully independent of each other (they touch different files within `src/messages/` for US1/US2/US4 and different files entirely for US3). They could be parallelized after Phase 2, but the priority order delivers MVP-first incremental value. US5 is independent of US1–US4 and could be implemented first if catalog-management is the consumer's primary need; the priority order matches the spec's value ranking.

**Foundational dependency**: Only US5 strictly needs T002–T004 (`ConflictError`); other stories don't import it. T002–T004 are sequenced in Phase 2 so US5 can later run cleanly without retroactive dependency injection.

## Parallel Execution Opportunities

- Within Phase 8: T040–T044 (five independent example files), T045 (CLAUDE.md), T046 (README) are all file-disjoint and can be drafted in parallel.
- Across phases: Once Phase 2 completes, US1 / US2 / US4 (all in `src/messages/messages.ts`) cannot run truly in parallel because they edit the same file; however US3 (in `src/webhooks/`) and US5 (in `src/catalog/`) are file-disjoint from US1/US2/US4 and could be developed by separate contributors after Phase 2.
- All `[verify]` gates are sequential (they certify the cumulative state).

## Implementation Strategy

**MVP scope**: Phases 1–3 (T001–T010). After T010 ships, a consumer can use `wa.messages.sendProduct(...)` end-to-end and the multi-account broadcast factory works with it. This is the minimum demonstrable feature.

**Incremental delivery order** (each phase ships independent value):
1. MVP (US1): single-product send + broadcast — most common commerce trigger
2. + US2: curated multi-product list — the comparison-shopping flow
3. + US3: order webhook receive — close the round-trip
4. + US4: catalog message — discovery flow
5. + US5: programmatic catalog management — automation for platform builders

If the team needs to ship something before all 5 stories complete, any subset that includes US1 is a viable v0.4.0-beta release. Polish phase (T040–T050) MUST run before tagging v0.4.0 final, including the FR-027 logging audit (T048) and the SC-008 bundle-size diff (T049).

## Independent Test Criteria Summary

| Story | Independent test |
|---|---|
| US1 | Mock `HttpClient.post`; assert `sendProduct` payload shape; assert broadcast factory delivers per-account `catalog_id` |
| US2 | Mock `HttpClient.post`; assert valid payload shape; assert validation throws BEFORE network for every limit breach |
| US3 | Synthetic webhook payloads; assert `OrderEvent` surfaces; assert `onOrder` and `onMessage` isolation; assert malformed `product_items` → `items: []` + `raw` preserved |
| US4 | Mock `HttpClient.post`; assert `sendCatalogMessage` payload for with/without thumbnail paths |
| US5 | Mock `HttpClient.{get,post,delete}`; assert REST shape for every method; assert `ConflictError` on strict-create duplicate; assert `upsertProduct` uses `?retailer_id=` query |

## Validation note

Format check: every task line above starts with `- [ ]`, has a sequential `T###` ID, has `[Story]` label on Phase 3–7 tasks, has no `[Story]` label on Phase 1/2/8 tasks, includes a concrete file path or verification command, and references the contract / data-model section that defines the work.
