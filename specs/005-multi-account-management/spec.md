# Feature Specification: Multi-WABA Account Management

**Feature Branch**: `005-multi-account-management`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "Multi-WABA account management for handling multiple WhatsApp Business Accounts"

## Clarifications

### Session 2026-02-14

- Q: Should WhatsAppMultiAccount allow adding/removing accounts after construction, or are accounts fixed at creation time? → A: Dynamic — support `addAccount()` and `removeAccount()` methods post-construction.
- Q: Should WhatsAppMultiAccount require full config per account, or support a shared base config with per-account overrides? → A: Shared base config + per-account overrides. Accounts only specify credentials (accessToken, phoneNumberId, businessAccountId) and optional overrides.
- Q: Should WhatsAppMultiAccount create all WhatsApp instances eagerly at construction, or lazily on first access? → A: Lazy — WhatsApp instances created on first access via `get()`. Resources allocated only when needed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List and Inspect Phone Numbers (Priority: P1)

A developer managing a WhatsApp Business Account needs to retrieve the phone numbers registered under their WABA. They list all phone numbers to see each number's display name, quality rating, verification status, and messaging limits. They can also retrieve detailed information about a specific phone number by its ID.

**Why this priority**: Visibility into phone numbers is the foundational read operation for multi-account management. Before performing any actions on phone numbers (registering, updating profiles), developers need to know what numbers exist and their current state. This is the lowest-risk operation and delivers immediate value for monitoring and dashboards.

**Independent Test**: Can be fully tested by calling `list()` and `get()` against a mocked client and verifying correct API paths, query parameters, and response parsing. Delivers immediate value by giving developers visibility into their phone number inventory.

**Acceptance Scenarios**:

1. **Given** a configured PhoneNumbers instance with a valid business account ID, **When** the developer calls `list()`, **Then** the SDK returns a typed list of phone numbers including each number's display name, quality rating, verification status, and platform type.
2. **Given** phone numbers exist on the account, **When** the developer calls `list()` with a fields filter, **Then** the SDK passes those fields to the API and returns only the requested fields for each phone number.
3. **Given** a known phone number ID, **When** the developer calls `get(phoneNumberId)`, **Then** the SDK returns the full details for that specific phone number.
4. **Given** an invalid phone number ID, **When** the developer calls `get(phoneNumberId)`, **Then** the SDK throws a typed error from the platform.

---

### User Story 2 - Manage Business Profiles (Priority: P1)

A developer needs to view and update the business profile associated with a specific phone number. The business profile includes public-facing information such as the business description, address, website, email, vertical (industry), and profile photo. They retrieve the current profile to display it in their admin panel, and update individual fields as business information changes.

**Why this priority**: Business profiles are the public face of a WhatsApp business number. Developers frequently need to read and update profile information programmatically, especially in multi-tenant platforms where each client's profile must be configured individually. This is equally critical to phone number listing for day-to-day operations.

**Independent Test**: Can be fully tested by calling `getBusinessProfile()` and `updateBusinessProfile()` against a mocked client and verifying correct API paths, payloads, and response handling.

**Acceptance Scenarios**:

1. **Given** a valid phone number ID, **When** the developer calls `getBusinessProfile(phoneNumberId)`, **Then** the SDK returns the business profile data including description, address, website URLs, email, vertical, and profile photo handle.
2. **Given** a valid phone number ID and updated profile fields, **When** the developer calls `updateBusinessProfile(phoneNumberId, updates)`, **Then** the SDK sends the update to the platform and returns a success confirmation.
3. **Given** a profile update with only a subset of fields, **When** `updateBusinessProfile()` is called, **Then** only the provided fields are sent in the request — existing profile fields are not affected.
4. **Given** an invalid phone number ID, **When** any business profile operation is called, **Then** the SDK throws a typed error from the platform.

---

### User Story 3 - Register and Deregister Phone Numbers (Priority: P2)

