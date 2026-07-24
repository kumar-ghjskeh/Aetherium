# Phase W6 - Terrain And Environment Foundation

## Task Boundary

Implement the deterministic terrain and environment foundation for the future connected World Mode
campus. This phase replaces the small diagnostic ground plane with source-generated terrain, river,
waterfall sheets, route surfaces, mountain perimeter, bounded atmosphere props, and district
foundation markers driven by the W5 manifests. It does not implement final district buildings,
Central Plaza terminals, dense foliage, spatial audio, dynamic weather, final navigation, visual
regression automation, terrain-following collision, or polished district interactions.

## Affected Modules

- `apps/web/src/features/world/engine/terrain-system.ts`
- `apps/web/src/features/world/engine/terrain-system.test.ts`
- `apps/web/src/features/world/components/environments/world-environment-scene.tsx`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/features/world/components/character/player-controller.tsx`
- World Mode architecture, layout, performance, asset, testing, README, readiness, and agent docs.

## Security And Privacy

- The environment is generated entirely from source-controlled configuration and contains no private
  user data.
- No object-storage keys, file bodies, AI prompts, cookies, provider secrets, database credentials,
  Redis credentials, or user-owned records are embedded in terrain data.
- District foundation markers use public route/location metadata only; runtime actions still route
  through existing authenticated APIs and Command Mode deep links.
- No downloaded assets or third-party art are added.

## Migration Impact

No database migration is required. This phase adds no backend tables, indexes, routes, workers,
object-storage buckets, Redis keys, or persistent schema changes.

## Performance Notes

- Terrain uses a single generated mesh with a `96 x 96` grid.
- The river is a single generated ribbon.
- Environment prop counts are bounded by graphics preset.
- No dense foliage, texture loads, post-processing, spatial audio, or asset bundles are introduced.
- Physics remains a stable fixed traversal collider; terrain-following collision is deferred.

## Validation Checklist

- [x] Deterministic terrain height sampling is covered by tests.
- [x] Central valley and mountain perimeter shaping are covered by tests.
- [x] River corridor carving is covered by tests.
- [x] Terrain mesh and river ribbon geometry counts are covered by tests.
- [x] Route generation consumes the W5 location manifest.
- [x] Environment prop generation is seeded, bounded, and covered by tests.
- [x] Graphics-preset environment budgets are covered by tests.
- [x] Runtime scene renders the W6 terrain foundation instead of the tiny diagnostic plane.
- [x] Terrain-bound player reset is implemented.
- [x] Focused web type check passes.
- [x] Focused web tests pass.
- [x] Full formatting, linting, type checks, tests, build, World Mode guard, and Alembic SQL smoke
      pass.
- [x] Phase commit is pushed.

## Known Limitations

- The player still walks on a conservative fixed collider rather than following terrain elevation.
- District foundation markers are not final district art.
- Water and waterfall visuals are simple procedural materials without textures.
- Browser screenshot evidence and frame-metric automation remain scheduled for W23 because no
  Playwright visual world harness is active in the repo yet.
- Central Plaza data integration and polished terminals begin in W7.
