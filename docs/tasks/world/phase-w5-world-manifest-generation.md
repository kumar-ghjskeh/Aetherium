# Phase W5 - World Manifest And Generation System

## Task Boundary

Implement the typed, data-driven manifest layer for future visual World Mode generation. This phase
adds source-controlled registries for locations, assets, spawns, fast travel, interactions,
environment zones, audio zones, camera routes, district themes, and deterministic validation. It
does not implement final terrain, district art, foliage, audio playback, cinematic travel execution,
asset bundles, backend schema changes, or finished district interactions.

## Affected Modules

- `apps/web/src/features/world/schemas/world-manifest-schema.ts`
- `apps/web/src/features/world/manifests/`
- `apps/web/src/features/world/engine/scene-registry.ts`
- `apps/web/src/features/world/engine/interaction-manifest.ts`
- `apps/web/src/features/world/engine/world-manifest.test.ts`
- World Mode architecture, layout, readiness, testing, README, and agent guidance docs.

## Security And Privacy

- Manifests are static frontend configuration and contain no private user data.
- Manifests contain no object-storage keys, provider keys, session cookies, database credentials,
  Redis credentials, raw prompts, file bodies, or user-owned content.
- Backend ownership remains authoritative. The interaction bridge still uses owner-scoped world
  location unlock state and deep-link data from the existing API before exposing runtime
  interactions.
- Command Mode routes in manifests are constrained to `/app` routes.

## Migration Impact

No database migration is required. This phase adds no backend tables, indexes, routes, workers,
object-storage buckets, Redis keys, or persistent schema changes.

## Performance Notes

- Manifest validation is deterministic and runs in tests, not per frame.
- Scene-registry lookups use maps for stable location, fast-travel, and interaction access.
- Asset entries are procedural placeholders only; no final geometry, textures, audio, or bundles are
  loaded by W5.
- The route-local lazy World Mode boundary remains unchanged, so Command Mode bundles are not
  expanded by final district assets.

## Validation Checklist

- [x] Typed world manifest schema is implemented.
- [x] Ten planned district locations are registered inside the 800 m world bounds.
- [x] Backend location identifiers and Command Mode routes are mapped.
- [x] Asset, theme, environment-zone, and audio-zone references are validated.
- [x] Spawn, fast-travel, interaction, and skippable camera-route references are validated.
- [x] Diagnostic interaction generation consumes the source-controlled manifest and backend unlock
      state.
- [x] Broken manifest references are rejected by tests.
- [x] Focused web type check passes.
- [x] Focused web tests pass.
- [x] Full formatting, linting, type checks, tests, build, World Mode guard, and Alembic SQL smoke
      pass.
- [x] Phase commit is pushed.

## Known Limitations

- The manifest coordinates are planning/runtime data for later generation, not final terrain.
- No final district buildings, landscape meshes, audio playback, asset bundles, map UI, or cinematic
  route execution exists yet.
- Fast-travel entries are registry data only until W17.
- Visual screenshot automation remains scheduled for W23.
