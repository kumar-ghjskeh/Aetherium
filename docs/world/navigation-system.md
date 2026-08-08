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

## Command Mode Bridge

W20 gives each mapped Command Mode route a `Travel There` deep link. Global-search results retain
their normal `Open Now` destination and may also expose a manifest-validated World Mode destination.
World URLs accept only registered backend location IDs and the `walk`, `cinematic`, or `instant`
travel modes. Invalid query values are ignored.

Opening the in-world Command interface pauses rendering and physics without unmounting the scene.
The player can open a practical Command Mode route, search real destinations, continue the most
recent real activity, or travel to an unlocked location. Locked locations remain visible but cannot
be selected for travel.

Exact player position and facing are a transient presentation concern. They are stored under
`aetherium:world:runtime-state:v1` in browser `sessionStorage`, expire after twelve hours, and are
restored only when the saved backend location matches the authenticated world profile. Durable
current, visited, and unlocked state continues to come only from the backend world API.
