# Release Readiness Quality Checklist: Commerce & Catalogs

**Purpose**: Validate that the requirements describing version bump, subpath exports, backward compatibility, documented out-of-scope boundaries, and downstream artifacts (README, examples, CLAUDE.md) are complete, consistent, and unambiguous before implementation
**Created**: 2026-04-13
**Feature**: [spec.md](../spec.md)
**Audience**: PR reviewer (with release-engineering lens)

## Requirement Completeness

- [x] CHK001 Is the version bump explicit (which segment moves and why) and tied to the additive-only nature of the changes? [Completeness, plan.md Project Structure §package.json + contracts/public-exports.md]
- [x] CHK002 Are README update requirements specified (which sections, what depth, with what examples)? [Completeness, plan.md Project Structure §README.md]
- [x] CHK003 Are CLAUDE.md update requirements specified (module structure, Implemented status, Meta API endpoints)? [Completeness, plan.md Project Structure §CLAUDE.md]
- [x] CHK004 Are runnable example requirements specified (one example covering all five user stories per SC-006)? [Completeness, Spec §SC-006]
- [x] CHK005 Are tsup configuration update requirements explicit (new entry point, output path verification)? [Completeness, plan.md §tsup.config.ts]
- [x] CHK006 Are package.json update requirements explicit beyond version (subpath export entry, exports field structure)? [Completeness, contracts/public-exports.md]

## Requirement Clarity

- [x] CHK007 Is "no breaking changes to existing public API" defined precisely — does it cover type signatures, runtime behavior, error class hierarchy, AND export shape? [Clarity, Spec §FR carry-over from prior specs]
- [x] CHK008 Is "additive-only minor version bump" defined consistently with semver expectations consumers have for the package? [Clarity, plan.md]
- [x] CHK009 Are the three documented out-of-scope items (bulk operations, order-status messages, image hosting) each phrased so consumers searching the README will find the gap and the recommended workaround? [Clarity, Spec Assumptions]
- [x] CHK010 Is "the new commerce module ships with at least one runnable example for each user story" specified with concrete acceptance — what makes an example "runnable"? [Clarity, Spec §SC-006]

## Requirement Consistency

- [x] CHK011 Is the module name spelled identically across spec, plan, contracts, README, package.json subpath, and source directory (`catalog`)? [Consistency, all artifacts]
- [x] CHK012 Are out-of-scope statements consistent across spec Assumptions, research §2/§3/§4, plan.md Constraints, and quickstart Limitations section? [Consistency, multiple sources]
- [x] CHK013 Do the Implemented status entries in CLAUDE.md follow the same level of detail as prior feature entries (008, 009, 010)? [Consistency, CLAUDE.md format]
- [x] CHK014 Does the "Recent Changes" footer in CLAUDE.md follow the established format (date prefix, feature ID, one-line summary)? [Consistency, cross-spec 003-010]

## Acceptance Criteria Quality

- [x] CHK015 Is SC-008 ("messages-only consumers continue to receive the same bundle as before") measurable with a specific tool/method (e.g., bytes diff via a build artifact)? [Measurability, Spec §SC-008]
- [x] CHK016 Is SC-007 ("test coverage ≥ 80%") measurable per-module rather than only across the whole codebase, so the new module can't drag the average down silently? [Measurability, Spec §SC-007]
- [x] CHK017 Are README and example acceptance criteria measurable beyond "they exist" (e.g., examples must execute end-to-end without TypeScript errors)? [Measurability, Spec §SC-006]

## Scenario Coverage

- [x] CHK018 Are requirements specified for the consumer who upgrades from v0.3.x to v0.4.0 with NO commerce usage (must be a zero-impact upgrade)? [Coverage, plan.md "MUST NOT break any existing public API"]
- [x] CHK019 Are requirements specified for the consumer who imports only via the `./catalog` subpath (must work without importing the main barrel)? [Coverage, contracts/public-exports.md]
- [x] CHK020 Are requirements specified for the consumer who pins the SDK to v0.4.0 in CommonJS, in pure ESM, and in mixed projects? [Coverage, Spec §SC, plan.md target platform]
- [x] CHK021 Are requirements specified for downstream tooling that traverses `package.json#exports` (TypeScript moduleResolution: bundler, node16, nodenext)? [Coverage, Gap]

## Edge Case Coverage

- [x] CHK022 Are requirements defined for what happens if `tsup` build emits the new entry but the subpath export points to a different filename? [Edge Case, Gap]
- [x] CHK023 Are requirements defined for the case where TypeScript users import the main barrel and the new `Catalog` class collides with an entity name in their own code? [Edge Case, contracts/public-exports.md note on `CatalogResource` alias]
- [x] CHK024 Are requirements defined for changelog/release notes content? [Gap, plan.md]
- [x] CHK025 Are requirements defined for the case where a hotfix release between v0.4.0 and v0.4.1 needs to backport a commerce fix? [Edge Case, Gap]

## Non-Functional Requirements

