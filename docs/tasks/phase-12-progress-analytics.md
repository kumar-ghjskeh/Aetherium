# Phase 12 - Progress Analytics

## Boundary

Implement read-only Command Mode progress analytics from existing Aetherium-owned records. Do not
add synthetic data, product-surveillance analytics, visual 3D world progression, or new tracking
events that are not already represented by product actions.

## Affected Modules

- `apps/api/app/api/v1/analytics.py`
- `apps/api/app/domain/analytics.py`
- `apps/api/app/schemas/analytics.py`
- `apps/api/app/services/analytics.py`
- `packages/shared-types`
- `packages/validation`
- `packages/api-client`
- `apps/web/src/features/analytics`
- `apps/web/src/app/app/analytics`

## Implementation Plan

1. Add typed analytics periods, metric keys, summary metrics, and trend bucket contracts.
2. Add an owner-scoped analytics service that aggregates existing learning, habit, file, AI usage,
   and project records.
3. Expose `GET /api/v1/analytics/summary` behind the current-user dependency.
4. Add shared Zod validation and typed API-client coverage.
5. Replace the Command Mode analytics placeholder with a real API-backed page, loading state, empty
   state, error state, period selector, summary cards, and accessible trend table.
6. Document that unsupported source signals are marked unavailable instead of fabricated.
7. Run focused tests and full repository validation before committing.

## Security And Privacy

- Analytics queries must always filter by `owner_user_id`.
- Cross-user rows must not affect metric totals or trends.
- The endpoint is read-only and does not expose raw file bodies, prompts, provider secrets, session
  data, cookies, object keys, or private document text.
- Unsupported metrics are returned with `available: false` and `value: null`.

## Migration Impact

No database migration is required. Phase 12 computes a read model over existing owner-scoped tables.

## Acceptance Criteria

- Authenticated users can view progress summaries for week, month, quarter, and year periods.
- Summary values come only from stored Aetherium records.
- Empty states are honest when no supported activity exists.
- Unimplemented signals are visibly unavailable.
- Cross-user data is excluded.
- Backend, frontend, and API-client tests cover the slice.
