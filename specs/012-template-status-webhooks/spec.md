# Feature Specification: Template Status Webhook Events

**Feature Branch**: `012-template-status-webhooks`
**Created**: 2026-04-14
**Status**: Draft
**Input**: User description: "Template status webhook events (#8, P2, Medium effort, High impact) — know when templates are approved/rejected/quality-changed"

## Clarifications

### Session 2026-04-14

- Q: Template-lifecycle webhooks are WABA-scoped and carry no `phone_number_id`/`display_phone_number`. How should template events carry identity? → A: Introduce a distinct `TemplateEventMetadata = { businessAccountId }` type; template events use it in place of the existing `EventMetadata`. WABA id is sourced from `entry.id`.
- Q: What shape should the template-event `timestamp` field use (existing SDK is inconsistent: `Date` for message/status/flow, ISO string for order)? → A: `Date` — matches the majority pattern and the nearest-analog (`StatusEvent`). Parser converts platform epoch seconds to `Date`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - React to template review decisions (Priority: P1)

A business sends a message template for review and needs to know, without polling, the moment the platform approves or rejects it. On approval they can enable campaigns that depend on the template; on rejection they need the reason so an operator can fix it and resubmit.

**Why this priority**: Template review turnaround ranges from minutes to 24+ hours. Polling the templates API for every pending template is wasteful and slow; missing a rejection reason delays remediation. Near-real-time delivery decisions are the primary justification for this feature.

**Independent Test**: Simulate a platform callback containing an approval or rejection for a known template, deliver it to the SDK's webhook pipeline, and verify the developer's registered callback fires with the template identity, new status, and (for rejections) the rejection reason.

**Acceptance Scenarios**:

1. **Given** a developer has registered a template-status callback, **When** the platform delivers an `APPROVED` status update for a template, **Then** the callback receives an event with the template name, template id, new status `APPROVED`, and the originating business account id.
2. **Given** a template has just been rejected, **When** the callback fires, **Then** the event exposes status `REJECTED` plus the platform-provided rejection reason (e.g. `ABUSIVE_CONTENT`, `TAG_CONTENT_MISMATCH`) so the caller can surface it to an operator.
3. **Given** a template transitions to `PENDING`, `PAUSED`, `DISABLED`, or back to `APPROVED`, **When** the callback fires, **Then** each transition is surfaced to the developer as a distinct event with the new status value.

---

### User Story 2 - Monitor template quality degradation (Priority: P2)

A business runs campaigns using approved templates. WhatsApp rates each template's user-perceived quality (GREEN / YELLOW / RED) based on block rates and feedback; a drop to RED pauses the template. The business needs to hear about quality drops immediately so it can throttle campaigns, swap templates, or contact recipients differently before the platform disables the template.

**Why this priority**: Quality changes happen less often than approvals but carry campaign-impacting consequences. Without a push event, businesses only discover a RED rating after a send fails.

**Independent Test**: Deliver a simulated quality-update payload with a previous and new quality score to the SDK's pipeline and verify the registered callback receives both scores alongside the template identity.

**Acceptance Scenarios**:

1. **Given** a developer has registered a template-quality callback, **When** the platform delivers a quality update (e.g. `GREEN` → `YELLOW`), **Then** the callback receives an event exposing the previous score, the new score, the template id, and the template name.
2. **Given** a quality update lacks a `previous_quality_score` (first rating), **When** the callback fires, **Then** the previous-score field is explicitly absent/undefined rather than a fabricated default.

---

### User Story 3 - Route template lifecycle changes alongside message traffic (Priority: P3)

A developer already consumes message and status webhooks through the SDK's existing webhook handler. Template-lifecycle events arrive on the same webhook URL but under different `field` names. The developer wants the SDK to route these automatically to dedicated callbacks instead of mixing them with the `onMessage` / `onStatus` / `onError` paths — or silently dropping them.

**Why this priority**: The routing and fan-out behavior is the glue that makes stories 1 and 2 feel native to the SDK. On its own it delivers little; combined with stories 1–2 it keeps developer code clean.

**Independent Test**: Send a webhook payload mixing a `messages` change and a `message_template_status_update` change in the same POST; verify both the message callback and the template-status callback fire exactly once, and that neither event leaks into the other's handler.

**Acceptance Scenarios**:

1. **Given** a payload containing both a message change and a template-status change, **When** the SDK parses and dispatches it, **Then** each registered callback receives only events for its own field and each event fires exactly once.
2. **Given** a payload containing a template-related field the SDK does not recognize (future Meta additions), **When** the SDK processes it, **Then** the unknown field is logged as a diagnostic and dropped without throwing, matching existing unknown-field handling.

---

### Edge Cases

