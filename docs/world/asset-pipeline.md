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

## Automation Targets

Future scripts should check:

- Missing register entries.
- Missing files.
- Duplicate assets.
- Oversized textures.
- Uncompressed GLB files.
- License metadata.
- Bundle-size impact.
