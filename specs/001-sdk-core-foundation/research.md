# Research: WhatsApp Cloud API SDK -- Core Foundation

**Branch**: `001-sdk-core-foundation` | **Date**: 2026-02-13
**Status**: Retroactive (all decisions already implemented and validated)

## Decision Log

### D-001: HTTP Client Strategy

**Decision**: Use native `fetch` (available in Node.js 18+) with no HTTP library dependencies.

**Rationale**: The SDK's zero-dependency constraint eliminates axios, node-fetch, got, and undici as options. Native `fetch` provides sufficient functionality for REST API calls, file uploads via FormData, and binary downloads. Node.js 18+ guarantees its availability.

**Alternatives considered**:
- `node-fetch`: Adds a runtime dependency; violates zero-dep constraint
- `undici`: Ships with Node.js but requires explicit import; native fetch wraps it already
- Custom HTTP via `http`/`https` modules: More code, less ergonomic, no FormData support

---

### D-002: Rate Limiting Algorithm

**Decision**: Token bucket algorithm with configurable capacity (default 80 tokens/second).

**Rationale**: Token bucket allows bursting up to the capacity while enforcing average throughput. Meta's WhatsApp Cloud API enforces 80 messages/second for Business tier. Token bucket is simpler to implement than leaky bucket and better models the platform's burst-tolerant behavior.

**Alternatives considered**:
- Leaky bucket: Smooths traffic too aggressively; doesn't allow legitimate bursts
- Sliding window: More complex, harder to implement correctly without timing issues
- No rate limiting: Risk of 429 errors and potential account suspension

---

### D-003: Retry Strategy

**Decision**: Exponential backoff with randomized jitter. Default: 3 retries, 1s base delay, 30s max delay, 0.2 jitter factor.

**Rationale**: Exponential backoff prevents thundering-herd effects. Jitter distributes retries across time when multiple clients hit the same error. Respecting `Retry-After` headers from 429 responses ensures compliance with platform guidance.

**Alternatives considered**:
- Fixed delay: Doesn't adapt to increasing contention
- Linear backoff: Less effective at avoiding thundering herd
- No retry: Consumers lose messages on transient failures

---

### D-004: Error Hierarchy Design

**Decision**: 7-class hierarchy rooted at `WhatsAppError extends Error`. Subclasses for specific failure modes: `ApiError`, `RateLimitError`, `AuthenticationError`, `ValidationError`, `WebhookVerificationError`, `MediaError`.

**Rationale**: Typed errors allow consumers to use `instanceof` checks for error handling logic. Separate classes for rate limiting and authentication enable distinct recovery strategies (retry vs. re-authenticate). All classes carry machine-readable `code` properties for programmatic handling.

**Alternatives considered**:
- Single error class with error codes: Less ergonomic; consumers need string comparisons
- Error union types: Don't extend Error; break `instanceof` and stack traces
- Platform error codes as enums: Too tightly coupled to Meta's error numbering

---

### D-005: Webhook Signature Verification

**Decision**: HMAC-SHA256 using `node:crypto.createHmac` + `timingSafeEqual` for comparison.

**Rationale**: Meta signs webhook payloads with HMAC-SHA256 using the app secret. Timing-safe comparison prevents timing side-channel attacks that could be used to forge signatures byte-by-byte.

**Alternatives considered**:
- Simple string comparison: Vulnerable to timing attacks
- Third-party crypto library: Unnecessary; Node.js crypto module is sufficient and well-audited

---

### D-006: Phone Number Validation

**Decision**: Strip all non-digit characters, validate 7-15 digit length per ITU-T E.164 standard. Return digits-only string (no `+` prefix).

**Rationale**: Meta's API expects phone numbers as digit-only strings without the `+` prefix. The 7-15 digit range covers all valid international phone numbers. Stripping formatting characters (spaces, dashes, parentheses, dots, plus) makes the SDK tolerant of common input formats.

**Alternatives considered**:
- libphonenumber: Adds a large runtime dependency (~300KB); overkill for basic validation
- Regex-only without stripping: Too strict; rejects valid formatted numbers
- No validation: Passes invalid numbers to the API, causing 400 errors

---

### D-007: Module Distribution Format

**Decision**: Dual ESM + CJS output via tsup with TypeScript declaration files (.d.ts, .d.cts).

**Rationale**: The Node.js ecosystem is mid-transition from CJS to ESM. Dual output ensures the SDK works in both `import` and `require` environments. tsup handles the complexity of generating both formats from a single TypeScript source with correct package.json `exports` mapping.

**Alternatives considered**:
- ESM-only: Breaks CommonJS consumers (still common in enterprise Node.js)
- CJS-only: Prevents tree-shaking and modern ESM workflows
- Manual dual build: Error-prone; tsup handles edge cases (default exports, __dirname, etc.)

---

### D-008: Webhook Middleware Strategy

**Decision**: Generic handler core (`createWebhookHandler`) with thin framework adapters for Express and Next.js.

**Rationale**: The core handler is framework-agnostic, accepting raw strings/buffers and returning status codes. Framework adapters translate between framework-specific request/response objects and the core handler. This keeps the core testable without framework dependencies and makes adding new framework adapters trivial.

**Alternatives considered**:
- Direct Express/Next.js integration: Couples core logic to frameworks
- Only core handler (no adapters): Consumers must write boilerplate for every framework
- Middleware-as-dependency (peer deps on express): Violates zero-dependency constraint

---

### D-009: Constructor Injection Pattern

**Decision**: All module classes (`Messages`, future `Media`, `Templates`) accept `HttpClient` via constructor injection.

**Rationale**: Constructor injection makes dependencies explicit, enables unit testing with mocked clients, and avoids global state. The `HttpClient` encapsulates auth, rate limiting, and retry -- module classes focus purely on building correct API payloads.

**Alternatives considered**:
- Global singleton client: Prevents multiple instances; complicates testing
- Factory functions: Less discoverable; harder to extend
- Service locator: Over-engineered for a library with one core dependency

---

### D-010: Testing Strategy

**Decision**: Unit tests with mocked `globalThis.fetch` via `vi.stubGlobal`. No live API calls in CI. Integration tests (*.integration.test.ts) for sandbox testing, skipped in CI.

**Rationale**: Mocking fetch at the global level allows testing the full HttpClient pipeline (auth headers, URL construction, error parsing, rate limiting, retry) without network calls. This keeps tests fast, deterministic, and runnable offline.

**Alternatives considered**:
- MSW (Mock Service Worker): Adds a dev dependency; more setup than vi.stubGlobal
- nock: CJS-focused, less compatible with native fetch
- Live API testing in CI: Flaky, requires secrets, rate limited
