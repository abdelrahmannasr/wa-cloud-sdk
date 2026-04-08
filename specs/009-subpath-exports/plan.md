# Implementation Plan: Subpath Exports for Remaining Modules

**Branch**: `009-subpath-exports` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-subpath-exports/spec.md`

## Summary

Add dedicated import subpaths for `./media`, `./templates`, `./phone-numbers`, and `./multi-account` modules, producing ESM, CJS, and TypeScript declaration outputs via tsup.

**Key Finding**: The build configuration and package.json exports map for all four subpaths are already fully implemented. The tsup entry points, barrel exports, and dist output files all exist. The remaining work is adding automated tests to verify subpath import resolution in both module systems and documenting the subpath exports in the README.

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode
**Primary Dependencies**: Zero runtime dependencies (dev: tsup 8, vitest 3)
**Storage**: N/A
**Testing**: Vitest with v8 coverage, minimum 80% threshold
**Target Platform**: Node.js 18+ (ESM + CJS dual output)
**Project Type**: Library (npm package)
**Performance Goals**: N/A (build/config change, no runtime impact)
**Constraints**: Zero runtime dependencies, backward compatibility
**Scale/Scope**: 4 new subpath exports following existing pattern of 3

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file is a placeholder template — no project-specific gates defined. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/009-subpath-exports/
├── plan.md              # This file
├── research.md          # Phase 0 output — existing implementation analysis
├── data-model.md        # Phase 1 output — subpath export mapping
├── quickstart.md        # Phase 1 output — consumer usage guide
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
# Already exists — no new source files needed
src/
├── media/index.ts           # Barrel export (exists, complete)
├── templates/index.ts       # Barrel export (exists, complete)
├── phone-numbers/index.ts   # Barrel export (exists, complete)
└── multi-account/index.ts   # Barrel export (exists, complete)

# Already configured
tsup.config.ts               # All 4 entry points (exists, complete)
package.json                  # All 4 exports map entries (exists, complete)

# Build output (already generated)
dist/
├── media/index.{js,cjs,d.ts,d.cts}
├── templates/index.{js,cjs,d.ts,d.cts}
├── phone-numbers/index.{js,cjs,d.ts,d.cts}
└── multi-account/index.{js,cjs,d.ts,d.cts}

# New files needed
tests/
└── subpath-exports.test.ts  # Verify all 7 subpath imports resolve correctly
```

**Structure Decision**: No new source or configuration files needed. The implementation is complete. Remaining work: a test file for subpath import verification and a README update documenting subpath imports.

## Complexity Tracking

No violations — feature follows an established pattern exactly.