- Payloads that carry a template event but omit a `template_id` or `template_name` (platform-side bug): the event is logged and skipped rather than surfaced with empty identity.
- A status transition whose status value is new to the platform and not in the SDK's known set: surface the raw string value so callers can still branch on it, but type it as a union-plus-string to flag the gap.
- A rejection with no `reason` field: surface status `REJECTED` with reason undefined — do not block the event.
- A webhook batch containing multiple template status updates for different templates in one POST: each is delivered as its own event in order.
- A template-status event that arrives before the corresponding template was created (eventual consistency from the platform): surface it verbatim — reconciliation is the caller's responsibility.
- Quality updates for a template id the caller has never interacted with (shared WABA, other integrations): still delivered — filtering is the caller's responsibility.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The SDK MUST recognize the platform's `message_template_status_update` webhook field and surface it as a distinct typed event separate from message, status, error, flow-completion, and order events.
- **FR-002**: The SDK MUST recognize the platform's `message_template_quality_update` webhook field and surface it as its own distinct typed event.
- **FR-003**: Each template status event MUST expose its WABA identity via a dedicated `TemplateEventMetadata` shape (`{ businessAccountId }`, sourced from the webhook `entry.id`) — distinct from the phone-number-scoped `EventMetadata` used by message/status/error/flow/order events. The event root MUST additionally expose: template id, template name, new status, event timestamp (delivered as a `Date`), and — when present in the payload — rejection reason and template language.
- **FR-004**: Each template quality event MUST expose its WABA identity via the same `TemplateEventMetadata` shape. The event root MUST additionally expose: template id, template name, template language, new quality score, previous quality score (when provided), and event timestamp (delivered as a `Date`).
- **FR-005**: The SDK MUST allow developers to register callbacks for template status events and template quality events independently, following the existing `on*` callback pattern used by message/status/error/flow-completion/order.
- **FR-006**: The SDK MUST route each incoming webhook change to the callback matching its field, so a single batch containing mixed change types fans out correctly to every registered handler.
- **FR-007**: The SDK MUST NOT deliver template-related events to the message, status, error, flow-completion, or order callbacks.
- **FR-008**: The SDK MUST preserve the status string verbatim when the value is outside the documented set (e.g. a new status added by Meta) so callers can still branch on it.
- **FR-009**: The SDK MUST log-and-skip (not throw) template-event payloads that are malformed — including those with a non-object `change.value` (null, array, primitive) or missing required identity fields (`template_id`, `template_name`, `template_language`) — matching existing malformed-payload handling.
- **FR-010**: Unknown template-related fields added by Meta in the future MUST be logged via the configured logger and silently dropped rather than causing a parser failure.
- **FR-011**: Signature verification, raw-body handling, verify-token challenge flow, and middleware behavior MUST remain unchanged — template events flow through the exact same HTTP entry points as existing webhooks.
- **FR-012**: The platform delivers webhooks at-least-once. The SDK MUST NOT deduplicate template events; callers dedupe using `(template_id, event timestamp, new status/score)` as needed.
- **FR-013**: Template status and template quality events MUST be included in the SDK's discriminated `WebhookEvent` union so a single `parse()` call returns them alongside other event types.

### Key Entities *(include if feature involves data)*

- **Template Event Metadata**: A dedicated metadata shape for template-lifecycle events, exposing only `businessAccountId` (the WABA id from `entry.id`). Used by both Template Status Event and Template Quality Event. Deliberately distinct from the phone-number-scoped metadata used by all other event types.
- **Template Status Event**: A typed record representing a platform-driven lifecycle change to a message template — approval, rejection, pause, disable, re-approval. Carries Template Event Metadata plus the template (id + name), new status, optional rejection reason, template language, and the change timestamp.
- **Template Quality Event**: A typed record representing a change to a template's user-perceived quality score. Carries Template Event Metadata plus the template (id + name), new score (`GREEN` / `YELLOW` / `RED` / `UNKNOWN`), previous score when available, and the change timestamp.
- **Template Status Value**: Enumeration covering the documented lifecycle states (`APPROVED`, `REJECTED`, `PENDING`, `PAUSED`, `DISABLED`, plus any platform-added string).
- **Template Quality Score**: Enumeration covering `GREEN`, `YELLOW`, `RED`, and `UNKNOWN` (first-rated or indeterminate), plus any platform-added string.
- **Rejection Reason**: Optional string accompanying a `REJECTED` status (e.g. `ABUSIVE_CONTENT`, `INVALID_FORMAT`, `TAG_CONTENT_MISMATCH`) — carried verbatim from the platform.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer integrating template-status callbacks can go from "no handler registered" to "receiving approval/rejection events in a local test" in under 15 minutes using the published examples.
- **SC-002**: For every template approval or rejection the platform emits to a correctly-configured webhook endpoint, the developer's callback fires exactly once in 100% of well-formed payloads delivered during acceptance testing.
- **SC-003**: Mixed webhook batches (message + template status + quality in one POST) dispatch every event to its correct callback with zero cross-contamination across 100% of acceptance test payloads.
- **SC-004**: For rejected templates, the rejection reason is available to the developer in the same event — no secondary API call is required to find out why.
- **SC-005**: Introducing this feature does not regress any existing webhook behavior: all previously-passing tests in the webhooks module continue to pass, and overall coverage stays at or above the project's 80% threshold.
- **SC-006**: When the platform introduces a new template status or quality value the SDK does not yet name, callers can still branch on it without upgrading the SDK.

## Assumptions

- The platform delivers template lifecycle and quality events on the same webhook URL as messages/statuses, differentiated by the `field` discriminator inside each `entry.changes[]`. This is the documented Meta behavior and matches how the SDK already discriminates `messages` vs `statuses`.
- Template events are subscribed to at the WhatsApp Business Account / App level via the Meta App Dashboard. Toggling subscriptions on the Meta side is out of scope for the SDK and remains the operator's responsibility.
- Callers want events delivered verbatim — no merging of consecutive status transitions, no debouncing of quality flaps, no cross-reference against the templates REST API.
- Deduplication, persistence, and reconciliation of template state are caller concerns, consistent with how the existing `onStatus` and `onOrder` paths behave.
- The template-status and template-quality fields are the feature's MVP scope. Other template-adjacent fields (e.g. `template_category_update`, `message_template_components_update`) are out of scope for this release and can be added later by extending the same routing pattern.
- Existing webhook-module public API (`createWebhookHandler`, Express middleware, Next.js middleware, `Webhooks` wrapper class, `parse()`) stays backward compatible — new callbacks are additive and optional.
