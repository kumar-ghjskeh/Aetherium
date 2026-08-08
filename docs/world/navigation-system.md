# World Navigation System

## Source of Truth

The backend world profile owns current, last visited, visited, unlocked, spawn, and preferred
navigation state. Visual manifests map scene IDs such as `knowledge-library` to backend IDs such as
`library`; they never grant authorization.

## Travel Modes

- **Walk:** selects and highlights a destination while preserving direct player control.
- **Cinematic:** moves the player along a terrain-aware eased route while the follow camera enters
  cinematic mode. Every sequence is skippable.
- **Instant:** relocates directly to the terrain-adjusted fast-travel point.

Reduced-motion mode converts cinematic travel to instant travel. Locked backend locations cannot be
selected for travel, while their Command Mode data remains governed by its normal route permissions.

## Arrival Synchronization

Walking and travel completion use the same arrival callback. Arrival calls the authenticated
`POST /api/v1/world/visit` endpoint with an idempotency key and updates the local world profile only
from the returned server state. Errors remain visible and are not presented as saved arrivals.

## Terrain and Collision

Travel points calculate their vertical position from the deterministic terrain sampler. The player
uses a Rapier trimesh collider generated from the same terrain vertices as the visible mesh, so
walking, ground detection, destination markers, and fast travel share one elevation model.

## Performance Boundaries

- Ten destinations maximum in the initial world.
- Arrival checks run at most every 750 ms.
- Travel interpolation runs inside the existing frame loop.
- Map UI and destination registries are memoized.
- Only current and selected markers animate.
