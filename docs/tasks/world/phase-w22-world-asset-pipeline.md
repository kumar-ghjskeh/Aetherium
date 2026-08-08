# Phase W22 - World Asset Pipeline

## Boundary

Add a strict, free, source-controlled asset validation and reporting workflow. No model, texture,
image, audio file, external download, backend migration, or production service is added.

## Implementation

- Parse the TypeScript asset manifest through the TypeScript compiler API instead of regular
  expressions or dynamic execution.
- Require every manifest ID to appear in the human-reviewable asset register.
- Require file-backed assets to stay under `apps/web/public/world`.
- Require stable `world-<district>-<role>` filenames and supported web delivery formats.
- Require source, author, approved license, attribution, compression, SHA-256, and byte-budget
  metadata for every file-backed asset.
- Reject missing, unregistered, source-only, oversized, hash-mismatched, and duplicate files.
- Add deterministic Node tests for parsing, procedural records, failure cases, and bundle reports.
- Add an ignored JSON size report and include the asset tests/check in `pnpm world:check` and CI.
- Broaden typed manifest contracts for future approved models, textures, images, and audio while
  preserving original procedural records.

## Security And Licensing

- Asset files are treated as untrusted build inputs and are never executed by the check.
- The manifest is parsed as syntax rather than imported.
- Paid, unclear-license, proprietary, ripped, and private-project assets remain prohibited.
- No network request or external package download is needed to validate the current registry.

## Validation Checklist

- [x] Manifest parser tests.
- [x] Registration, path, naming, format, metadata, hash, size, and duplicate checks.
- [x] Deterministic bundle report test.
- [x] Current procedural-only registry passes.
- [x] Full repository CI.
- [x] Production build.
- [x] Alembic SQL smoke validation.
- [x] Commit and push.
