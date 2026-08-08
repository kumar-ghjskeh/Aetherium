# Phase W20 - Command And World Integration

## Boundary

Connect World Mode and Command Mode without duplicating application state or backend authorization.
No backend schema, migration, external service, dependency, or asset is added.

## Implementation

- Add validated World Mode deep links for registered location IDs and supported travel modes.
- Add `Travel There` actions to mapped Command Mode routes and global-search results.
- Keep the normal search-result action as the direct `Open Now` path.
- Add an in-world Command interface with search, real continue-activity routing, direct Command Mode
  routes, and unlocked travel destinations.
- Pause rendering and physics while the Command interface is open, without unmounting the world.
- Duck world music and ambience while a complex panel is open.
- Preserve exact player position and facing in expiring, tab-scoped session storage.
- Restore exact state only when it agrees with the authenticated backend world profile.

## Security And Privacy

- World query parameters are validated against source-controlled registries.
- Backend APIs remain the sole authority for current, visited, unlocked, and owner-scoped data.
- Session storage contains only non-sensitive position, facing, location ID, and timestamp values.
- No session token, private content, object key, provider configuration, or raw API response is
  written to browser storage.
- Command and search mutations continue through authenticated Aetherium APIs.

## Performance

- Rendering and physics pause while the Command interface is open.
- Position persistence is throttled to at most once every 500 milliseconds.
- The existing scene remains mounted, avoiding a full asset and physics reload on close.
- World route manifests imported by Command Mode contain only small static location contracts.

## Validation Checklist

- [x] Deep-link parse and route-mapping tests.
- [x] Position expiry, bounds, and restoration tests.
- [x] Command interface keyboard and travel tests.
- [x] Search-result and mapped-route handoff tests.
- [x] Audio ducking tests.
- [x] Strict TypeScript validation.
- [x] Full repository CI.
- [x] Production build.
- [x] Alembic SQL smoke validation.
- [x] Commit and push.
