# Feature Specification: Subpath Exports for Remaining Modules

**Feature Branch**: `009-subpath-exports`
**Created**: 2026-04-08
**Status**: Draft
**Input**: User description: "Subpath exports for remaining SDK modules: add dedicated import paths for ./media (Media class and all media types), ./templates (Templates class, TemplateBuilder, and all template types), ./phone-numbers (PhoneNumbers class and all phone number types), and ./multi-account (WhatsAppMultiAccount class, all distribution strategies, and all multi-account types). Each subpath must produce ESM, CJS, and declaration files via the existing tsup build, following the same pattern as the existing ./errors, ./messages, and ./webhooks subpath exports. Must work in both module systems with full TypeScript type definitions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import Media Module via Subpath (Priority: P1)

As an SDK consumer building an application that only needs media operations (upload, download, manage media assets), I need a dedicated import path for the media module so that I can import exactly what I need without pulling in the entire SDK, resulting in cleaner imports and enabling bundlers to tree-shake unused modules.

**Why this priority**: Media operations are the most commonly used standalone module after messages and webhooks (which already have subpath exports). Developers building media management tools or CDN integrations should not need to import the entire SDK.

**Independent Test**: Can be fully tested by importing from the media subpath in both ESM and CommonJS environments and verifying that the Media class and all related types are available and usable.

**Acceptance Scenarios**:

1. **Given** a consumer wants to use only media operations, **When** they import from the media subpath, **Then** they receive the Media class and all related media types (MediaCategory, media constraints, upload/url/download/delete response types) without importing messages, templates, or other unrelated modules.

2. **Given** a consumer uses a bundler with tree-shaking enabled, **When** they import only the media subpath, **Then** the final bundle does not include code from messages, templates, phone numbers, or multi-account modules.

3. **Given** a consumer uses CommonJS require syntax, **When** they require the media subpath, **Then** they receive the same exports as the ESM import with full functionality.

4. **Given** a consumer uses TypeScript, **When** they import from the media subpath, **Then** full type definitions are available including autocompletion and type checking for all exported classes, interfaces, and types.

---

### User Story 2 - Import Templates Module via Subpath (Priority: P2)

As an SDK consumer building a template management dashboard or content management system, I need a dedicated import path for the templates module so that I can work with template CRUD operations and the TemplateBuilder without importing unrelated SDK modules.

**Why this priority**: Template management is a distinct use case from message sending. Consumers building admin panels or content management tools need templates and the builder but not messages, media, or webhooks.

**Independent Test**: Can be fully tested by importing from the templates subpath and verifying that the Templates class, TemplateBuilder, and all related types are available.

**Acceptance Scenarios**:

1. **Given** a consumer wants to manage message templates, **When** they import from the templates subpath, **Then** they receive the Templates class, TemplateBuilder, and all related types (TemplateCategory, TemplateStatus, CreateTemplateRequest, validation constants).

2. **Given** a consumer uses the templates subpath in a CommonJS project, **When** they require the module, **Then** the exports match the ESM version with full functionality.

3. **Given** a consumer uses TypeScript with the templates subpath, **When** they use the TemplateBuilder, **Then** all fluent API methods have proper type definitions and autocompletion.

---

### User Story 3 - Import Phone Numbers Module via Subpath (Priority: P3)

As an SDK consumer building a phone number management tool or onboarding flow, I need a dedicated import path for the phone numbers module so that I can manage phone numbers, business profiles, and verification without importing the full SDK.

**Why this priority**: Phone number management is an administrative function often handled by separate services or admin tools. These consumers do not typically need messaging or media capabilities.

**Independent Test**: Can be fully tested by importing from the phone-numbers subpath and verifying that the PhoneNumbers class and all related types are available.

**Acceptance Scenarios**:

1. **Given** a consumer wants to manage phone numbers, **When** they import from the phone-numbers subpath, **Then** they receive the PhoneNumbers class and all related types (PhoneNumber, BusinessProfile, request/response types).

2. **Given** a consumer uses the phone-numbers subpath in either module system, **When** the import resolves, **Then** it works correctly in both ESM and CommonJS environments with full type definitions.

---

### User Story 4 - Import Multi-Account Module via Subpath (Priority: P4)

As an SDK consumer building a multi-tenant WhatsApp platform that manages multiple business accounts, I need a dedicated import path for the multi-account module so that I can use the multi-account manager and distribution strategies without importing the full SDK.

**Why this priority**: Multi-account management is an advanced use case used by platform builders. While important, it serves a narrower audience than media or template management. The multi-account module has the most exports (manager class plus three distribution strategies) making a dedicated subpath especially valuable for discoverability.

**Independent Test**: Can be fully tested by importing from the multi-account subpath and verifying that the WhatsAppMultiAccount class, all three distribution strategies, and all related types are available.

**Acceptance Scenarios**:

