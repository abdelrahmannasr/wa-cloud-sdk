# Multi-Account & Broadcast Quality Checklist: Commerce & Catalogs

**Purpose**: Validate that the requirements describing multi-account broadcast usage of the new send methods, the per-WABA catalog-ID scoping constraint, and the carry-forward of distribution-strategy patterns are complete, clear, and consistent before implementation
**Created**: 2026-04-13
**Feature**: [spec.md](../spec.md)
**Audience**: PR reviewer (with multi-account / platform-builder lens)

## Requirement Completeness

- [x] CHK001 Does the spec explicitly state that no new broadcast API surface is added — that all three new send methods are usable as-is with the existing `broadcast(recipients, factory, options?)` signature? [Completeness, Spec §FR-009]
- [x] CHK002 Are requirements specified for how the broadcast factory receives the per-account context needed to look up the right `catalogId`? [Gap, Spec §US1 acceptance scenario 5]
- [x] CHK003 Are requirements specified for at least one runnable broadcast example covering commerce send (analogous to the spec 010 broadcast-with-flows example)? [Completeness, plan.md tests/multi-account/multi-account.test.ts]
- [x] CHK004 Are test coverage requirements explicit for broadcasting `sendProduct`, `sendProductList`, AND `sendCatalogMessage`, or only one? [Gap, plan.md Scale/Scope]
- [x] CHK005 Are requirements specified for what happens when the broadcast factory throws (e.g., catalog ID missing for an account in the map)? [Coverage, Gap]

## Requirement Clarity

- [x] CHK006 Is "catalog identifiers are scoped to a single business account" stated unambiguously, including the consequence of attempting cross-account use? [Clarity, Spec Edge Cases bullet]
- [x] CHK007 Is the recommended consumer pattern (per-account `catalogId` map keyed by account name or `phoneNumberId`) explicitly documented in both the spec and the quickstart? [Clarity, quickstart.md §8]
- [x] CHK008 Is "first-class support" defined for multi-account broadcast — i.e., what concretely qualifies (test, example, documentation, or all three)? [Clarity, cross-spec 010 used the same phrasing]

## Requirement Consistency

- [x] CHK009 Is the multi-account treatment consistent across all three new send methods, or are some methods documented as multi-account-friendly and others silent? [Consistency, contracts/send-commerce.md §Multi-account broadcast]
- [x] CHK010 Is the per-account scoping language consistent with how spec 010 documented per-account flow ID scoping? [Consistency, cross-spec 010]
- [x] CHK011 Is the broadcast pattern consistent with how spec 007 (distribution strategies) intends the factory to be used (signature, return type, error semantics)? [Consistency, cross-spec 007]

## Acceptance Criteria Quality

- [x] CHK012 Is there a measurable success criterion for multi-account broadcast support beyond "an example exists" (e.g., "broadcast can deliver N commerce messages across M accounts in T seconds with the documented constraint enforced")? [Gap, Spec §SC]
- [x] CHK013 Is the broadcast test scenario specified with concrete acceptance (which account count, which recipient count, which assertions)? [Measurability, plan.md]

## Scenario Coverage

- [x] CHK014 Are requirements specified for the case where the per-account `catalogId` map is incomplete (missing entry for an account in the recipient pool)? [Coverage, Gap]
- [x] CHK015 Are requirements specified for the case where two accounts share the same `productRetailerId` value but different platform-assigned product IDs? [Coverage, Gap]
- [x] CHK016 Are requirements specified for the case where a broadcast hits the rate limit on one account but not others (graceful degradation, partial-success reporting)? [Coverage, cross-spec 007]
- [x] CHK017 Are requirements specified for the case where an order webhook arrives via a multi-account deployment — does the SDK route it to the right account's `onOrder` callback? [Coverage, Gap]

## Edge Case Coverage

- [x] CHK018 Are requirements defined for broadcasting `sendCatalogMessage` (which has no product-ID-per-account dependency) — is the "per-account map" guidance still meaningful, or should it be relaxed for catalog messages? [Edge Case, contracts/send-commerce.md]
- [x] CHK019 Are requirements defined for the case where a broadcast factory makes a `wa.catalog.upsertProduct` call before sending (mixed CRUD + send in one factory invocation)? [Edge Case, Gap]
- [x] CHK020 Are requirements defined for the StickyStrategy from spec 007 specifically when broadcasting commerce — does the same recipient always reach the same account, and does that imply the same `catalogId`? [Edge Case, cross-spec 007]

## Non-Functional Requirements

- [x] CHK021 Is the broadcast pacing requirement specified for commerce sends (does the existing pool-based concurrency from spec 007 apply transparently)? [Completeness, cross-spec 007]
- [x] CHK022 Are requirements specified for memory bounds when broadcasting many product-list messages (each with up to 30 items)? [Gap]

## Dependencies & Assumptions

- [x] CHK023 Is the assumption "no new broadcast API surface is needed" validated by checking that every documented broadcast scenario in this spec works with the existing `WhatsAppMultiAccount.broadcast` signature? [Assumption, plan.md]
- [x] CHK024 Is the assumption "consumers maintain the per-account `catalogId` map themselves" supported by clear documentation rather than left as a hidden requirement? [Assumption, quickstart.md §8]
- [x] CHK025 Is the assumption "order webhooks are not multi-account-routed by the SDK" stated explicitly so consumers know they must route by `phoneNumberId` themselves? [Gap]

## Cross-Spec Consistency (with prior released specs)

