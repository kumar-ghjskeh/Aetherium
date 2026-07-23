# Phase W1 - World Runtime Foundation

## Status

Validated for the `feat: add world runtime foundation` commit.

## Boundary

Phase W1 adds the browser runtime foundation only. It installs the ADR-approved visual runtime
dependencies, enables the backend runtime feature flag, lazy-loads the `/app/world` canvas bundle,
and renders a minimal diagnostic scene. It does not implement final district art, terrain,
landmarks, player controls, camera travel, audio, assets, physics interactions, or visual world
progression.

## Affected Areas

- `apps/web/src/features/world/` runtime, fallback, diagnostics, and tests.
- `apps/web/src/app/globals.css` runtime layout and accessibility styles.
- `apps/api/app/services/foundation.py` world feature flag and scene-manifest status.
- Shared types, validation schemas, and API-client contract tests.
- `scripts/no-visual-world-check.mjs` dependency and asset policy guard.
- Documentation under `docs/world/`, `docs/testing/`, and repository status files.

## Security And Privacy Implications

- The runtime receives only existing owner-scoped world contracts and user preferences.
- No private files, raw prompts, object keys, cookies, session tokens, provider keys, Redis
  credentials, MinIO credentials, or database credentials are exposed in world manifests.
- Command Mode remains the fallback for unsupported browsers, reduced motion, and runtime errors.
- World interactions still route through authenticated APIs; W1 adds no mutation surface.

## Performance Implications

- Three.js and React Three Fiber are lazy-loaded only from `/app/world`.
- The diagnostic scene uses one directional light, one grid, one ground plane, one sky, one rotating
  diagnostic mesh, and low-cost fog.
- The runtime pauses rendering when the browser tab is hidden.
- Graphics presets control pixel ratio, antialiasing, and shadows.
- Diagnostics sample FPS, frame time, draw calls, triangles, active objects, and pixel ratio.

## Validation Checklist

- [x] Approved W1 dependencies installed only in `apps/web`.
- [x] `pnpm world:check` allows only approved dependencies and blocks unregistered model assets.
- [x] Backend feature flags expose `runtime_foundation`.
- [x] `/app/world` lazy-loads the visual bundle after data and capability checks.
- [x] Unsupported WebGL2 falls back to Command Mode.
- [x] User or system reduced motion falls back to Command Mode.
- [x] Runtime error boundary falls back to Command Mode.
- [x] Canvas pauses when the tab is hidden.
- [x] Runtime diagnostics are available outside production or with debug mode enabled.
- [x] Unit, frontend, backend, type, lint, build, and migration validation pass.
- [ ] Phase commit pushed.
