# World Asset Register

Every committed visual or audio asset must be recorded here before it is used by World Mode.

No external visual or audio assets are registered through Phase W5. W5 adds procedural placeholder
asset IDs in `apps/web/src/features/world/manifests/assets.manifest.ts`; those entries are original
Aetherium planning records and do not point to committed model, texture, or audio files.

## License Rules

Allowed:

- Original procedural geometry.
- Script-generated Blender outputs created for Aetherium.
- CC0 assets.
- Public-domain assets.
- MIT-compatible utilities where relevant.
- Free glTF/GLB assets with clear redistribution rights.

Disallowed:

- Ripped game assets.
- Paid assets.
- Copyrighted characters, brands, maps, or distinctive trade dress.
- Proprietary game files.
- Assets with unclear licensing.
- Unattributed downloads.

## Register Template

| Asset ID           | Asset Name    | Type                | Source           | Author      | License          | Download Date | Modifications | Repository Path | Attribution Required | Redistribution Notes | Reviewer |
| ------------------ | ------------- | ------------------- | ---------------- | ----------- | ---------------- | ------------- | ------------- | --------------- | -------------------- | -------------------- | -------- |
| `example-asset-id` | Example asset | model/audio/texture | URL or generated | Author name | CC0/MIT/original | YYYY-MM-DD    | Summary       | `apps/web/...`  | Yes/No               | Notes                | Reviewer |

## Procedural Asset Template

| Asset ID                   | Generator                        | Seed                 | Output Path    | License               | Notes                |
| -------------------------- | -------------------------------- | -------------------- | -------------- | --------------------- | -------------------- |
| `example-procedural-rocks` | `scripts/world/generate-rocks.*` | `aetherium-rocks-v1` | `apps/web/...` | Original to Aetherium | Deterministic output |

## Review Checklist

- License permits repository use and redistribution.
- Asset has no trademarked or copyrighted character resemblance.
- File size is appropriate for web delivery.
- Texture dimensions are power-of-two where needed.
- Compression plan is documented.
- Attribution requirements are represented in UI/docs if required.
- Asset path follows Aetherium naming conventions.
