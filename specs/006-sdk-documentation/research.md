# Research: SDK Documentation & Polish

**Feature**: 006-sdk-documentation
**Date**: 2026-02-16

## Research Summary

This feature is documentation-only. No unknowns from Technical Context required research (all fields resolved from existing codebase). The research below documents decisions made during planning about documentation structure and conventions.

---

## R-001: README Section Structure

**Decision**: Follow the standard npm SDK README pattern: badges → overview → features → install → quick start → config reference → per-module docs → error handling → advanced usage → license.

**Rationale**: This is the de facto standard for TypeScript SDK documentation on npm. Developers expect this order and can quickly scan for what they need. The Stripe, Twilio, and SendGrid Node SDKs all follow this pattern.

**Alternatives considered**:
- Separate docs site (Docusaurus/VitePress) — Rejected: overkill for a single-package SDK; adds maintenance burden and a build step. README is sufficient for the current scope.
- Monolithic API reference in README — Rejected: TSDoc already provides complete API reference. README should link to key methods, not duplicate.

---

## R-002: Example File Format

**Decision**: TypeScript `.ts` files as reference code. Each file is syntactically valid, self-contained, and includes a header comment with run instructions (`npx tsx examples/[name].ts`). No separate `package.json` in examples/.

**Rationale**: Reference code that developers read and adapt to their project is more practical than a runnable examples project. Developers using this SDK already have their own project setup. A separate package.json in examples/ would confuse the zero-dependency message and add maintenance burden.

**Alternatives considered**:
- Fully runnable examples project with package.json + tsx — Rejected per clarification session: adds maintenance burden, confuses zero-dependency messaging.
- JavaScript examples — Rejected: SDK is TypeScript-first, and TypeScript examples serve both TS and JS developers (JS developers can strip types).

---

## R-003: WhatsAppConfig Documentation Source

**Decision**: Extract all configuration options directly from `src/client/types.ts` WhatsAppConfig interface. Default values extracted from `src/client/http-client.ts` constructor and `src/utils/retry.ts` DEFAULT_RETRY_CONFIG.

**Rationale**: Single source of truth from the actual codebase. Prevents documentation drift.

**Verified defaults**:
- `apiVersion`: `'v21.0'`
- `baseUrl`: `'https://graph.facebook.com'`
- `timeoutMs`: `30000`
- `rateLimitConfig.maxTokens`: `80`
- `rateLimitConfig.refillRate`: `80`
- `rateLimitConfig.enabled`: `true` (implicit — rate limiter created by default)
- `retryConfig.maxRetries`: `3`
- `retryConfig.baseDelayMs`: `1000`
- `retryConfig.maxDelayMs`: `30000`
- `retryConfig.jitterFactor`: `0.2`

---

## R-004: Error Class Hierarchy Documentation

**Decision**: Document the full inheritance tree with a properties table per class. Include code examples for the 3 most common error handling patterns: API errors, rate limits, and validation errors.

**Rationale**: Error handling is the #1 area where developers need guidance beyond TSDoc. The class hierarchy determines catch order, and the properties determine what recovery actions are possible.

**Verified hierarchy**:
```
WhatsAppError (base)
├── ApiError (statusCode, errorType, errorSubcode?, fbTraceId?)
│   ├── RateLimitError (retryAfterMs?)
│   └── AuthenticationError
├── ValidationError (field?)
├── WebhookVerificationError
└── MediaError (mediaType?)
```

---

## R-005: Badge Selection

**Decision**: Include 3 badges: npm version, license (MIT), and Node.js version (>=18).

**Rationale**: These are the 3 most useful badges for quick package evaluation. npm version shows freshness, license shows usability, and Node.js version shows compatibility. Additional badges (build status, coverage) can be added later when CI is configured.

**Alternatives considered**:
- Build/CI badge — Deferred: No CI pipeline configured yet.
- Coverage badge — Deferred: Requires coverage reporting service integration.
- TypeScript badge — Considered but low value: the `.d.ts` in exports already signals TypeScript support.

---

## R-006: Package Verification

**Decision**: Run the standard verification sequence: typecheck → build → test:coverage → lint → pack --dry-run.

**Rationale**: This matches the `prepublishOnly` script already in package.json (minus pack). The dry-run pack confirms that only dist/, README.md, LICENSE, and package.json are included (the `files` array in package.json already limits this).

**Verified**: The `files` array in package.json is `["dist", "README.md", "LICENSE"]`. The examples/ directory is correctly excluded from the published package.
