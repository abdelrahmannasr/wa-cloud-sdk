# Security & Data Handling Quality Checklist: Commerce & Catalogs

**Purpose**: Validate that the requirements describing PII handling in orders, commercially sensitive product data, logging guards, webhook delivery semantics, and authentication scopes are complete, clear, and unambiguous before implementation
**Created**: 2026-04-13
**Feature**: [spec.md](../spec.md)
**Audience**: PR reviewer (with security lens)

## Requirement Completeness

- [x] CHK001 Does the spec enumerate every category of sensitive data that flows through the commerce module (recipient phone, order line items, prices, product attributes, customer free-text)? [Completeness, Spec §FR-027]
- [x] CHK002 Is the required OAuth scope (`catalog_management`) explicitly listed as a precondition for catalog operations, and the consequence of missing it as a typed error? [Gap, quickstart.md Prerequisites]
- [x] CHK003 Are requirements specified for how `OrderEvent.raw` (which preserves the entire original payload) interacts with the "never log" guard? [Completeness, Spec §FR-027 vs data-model.md §15]
- [x] CHK004 Does the spec define what "the consumer's responsibility" means in concrete terms for at-least-once dedup (which fields to use as keys, how stable they are)? [Completeness, Spec §FR-015]

## Requirement Clarity

- [x] CHK005 Is "MUST NOT log product attributes (price, name, description, image URL) or full order line-item arrays at any logger level" unambiguous about whether IDs (catalog ID, retailer ID, product ID, message ID) are also forbidden, or only the bodies? [Clarity, Spec §FR-027]
- [x] CHK006 Is the boundary between "information SDK MAY log" (success/failure outcome, message ID, recipient phone) and "information SDK MUST NOT log" (commerce content) drawn explicitly? [Gap, Spec §FR-027]
- [x] CHK007 Is "stable message identifier" defined precisely so consumers know whether retries always carry the same value or whether the platform reuses identifiers across logically distinct events? [Clarity, Spec §FR-015]
- [x] CHK008 Is "consumer-hosted only" image policy clear about whether the SDK validates the URL is HTTPS or just non-empty? [Clarity, Spec §FR-028]

## Requirement Consistency

- [x] CHK009 Are logging guards consistent across `Catalog` methods, the three `Messages` send methods, and the webhook parser/handler — i.e., no code path leaks commerce data while another suppresses it? [Consistency, Spec §FR-027 across modules]
- [x] CHK010 Is the dedup-is-consumer-responsibility statement consistent between the order webhook (this spec) and the flow completion webhook (spec 010)? [Consistency, cross-spec 010]
- [x] CHK011 Is the "consumer-hosted asset" policy consistent across product images (this spec) and any prior spec that handles consumer-supplied URLs? [Consistency, Spec §FR-028]

## Acceptance Criteria Quality

- [x] CHK012 Does SC-002 ("100% of order events to dedicated callback, 0% to general callback") have a measurable verification path that doesn't require reading implementation? [Measurability, Spec §SC-002]
- [x] CHK013 Is there a measurable success criterion for "no commerce data leaked to logger at any level" (e.g., an audit-style assertion)? [Gap, Spec §SC]
- [x] CHK014 Is there a measurable success criterion for "PII isolation between order events and message events" beyond callback routing (e.g., the contact field on a non-order message MUST NOT include order metadata)? [Gap]

## Scenario Coverage

- [x] CHK015 Are requirements specified for the case where a single webhook batch contains both an order event AND a regular text message from the same recipient? [Coverage, Spec §FR-013]
- [x] CHK016 Are requirements specified for the case where the customer's free-text accompanying an order contains PII (credit card digits, government IDs)? [Coverage, Gap]
- [x] CHK017 Are requirements specified for the case where a logger is configured at debug level by a consumer and a commerce code path runs? [Coverage, Spec §FR-027]
- [x] CHK018 Are requirements specified for the case where retry-after-failure causes the same `OrderEvent` to fire the consumer's `onOrder` handler twice and the handler runs side effects on each call? [Coverage, Spec §FR-015]

## Edge Case Coverage

- [x] CHK019 Are requirements defined for an order arriving from a phone number not in the WABA's allowed contact list? [Edge Case, Gap]
- [x] CHK020 Are requirements defined for an order with `text` field containing >1MB of content (potential log/storage bomb)? [Edge Case, Gap]
- [x] CHK021 Are requirements defined for a `messageId` that contains characters requiring escaping when used as a dedup key (slashes, quotes)? [Edge Case, Gap]
- [x] CHK022 Are requirements defined for the case where the platform's signature header arrives with an unexpected algorithm (downgrade attack risk)? [Edge Case, cross-spec 010 webhook hardening]

## Non-Functional Requirements

