# Phase W3 - Camera System

## Task Boundary

Implement the World Mode camera foundation inside the diagnostic runtime only. This phase adds pure
camera math, a transient camera store, mouse/wheel/gamepad camera input, smooth third-person follow,
distance/FOV/sensitivity/smoothing controls, reduced-motion-aware behavior, optional sprint camera
shake, recenter support, and basic diagnostic collision shortening. It does not implement authored
cinematic travel paths, map overview rendering, interaction camera sequences, final terrain,
district collision meshes, audio, or final world art.

## Affected Modules

- `apps/web/src/features/world/engine/camera-system.ts`
- `apps/web/src/features/world/engine/camera-system.test.ts`
- `apps/web/src/features/world/state/camera-store.ts`
- `apps/web/src/features/world/hooks/use-world-camera-input.ts`
- `apps/web/src/features/world/components/camera/`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/features/world/components/diagnostics/runtime-diagnostics-panel.tsx`
- `apps/web/src/features/world/components/environments/diagnostic-scene.tsx`
- `apps/web/src/app/globals.css`
- World Mode documentation and readiness notes.

## Security And Privacy

- Camera settings and pose are local transient client state.
- No private user data, object-storage keys, document bodies, AI prompts, cookies, or provider
  secrets are added to camera state or telemetry.
- The camera rig does not call backend mutation APIs.
- Future interaction and cinematic travel work must continue to route through existing owner-scoped
  APIs and Command Mode deep-link contracts.

## Migration Impact

No database migration is required. This phase adds no backend tables, indexes, routes, or persistent
schema changes.

## Performance Notes

- Camera math is implemented as pure functions with unit tests.
- Camera pose is published to Zustand only when coarse telemetry changes.
- Normal follow behavior does not depend on GSAP timelines.
- Camera collision is limited to low-cost diagnostic blockers and simple world bounds until final
  district collision meshes exist.

## Validation Checklist

- [x] Orbit pitch and distance are clamped.
- [x] Reduced motion disables cinematic travel mode selection and sprint FOV expansion.
- [x] Panel and interaction modes take priority over cinematic travel.
- [x] Sprint FOV transition is deterministic.
- [x] Diagnostic camera collision shortens the camera segment before blockers.
- [x] Smooth damping avoids instant snapping.
- [x] Focused web type check passes.
- [x] Focused web tests pass.
- [x] Full formatting, linting, type checks, tests, build, World Mode guard, and Alembic SQL smoke
      pass.
- [ ] Phase commit is pushed.

## Known Limitations

- Camera behavior is validated in unit tests and the diagnostic runtime, not final 3D districts.
- Interaction framing contracts are represented by mode priority only; W4 will add interaction
  points and prompts.
- Cinematic travel path execution remains scheduled for W17.
- Screenshot and browser visual regression automation remains scheduled for W23.
