# World Engine Architecture

## Role

World Mode is an optional presentation layer for the same backend state used by Command Mode. It
must not own separate copies of documents, habits, tasks, AI conversations, progress, or
achievements.

## Current Status

No 3D functionality is implemented.

The current non-visual foundation stores world profile data only:

- Current and last visited location identifiers.
- Spawn location identifier.
- Preferred navigation method.
- Tutorial completion state.
- World-state version.
- Visited and unlocked location identifier lists.

This data is available through `/api/v1/world/profile` and `/api/v1/world/visit`. It is a future
World Mode contract, not a rendered scene.

## Future Runtime Layers

- Next.js route boundary for World Mode.
- React Three Fiber renderer.
- Three.js assets and scene graph.
- Zustand transient state for camera, controls, selected location, and debug overlays.
- TanStack Query for server state shared with Command Mode.
- Asset loading by district or zone.

## Progressive Enhancement

The app must load Command Mode when:

- WebGL is unavailable.
- Reduced motion is enabled.
- The user selects low-performance mode.
- The 3D bundle fails to load.
- Hardware is below the selected performance preset.

## Initial World Scope

The first world implementation should be a compact central campus with:

- Central Plaza.
- Library.
- Habit Garden.

Navigation will start with:

- Keyboard movement.
- Fast travel.
- Point-and-travel later.
- Command palette access to the same destinations.

## Performance Budget

- Initial web payload must not include all 3D scenes.
- Each district should load independently.
- Low mode should target usable 30 FPS on integrated graphics where possible.
- Balanced mode should avoid expensive real-time lighting and particle counts.
- Production debug overlays must be disabled unless explicitly enabled.

## Accessibility

Every core action available in World Mode must also be available through Command Mode. World Mode
must not be required for accessing personal data or completing core workflows.
