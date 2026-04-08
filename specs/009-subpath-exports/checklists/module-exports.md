# Module Exports Checklist: Subpath Exports for Remaining Modules

**Purpose**: Validate requirements quality for package subpath exports — ESM/CJS dual output, TypeScript declarations, tree-shaking, and backward compatibility
**Created**: 2026-04-08
**Feature**: [spec.md](../spec.md)

## Requirement Completeness

- [ ] CHK001 - Are all four new subpath names explicitly listed with their corresponding module contents? [Completeness, Spec §FR-001–FR-004]
- [ ] CHK002 - Are the specific classes, types, and constants exposed by each subpath enumerated in the spec? [Completeness, Spec §FR-001–FR-004]
- [ ] CHK003 - Is the requirement for TypeScript declaration files specified for both ESM and CJS outputs? [Completeness, Spec §FR-007]
- [ ] CHK004 - Are requirements for the three existing subpath exports (./errors, ./messages, ./webhooks) documented as must-not-break constraints? [Completeness, Spec §FR-009]
- [ ] CHK005 - Is the main entry point preservation requirement explicitly stated? [Completeness, Spec §FR-008]

## Requirement Clarity

- [ ] CHK006 - Is the subpath naming convention clearly defined (directory-name matching) rather than left ambiguous? [Clarity, Spec §Assumptions-5]
- [ ] CHK007 - Are the ESM and CJS output formats specified with concrete file extensions (.js, .cjs, .d.ts, .d.cts)? [Clarity, Spec §FR-005–FR-007]
- [ ] CHK008 - Is "full type definitions" quantified — does it mean all exported symbols, or only public API surface? [Clarity, Spec §FR-007]
- [ ] CHK009 - Is "works correctly in both ESM and CommonJS environments" defined with specific resolution behavior (e.g., Node.js exports map, not legacy main/module fields)? [Clarity, Spec §FR-005–FR-006]

## Requirement Consistency

- [ ] CHK010 - Are the acceptance scenarios for each subpath consistent in their testing criteria across all four user stories? [Consistency, Spec §US-1–US-4]
- [ ] CHK011 - Is the pattern described for new subpaths consistent with how the existing three subpaths (./errors, ./messages, ./webhooks) are configured? [Consistency, Spec §Assumptions-5]
- [ ] CHK012 - Do the success criteria align with the functional requirements — is every FR covered by at least one SC? [Consistency, Spec §SC vs §FR]

## Acceptance Criteria Quality

- [ ] CHK013 - Can SC-005 ("resolve correctly in both ESM and CommonJS") be objectively measured without implementation knowledge? [Measurability, Spec §SC-005]
- [ ] CHK014 - Can SC-006 ("TypeScript autocompletion and type checking work correctly") be objectively verified? [Measurability, Spec §SC-006]
- [ ] CHK015 - Is SC-009 ("automated tests verifying import resolution") specific enough about what constitutes a passing test? [Measurability, Spec §SC-009]

## Scenario Coverage

- [ ] CHK016 - Are requirements defined for consumers using both the main entry point and a subpath simultaneously in the same project? [Coverage, Spec §Edge Cases]
- [ ] CHK017 - Are requirements specified for bundlers that do not respect the package.json exports field? [Coverage, Spec §Edge Cases]
- [ ] CHK018 - Are requirements addressed for consumers who depend on the SDK transitively (as a dependency of a dependency)? [Gap]

## Edge Case Coverage

- [ ] CHK019 - Is the behavior for importing a non-existent subpath explicitly defined in requirements? [Edge Cases, Spec §Edge Cases]
- [ ] CHK020 - Are requirements defined for what happens when dist output is stale or missing (e.g., consumer installs but build artifacts are incomplete)? [Gap]
- [ ] CHK021 - Is the minimum Node.js version requirement for subpath exports explicitly stated as a constraint? [Edge Cases, Spec §Assumptions-3]

## Dependencies & Assumptions

- [ ] CHK022 - Is the assumption that barrel exports already exist for all four modules validated against current source? [Assumption, Spec §Assumptions-1]
- [ ] CHK023 - Is the assumption that tsup can produce additional entry points without configuration issues documented with evidence? [Assumption, Spec §Assumptions-2]
- [ ] CHK024 - Is the zero-runtime-dependencies constraint restated as a success criterion? [Dependency, Spec §SC-008]

## Notes

- Focus: Module exports — package configuration, ESM/CJS dual output, TypeScript declarations, backward compatibility
- Depth: Standard (~24 items)
- Audience: Reviewer (PR-level)
- Key context: Research found that all four subpath exports are already implemented in package.json, tsup.config.ts, and dist/. Requirements should be validated against this reality.
