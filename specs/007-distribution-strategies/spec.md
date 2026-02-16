# Feature Specification: Distribution Strategies & Broadcast

**Feature Branch**: `007-distribution-strategies`
**Created**: 2026-02-16
**Status**: Draft
**Input**: User description: "implement the distribution strategies and broadcast"

## Clarifications

### Session 2026-02-16

- Q: What is the API for strategy-based individual sends (not broadcast)? → A: A `getNext(recipient?)` method returns a strategy-selected `WhatsApp` instance; developer calls `.messages.sendText()` etc. themselves. This follows the existing `get(name)` pattern.
- Q: Should developers be able to provide custom distribution strategies? → A: Yes — the system accepts a custom strategy that conforms to a defined contract (e.g. a function or object with a `select` method), in addition to the 3 built-in strategies.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distribute messages across accounts evenly (Priority: P1)

A developer running a high-volume WhatsApp campaign needs to spread message sends across multiple WABA accounts to stay within per-account rate limits. They configure the multi-account manager with a round-robin strategy so that each outgoing message is automatically routed to the next account in sequence, without manually picking which account to use.

**Why this priority**: This is the most common distribution need — even load spreading. It enables high-throughput campaigns without developers writing custom routing logic. It's the simplest strategy to understand and the foundation the others build upon.

**Independent Test**: Can be fully tested by configuring 3 accounts with round-robin strategy, sending 9 messages, and verifying each account handled exactly 3 messages in cyclic order.

**Acceptance Scenarios**:

1. **Given** a multi-account manager with 3 accounts and round-robin strategy, **When** 6 messages are sent via the distribution method, **Then** each account sends exactly 2 messages in cyclic order (A, B, C, A, B, C).
2. **Given** a round-robin manager where one account is removed mid-session, **When** the next message is sent, **Then** routing continues across the remaining accounts without error.
3. **Given** a round-robin manager where a new account is added mid-session, **When** the next cycle begins, **Then** the new account is included in the rotation.

---

### User Story 2 - Broadcast a message to many recipients in parallel (Priority: P2)

A developer needs to send the same message (or a per-recipient variant) to a large list of recipients, distributing the work across all configured accounts. They call a broadcast method with a list of recipients and a message factory, and the system fans out sends across accounts using the configured distribution strategy, executing in parallel for throughput.

**Why this priority**: Broadcast is the primary high-volume use case for multi-account setups. It depends on a distribution strategy (P1) to route work, making it the natural second priority. It delivers the biggest campaign throughput improvement.

**Independent Test**: Can be fully tested by broadcasting to 10 recipients across 3 accounts and verifying all 10 messages were sent, distributed according to the active strategy, with parallel execution.

**Acceptance Scenarios**:

1. **Given** a manager with 3 accounts and 10 recipients, **When** broadcast is called with a text message factory, **Then** all 10 messages are sent successfully, distributed across accounts per the strategy.
2. **Given** a broadcast of 5 messages where 1 fails (e.g. invalid phone number), **When** the broadcast completes, **Then** the result reports 4 successes and 1 failure with the error details, and remaining sends are not affected.
3. **Given** a broadcast with a per-recipient message factory, **When** each message is sent, **Then** the factory receives the recipient phone number and the message content is customized per recipient.

---

### User Story 3 - Route by account capacity/weight (Priority: P3)

A developer manages accounts with different rate-limit tiers (e.g. one enterprise account at 1000 msg/sec, two business accounts at 80 msg/sec each). They assign weights to each account so the distribution strategy sends proportionally more traffic to higher-capacity accounts.

**Why this priority**: Capacity-based routing optimizes throughput when accounts have unequal tiers. It's less universally needed than round-robin but critical for heterogeneous account setups.

**Independent Test**: Can be fully tested by configuring 2 accounts with weights 80 and 20, sending 100 messages, and verifying the distribution is approximately 80/20.

**Acceptance Scenarios**:

1. **Given** 2 accounts with weights 80 and 20, **When** 1000 messages are distributed, **Then** approximately 80% go to the first account and 20% to the second (within ±5% tolerance).
2. **Given** an account with weight 0, **When** messages are distributed, **Then** that account receives no messages.
3. **Given** all accounts with equal weights, **When** messages are distributed, **Then** the result is approximately even (similar to round-robin).

---

