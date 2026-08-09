# W25 Final World Polish

## Boundary

W25 converts the complete, tested World Mode foundation into the final product presentation. It
refines shared rendering, environment, camera, collision, audio/UI wording, responsive layout, and
loading/error surfaces without duplicating backend data or changing owner authorization.

## Visual Audit

- All ten districts render and use real Aetherium data, but the reviewed W23 baselines are visually
  flat, over-fogged, and read as procedural prototypes.
- Day lighting washes terrain and mountain colors while dark landmark materials lose surface
  separation.
- The world lacks the vegetation density promised by the performance presets.
- Several fast-travel views frame buildings too far away; Progress Tower is cropped vertically.
- The `/app/world` page still exposes implementation language, technical registries, and a build
  progress rail instead of prioritizing the world.
- Terrain collision is present, but district landmarks need bounded simplified collision and camera
  obstruction handling.

## Implementation Plan

- Make the live world the primary unframed route experience and remove prototype/debug copy from
  normal product UI.
- Tune time-of-day colors, fog, exposure, shadows, water, and emissive response.
- Add restrained preset-aware bloom/vignette only where the performance tier allows it.
- Add deterministic instanced trees and ground cover with no downloaded assets.
- Add data-driven district arrival focus, approach distance, and simplified collision dimensions.
- Add bounded landmark collision and camera blocker calculations.
- Polish loading, fallback, HUD, labels, prompts, controls, and responsive dimensions.
- Keep diagnostics development-only and keep reduced-motion, high-contrast, sensory, and Command
  Mode fallbacks intact.

## Security And Privacy

- Existing authenticated APIs remain the only data source.
- Scene dressing and camera metadata contain no user data or secrets.
- No new external service, storage object, browser secret, or mutation path is introduced.
- No database migration is required.

## Acceptance Evidence

- Deterministic unit tests for vegetation, framing, collision, and time-of-day output.
- Full web, API-client, and backend suites.
- Updated headed and headless visual baselines reviewed across all ten districts, day/sunset/night,
  Low/Balanced presets, accessibility, failure, and fallback states.
- Runtime performance evidence at 1080p Low, 1080p Balanced, and 1440p Balanced.
- Clean console/network checks, production build, policy guards, and Alembic SQL validation.

## Completion

- `/app/world` now presents Aetherium Campus as the primary full-width experience and no longer
  exposes roadmap, registry, diagnostic-scene, or future-world language in normal product UI.
- Ten typed location records now own arrival focus, arrival distance, camera obstruction, and
  simplified landmark collision dimensions.
- The shared renderer now uses a camera-following deterministic sun/shadow volume, gradient sky,
  tuned time-of-day palette, restrained tier-aware post-processing, denser deterministic instanced
  vegetation, and revised terrain depth.
- District collision uses bounded Rapier cylinders; no detailed visual mesh is promoted to a physics
  collider.
- Arrival framing now begins when Rapier consumes the teleport rather than when navigation requests
  it. The camera derives an exterior landmark distance from the travel approach and authored
  backoff, while slow visual-test rendering gets a test-only extended framing window.
- The controller corrects terrain penetration after unusually slow frames, and map travel resolves
  the selected destination from current store state to avoid stale same-frame selection.
- Location-marker labels derive their approach-facing orientation from the travel manifest. Project
  Dock keeps its canvas presentation free of duplicate reverse-face signs and relies on the
  persistent HUD and accessible interaction prompts for its location name.
- Loading, service failure, reduced-motion, unsupported-WebGL, high-contrast, and Command Mode
  fallbacks remain explicit and tested.
- Password login now opens `/app` directly instead of compiling and traversing the legacy `/command`
  redirect; headed and headless browser coverage verifies the authenticated shell is visible after
  login.
- The visual suite now includes a compact-screen overlay geometry check so atmosphere/audio controls
  and district data panels remain readable without overlapping.
- No external visual asset, package, user-data field, API mutation, secret, or migration was added.

Final headed Chromium evidence on the target laptop:

| Scenario       | FPS | Frame time | Triangles | Texture estimate |
| -------------- | --: | ---------: | --------: | ---------------: |
| 1080p Low      |  60 |    16.6 ms |    72,506 |            72 MB |
| 1080p Balanced |  35 |    28.3 ms |    91,458 |           148 MB |
| 1440p Balanced |  60 |    16.6 ms |    91,458 |           148 MB |

The 1080p Balanced sample clears the 30 FPS usability floor but did not meet the aspirational 60 FPS
target in that capture. Automatic mode can reduce pixel ratio or tier when sustained samples exceed
the frame budget.
