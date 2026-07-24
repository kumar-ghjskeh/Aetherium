# Phase W4 - Interaction Framework

## Task Boundary

Implement the reusable World Mode interaction framework inside the diagnostic runtime. This phase
adds typed interaction contracts, radius detection, facing-aware ranking, activation state
resolution, permission/loading/error/disabled states, diagnostic markers, accessible prompts, and
Command Mode route activation from existing world deep-link data. It does not implement final
district-specific props, custom 3D panels, fast travel, backend mutations, audio, final world art,
or cinematic interaction framing.

## Affected Modules

- `apps/web/src/features/world/engine/interaction-system.ts`
- `apps/web/src/features/world/engine/interaction-manifest.ts`
- `apps/web/src/features/world/state/interaction-store.ts`
- `apps/web/src/features/world/components/interactions/`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/app/globals.css`
- World Mode documentation and readiness notes.

## Security And Privacy

- Interaction definitions use existing Command Mode deep-link routes and do not include private
  data.
- Client-side permission and disabled states are ergonomic only; future mutations must remain
  server-authorized through owner-scoped APIs.
- No object-storage keys, document bodies, AI prompts, cookies, provider secrets, or session values
  are added to interaction state or telemetry.
- Activation routes through Command Mode pages rather than directly mutating user data.

## Migration Impact

No database migration is required. This phase adds no backend tables, indexes, routes, or persistent
schema changes.

## Performance Notes

- Interaction radius and ranking logic are pure functions with unit tests.
- Diagnostic marker count is small and fixed.
- Interaction state updates only when active interaction changes or the user activates an action.
- The prompt is a 2D overlay to keep complex reading and data workflows in Command Mode.

## Validation Checklist

- [x] Interaction radius detection is covered by tests.
- [x] Facing-aware priority ranking is covered by tests.
- [x] Disabled, permission-denied, loading, and error states are modeled.
- [x] Command-route activation is covered by tests.
- [x] Diagnostic interactions are generated from existing deep links and location unlock state.
- [x] Accessible prompt and keyboard/gamepad activation contracts are implemented.
- [x] Focused web type check passes.
- [x] Focused web tests pass.
- [x] Full formatting, linting, type checks, tests, build, World Mode guard, and Alembic SQL smoke
      pass.
- [ ] Phase commit is pushed.

## Known Limitations

- Diagnostic interaction markers are not final district art.
- Fast travel and cinematic travel remain scheduled for later phases.
- Interaction camera framing remains scheduled after authored interaction points exist.
- Screenshot and browser visual regression automation remains scheduled for W23.