A developer onboarding a new phone number to WhatsApp Cloud API needs to register it programmatically. They request a verification code (via SMS or voice call), submit the code to complete verification, and then register the phone number. When a number is no longer needed, they deregister it to free up the slot.

**Why this priority**: Phone number registration is essential for onboarding new numbers but happens less frequently than day-to-day profile and listing operations. Deregistration is needed for lifecycle management, particularly in multi-tenant platforms where businesses churn.

**Independent Test**: Can be fully tested by calling `requestVerificationCode()`, `verifyCode()`, `register()`, and `deregister()` against a mocked client and verifying correct API paths and payloads.

**Acceptance Scenarios**:

1. **Given** a phone number ID for an unregistered number, **When** the developer calls `requestVerificationCode(phoneNumberId, { codeMethod: 'SMS' })`, **Then** the SDK sends the request and returns a success confirmation.
2. **Given** a valid verification code was received, **When** the developer calls `verifyCode(phoneNumberId, { code: '123456' })`, **Then** the SDK submits the code and returns a success confirmation.
3. **Given** a verified phone number, **When** the developer calls `register(phoneNumberId)`, **Then** the SDK registers the number with the Cloud API and returns a success confirmation.
4. **Given** a registered phone number, **When** the developer calls `deregister(phoneNumberId)`, **Then** the SDK deregisters the number and returns a success confirmation.
5. **Given** an already-registered number, **When** the developer calls `register()` again, **Then** the SDK throws a typed error from the platform.

---

### User Story 4 - Multi-Instance WhatsApp Client Management (Priority: P2)

A platform developer managing WhatsApp on behalf of multiple businesses needs to create and manage separate WhatsApp client instances for different phone numbers or WABAs. Rather than manually constructing clients, they use a factory helper to create pre-configured instances and can iterate over them for bulk operations. As businesses onboard and churn, they dynamically add and remove accounts at runtime without recreating the manager.

**Why this priority**: Multi-tenant platforms are a primary use case for this SDK (e.g., the Khalsa platform). A factory pattern reduces boilerplate and ensures consistent configuration across instances. Dynamic account management is essential for platforms where businesses onboard and offboard at runtime. However, it depends on the phone number listing (User Story 1) being available first.

**Independent Test**: Can be fully tested by creating a manager with multiple account configurations, adding/removing accounts dynamically, and verifying that each returned WhatsApp instance is correctly configured with its own phone number and credentials.

**Acceptance Scenarios**:

1. **Given** a developer has credentials for multiple WABAs/phone numbers, **When** they create a multi-account manager with an array of account configurations, **Then** they can retrieve individual WhatsApp instances by account name or phone number ID.
2. **Given** a multi-account manager with multiple accounts, **When** the developer iterates over all accounts via `getAccounts()`, **Then** they receive each account's configuration (name, credentials, settings) for inspection or selective instance retrieval.
3. **Given** a multi-account manager, **When** the developer requests an instance for a non-existent account name, **Then** they receive a clear error identifying the unknown account.
4. **Given** a multi-account manager, **When** the developer calls `destroy()`, **Then** all underlying WhatsApp instances are cleaned up properly.
5. **Given** a running multi-account manager, **When** the developer calls `addAccount()` with a new account configuration, **Then** the new account is immediately available for retrieval and operations.
6. **Given** a running multi-account manager with an existing account, **When** the developer calls `removeAccount()` by account name, **Then** the account's WhatsApp instance is destroyed and the account is no longer available for retrieval.

---

### Edge Cases

