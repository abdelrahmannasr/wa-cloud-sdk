# Implementation Plan: Multi-WABA Account Management

**Branch**: `005-multi-account-management` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-multi-account-management/spec.md`

## Summary

Add phone number management (list, get, register, deregister, verification, business profiles) and a multi-account manager class for handling multiple WhatsApp Business Accounts with shared base config and lazy instance initialization. Follows existing SDK patterns (Templates/Media class structure, constructor injection, typed responses).

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode enabled
**Primary Dependencies**: Zero runtime dependencies (Node.js built-in APIs only)
**Storage**: N/A (stateless SDK library)
**Testing**: Vitest 3 with v8 coverage, minimum 80% threshold
**Target Platform**: Node.js 18+ (uses native fetch)
**Project Type**: Single library package (ESM + CJS dual export via tsup)
**Performance Goals**: N/A for SDK layer — delegates to Meta API rate limits
**Constraints**: Zero runtime dependencies; all existing exports preserved
**Scale/Scope**: WhatsAppMultiAccount supports arbitrary number of accounts with lazy initialization

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is template-only (not yet ratified for this project). No formal gates to enforce. Plan follows project conventions from CLAUDE.md instead:

| Convention | Status | Notes |
|-----------|--------|-------|
| Zero runtime dependencies | PASS | No new dependencies |
| `interface` for public APIs | PASS | All contracts use interfaces |
| Named exports only | PASS | No default exports |
| `readonly` on interface properties | PASS | All entity fields readonly |
| TSDoc with @example blocks | PASS | Contract specifies all public APIs |
| Typed error classes | PASS | ValidationError for input validation |
| Constructor injection (HttpClient) | PASS | PhoneNumbers follows Templates pattern |
| `Promise<ApiResponse<T>>` returns | PASS | All methods return standard response |
| Test coverage ≥ 80% | PLANNED | Unit tests for all classes |
| Backwards compatibility | PASS | All existing exports preserved |

**Post-Phase 1 re-check**: All conventions still pass. No violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/005-multi-account-management/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── phone-numbers-api.md
│   └── multi-account-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── phone-numbers/           # NEW — Phone number management module
│   ├── types.ts             # PhoneNumber, BusinessProfile, request/response interfaces, type unions
│   ├── phone-numbers.ts     # PhoneNumbers class (list, get, business profile, registration)
│   └── index.ts             # Barrel export
├── multi-account/           # REPLACE stub — Multi-account manager module
│   ├── types.ts             # AccountConfig, MultiAccountConfig interfaces
│   ├── multi-account.ts     # WhatsAppMultiAccount class (lazy init, dynamic add/remove)
│   └── index.ts             # Barrel export (replaces empty stub)
├── whatsapp.ts              # UPDATE — Add phoneNumbers lazy accessor
├── index.ts                 # UPDATE — Add phone-numbers and multi-account exports
└── ... (existing modules unchanged)

tests/
├── phone-numbers/
│   ├── phone-numbers.test.ts    # Unit tests for PhoneNumbers class
│   └── types.test.ts            # Type validation tests (if needed)
├── multi-account/
│   └── multi-account.test.ts    # Unit tests for WhatsAppMultiAccount class
└── whatsapp.test.ts             # UPDATE — Add phoneNumbers accessor tests
```

**Structure Decision**: Single library project following the established per-module directory pattern (`src/{module}/types.ts`, `src/{module}/{module}.ts`, `src/{module}/index.ts`). New `phone-numbers/` module parallels `templates/`. Existing `multi-account/` stub replaced with full implementation.

## Implementation Phases

### Phase A: Phone Numbers Types & Class (P1 — User Stories 1 & 2)

**Files**: `src/phone-numbers/types.ts`, `src/phone-numbers/phone-numbers.ts`, `src/phone-numbers/index.ts`

1. Define all type unions (QualityRating, CodeVerificationStatus, NameStatus, PlatformType, etc.)
2. Define interfaces: PhoneNumber, BusinessProfile, BusinessProfileUpdate, PhoneNumberListParams, PhoneNumberListResponse, BusinessProfileResponse, VerificationCodeRequest, VerifyCodeRequest, RegisterRequest, SuccessResponse
3. Implement PhoneNumbers class with constructor injection (`HttpClient` + `businessAccountId`)
4. Implement `list()` — GET `/{waba_id}/phone_numbers` with optional params
5. Implement `get()` — GET `/{phone_number_id}` with optional fields
6. Implement `getBusinessProfile()` — GET `/{phone_number_id}/whatsapp_business_profile` (unwrap `data[0]`)
7. Implement `updateBusinessProfile()` — POST `/{phone_number_id}/whatsapp_business_profile` (auto-inject `messaging_product`)
8. Create barrel export

**Tests**: list (empty, with data, with fields filter, pagination), get (valid, invalid ID), getBusinessProfile (valid, fields), updateBusinessProfile (partial, full), constructor validation.

### Phase B: Registration & Verification (P2 — User Story 3)

**Files**: `src/phone-numbers/phone-numbers.ts` (extend), `src/phone-numbers/types.ts` (extend)

1. Implement `requestVerificationCode()` — POST `/{phone_number_id}/request_code` with client-side validation of codeMethod
2. Implement `verifyCode()` — POST `/{phone_number_id}/verify_code`
3. Implement `register()` — POST `/{phone_number_id}/register` (auto-inject `messaging_product`)
4. Implement `deregister()` — POST `/{phone_number_id}/deregister`

**Tests**: requestVerificationCode (SMS, VOICE, invalid method), verifyCode (valid, empty code), register (valid, empty pin), deregister (valid, invalid ID), error paths (400, 401, 429, 500).

### Phase C: Multi-Account Manager (P2 — User Story 4)

**Files**: `src/multi-account/types.ts`, `src/multi-account/multi-account.ts`, `src/multi-account/index.ts`

1. Define interfaces: AccountConfig, MultiAccountConfig
2. Implement WhatsAppMultiAccount class with:
   - Constructor: validate accounts, store configs in Maps, build phoneNumberId→name lookup
   - `get()`: lookup by name or phoneNumberId, lazy-create WhatsApp instance with merged config
   - `addAccount()`: validate uniqueness, store config
   - `removeAccount()`: destroy instance if exists, remove from maps
   - `getAccounts()`: return read-only view
   - `has()`: check existence
   - `destroy()`: clean up all instances, clear maps

**Tests**: constructor (valid, empty accounts, duplicate names), get (by name, by phoneNumberId, lazy creation, cached return, unknown), addAccount (valid, duplicate name, duplicate phoneNumberId), removeAccount (valid, with/without instance, unknown), getAccounts, has, destroy (with/without instances, post-destroy usage).

### Phase D: Integration & Exports (Ties everything together)

**Files**: `src/whatsapp.ts`, `src/index.ts`

1. Add `phoneNumbers` lazy accessor to WhatsApp class (same pattern as `templates`)
2. Update `src/index.ts` barrel to export PhoneNumbers, WhatsAppMultiAccount, and all types
3. Verify all existing exports unchanged

**Tests**: Update `whatsapp.test.ts` for phoneNumbers accessor (with businessAccountId, without businessAccountId error), verify existing tests pass unchanged.

## Complexity Tracking

No constitution violations — no complexity justification needed.
