# API Surface Requirements Quality Checklist: Template Status Webhook Events

**Purpose**: Unit-test the public-API-surface requirements (type names, union extensibility, backward compatibility, exports) for completeness, clarity, and consistency. Reviewer-facing PR gate.
**Created**: 2026-04-14
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [contracts/webhook-events.md](../contracts/webhook-events.md) · [contracts/public-exports.md](../contracts/public-exports.md)

## Type System Requirements — Completeness

- [x] CHK001 - Are all seven new exported type names enumerated explicitly (`TemplateEventMetadata`, `TemplateEventStatus`, `TemplateQualityScore`, `TemplateStatusEvent`, `TemplateQualityEvent`, `WebhookTemplateStatusPayload`, `WebhookTemplateQualityPayload`)? [Completeness, Contracts public-exports.md]
- [x] CHK002 - Is the shape of `TemplateEventMetadata` specified as a dedicated type and NOT as an extension of the existing `EventMetadata`? [Completeness, Spec Clarifications §1; Contracts webhook-events.md]
- [x] CHK003 - Are the documented lifecycle-status literals enumerated in `TemplateEventStatus` (APPROVED, REJECTED, PENDING, PAUSED, DISABLED, plus any additional known values)? [Completeness, Contracts webhook-events.md]
- [x] CHK004 - Are the documented quality-score literals enumerated in `TemplateQualityScore` (GREEN, YELLOW, RED, UNKNOWN)? [Completeness, Contracts webhook-events.md]
- [x] CHK005 - Does every parsed-event type specification list every field with its exact type, readonly modifier, and optionality? [Completeness, Contracts webhook-events.md]

## Type System Requirements — Clarity

- [x] CHK006 - Is the `(string & {})` extensibility idiom explained (why not a closed enum, why not a plain `string`) so an implementer or reviewer can't second-guess it? [Clarity, Research §1]
- [x] CHK007 - Are `readonly` property markers specified as mandatory on all new interfaces, consistent with the project's immutability convention? [Clarity, Plan Constitution Check]
- [x] CHK008 - Is the canonical home for each new type specified (e.g. all in `src/webhooks/types.ts`, not split across modules)? [Clarity, Plan Project Structure]
- [x] CHK009 - Is the exact discriminator literal for each new event type specified (`'template_status'`, `'template_quality'`)? [Clarity, Contracts webhook-events.md]

## Backward Compatibility Requirements

- [x] CHK010 - Is the breaking-change risk for consumers who exhaustively `switch` on `event.type` disclosed explicitly? [Completeness, Contracts webhook-events.md §Breaking-change disclosure]
- [x] CHK011 - Is the non-breaking guarantee for consumers using narrow `event.type === 'message'` predicates called out? [Completeness, Contracts webhook-events.md]
- [x] CHK012 - Are existing event types (`MessageEvent`, `StatusEvent`, `ErrorEvent`, `FlowCompletionEvent`, `OrderEvent`) confirmed unchanged? [Consistency, Plan §Technical Context]
- [x] CHK013 - Is `EventMetadata` confirmed unchanged (i.e. not modified to carry optional `businessAccountId`)? [Consistency, Spec Clarifications §1]
- [x] CHK014 - Is the additive-only nature of new `WebhookHandlerCallbacks` fields explicit (both optional, neither required for existing consumers)? [Consistency, Contracts webhook-events.md]

## Export Surface Requirements

- [x] CHK015 - Are the re-export points documented for every new name (main barrel `src/index.ts` AND `src/webhooks/index.ts`)? [Completeness, Contracts public-exports.md]
- [x] CHK016 - Is the `./webhooks` subpath export reuse confirmed (no new subpath entry needed)? [Consistency, Contracts public-exports.md]
- [x] CHK017 - Is the subpath-import parity requirement stated (same type identity from main barrel and subpath)? [Completeness, Contracts public-exports.md]
- [x] CHK018 - Is the list of raw wire types (`WebhookTemplateStatusPayload`, `WebhookTemplateQualityPayload`) consciously exported for power users or kept internal? [Clarity, Contracts public-exports.md]

## Callback Contract Requirements

- [x] CHK019 - Is the fluent-return contract (`onTemplateStatus() → this`) specified for chainability? [Completeness, Contracts callbacks.md]
- [x] CHK020 - Is the merge-precedence rule between `_pendingCallbacks` and explicit `createHandler` args specified for both new callbacks? [Clarity, Contracts callbacks.md §Merge precedence]
- [x] CHK021 - Is the sequential-await semantics (one event at a time, throw aborts remaining) reaffirmed for the new dispatch cases rather than re-specified differently? [Consistency, Contracts callbacks.md §Handler dispatch]
- [x] CHK022 - Is the callback signature (`(event) => void | Promise<void>`) specified identically to existing callbacks? [Consistency, Contracts callbacks.md]

## Documentation Requirements

- [x] CHK023 - Are TSDoc + `@example` blocks mandated for every new public type, callback, and method? [Completeness, Plan Constitution Check]
- [x] CHK024 - Is a README update scoped to the Webhooks section (not a new top-level section)? [Clarity, Contracts public-exports.md §README.md]
- [x] CHK025 - Is the CLAUDE.md edit scope specified (Module Structure, Implementation Status, Meta API Reference, Recent Changes)? [Completeness, Contracts public-exports.md §CLAUDE.md]

## Versioning Requirements

- [x] CHK026 - Is the semver-level bump specified explicitly (0.4.0 → 0.5.0) with rationale? [Clarity, Research §10; Contracts public-exports.md]
- [x] CHK027 - Is the no-change-to-`dependencies` / `peerDependencies` invariant stated? [Completeness, Contracts public-exports.md]
- [x] CHK028 - Is the no-change-to-tsup-config invariant stated (no new entry point)? [Completeness, Contracts public-exports.md]

## Ambiguities & Conflicts

- [x] CHK029 - Does the spec clearly state the event-root vs metadata split for `businessAccountId` (inside `metadata`, not at root)? [Clarity, Spec Clarifications §1]
- [x] CHK030 - Is there any conflict between FR-005 ("independent callbacks") and FR-006 ("routed to matching field")? [Conflict, Spec §FR-005 vs §FR-006]
- [x] CHK031 - Is there any missing specification for how the unified client `WhatsApp.webhooks` picks up the new `onTemplateStatus`/`onTemplateQuality` methods (e.g. is it automatic via the existing wrapper)? [Gap, Plan §Project Structure]

## Notes

- Check items off as completed: `[x]`
- This checklist tests whether the public API contract is specified cleanly enough that the tasks phase can execute without further clarification.
- ≥80% of items reference a specific spec/plan/contract section for traceability.