- What happens when listing phone numbers on a WABA with zero numbers? The SDK returns an empty list, not an error.
- What happens when the business account ID is missing or empty? The PhoneNumbers constructor throws a validation error immediately, consistent with the Templates module pattern.
- What happens when a verification code has expired? The SDK throws a typed error from the platform with the specific error details.
- What happens when a phone number is already registered with WhatsApp (personal or another business)? The SDK propagates the platform's conflict error.
- What happens when updating a business profile with an invalid website URL format? The SDK propagates the platform's validation error.
- What happens when requesting a verification code via an unsupported method? The SDK validates the code method (SMS or VOICE) client-side before making the request.
- What happens when calling `register()` without first verifying the phone number? The SDK propagates the platform's precondition error.
- What happens when a multi-account manager is given duplicate account names? The manager throws a validation error identifying the duplicate.
- What happens when `addAccount()` is called with a name that already exists? The manager throws a validation error identifying the duplicate.
- What happens when `removeAccount()` is called for an account that doesn't exist? The manager throws a typed error identifying the unknown account.
- What happens when `destroy()` is called but some accounts were never accessed? Only accounts that were lazily instantiated are cleaned up; unaccessed account configs are simply discarded.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: SDK MUST provide a PhoneNumbers class that accepts a client and business account ID via constructor injection, consistent with the existing Templates class pattern.
- **FR-002**: SDK MUST provide a `list()` operation to retrieve all phone numbers registered under the business account, supporting optional field selection and returning typed phone number objects with display name, quality rating, verification status, platform type, and messaging limits.
- **FR-003**: SDK MUST provide a `get()` operation to retrieve detailed information about a specific phone number by its ID, including all available fields.
- **FR-004**: SDK MUST provide a `getBusinessProfile()` operation to retrieve the business profile for a specific phone number, returning typed profile data (description, address, websites, email, vertical, profile photo).
- **FR-005**: SDK MUST provide an `updateBusinessProfile()` operation to modify the business profile for a specific phone number, accepting a partial update object so that only provided fields are sent to the platform.
- **FR-006**: SDK MUST provide a `requestVerificationCode()` operation to initiate phone number verification via SMS or voice call, validating the code method (SMS or VOICE) client-side before making the request.
- **FR-007**: SDK MUST provide a `verifyCode()` operation to submit a verification code for a phone number.
- **FR-008**: SDK MUST provide a `register()` operation to register a verified phone number with the Cloud API, accepting a required messaging pin parameter.
- **FR-009**: SDK MUST provide a `deregister()` operation to remove a phone number from the Cloud API.
- **FR-010**: SDK MUST provide a WhatsAppMultiAccount manager class that accepts a shared base configuration and an array of per-account configurations, merging base settings with per-account overrides for each managed WhatsApp client instance.
- **FR-011**: The WhatsAppMultiAccount manager MUST allow retrieval of individual WhatsApp instances by account name or phone number ID, lazily creating the instance on first access.
- **FR-012**: The WhatsAppMultiAccount manager MUST provide iteration over all managed instances for bulk operations.
- **FR-013**: The WhatsAppMultiAccount manager MUST validate that account names are unique and throw a validation error for duplicates.
- **FR-014**: The WhatsAppMultiAccount manager MUST provide a `destroy()` method that cleans up all instantiated WhatsApp instances (only those that were lazily created).
- **FR-019**: The WhatsAppMultiAccount manager MUST provide an `addAccount()` method to register a new account at runtime, validating name uniqueness and making the account immediately available.
- **FR-020**: The WhatsAppMultiAccount manager MUST provide a `removeAccount()` method that destroys the account's WhatsApp instance and removes it from the manager.
- **FR-015**: The PhoneNumbers module MUST be accessible through the unified WhatsApp client via a `phoneNumbers` accessor, lazily initialized with validation that businessAccountId is provided (consistent with the templates accessor pattern).
- **FR-016**: All PhoneNumbers class methods MUST accept an optional request options parameter for timeout, signal, and header overrides, consistent with other SDK modules.
- **FR-017**: All PhoneNumbers class methods MUST return typed response data wrapped in the SDK's standard ApiResponse structure, consistent with other SDK modules.
- **FR-018**: All existing public exports MUST remain available and unchanged for backwards compatibility.

### Key Entities