1. **Given** a consumer wants to manage multiple WhatsApp business accounts, **When** they import from the multi-account subpath, **Then** they receive the WhatsAppMultiAccount class, RoundRobinStrategy, WeightedStrategy, StickyStrategy, and all related types (AccountConfig, MultiAccountConfig, DistributionStrategy, BroadcastMessageFactory, BroadcastOptions, BroadcastResult).

2. **Given** a consumer uses the multi-account subpath in either module system, **When** the import resolves, **Then** it works correctly in both ESM and CommonJS environments with full type definitions.

---

### Edge Cases

- What happens when a consumer imports from a subpath that has not been configured in the package exports map? The import fails with a standard module-not-found error at build or runtime, consistent with Node.js module resolution behavior.
- What happens when a consumer imports from both the main entry point and a subpath in the same project? Both imports resolve correctly without conflicts or duplicate module instances, as they reference the same underlying build output.
- What happens when a consumer uses an older version of Node.js that does not support package exports maps? Consumers on Node.js versions below 12.7 cannot use subpath exports. This is acceptable since the SDK already requires Node.js 18+.
- What happens when a consumer uses a bundler that does not respect the exports field in package.json? The consumer can fall back to importing from the main entry point, which continues to re-export all modules.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a dedicated import path for the media module, exposing the Media class and all related types from the media module's barrel export.
- **FR-002**: The system MUST provide a dedicated import path for the templates module, exposing the Templates class, TemplateBuilder, and all related types from the templates module's barrel export.
- **FR-003**: The system MUST provide a dedicated import path for the phone-numbers module, exposing the PhoneNumbers class and all related types from the phone-numbers module's barrel export.
- **FR-004**: The system MUST provide a dedicated import path for the multi-account module, exposing the WhatsAppMultiAccount class, all distribution strategies, and all related types from the multi-account module's barrel export.
- **FR-005**: All new subpath exports MUST produce ESM output that is importable via standard import syntax.
- **FR-006**: All new subpath exports MUST produce CommonJS output that is importable via require syntax.
- **FR-007**: All new subpath exports MUST include TypeScript declaration files providing full type information for all exported symbols.
- **FR-008**: The existing main entry point MUST continue to re-export all modules, preserving full backward compatibility.
- **FR-009**: The existing subpath exports for ./errors, ./messages, and ./webhooks MUST remain unchanged and functional.

### Key Entities

- **Subpath Export**: A dedicated import path defined in the package.json exports map that points to a specific module's build output (ESM, CJS, and type declarations). Each subpath corresponds to one SDK module and exposes only that module's public API.

- **Module Barrel Export**: An index file within each module directory that re-exports all public classes, interfaces, types, and constants intended for consumer use. Each new subpath points to the corresponding barrel export's compiled output.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can import the media module via its dedicated subpath and use all media operations without importing the full SDK.
- **SC-002**: A consumer can import the templates module via its dedicated subpath and use all template operations including the TemplateBuilder without importing the full SDK.
- **SC-003**: A consumer can import the phone-numbers module via its dedicated subpath and use all phone number operations without importing the full SDK.
- **SC-004**: A consumer can import the multi-account module via its dedicated subpath and use the multi-account manager and all distribution strategies without importing the full SDK.
- **SC-005**: All four new subpath imports resolve correctly in both ESM and CommonJS environments.
- **SC-006**: TypeScript autocompletion and type checking work correctly for all symbols imported via the new subpaths.
- **SC-007**: The existing main entry point and existing subpath exports (./errors, ./messages, ./webhooks) continue to work identically with zero changes required by consumers.
- **SC-008**: The SDK retains zero runtime dependencies after all changes.
- **SC-009**: All new subpath exports are covered by automated tests verifying import resolution in both module systems.

## Assumptions

1. **Existing barrel exports**: Each module directory (media, templates, phone-numbers, multi-account) already has an index.ts barrel export that re-exports all public symbols. No new source files need to be created — only build and package configuration changes are required.
2. **Build tooling support**: The existing tsup configuration can be extended to produce additional entry points for the new subpaths, following the same pattern used for ./errors, ./messages, and ./webhooks.
3. **Node.js version**: Consumers are on Node.js 18+ (as required by the SDK), which fully supports the package.json exports map for subpath resolution.
4. **Backward compatibility**: All changes are additive. No existing exports, import paths, or type definitions are modified or removed. Consumers who import from the main entry point are unaffected.
5. **Subpath naming convention**: Subpath names match the source directory names (./media, ./templates, ./phone-numbers, ./multi-account), consistent with the existing ./errors, ./messages, and ./webhooks convention.
6. **Tree-shaking verification**: Tree-shaking behavior (acceptance scenario US1-2) depends on the consumer's bundler configuration and is not verifiable in unit tests. The SDK provides the correct package.json exports map and separate entry points to enable tree-shaking, but actual bundle size reduction is the consumer's responsibility.
