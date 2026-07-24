# World Engine Architecture

## Role

World Mode is an optional presentation layer for the same backend state used by Command Mode. It
must not own separate copies of documents, habits, tasks, AI conversations, progress, or
achievements.

## Current Status

The W1 diagnostic 3D runtime foundation, W2 player-controller foundation, W3 camera foundation, and
W4 interaction framework are implemented. The protected `/app/world` route still loads API-backed
world data contracts first, then lazy-loads a route-local visual bundle only when the backend
runtime flag, scene manifest, browser WebGL2 support, and reduced-motion settings allow it.

ADR 0025 now defines the approved visual World Mode architecture. It selects a browser-native React
Three Fiber and Three.js runtime, with WebGL2 as the default, WebGPU experiments behind feature
flags, route-level lazy loading, Command Mode fallback, strict asset licensing, and performance
budgets. W2 adds normalized keyboard/gamepad input, deterministic movement-state logic, a Rapier
capsule controller, and a procedural diagnostic avatar. W3 adds smooth third-person follow, orbit
input, FOV and smoothing settings, reduced-motion-aware behavior, and basic diagnostic camera
collision. W4 adds typed interaction contracts, diagnostic deep-link-backed interaction terminals,
radius/facing ranking, permission/loading/error state modeling, accessible prompts, and Command Mode
routing. Final district scenes, authored cinematic travel paths, navigation maps, audio, and assets
remain deferred to later W phases.

The current non-visual foundation stores world profile data only:

- Current and last visited location identifiers.
- Spawn location identifier.
- Preferred navigation method.
- Tutorial completion state.
- World-state version.
- Visited and unlocked location identifier lists.

This data is available through `/api/v1/world/profile` and `/api/v1/world/visit`. It is a future
World Mode contract, not a rendered scene.

The Phase 18 data foundation also exposes:

- `GET /api/v1/world/locations`
- `GET /api/v1/world/locations/unlocked`
- `GET /api/v1/world/locations/visited`
- `GET /api/v1/world/locations/{location_id}`
- `GET /api/v1/world/deep-links`
- `GET /api/v1/world/scene-manifest`
- `GET /api/v1/world/feature-flags`

The scene manifest contains future scene keys only. In W1 it sets `visualRuntimeAvailable` to `true`
for the diagnostic runtime, keeps every location `allowedToRender` value at `false`, and contains no
asset bundle references.

The achievement engine also writes `world_unlock_records` as future destination identifiers such as
`achievement_hall:first_file_display`. These are non-visual progression records for the later World
Mode phase. They must not be treated as rendered scenes, assets, character state, or access gates to
the user's data.

## Future Runtime Layers

- Next.js route boundary for World Mode.
- React Three Fiber renderer under a lazy `/app/world` route boundary.
- Three.js assets and scene graph.
- Zustand transient state for camera, controls, selected location, and debug overlays.
- TanStack Query for server state shared with Command Mode.
- Asset loading by district or zone.
- Fixed-seed world generation for deterministic screenshots and regression tests.

## Progressive Enhancement

The app must load Command Mode when:

- WebGL is unavailable.
- Reduced motion is enabled.
- The user selects low-performance mode.
- The 3D bundle fails to load.
- Hardware is below the selected performance preset.

## Initial World Scope

W1 renders only a diagnostic scene with a ground plane, sky, camera, one test light, and debug grid.
W2 adds movement over that diagnostic ground plane only, W3 adds a diagnostic third-person camera,
and W4 adds diagnostic interaction prompts and markers tied to Command Mode deep links. The first
functional world implementation should become a compact central campus with:

- Central Plaza.
- Library.
- Habit Garden.

Current diagnostic movement supports keyboard and gamepad movement, sprint, pause, and a
collision-ready capsule body. Current diagnostic camera support includes mouse drag, wheel distance,
gamepad right-stick orbit, recenter, sprint FOV transition, and basic collision shortening. Future
navigation phases add:

- Fast travel.
- Point-and-travel later.
- Command palette access to the same destinations.

## Current Location Registry

The current registry uses stable non-visual identifiers:

- `central_plaza`
- `library`
- `ai_hall`
- `programming_tower`
- `research_laboratory`
- `habit_garden`
- `command_center`
- `personal_home`
- `achievement_hall`
- `knowledge_observatory`
- `project_workshop`
- `media_theater`

## Performance Budget

- Initial web payload must not include all 3D scenes.
- Each district should load independently.
- Low mode should target usable 30 FPS on integrated graphics where possible.
- Balanced mode should avoid expensive real-time lighting and particle counts.
- Production debug overlays must be disabled unless explicitly enabled.

## Accessibility

Every core action available in World Mode must also be available through Command Mode. World Mode
must not be required for accessing personal data or completing core workflows.