- **PhoneNumber**: A WhatsApp-enabled phone number registered under a WABA, characterized by its ID, display phone number, display name, quality rating (GREEN/YELLOW/RED), verification status (VERIFIED/NOT_VERIFIED), platform type, name status, and messaging limits (tier and current volume).
- **BusinessProfile**: The public-facing business information tied to a specific phone number, including business description, address, website URLs (up to 2), email, industry vertical, profile photo handle, and "about" text.
- **VerificationCodeRequest**: A request to initiate phone number verification, specifying the delivery method (SMS or VOICE) and language code for the verification message.
- **MultiAccountConfig**: Top-level configuration for the multi-account manager, containing shared base settings (apiVersion, baseUrl, logger, rateLimitConfig, retryConfig, timeoutMs) that apply to all accounts unless overridden, plus an array of account-specific configurations.
- **AccountConfig**: Configuration for a single managed account, containing required credentials (access token, phone number ID), a unique account name label, optional business account ID, and optional per-account overrides for any shared base setting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can list and inspect all phone numbers for a WABA using 3 or fewer lines of code (import, construct, call).
- **SC-002**: Developers can view and update a business profile for any phone number without constructing raw API payloads.
- **SC-003**: Developers can register a new phone number through the full verification flow (request code, verify, register) using the SDK alone.
- **SC-004**: Developers managing multiple WABAs or phone numbers can create a multi-account manager and send messages through any account in 5 or fewer lines of code.
- **SC-005**: All PhoneNumbers operations and WhatsAppMultiAccount methods follow the same patterns as existing SDK modules (constructor injection, standard response types, request options), requiring zero additional learning for developers already using the SDK.
- **SC-006**: The multi-account module introduces zero additional runtime dependencies.
- **SC-007**: Test coverage meets or exceeds the project minimum of 80% on lines, functions, branches, and statements.
- **SC-008**: All existing SDK tests continue to pass without modification.

## Assumptions

- Phone number management endpoints use the Meta Graph API under the WABA ID path (`GET /{waba_id}/phone_numbers`) for listing and under the phone number ID path (`GET/POST /{phone_number_id}`) for individual operations.
- Business profile endpoints follow the pattern `GET/POST /{phone_number_id}/whatsapp_business_profile`.
- Registration endpoints follow the pattern `POST /{phone_number_id}/register` and `POST /{phone_number_id}/deregister`.
- Verification endpoints follow the pattern `POST /{phone_number_id}/request_code` and `POST /{phone_number_id}/verify_code`.
- The WhatsAppMultiAccount manager is a convenience wrapper — it does not add new API capabilities beyond what individual WhatsApp instances provide.
- Each managed account in WhatsAppMultiAccount gets its own independent WhatsApp instance with its own HTTP client, rate limiter, and retry configuration. Instances are created lazily on first access to minimize resource allocation for unused accounts.
- The existing WhatsAppConfig interface already contains all fields needed for individual accounts. The WhatsAppMultiAccount manager introduces a shared base config (apiVersion, baseUrl, logger, rateLimitConfig, retryConfig, timeoutMs) that is merged with per-account credentials and optional overrides to produce each account's full config.
- Quality rating values follow Meta's documented scale: GREEN, YELLOW, RED, with an additional UNKNOWN for newly registered numbers.

## Scope Boundaries

### In Scope

- PhoneNumbers class with list, get, register, deregister, verification, and business profile operations
- WhatsAppMultiAccount manager for creating and managing multiple WhatsApp instances
- Integration with the unified WhatsApp client via a `phoneNumbers` accessor
- Typed interfaces for all phone number, business profile, and verification data
- Client-side validation for verification code method (SMS/VOICE)
- Comprehensive unit tests
- Full backwards compatibility with existing exports

### Out of Scope

- Phone number migration between WABAs (complex workflow requiring coordination between source and destination WABAs)
- WhatsApp Business Account creation or deletion (managed through Meta Business Suite, not the API)
- Payment and billing management for WABAs
- Automated phone number provisioning from telecom providers
- Two-step verification PIN management
- Phone number analytics and conversation-based pricing details
- Breaking changes to existing public APIs
- Runtime dependency additions