### User Story 4 - Sticky routing for conversation continuity (Priority: P4)

A developer needs to ensure that follow-up messages to the same recipient always go through the same account, so the recipient sees a consistent sender number. They configure a sticky strategy that hashes the recipient's phone number to deterministically map it to an account.

**Why this priority**: Conversation continuity is important for customer service and two-way messaging flows, but many campaign-style use cases don't need it. It's valuable but more niche than even distribution.

**Independent Test**: Can be fully tested by sending 5 messages to the same recipient and verifying all 5 go through the same account, then sending to a different recipient and verifying consistent (but potentially different) account assignment.

**Acceptance Scenarios**:

1. **Given** a sticky strategy with 3 accounts, **When** 10 messages are sent to the same recipient, **Then** all 10 are routed to the same account.
2. **Given** a sticky strategy, **When** messages are sent to many different recipients, **Then** the recipients are distributed across accounts (not all stuck to one).
3. **Given** a sticky strategy where the assigned account is removed, **When** the next message to that recipient is sent, **Then** the recipient is re-assigned to a different account deterministically.

---

### Edge Cases

- What happens when a distribution method is called with zero registered accounts? The system rejects the call with a clear error.
- What happens when a broadcast is called with an empty recipients list? The system returns an empty result set without error.
- What happens when all sends in a broadcast fail? The result reports all failures; no partial state is left behind.
- What happens during broadcast if one account becomes unreachable mid-execution? Other accounts continue processing their assigned recipients; failures from the unreachable account are collected in the result.
- What happens when `destroy()` is called during an in-progress broadcast? Pending sends are not interrupted (they complete or fail on their own), but no new sends are initiated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support a round-robin distribution strategy that cycles through accounts in order, wrapping around after the last account.
- **FR-002**: System MUST support a capacity-based (weighted) distribution strategy where weights are configured on the strategy itself (not on individual accounts), determining each account's share of traffic.
- **FR-003**: System MUST support a sticky distribution strategy that deterministically maps a recipient phone number to an account, ensuring the same recipient always uses the same account.
- **FR-004**: System MUST provide a `getNext(recipient?)` method that returns a `WhatsApp` instance selected by the active distribution strategy, following the same pattern as the existing `get(name)` method.
- **FR-005**: System MUST provide a broadcast method that sends a message to a list of recipients, distributing sends across accounts using the configured strategy.
- **FR-006**: Broadcast MUST accept a message factory function that receives a strategy-selected WhatsApp instance and the recipient phone number, and performs the send operation, enabling per-recipient customization of message type and content.
- **FR-007**: Broadcast MUST execute sends in parallel across accounts for throughput.
- **FR-008**: Broadcast MUST return a result object containing successes and failures, where each failure includes the recipient and the error detail.
- **FR-009**: Distribution strategies MUST handle dynamic account changes (add/remove) without requiring manager re-creation.
- **FR-010**: System MUST allow the distribution strategy to be specified at manager construction time via configuration.
- **FR-011**: System MUST accept custom strategy implementations that conform to a defined contract, in addition to the 3 built-in strategies (round-robin, weighted, sticky).
- **FR-012**: The default behavior (no strategy specified) MUST remain the current manual `get()` lookup, preserving backward compatibility.
- **FR-013**: Broadcast MUST support an optional concurrency limit to control how many sends execute simultaneously.

### Key Entities

- **DistributionStrategy**: The routing algorithm used to select which account handles a given send. Built-in variants: round-robin, weighted, sticky. Developers can also provide custom implementations conforming to the strategy contract.
- **BroadcastResult**: The outcome of a broadcast operation, containing per-recipient success/failure details.
- **BroadcastMessageFactory**: A user-provided function that receives a strategy-selected WhatsApp instance and a recipient phone number, and performs the send operation. The developer controls which message type and content to use.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Round-robin distributes messages across N accounts with at most 1 message difference between any two accounts over any N-message window.
- **SC-002**: Weighted distribution matches configured weights within ±5% tolerance over 1000+ messages.
- **SC-003**: Sticky routing sends 100% of messages for a given recipient to the same account (until that account is removed).
- **SC-004**: Broadcast of 1000 recipients across 5 accounts completes with all sends executed (success or failure reported per recipient).
- **SC-005**: Existing `get()` lookup continues to work identically when no strategy is configured — zero breaking changes.