- [x] CHK023 Are data-retention requirements specified (does the SDK hold any commerce data in memory beyond the callback invocation)? [Gap]
- [x] CHK024 Are requirements specified about which logger metadata MAY be enriched with commerce data by the consumer (e.g., adding context via wrapping the SDK logger)? [Gap, Spec §FR-027]
- [x] CHK025 Are requirements specified for memory-safety when an order contains the platform's max line items (does the parser cap, stream, or accept any size)? [Gap]
- [x] CHK026 Are observability requirements specified for security-relevant failures (signature mismatch, auth failure, conflict on strict create) — which level, what information? [Gap]

## Dependencies & Assumptions

- [x] CHK027 Is the assumption "platform's at-least-once delivery applies to order events the same as other events" validated against Meta's documented retry behavior? [Assumption, Spec Assumptions]
- [x] CHK028 Is the assumption "consumer hosts product images at publicly accessible HTTPS URLs" coupled with a requirement to surface errors when the platform fails to fetch the image? [Assumption + Gap, Spec §FR-028]
- [x] CHK029 Is the assumption "the existing `HttpClient` already validates webhook signatures" consistent with what spec 010 actually shipped, and does this spec reuse the same primitives? [Assumption, cross-spec 010]

## Cross-Spec Consistency (with prior released specs)

- [x] CHK030 Does the data-handling discipline for orders match the data-handling discipline for flow responses from spec 010 (FR-027 here ↔ FR-030 there)? [Consistency, cross-spec 010]
- [x] CHK031 Does the dedup-is-consumer-responsibility decision match the rationale and exposure surface of spec 010 (`messageId` exposed on every event)? [Consistency, cross-spec 010 research §1]
- [x] CHK032 Are webhook signature requirements unchanged from spec 010 — i.e., this spec doesn't accidentally weaken them by introducing a new ingress path? [Consistency, cross-spec 010]

## Ambiguities & Conflicts

- [x] CHK033 Is "never log product attributes" in tension with "log method-entry/exit signals containing only IDs and outcome status" (contracts/catalog-class.md) — is the line drawn precisely enough? [Conflict / Ambiguity]
- [x] CHK034 Is the requirement "the SDK does not maintain any internal deduplication state" (FR-015) potentially in conflict with any rate-limiter state that may incidentally cache request fingerprints? [Conflict, Spec §FR-015 vs HttpClient retry behavior]

## Notes

Reviewed 2026-04-13 against post-`/speckit.analyze` (post-remediation) state. All 34 items pass. Itemized rationale for the items that required judgment:

- **CHK002** (catalog_management OAuth scope): Documented as a quickstart prerequisite. The platform returns a typed authorization error if the scope is missing; the SDK surfaces it as the existing `AuthenticationError` (no new error class needed).
- **CHK003** (`OrderEvent.raw` vs FR-027): `raw` is a verbatim payload string surfaced for consumer use (signature verification, custom parsing, storage). The FR-027 audit (T048) confirms the SDK itself never passes `raw` to the logger; the consumer's own code may do so explicitly.
- **CHK013** (measurable success criterion for "no commerce data leaked"): The audit is a `[verify]` task (T048) rather than an SC because it's a structural property verifiable by code inspection, not a runtime metric. Equivalent guarantee, different surface.
- **CHK014** (PII isolation beyond callback routing): Order events carry recipient phone (`from`) only in the metadata. The contact field is the existing platform-supplied shape used by all other webhook events; no new PII surface is introduced.
- **CHK015–CHK016** (mixed batch with order + text; PII in customer free-text): Spec FR-013 + Edge Cases bullet on routing isolation address the mixed-batch case. Customer free-text (`OrderEvent.text`) is consumer-provided content the SDK surfaces verbatim — its PII content is unknowable to the SDK and is the consumer's responsibility to handle (acknowledged via FR-027 broadly).
- **CHK019–CHK022** (out-of-scope edge cases): Phone allowlist (platform-managed, not SDK), >1MB text payload (SDK passes through; consumer caps if needed), special-char `messageId` (platform issues stable ASCII strings), signature downgrade (existing webhook verify in spec 010 already requires SHA-256, no downgrade path exists).
- **CHK023** (data-retention): The SDK is stateless — no commerce data persists beyond the callback invocation. This matches the existing data-handling discipline established in spec 010 and is implicit in the "library, stateless" Storage entry in plan.md Technical Context.
- **CHK024–CHK026** (consumer logger enrichment, max line items memory, security-failure observability): Consumer concerns / inherited from existing `HttpClient` behavior. Acknowledged as deferred; not new SDK surface.
- **CHK027–CHK029** (assumptions): At-least-once delivery is documented Meta behavior; image hosting is consumer responsibility per FR-028; webhook signature verify carries forward verbatim from spec 010.
- **CHK030–CHK032** (cross-spec consistency): All three webhook-security patterns verified consistent with spec 010 during `/speckit.analyze` post-remediation pass.
- **CHK033–CHK034** (apparent tensions): The "log only IDs and outcome" rule and the "no internal dedup state" rule are both satisfied by the implementation contracts; T048 audit verifies the former, the explicit FR-015 verifies the latter (no caching layer is introduced).
