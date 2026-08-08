# World Asset Register

Every committed visual or audio asset must be recorded here before it is used by World Mode.

No external visual or audio assets are registered through Phase W15. W5 adds procedural placeholder
asset IDs in `apps/web/src/features/world/manifests/assets.manifest.ts`; those entries are original
Aetherium planning records and do not point to committed model, texture, or audio files. W6 adds
code-generated terrain, water, mist, rocks, clouds, route lines, and district foundation markers
only. W7 adds a procedural Central Plaza, crystal, arches, water channels, terminal pods, and
in-scene labels through React Three Fiber primitives. It adds no downloaded model, texture, or audio
files. W8 adds a procedural Knowledge Library exterior, dome, rings, shelf/tablet displays,
collection shelves, file display tablets, and tag markers through React Three Fiber primitives. It
adds no downloaded model, texture, or audio files. W9 adds a procedural AI Observatory dome, orbital
rings, mentor probes, status terminals, columns, and probe labels through React Three Fiber
primitives. It adds no downloaded model, texture, or audio files. W10 adds a procedural Habit Garden
terrace, pond, water channels, plant beds, canopy light, milestone crystals, and habit labels
through React Three Fiber primitives. It adds no downloaded model, texture, or audio files. W11 adds
a procedural Learning Academy exterior, wing structures, course halls, lesson stations, mastery
beacon, and a fixed DOM roadmap-progress panel. It adds no downloaded model, texture, or audio
files. W12 adds a procedural Coding Arena, tiered stands, compiler core, code rails, workspace
consoles, exercise pylons, and sealed runner vault. It adds no downloaded model, texture, or audio
files. W13 adds a procedural Project Dock, water slips, workshop control room, crane, construction
berths, milestone signals, and blocker beacons. It adds no downloaded model, texture, or audio
files. W14 adds a procedural Progress Tower, structural fins, metric floors, study-trend columns,
observation rings, and crystal crown. It adds no downloaded model, texture, or audio files. W15 adds
a procedural Achievement Hall, colonnade, memorial wall, laurels, trophy pedestals, certificate
plaques, completed-project models, and world-unlock crystals. It adds no downloaded model, texture,
or audio files. W16 adds a procedural Personal Sanctuary terrace, pavilion, symbolic avatar focus,
favorite alcoves, certificate displays, privacy shields, and preference beacons. It adds no
downloaded model, texture, image, or audio files.

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
