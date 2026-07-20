# Phase 1 Task: User-Owned Data Foundation

## Boundary

Implement the non-visual user-owned foundation required by later Aetherium slices:

- User preferences.
- Non-visual world profile state.
- Domain events with idempotency.
- In-app notifications with read and unread state.
- Persistent audit logs.
- Reusable ownership and pagination helpers.
- Backend and shared-client tests for authorization and cross-user isolation.

Do not implement file storage, AI, habits, learning, projects, analytics, achievements, or visual
World Mode in this task.

## Affected Modules

- `apps/api/alembic`: add the next Aetherium-only migration.
- `apps/api/app/models`: add user-owned foundation tables.
- `apps/api/app/services`: add ownership, pagination, and user-data services.
- `apps/api/app/api/v1`: add settings, world, domain-event, notification, and audit-log routes.
- `packages/shared-types`, `packages/validation`, `packages/api-client`: add typed contracts.
- `docs`: update architecture, security, operations, and testing documents.

## Security And Privacy

- Every table in this slice is scoped by `owner_user_id` referencing `users.id`.
- All public data-access paths use the authenticated current-user dependency and owner filters.
- Cross-user reads and mutations return not-found style errors without confirming the record exists.
- Audit metadata is sanitized before persistence and must not contain passwords, raw tokens,
  cookies, secrets, API keys, or full sensitive request bodies.
- Domain events are append-only and idempotent per user and idempotency key.

## Migration Implications

Add `0003_user_owned_foundation` after `0002_auth_foundation`. The migration creates only new tables
and indexes. It does not mutate existing auth rows. Defaults are created for users at registration
and lazily for already-existing users when preferences or world profile endpoints are read.

## Performance Implications

- List endpoints are paginated with bounded `limit` and `offset`.
- Owner and timestamp indexes support user-scoped reads.
- Domain-event idempotency uses a unique per-user key.

## Validation Plan

- Backend tests for preferences persistence, world profile updates, domain-event idempotency,
  notification read state, audit sanitization, pagination, authentication, authorization, cross-user
  isolation, and database constraints.
- Shared API-client tests for new endpoint request/response contracts.
- Full repository validation through `pnpm run ci`.
- Alembic offline upgrade, downgrade, and re-upgrade SQL validation.
