# ADR 0022 - World Mode Data Foundation Before Visual Rendering

## Status

Accepted

## Context

Aetherium needs future World Mode contracts before a visual 3D implementation begins. Existing
Command Mode features already emit world-location identifiers in search results, achievements, and
profile state, but the product must stop before visual open-world work.

The roadmap requires:

- location identifiers and metadata
- current, visited, and unlocked location APIs
- future scene-manifest schema
- deep-link contracts from future world locations back to Command Mode routes
- a feature flag indicating the visual world is not yet active

## Decision

Aetherium will keep World Mode as a data-contract-only layer in this phase.

The backend now owns a static world location registry with stable identifiers, display metadata,
Command Mode routes, future scene keys, and deep-link entity categories. The registry extends the
existing `world_profiles` source of truth rather than adding a parallel world database model.

The scene manifest is intentionally non-renderable:

- `visualRuntimeAvailable` is `false`
- every manifest location has `allowedToRender` set to `false`
- asset bundle keys are `null`
- the `/app/world` route explains that visual World Mode is not implemented

No Three.js, React Three Fiber, Drei, physics, asset, player, camera, terrain, lighting, animation,
or spatial-audio implementation is allowed in this phase.

## Consequences

- Command Mode remains the only usable interface.
- Future 3D work can consume stable location IDs and deep-link contracts without inventing a second
  source of truth.
- The registry can evolve through ADRs if visual implementation exposes a genuine gap.
- User-owned state remains protected by existing authorization dependencies.
- No migration is required for this phase.
