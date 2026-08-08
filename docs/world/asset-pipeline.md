# Asset Pipeline

## Goal

World Mode assets must be web-appropriate, license-safe, deterministic where possible, and
documented before use.

## Asset Sources

Priority order:

1. Procedural geometry.
2. Original script-generated Blender assets.
3. CC0 assets.
4. Public-domain assets.
5. MIT-compatible utilities.
6. Free glTF/GLB assets with clear redistribution rights.

## Formats

- glTF or GLB for models.
- Draco compression where appropriate.
- Meshopt compression where appropriate.
- KTX2/Basis textures where supported.
- Compressed audio.
- SVG for interface icons.
- Procedural geometry for repeated architectural and landscape forms.

## Naming

Use stable names:

```text
world-{district}-{asset-role}-{variant}
```

Examples:

- `world-plaza-crystal-core-a`
- `world-library-arch-column-a`
- `world-garden-plant-stage-02`

## Registration

Every asset must be added to:

- `docs/world/asset-register.md`
- `apps/web/src/features/world/manifests/assets.manifest.ts` after W5

The asset register records source, license, author, modification, path, and attribution needs.

## Optimization

Before final use:

- Remove unused mesh data.
- Merge static geometry where useful.
- Generate LODs for large objects.
- Compress textures.
- Prefer instancing for repeated objects.
- Keep source and optimized files clearly separated if source files are retained.

## Prohibited Assets

- Paid assets.
- Ripped game assets.
- Copyrighted characters.
- Proprietary game files.
- Unclear-license downloads.
- Assets copied from another private project.

## Automated Gate

Run:

```text
pnpm world:assets:test
pnpm world:assets:check
pnpm world:assets:report
```

`world:check` includes both asset tests and the asset check, so the CI gate rejects:

- Manifest IDs missing from the asset register.
- Runtime files missing from the manifest.
- Manifest paths with no file.
- Duplicate IDs, paths, or content hashes.
- Files outside `apps/web/public/world`.
- Path traversal and unsafe or inconsistent names.
- Unsupported runtime and source-only formats.
- Missing source, author, license, attribution, compression, hash, or size-budget metadata.
- Hash mismatches and size-budget violations.

`world:assets:report` writes ignored output to `artifacts/world-assets-report.json`. The report
contains counts and byte totals only; it does not copy assets.

## Compression Workflow

The runtime accepts optimized delivery formats such as GLB/glTF, KTX2/Basis, WebP/AVIF, and
compressed OGG/MP3. File-backed entries must declare their compression method. Source formats such
as Blender, FBX, PSD, EXR, TIFF, HDR, and WAV are rejected from the runtime directory.

No file-backed assets exist through W22, so running a compressor would be misleading. When the first
asset is introduced, optimization must happen before registration using a documented free tool such
as glTF Transform for mesh/Draco/Meshopt work and `toktx` for KTX2. The optimized file's SHA-256 and
byte budget are then committed to the manifest, and CI enforces the result.
