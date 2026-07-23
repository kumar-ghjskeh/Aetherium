# Phase 18 - World Mode Data Foundation

## Boundary

Implement only data and interface contracts for future World Mode. This phase must not render a
visual 3D world, install 3D libraries, add assets, create player controls, or implement camera,
terrain, lighting, physics, shaders, particle systems, spatial audio, weather, or cinematic travel.

## Affected Modules

- `apps/api/app/domain/world.py`
- `apps/api/app/api/v1/world.py`
- `apps/api/app/schemas/foundation.py`
- `apps/api/app/services/foundation.py`
- `packages/shared-types`
- `packages/validation`
- `packages/api-client`
- `apps/web/src/features/world`
- `docs/architecture/world-engine.md`
- `docs/architecture/api-plan.md`
- `docs/architecture/system-overview.md`
- `docs/architecture/data-model.md`

## Implementation

- Added a canonical non-visual world location registry using stable existing location identifiers.
- Added location metadata for Command Mode routes, future scene keys, default-unlock state,
  deep-link entity types, and visual-implementation status.
- Added protected world APIs for:
  - location registry
  - unlocked locations
  - visited locations
  - location detail
  - deep-link contracts
  - future scene manifest schema
  - feature flags
- Added shared TypeScript types and Zod validation schemas for the new contracts.
- Added typed API-client methods for the new world endpoints.
- Replaced the generic `/app/world` placeholder with a real API-backed data-contract page.

## Security And Privacy

- All world state APIs require the authenticated Aetherium session.
- Location state is derived from the authenticated user's own `world_profiles` row.
- Cross-user state is not exposed.
- The endpoints do not expose private file contents, AI prompts, secrets, object keys, or raw
  tokens.
- Deep links are route contracts only. Future entity IDs must still be resolved through owner-scoped
  APIs before navigation.

## Database

No database migration is required. Existing `world_profiles` and `world_unlock_records` remain the
source of truth for non-visual world state and progression identifiers.

## Tests

- Backend tests cover location registry state, data-only scene manifest, feature flags, auth
  requirements, and cross-user isolation.
- API-client tests cover location listing, feature flags, and scene manifest parsing.
- Frontend tests cover the `/app/world` data-contract page ready and error states.

## Validation Plan

- Run backend focused tests for foundation/world APIs.
- Run API-client tests.
- Run web tests.
- Run full CI validation.
- Run a prohibited-3D scan to verify no visual World Mode implementation was added.

## Acceptance

- Future World Mode has stable non-visual contracts for location IDs, deep links, scene-manifest
  shape, current/visited/unlocked state, and feature flags.
- `/app/world` clearly reports that visual World Mode is not implemented.
- No visual 3D implementation exists.
