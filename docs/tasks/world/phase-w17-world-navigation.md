# Phase W17 - World Navigation and Travel

## Scope

W17 makes all ten authored districts reachable through walking destinations, skippable cinematic
travel, instant travel, Command Mode deep links, and saved backend location state.

Included:

- Typed destination mapping between visual scene IDs and backend world-location IDs.
- Terrain-aware fast-travel points and one-time spawn at the saved current or spawn location.
- Readable world map with current, visited, unlocked, locked, and selected states.
- Walk, cinematic, and instant travel modes.
- Skippable cinematics and reduced-motion conversion to instant travel.
- In-world location markers and walking destination highlighting.
- Walking-arrival detection and authenticated, idempotent `/api/v1/world/visit` synchronization.
- Visible save failure state without false success.
- Continue-from-last-location action and direct Command Mode destination links.
- Terrain trimesh collision so player traversal follows visible elevation.

Excluded:

- Vehicles, autopilot pathfinding, navmesh agents, climbing, or route avoidance.
- Teleporting to locked destinations.
- Client-side world unlock mutation or authorization decisions.
- Decorative map images or externally sourced map assets.
- Final atmospheric, audio, and performance polish scheduled for W18-W21.

## Security and State Notes

- Backend world profiles remain the source of truth for current, visited, and unlocked locations.
- Travel uses an authenticated visit endpoint with a new idempotency key per arrival.
- The browser never grants an unlock and cannot travel to locations marked locked by the backend.
- Failed arrival synchronization is shown to the user; the UI does not display a false saved state.
- Manifests contain only public product location metadata.

## Accessibility Notes

- The world map is a named dialog with real buttons for every destination.
- Current, visited, selected, unlocked, and locked state are expressed in text and ARIA labels.
- Keyboard and gamepad map requests use the shared input abstraction.
- Cinematic travel has a visible Skip travel action.
- Reduced motion changes cinematic travel to an immediate relocation.
- Every destination keeps its Command Mode link.

## Performance Notes

- Destination mapping is memoized and bounded at ten locations.
- Arrival detection is throttled to 750 ms.
- Travel movement uses the existing render loop without per-frame React component state.
- The terrain collider reuses deterministic generated mesh data and is disposed on unmount.
- Markers use bounded procedural geometry with motion only for the current/selected destination.

## Validation Checklist

- [x] Focused Web type check passes.
- [x] Navigation math, store, map, terrain, and API-sync tests pass.
- [x] Full repository CI passes.
- [x] Alembic SQL smoke validation passes.
- [x] Git author and committer are `Sai Kumar <saikumarthota120@gmail.com>`.
- [x] Phase commit is pushed without co-author trailers.

## Known Limitations

- Walking destinations provide world highlighting but do not perform automatic pathfinding.
- Cinematic travel follows a terrain-aware interpolated route rather than a hand-authored camera
  spline for every location pair.
- Browser screenshot and real-frame travel checks remain scheduled for W23.
- Controller remapping is deferred; the shared input abstraction remains controller-ready.
