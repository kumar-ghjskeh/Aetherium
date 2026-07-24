# Phase W2 - Player Controller

## Task Boundary

Implement the World Mode player-controller foundation inside the existing diagnostic runtime only.
This phase adds testable input mapping, deterministic movement-state calculation, a Rapier-backed
capsule controller, a procedural stylized avatar, pause handling, and runtime telemetry. It does not
implement final terrain, polished camera behavior, district art, map travel, district interactions,
audio, or visual progression.

## Affected Modules

- `apps/web/src/features/world/engine/input-system.ts`
- `apps/web/src/features/world/engine/player-controller.ts`
- `apps/web/src/features/world/state/player-store.ts`
- `apps/web/src/features/world/hooks/use-world-input.ts`
- `apps/web/src/features/world/components/character/`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/features/world/components/environments/diagnostic-scene.tsx`
- `apps/web/src/features/world/components/diagnostics/runtime-diagnostics-panel.tsx`
- `apps/web/src/app/globals.css`
- World Mode documentation and readiness notes.

## Security And Privacy

- The controller is client-only transient state and does not persist private user data.
- No secrets, object-storage keys, document bodies, AI prompts, or session values are exposed in the
  runtime, manifests, tests, or telemetry.
- Gamepad and keyboard input remain local to the browser runtime.
- Future mutations must continue to call authenticated owner-scoped APIs instead of storing state in
  the scene.

## Migration Impact

No database migration is required. This phase adds no backend tables, indexes, routes, or persistent
schema changes.

## Performance Notes

- Movement intent and movement-state calculations are pure functions covered by unit tests.
- Runtime state publishing is throttled so per-frame updates do not force broad React rerenders.
- The procedural avatar uses simple built-in geometry and no external assets.
- Physics remains limited to one dynamic capsule and a fixed diagnostic ground collider.

## Validation Checklist

- [x] Keyboard movement intent is normalized, including diagonals.
- [x] Gamepad movement intent applies dead zones.
- [x] Sprint state is distinct from jog and walk.
- [x] Pause state stops movement.
- [x] Falling and landing transitions are deterministic.
- [x] Diagnostic runtime includes a collision-ready capsule body.
- [x] Focused web type check passes.
- [x] Focused web tests pass.
- [x] Full formatting, linting, type checks, tests, build, World Mode guard, and Alembic SQL smoke
      pass.
- [ ] Phase commit is pushed.

## Known Limitations

- The W2 avatar is procedural and intentionally asset-free.
- Camera behavior remains the W1 diagnostic camera until W3.
- Collision is limited to the diagnostic ground plane, not final terrain or district collision
  meshes.
- Screenshot and browser visual regression automation remains scheduled for W23.
