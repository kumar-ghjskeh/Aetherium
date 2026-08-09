# W24 World Accessibility

## Boundary

W24 makes the existing visual World Mode operable and understandable through keyboard, controller,
screen-reader, reduced-motion, high-contrast, and reduced-sensory paths. It does not change domain
data, authorization, database tables, or Command Mode ownership rules.

## Audit Findings

- Command Mode and map dialogs expose semantic dialog roles but do not trap or restore focus.
- The Command bridge closes on `Tab`, preventing normal keyboard traversal.
- Camera, atmosphere, and audio controls exist, but accessibility settings are distributed across
  diagnostic-only or separate panels.
- The runtime respects saved reduced-motion preferences at load and many scene animations already
  stop when reduced motion is active.
- High contrast, text scaling, and an explicit particle control are not available in World Mode.
- Gameplay supports a controller, but DOM dialogs do not yet support controller focus movement and
  activation.

## Implementation

- Add reusable focus trapping, Escape handling, focus restoration, and gamepad menu navigation.
- Preserve `Tab` for DOM focus navigation while keeping the world-surface Command shortcut.
- Add an accessibility panel with controls for:
  - Reduced motion.
  - Camera shake.
  - Cinematic travel.
  - Particles.
  - Dynamic weather.
  - High contrast.
  - World UI text size.
  - Sound captions.
  - Reduced sensory audio.
- Keep a direct Command Mode fallback link available from the panel.
- Apply explicit data attributes to the runtime frame so visual modes are testable without relying
  on color alone.
- Keep controls transient for the current World Mode visit. Saved product preferences remain the
  initial source of truth and continue to be edited through Command Mode Settings.

## Security And Privacy

- No credentials, private content, or owner-scoped records are stored in accessibility state.
- Existing authenticated APIs remain the only source of user data.
- No browser-exposed secrets or external services are added.
- No migration is required.

## Validation

- Unit tests for key capture, controller actions, and settings state.
- Component tests for focus trapping/restoration and accessibility controls.
- Keyboard-only Playwright scenario with accessibility-state assertions.
- Reduced-motion and high-contrast visual captures.
- `pnpm world:check` and the complete repository CI suite.

## Completion Evidence

- Unit and component coverage includes input capture, gamepad menu actions, accessibility state,
  Command-interface focus behavior, and accessibility-panel state coordination.
- The full web suite passes with 54 files and 202 tests.
- The API client passes 26 tests and the backend passes 159 tests.
- Both headed and headless Chromium pass all 20 World Mode scenarios, including the reviewed
  high-contrast baselines.
- The browser flow completes with no critical console errors, no failed application requests, and no
  axe violations.
- Independence, World asset policy, deployment readiness, formatting, linting, TypeScript and Python
  type checks, the production Next.js build, and full Alembic offline SQL generation all pass.
- No database migration, backend route, asset, or external service was added.
