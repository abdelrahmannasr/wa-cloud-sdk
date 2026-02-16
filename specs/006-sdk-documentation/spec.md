# Feature Specification: SDK Documentation & Polish

**Feature Branch**: `006-sdk-documentation`
**Created**: 2026-02-16
**Status**: Draft
**Input**: User description: "Documentation and polish: README with install/quickstart/config/modules/error-handling/advanced-usage, examples directory with send-text/webhooks-express/webhooks-nextjs/media-upload/templates/multi-account, and final verification"

## Clarifications

### Session 2026-02-16

- Q: Phone-numbers module has no corresponding example in FR-005 but SC-002 requires 100% module coverage. Which is correct? → A: Add a 7th example (`phone-numbers`) covering listing, business profile, and verification flow.
- Q: Should examples be fully runnable (with their own package.json and deps) or reference code to read and adapt? → A: Reference code — syntactically valid `.ts` files with header comments showing how to run (e.g., `npx tsx examples/...`). No separate package.json in examples/.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and Evaluate the SDK (Priority: P1)

A developer discovers the `@abdelrahmannasr-wa/cloud-api` package on npm or GitHub. They visit the repository to evaluate whether it meets their needs before installing. They need a clear, professional README that communicates what the SDK does, how to install it, a quick start example, available features, and how the SDK is structured.

**Why this priority**: The README is the first touchpoint for every potential user. Without it, developers cannot evaluate the SDK, leading to zero adoption regardless of code quality.

**Independent Test**: Can be fully tested by visiting the repository and reading the README — a developer should understand the SDK's purpose, install it, and send their first message within 5 minutes of reading.

**Acceptance Scenarios**:

1. **Given** a developer visits the GitHub repository, **When** they read the README, **Then** they understand the SDK's purpose, supported features, and installation steps within 2 minutes.
2. **Given** a developer reads the Quick Start section, **When** they copy the example code, **Then** they have a working "send text message" example with minimal configuration (access token + phone number ID).
3. **Given** a developer wants to evaluate SDK capabilities, **When** they scan the README's feature list, **Then** they see all supported modules (messages, media, templates, webhooks, phone numbers, multi-account) with brief descriptions.
4. **Given** a developer needs to configure the SDK, **When** they read the Configuration section, **Then** they find a complete table of all configuration options with types, defaults, and descriptions.

---

### User Story 2 - Learn by Example (Priority: P2)

A developer has installed the SDK and wants to implement a specific use case (send messages, handle webhooks, upload media, manage templates, etc.). They look for runnable example code that demonstrates real-world patterns they can adapt to their project.

**Why this priority**: Examples bridge the gap between API reference and real implementation. They accelerate onboarding and reduce trial-and-error, which is the second most impactful driver of developer satisfaction after the README.

**Independent Test**: Can be fully tested by running any single example file — each example should be self-contained and demonstrate a complete use case.

**Acceptance Scenarios**:

1. **Given** a developer wants to send text messages, **When** they open the send-text example, **Then** they see a self-contained script showing WhatsApp client creation and message sending with proper error handling.
2. **Given** a developer builds an Express app, **When** they open the webhooks-express example, **Then** they see a complete Express server with webhook verification and message handling callbacks.
3. **Given** a developer builds a Next.js app, **When** they open the webhooks-nextjs example, **Then** they see a complete App Router route handler with GET (verification) and POST (event handling) exports.
4. **Given** a developer needs to upload media, **When** they open the media-upload example, **Then** they see file reading, upload, and sending a media message using the returned media ID.
5. **Given** a developer wants to manage templates, **When** they open the templates example, **Then** they see template listing, creation (using the TemplateBuilder), and sending a template message.
6. **Given** a developer needs to manage phone numbers, **When** they open the phone-numbers example, **Then** they see phone number listing, business profile retrieval and update, and the verification code request flow.
7. **Given** a developer manages multiple WhatsApp accounts, **When** they open the multi-account example, **Then** they see multi-account setup, account lookup, and sending messages through different accounts.

---

### User Story 3 - Understand Error Handling Patterns (Priority: P3)

A developer encounters an error while using the SDK. They need documentation that explains the error class hierarchy, common error scenarios, and recommended handling patterns so they can write robust integration code.

**Why this priority**: Error handling is critical for production use. Clear documentation of error types and recovery strategies prevents developers from writing fragile integrations.

**Independent Test**: Can be tested by reading the error handling section in the README — a developer should understand all error types and know how to handle rate limits, authentication failures, and validation errors.

**Acceptance Scenarios**:

1. **Given** a developer reads the Error Handling section, **When** they review the error class hierarchy, **Then** they understand the inheritance chain (WhatsAppError > ApiError > RateLimitError, etc.) and what properties each class exposes.
2. **Given** a developer encounters a rate limit, **When** they follow the documented pattern, **Then** they can implement retry logic using the `retryAfterMs` property on `RateLimitError`.
3. **Given** a developer encounters a validation error, **When** they check the error's `field` property, **Then** they can identify and fix the invalid input.

