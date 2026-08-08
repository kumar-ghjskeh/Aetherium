# Phase W21 - World Performance System

## Boundary

Turn the approved graphics presets and runtime diagnostics into enforceable browser-runtime
contracts. This phase adds no backend schema, migration, external service, dependency, or asset.

## Implementation

- Define typed Low, Balanced, and High budgets for pixel ratio, view distance, shadows, vegetation,
  particles, water, draw calls, triangles, and texture memory.
- Implement Automatic mode with four-sample degradation and twelve-sample recovery hysteresis.
- Reduce pixel ratio before lowering the effective graphics tier.
- Apply adaptive pixel ratio and view distance directly to the renderer and camera.
- Use no shadows in Low, a 1024 sun shadow map in Balanced, and a 2048 map in High.
- Move runtime metrics into a dedicated Zustand store so samples do not rerender the canvas owner.
- Report FPS, frame time, draw calls, triangles, active meshes, loaded GPU resources, estimated
  texture memory, physics bodies, pixel ratio, and available JavaScript heap use.
- Surface budget warnings and use them as Automatic-mode pressure signals.
- Use ACES filmic tone mapping while retaining route lazy loading and hidden-panel/tab pausing.

## Security And Privacy

- Diagnostics contain aggregate rendering counters only.
- No user content, source text, API response body, cookie, token, object key, provider secret,
  database credential, or device identifier enters diagnostics.
- Browser heap reporting is optional and remains local; it is not transmitted or persisted.

## Validation Checklist

- [x] Preset budget and pixel-ratio tests.
- [x] Automatic degradation and recovery-hysteresis tests.
- [x] Resource-warning tests.
- [x] Dedicated performance-store tests.
- [x] Strict TypeScript validation and frontend lint.
- [x] Full repository CI.
- [x] Production build.
- [x] Alembic SQL smoke validation.
- [x] W23 hardware browser probes remain explicitly deferred.
- [x] Commit and push.
