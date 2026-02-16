# Implementation Plan: SDK Documentation & Polish

**Branch**: `006-sdk-documentation` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-sdk-documentation/spec.md`

## Summary

Create comprehensive user-facing documentation for the `@abdelrahmannasr-wa/cloud-api` SDK: a professional README.md with badges, installation, quick start, configuration reference, per-module documentation, error handling guide, and advanced usage; 7 TypeScript reference example files covering all SDK modules; and final build/test/lint verification to confirm publishing readiness. TSDoc on all public APIs is already complete (confirmed via audit) — this phase focuses exclusively on README, examples, and verification.

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode
**Primary Dependencies**: Zero runtime dependencies (devDependencies only: tsup 8, vitest 3, eslint 9, prettier 3)
**Storage**: N/A (stateless SDK library)
**Testing**: Vitest with v8 coverage, 80% minimum threshold
**Target Platform**: Node.js 18+ (uses native fetch)
**Project Type**: Single npm package (ESM + CJS dual export)
**Performance Goals**: N/A (documentation feature)
**Constraints**: README must be a single file (no docs site). Examples are reference code only (no examples/package.json). Zero runtime dependencies must be maintained.
**Scale/Scope**: 1 README.md file, 7 example .ts files, verification of existing build/test/lint

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution is not yet customized (template placeholders remain). No formal gates to enforce. The following project conventions from CLAUDE.md serve as implicit gates:

| Gate | Status | Notes |
|------|--------|-------|
| Zero runtime dependencies | PASS | Documentation-only feature adds no dependencies |
| No default exports | PASS | Examples will use named imports only |
| No `any` types | PASS | Example code uses typed SDK APIs |
| Typed error classes | PASS | Error handling examples use typed catches |
| TSDoc with @example on public APIs | PASS | Already 100% complete (audit confirmed) |
| Test coverage >80% | VERIFY | Final verification step (no new source code) |
| ESLint zero errors | VERIFY | Final verification step |

No violations. GATE PASSED.

## Project Structure

### Documentation (this feature)

```text
specs/006-sdk-documentation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
README.md                         # NEW — Primary documentation (FR-001 through FR-009)
examples/
├── send-text.ts                  # NEW — Text message sending (FR-005, FR-006)
├── webhooks-express.ts           # NEW — Express webhook server (FR-005, FR-006)
├── webhooks-nextjs.ts            # NEW — Next.js App Router handlers (FR-005, FR-006)
├── media-upload.ts               # NEW — Media upload + send (FR-005, FR-006)
├── templates.ts                  # NEW — Template CRUD + builder (FR-005, FR-006)
├── phone-numbers.ts              # NEW — Phone management + verification (FR-005, FR-006)
└── multi-account.ts              # NEW — Multi-WABA management (FR-005, FR-006)
```

**Structure Decision**: Documentation files only. No changes to `src/` or `tests/`. The README goes at repository root (standard npm convention). Examples go in `examples/` at repository root (standard SDK convention, excluded from npm package by `files` array in package.json).

## README Structure

The README.md will follow this section order (mapped to requirements):

1. **Title + Badges** (FR-009) — Package name, npm version badge, license badge, Node.js version badge
2. **Overview** (FR-001) — One-paragraph description of what the SDK does
3. **Features** (FR-001) — Bullet list of all 6 modules with brief descriptions
4. **Installation** (FR-001) — npm/pnpm/yarn install commands
5. **Quick Start** (FR-001, FR-003) — Minimal send-text example using unified client
6. **Configuration** (FR-002) — Full `WhatsAppConfig` reference table:

   | Option | Type | Required | Default | Description |
   |--------|------|----------|---------|-------------|
   | `accessToken` | `string` | Yes | — | Meta access token |
   | `phoneNumberId` | `string` | Yes | — | WhatsApp phone number ID |
   | `businessAccountId` | `string` | No | — | WABA ID (required for templates) |
   | `apiVersion` | `string` | No | `'v21.0'` | Graph API version |
   | `baseUrl` | `string` | No | `'https://graph.facebook.com'` | API base URL |
   | `logger` | `Logger` | No | — | Custom logger instance |
   | `rateLimitConfig.maxTokens` | `number` | No | `80` | Max tokens in bucket |
   | `rateLimitConfig.refillRate` | `number` | No | `80` | Tokens refilled per second |
   | `rateLimitConfig.enabled` | `boolean` | No | `true` | Enable/disable rate limiting |
   | `retryConfig.maxRetries` | `number` | No | `3` | Maximum retry attempts |
   | `retryConfig.baseDelayMs` | `number` | No | `1000` | Base delay between retries |
   | `retryConfig.maxDelayMs` | `number` | No | `30000` | Maximum delay cap |
   | `retryConfig.jitterFactor` | `number` | No | `0.2` | Jitter randomization factor |
   | `timeoutMs` | `number` | No | `30000` | Request timeout in ms |
   | `appSecret` | `string` | No | — | App secret for webhook verification |
   | `webhookVerifyToken` | `string` | No | — | Webhook verify token |

7. **Messages** (FR-001) — Key methods: sendText, sendImage, sendTemplate, etc. with code snippet
8. **Media** (FR-001) — Upload, download, getUrl, delete with code snippet
9. **Templates** (FR-001) — CRUD + TemplateBuilder with code snippet
10. **Webhooks** (FR-001) — Parse, verify, Express/Next.js middleware with code snippet
11. **Phone Numbers** (FR-001) — List, profile, verification with code snippet
12. **Multi-Account** (FR-001) — Setup + lookup with code snippet
13. **Error Handling** (FR-007) — Class hierarchy, properties table, catch examples
14. **Advanced Usage** (FR-008) — Direct imports, rate limiter config, retry config, request options
15. **ESM & CJS** (FR-004) — Both import syntaxes
16. **Examples** — Link to examples/ directory
17. **License** (FR-001) — MIT

## Example File Structure

Each example file follows this template pattern:

```typescript
/**
 * Example: [Title]
 *
 * Demonstrates: [what this example shows]
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   [additional env vars as needed]
 *
 * Run: npx tsx examples/[filename].ts
 */

import { WhatsApp } from '@abdelrahmannasr-wa/cloud-api';

// ... self-contained example with error handling
```

### Example contents (per file):

1. **send-text.ts** — Create WhatsApp client, send text message, handle response, catch errors
2. **webhooks-express.ts** — Create Express app, mount webhook middleware, handle message/status callbacks, start server
3. **webhooks-nextjs.ts** — Export GET (verification) and POST (event handling) App Router handlers
4. **media-upload.ts** — Read file from disk, upload via media.upload(), send media message using returned ID
5. **templates.ts** — List templates, create template with TemplateBuilder, send template message
6. **phone-numbers.ts** — List phone numbers, get/update business profile, request verification code
7. **multi-account.ts** — Configure multiple accounts, lookup by name, send through specific account, cleanup

## Verification Checklist

Final verification runs these commands in sequence:

1. `pnpm typecheck` — Zero type errors
2. `pnpm build` — Produces dist/ with ESM + CJS + declarations
3. `pnpm test:coverage` — All metrics >80%
4. `pnpm lint` — Zero errors
5. `pnpm pack --dry-run` — Only dist/, README.md, LICENSE, package.json included

## Complexity Tracking

No constitution violations to justify. This feature creates only documentation files (README.md + 7 examples) with no changes to source code or build configuration.
