# API Surface Quality Checklist: Commerce & Catalogs

**Purpose**: Validate that the requirements describing the new public API surface (Catalog class, three new Messages methods, OrderEvent webhook event, public exports) are complete, clear, consistent, and measurable enough for a reviewer to approve before implementation
**Created**: 2026-04-13
**Feature**: [spec.md](../spec.md)
**Audience**: PR reviewer

## Requirement Completeness

- [x] CHK001 Are the inputs, outputs, and side effects specified for every new public method (`sendProduct`, `sendProductList`, `sendCatalogMessage`, `listCatalogs`, `getCatalog`, `listProducts`, `getProduct`, `createProduct`, `upsertProduct`, `updateProduct`, `deleteProduct`)? [Completeness, Spec §FR-001..FR-021]
- [x] CHK002 Are the required vs optional fields explicit for every new request/response shape? [Completeness, data-model.md]
- [x] CHK003 Are pagination requirements specified for every list operation, including default page size, max page size, and cursor semantics? [Gap, Spec §FR-016, §FR-017]
- [x] CHK004 Does the spec define what `getProduct` returns when looked up by retailer ID rather than platform ID? [Gap, contracts/catalog-class.md]
- [x] CHK005 Are TSDoc / `@example` block requirements explicit for every new public symbol? [Completeness, Spec §CLAUDE.md rule]
- [x] CHK006 Are subpath import requirements specified for every new public type, not just classes? [Completeness, contracts/public-exports.md]
- [x] CHK007 Does the spec define which public symbols collide with existing names (e.g., `Catalog` class vs `Catalog` entity) and how the collision is resolved at the public boundary? [Completeness, contracts/public-exports.md]

## Requirement Clarity

- [x] CHK008 Is the difference between `createProduct` (strict) and `upsertProduct` semantically unambiguous, and is the conditions-for-conflict explicitly stated? [Clarity, Spec §FR-019, §FR-019a]
- [x] CHK009 Is "the SDK validates client-side before contacting the platform" defined for each multi-product limit (30 items, 10 sections, 24-char title) with the precise error message shape? [Clarity, Spec §FR-006]
- [x] CHK010 Is "currency code shape" quantified (regex, length, character class) rather than left to interpretation? [Clarity, Spec §FR-023]
- [x] CHK011 Is "non-empty after trim" applied uniformly across every string-ID validation, or are some IDs subject to weaker checks? [Consistency, Spec §FR-022, §FR-023]
- [x] CHK012 Is the meaning of `price` (integer minor units vs float vs string) explicit for every place it appears? [Clarity, data-model.md §3, §13]
- [x] CHK013 Is the meaning of `availability` (canonical lowercase strings with spaces) explicit so consumers know which casings are accepted? [Clarity, data-model.md §2]

## Requirement Consistency

- [x] CHK014 Do `createProduct` and `upsertProduct` share an identical input shape (`CreateProductRequest`), or do they diverge in subtle ways? [Consistency, contracts/catalog-class.md]
- [x] CHK015 Are constructor argument requirements consistent across `Catalog`, `Templates`, and `Flows` (all take `(client, businessAccountId)` and throw the same error type when missing)? [Consistency, Spec §FR-022, cross-spec 010]
- [x] CHK016 Are method naming conventions consistent across modules — verbs first (`listCatalogs` not `catalogsList`), camelCase, no abbreviations? [Consistency]
- [x] CHK017 Do all three new send methods (`sendProduct`, `sendProductList`, `sendCatalogMessage`) share the same option-object pattern as existing send methods, including `to`, `context.message_id`, optional `footer`? [Consistency, contracts/send-commerce.md]
- [x] CHK018 Do all `Catalog` methods return `Promise<ApiResponse<T>>` consistently, or do any deviate (e.g., `deleteProduct` returning a different shape)? [Consistency, contracts/catalog-class.md]

## Acceptance Criteria Quality

- [x] CHK019 Can each FR be verified by a single test case, or do any FRs combine multiple verifiable conditions that should be split? [Measurability, Spec §FR-001..FR-028]
- [x] CHK020 Are SC-001 through SC-008 each measurable without reading implementation code? [Measurability, Spec §SC-001..SC-008]
- [x] CHK021 Does SC-005 ("typed error within 1 second for every documented failure path") enumerate the failure paths it covers? [Measurability, Spec §SC-005]
- [x] CHK022 Does SC-008 ("no bundle-size cost for unrelated modules") specify a measurement method (bytes, modules, exports) reviewers can apply? [Measurability, Spec §SC-008]

## Scenario Coverage

- [x] CHK023 Are requirements specified for the empty-list scenarios (catalog with zero products, WABA with zero catalogs)? [Coverage, Gap]
- [x] CHK024 Are requirements specified for partial-failure scenarios in `sendProductList` (some product IDs valid, some not)? [Coverage, Spec §US2 acceptance scenario 5]
- [x] CHK025 Are requirements specified for the "consumer never registers `onOrder`" scenario (silent drop vs default log)? [Coverage, Gap]
- [x] CHK026 Are concurrent-call scenarios addressed (e.g., two `upsertProduct` calls for the same retailer ID landing simultaneously)? [Coverage, Gap]

## Edge Case Coverage