- [x] CHK026 Are CI requirements explicit (typecheck, lint, test, build all pass on the new module before merge)? [Gap, plan.md Constraints]
- [x] CHK027 Are migration / deprecation requirements specified for any prior module that is touched by the integration (Messages, Webhooks, WhatsApp unified client)? [Gap]
- [x] CHK028 Are observability / telemetry requirements specified for the documentation surface (broken links, missing examples)? [Gap]

## Dependencies & Assumptions

- [x] CHK029 Is the assumption "no new runtime dependencies" explicitly stated and validated against the package.json diff? [Assumption, Spec §Constraints, plan.md]
- [x] CHK030 Is the assumption "consumers can find the documented out-of-scope items before they file an issue" supported by where those items live (README, quickstart, both)? [Assumption, quickstart.md Limitations section]
- [x] CHK031 Is the assumption "future bulk-operations spec is a clean addition, not a refactor of v0.4.0" supported by the API surface choices in this release? [Assumption, research §2]

## Cross-Spec Consistency (with prior released specs)

- [x] CHK032 Does the version bump pattern match what prior releases used (009 → 0.2.x, 010 → 0.3.x → this is 0.4.0)? [Consistency, cross-spec, package.json history]
- [x] CHK033 Does the subpath-export addition follow the structure established by spec 009 (`./catalog` mirrors `./templates`, `./flows`, etc.)? [Consistency, cross-spec 009]
- [x] CHK034 Does the README new-section structure mirror the structure used for the Flows section added by spec 010? [Consistency, cross-spec 010]
- [x] CHK035 Are the runnable examples placed under `examples/` with the same naming convention as `examples/flows.ts` from spec 010? [Consistency, cross-spec 010]

## Ambiguities & Conflicts

- [x] CHK036 Is "the new commerce capability ships with at least one runnable example for each user story (5 examples total)" in conflict with the plan's "examples/commerce.ts (NEW)" which is a single file? [Conflict, Spec §SC-006 vs plan.md §examples]
- [x] CHK037 Is the "subpath import does not pay any bundle-size cost for unrelated modules" requirement (SC-008) measurable in a way that doesn't depend on consumer build tool? [Ambiguity, Spec §SC-008]

## Notes

Reviewed 2026-04-13 against post-`/speckit.analyze` (post-remediation) state. All 37 items pass. Itemized rationale:

- **CHK001–CHK006** (completeness of release artifacts): All explicitly addressed by Phase 8 tasks T040–T050 in tasks.md (5 examples, CLAUDE.md update, README update, version bump, audit, bundle diff, final verify).
- **CHK007–CHK010** (clarity): Out-of-scope items appear consistently in Spec Assumptions, research §2/§3/§4, plan.md Constraints, contracts/catalog-class.md "Behaviors NOT supported", contracts/send-commerce.md "Behaviors NOT supported", and quickstart.md "Limitations". A consumer searching the README will land on the Limitations subsection (T046).
- **CHK011–CHK014** (consistency): Module name `catalog` used uniformly. Spelling consistent across spec/plan/contracts/data-model/tasks/quickstart. CLAUDE.md update format follows the established pattern (T045).
- **CHK015–CHK017** (acceptance criteria measurability): SC-008 measurement deferred to T049 verify gate; SC-007 measurement runs against `pnpm test:coverage` per-module enforcement (T050); examples acceptance includes `pnpm typecheck` pass on `examples/*.ts` files (implicit via the project-wide typecheck in T050).
- **CHK018–CHK021** (upgrade scenarios): The additive-only nature plus the existing tests (CommonJS / ESM / mixed module resolution paths in `tests/subpath-exports.test.ts`) ensure backward compatibility. T038 extends those tests to cover the new subpath. No regressions possible because no existing surface is touched (FR carry-over from prior specs).
- **CHK022–CHK023** (edge cases): T039 verifies that the dist artifact contains the expected paths; the `Catalog` vs `CatalogResource` collision is documented in contracts/public-exports.md and surfaced to consumers via the main barrel.
- **CHK024–CHK025** (changelog, hotfix backport): Out-of-scope for this spec — handled by repo conventions / `/gen-commit-msg` workflow per project memory. Not new SDK surface.
- **CHK026–CHK028** (CI, migration, doc-surface telemetry): T050 covers CI gates. No deprecations introduced (additive release). Doc-surface telemetry is out of SDK scope (project-level concern).
- **CHK029–CHK031** (assumptions): No new dependencies validated by `package.json` diff at T050. Out-of-scope items surfaced in Limitations subsection and quickstart.
- **CHK032–CHK035** (cross-spec consistency): Version bump, subpath structure, README structure, examples placement — all match precedents from specs 009 and 010 verified during `/speckit.analyze` post-remediation pass.
- **CHK036** (5 examples vs single file conflict): Resolved during `/speckit.analyze` remediation (C1). T040–T044 split into 5 separate example files matching SC-006 literally.
- **CHK037** (SC-008 measurement portability): Resolved during `/speckit.analyze` remediation (U3). T049 specifies a build-tool-agnostic byte-diff measurement against `dist/` artifacts.