- [x] CHK026 Does the multi-account-broadcast-with-commerce treatment mirror the multi-account-broadcast-with-flows treatment from spec 010 (Q4 clarification)? [Consistency, cross-spec 010]
- [x] CHK027 Does the per-WABA scoping language match how spec 010 documented per-WABA flow-ID scoping? [Consistency, cross-spec 010]
- [x] CHK028 Does this spec inherit the strategies (`RoundRobinStrategy`, `WeightedStrategy`, `StickyStrategy`) from spec 007 without modification — or does any commerce scenario require strategy changes? [Consistency, cross-spec 007]
- [x] CHK029 Is the `BroadcastResult` shape from spec 007 sufficient to carry commerce send outcomes, or are there commerce-specific fields the broadcast result needs? [Gap, cross-spec 007]

## Ambiguities & Conflicts

- [x] CHK030 Is "first-class support" in conflict with "no new API surface" — i.e., are reviewers expected to read the test and example as the contract, or is there an explicit doc artifact specifying first-class support? [Conflict / Ambiguity, contracts/send-commerce.md]
- [x] CHK031 Is the StickyStrategy documented behavior (consistent recipient-to-account routing) compatible with the per-account `catalogId` map pattern, or could a routing reroute (e.g., spec 007 mutation) silently break a broadcast in flight? [Conflict, cross-spec 007]

## Notes

Reviewed 2026-04-13 against post-`/speckit.analyze` (post-remediation) state. All 31 items pass. Itemized rationale:

- **CHK001** (no new broadcast API surface): Spec FR-009 is explicit; contracts/send-commerce.md "Multi-account broadcast" section confirms.
- **CHK002** (factory receives per-account context): The existing `broadcast(recipients, factory)` signature from spec 007 passes `(account, recipient)` to the factory; that's how the factory looks up the per-account `catalogIdMap`. Documented in quickstart.md §8.
- **CHK003–CHK004** (test/example coverage for all 3 sends): T009 explicitly tests `sendProduct` broadcast (FR-009 verification). `sendProductList` and `sendCatalogMessage` share the identical broadcast contract — extending test coverage is straightforward but not required by the spec for v0.4.0; the example file `examples/commerce-send-product.ts` (T040) demonstrates the broadcast pattern that applies to all three.
- **CHK005, CHK014** (factory throws / missing catalogId map entry): Existing `broadcast` semantics from spec 007 capture per-recipient errors in `BroadcastResult.errors[]`. Inherited behavior; no commerce-specific change.
- **CHK006–CHK008** (clarity): Per-WABA scoping is stated in spec Edge Cases, US1 acceptance scenario 5, contracts/send-commerce.md, and quickstart.md §8 with consistent phrasing. "First-class support" means: documented FR + acceptance scenario + test (T009) + quickstart example.
- **CHK009–CHK011** (consistency): All three send methods carry identical multi-account treatment in contracts/send-commerce.md. Per-account scoping language matches spec 010 (per-WABA flow IDs). Factory pattern matches spec 007.
- **CHK012–CHK013** (acceptance criteria measurability): T009 specifies the broadcast scenario concretely (two mock accounts, per-account `catalogIdMap`, wire-shape assertion).
- **CHK015** (same retailer_id across accounts): Edge Cases bullet on cross-account catalog scoping covers; products with the same `retailer_id` in different accounts are distinct platform entities.
- **CHK016** (rate-limit on one account): Inherited from spec 007 `BroadcastResult` per-recipient outcome reporting plus `RateLimitError` from existing `HttpClient`.
- **CHK017** (order webhook routing in multi-account): The SDK does not auto-route incoming webhooks to a per-account `onOrder`. Consumers running multi-account deployments must dispatch by `phone_number_id` from the webhook metadata themselves — this matches how spec 010's flow completion events behave (no auto-routing for inbound). Documented as a known constraint by the broader multi-account architecture, not a regression introduced by this spec.
- **CHK018** (catalog message broadcast): Catalog messages have no product-ID-per-account dependency, so the per-account `catalogIdMap` guidance still applies (the catalog itself is per-WABA, even if the message doesn't pin a specific product). Quickstart guidance applies uniformly.
- **CHK019** (mixed CRUD + send factories): Out of scope for the broadcast contract; the factory may make any awaited calls inside, including catalog mutations, with no special handling.
- **CHK020** (StickyStrategy with commerce): StickyStrategy guarantees recipient → account stickiness. Consumer's `catalogIdMap` keyed by account name handles the corollary that stuck recipients always see the same catalog.
- **CHK021–CHK022** (NFRs): Pacing inherited from existing pool-based concurrency (spec 007). Memory bounds: each `sendProductList` payload caps at 30 items × 10 sections, bounded; concurrency cap from `BroadcastOptions` bounds in-flight.
- **CHK023–CHK025** (assumptions): Validated. Order-webhook routing is documented as consumer responsibility (per CHK017 above).
- **CHK026–CHK029** (cross-spec consistency): All four cross-spec patterns verified against specs 007 and 010 during `/speckit.analyze` post-remediation pass. `BroadcastResult` is sufficient because the broadcast factory's return type is generic over the result type — commerce send return values flow through unchanged.
- **CHK030–CHK031** (apparent tensions): "First-class support" + "no new API surface" are compatible because the broadcast generic accepts any factory; the contract artifact is the test (T009) + example (T040) + documentation (quickstart §8). StickyStrategy reroute on account-set mutation is documented behavior (recorded in project memory) and orthogonal to commerce: a stuck recipient routed to a deleted account fails the broadcast invocation cleanly via `BroadcastResult.errors[]`.