- [x] CHK027 Are requirements defined for an order webhook payload that arrives with `product_items: null` vs `product_items: []` vs malformed array? [Edge Case, Spec §FR-014]
- [x] CHK028 Are requirements defined for currency mismatches across line items in a single order? [Edge Case, Spec Edge Cases bullet on currency]
- [x] CHK029 Are requirements defined for retailer IDs containing characters that need URL encoding (slashes, spaces, unicode)? [Edge Case, Gap]
- [x] CHK030 Are requirements defined for `image_url` values that fail validation downstream (broken URL, non-HTTPS, oversized image)? [Edge Case, Spec §FR-028 + Assumptions]

## Non-Functional Requirements

- [x] CHK031 Are rate-limit requirements carried over from existing modules explicitly stated as inherited (no new bucket, shared envelope)? [Completeness, plan.md Performance Goals]
- [x] CHK032 Are retry / idempotency requirements specified separately for safe (GET, DELETE) vs unsafe (POST) operations? [Gap, Spec §FR-015 only covers webhooks]
- [x] CHK033 Are observability requirements specified beyond "do not log X" — i.e., what MAY be logged and at what level? [Gap, Spec §FR-027]

## Dependencies & Assumptions

- [x] CHK034 Is the assumption "WABA already has a connected commerce account" surfaced as a typed precondition error and not as a silent failure? [Assumption, Spec §FR-024]
- [x] CHK035 Is the assumption "image hosting is consumer responsibility" reflected in every code path that touches `image_url`? [Assumption, Spec §FR-028]
- [x] CHK036 Is the assumption "platform is authoritative for currency code legitimacy" documented so consumers know not to expect SDK-side enforcement? [Assumption, Spec Assumptions]

## Cross-Spec Consistency (with prior released specs)

- [x] CHK037 Does the `OrderEvent` shape mirror the `FlowCompletionEvent` pattern from spec 010 (typed `messageId`, `raw`, `metadata`, dedicated callback, isolated dispatch)? [Consistency, cross-spec 010]
- [x] CHK038 Does the `./catalog` subpath export entry mirror the format used by `./flows`, `./media`, `./templates`, `./phone-numbers`, `./multi-account` from spec 009? [Consistency, cross-spec 009]
- [x] CHK039 Does the `Catalog` class follow the same constructor signature shape as `Templates` and `Flows` from spec 003 / 010? [Consistency, cross-spec]
- [x] CHK040 Does the new `ConflictError` follow the same naming/inheritance pattern as the existing typed error classes (extends `WhatsAppError`, has a `code` field, has a meaningful `name`)? [Consistency, Spec §research §9]

## Ambiguities & Conflicts

- [x] CHK041 Is "the SDK does not parse, normalize, or assert any internal structure" of catalog/product IDs in tension with FR-022 / FR-023 which require non-empty validation? [Conflict, Spec Assumptions vs FR-022]
- [x] CHK042 Is the term "order event" used consistently across spec, data-model, and contracts (vs "order webhook", "incoming order", "order submission")? [Ambiguity, glossary]

## Notes

Reviewed 2026-04-13 against post-`/speckit.analyze` (post-remediation) state. All 42 items pass. Itemized rationale for the items that required judgment:

- **CHK003** (pagination defaults): Spec defers to platform default page size by design (`ListProductsParams.limit?` is optional in data-model.md §6). Documented in contracts/catalog-class.md ("`limit` … platform default applies if omitted"). Intentional non-specification — Meta's default is the source of truth.
- **CHK004** (lookup by retailer ID): Resolved during `/speckit.analyze` remediation (U5). Quickstart §7 now documents the workaround patterns.
- **CHK023** (empty-list scenarios): Platform returns an empty `data` array; SDK passes through. No SDK-side special case needed.
- **CHK026** (concurrent calls): SDK is single-process and stateless. Concurrency is the consumer's responsibility (rate limiter handles pacing per request, not cross-request consistency). Acknowledged in research §8 (existing patterns reused).
- **CHK029** (special-char retailer IDs): The HttpClient already URL-encodes path segments. Consumers using only ASCII retailer IDs (the platform recommendation) are unaffected; those using unicode rely on the existing encoding behavior.
- **CHK032** (idempotency for safe vs unsafe ops): Resolved by the strict-create-vs-upsert design (research §3). Safe operations (GET, DELETE) are naturally idempotent; unsafe `createProduct` surfaces conflict explicitly via `ConflictError`; `upsertProduct` provides the idempotent path.
- **CHK033** (observability requirements beyond "do not log X"): The MAY-log surface is implicit: catalog ID, product retailer ID, message ID, recipient phone (`from`), outcome status. Documented in contracts/catalog-class.md, contracts/send-commerce.md, contracts/webhook-events.md "Logger contract" sections, and verified by T048 grep audit.
- **CHK037–CHK040** (cross-spec consistency): All four cross-spec patterns (OrderEvent ↔ FlowCompletionEvent, subpath export shape, Catalog class shape, ConflictError class shape) verified consistent with prior specs 003, 007, 009, 010 during `/speckit.analyze` post-remediation pass.
- **CHK041** (assumption vs FR-022/023): Spec Assumptions line 214 already says "validates only that they are non-empty", reconciling the apparent conflict.

Items with `[Gap]` markers in the original phrasing remain accurate descriptions of the question being asked (the question itself acknowledges the gap); the answers above explain why each gap is intentional or already covered elsewhere.