---

### User Story 4 - Verify SDK Readiness for Publishing (Priority: P4)

A maintainer needs to verify that the SDK package is complete and ready for publishing. This includes verifying that the build produces correct outputs, all tests pass with adequate coverage, there are no lint errors, and the package contents are correct.

**Why this priority**: Final verification ensures quality before publishing. While important, it's a one-time gate rather than ongoing user value.

**Independent Test**: Can be tested by running the full verification suite (build, typecheck, test coverage, lint) and inspecting the package output.

**Acceptance Scenarios**:

1. **Given** a maintainer runs the build command, **When** the build completes, **Then** the `dist/` directory contains ESM (.js), CJS (.cjs), and declaration (.d.ts, .d.cts) files for each entry point.
2. **Given** a maintainer runs tests with coverage, **When** coverage is calculated, **Then** all metrics (lines, functions, branches, statements) exceed 80%.
3. **Given** a maintainer runs the linter, **When** linting completes, **Then** there are zero errors or warnings.
4. **Given** a maintainer inspects the package with a dry-run pack, **When** they review the file list, **Then** only intended files are included (dist/, README.md, LICENSE, package.json) and no source code, tests, or config files leak into the package.

---

### Edge Cases

- What happens when a developer copies a Quick Start example but has an invalid access token? The example should show what error to expect and link to the Error Handling section.
- What happens when a developer tries to run an example that requires specific environment variables without setting them? Each example must document required environment variables at the top with clear instructions.
- What happens when a developer installs the SDK in a CommonJS project? The README must mention both ESM and CJS support and show appropriate import syntax for each.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST include a README.md at the root with the following sections: overview/badges, installation, quick start, configuration reference, module documentation (messages, media, templates, webhooks, phone numbers, multi-account), error handling, and license.
- **FR-002**: The README MUST include a configuration reference table listing every `WhatsAppConfig` option with its type, whether it is required or optional, default value, and a brief description.
- **FR-003**: The README MUST show import examples for both the unified client pattern and direct module imports.
- **FR-004**: The README MUST document both ESM (`import`) and CJS (`require`) import syntax.
- **FR-005**: The repository MUST include an `examples/` directory with at least 7 reference example files: send-text, webhooks-express, webhooks-nextjs, media-upload, templates, phone-numbers, and multi-account. Each file is syntactically valid TypeScript with a header comment showing how to run it (e.g., `npx tsx examples/send-text.ts`). No separate package.json is needed in the examples directory.
- **FR-006**: Each example file MUST be self-contained, include a header comment explaining what it demonstrates, list required environment variables, and include inline comments for key steps.
- **FR-007**: The README error handling section MUST list all error classes, their properties, inheritance relationships, and provide code examples for catching and handling common error types.
- **FR-008**: The README MUST include an Advanced Usage section covering direct module imports, custom rate limiter configuration, retry configuration, and request options.
- **FR-009**: The README MUST include npm badges (version, license, Node.js version) at the top for quick package evaluation.
- **FR-010**: The build output MUST produce ESM, CJS, and TypeScript declaration files for each package entry point and the package must pass a dry-run pack verification.
- **FR-011**: All test suites MUST pass with coverage exceeding 80% on lines, functions, branches, and statements.
- **FR-012**: The codebase MUST have zero lint errors when running the linter.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer new to the SDK can install it and send their first message by following only the README, in under 5 minutes.
- **SC-002**: 100% of SDK modules (messages, media, templates, webhooks, phone numbers, multi-account) have corresponding example files and README documentation.
- **SC-003**: The README contains a complete configuration reference covering all available options with types, defaults, and descriptions.
- **SC-004**: All 7 example files are syntactically valid TypeScript reference code, each demonstrating a complete use case with error handling and a header comment showing how to execute it.
- **SC-005**: The package build produces valid ESM, CJS, and declaration outputs with zero errors.
- **SC-006**: Test coverage exceeds 80% on all four axes (lines, functions, branches, statements).
- **SC-007**: The codebase passes linting with zero errors or warnings.

## Assumptions

- TSDoc coverage on all public APIs is already complete (100% coverage with @example blocks confirmed via audit). This phase does not need to add TSDoc to source files.
- The README targets developers with basic Node.js/TypeScript experience who are new to this specific SDK but familiar with WhatsApp Cloud API concepts.
- Example files are documentation-only (not shipped in the npm package) and use environment variables for credentials rather than hardcoded values.
- The SDK's existing test suite and lint configuration are stable. Final verification is a confirmation step, not a remediation effort.
- Example files will be written in TypeScript to match the SDK's primary language, with a note in the README about JavaScript compatibility.
