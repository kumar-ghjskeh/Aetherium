# Phase 17 - Notifications And Review Workflows

## Boundary

Implement owner-scoped in-app notification preferences, review workflow records, monthly review
records, and local workflow generation APIs. Do not add email, push, SMS, or external delivery. Do
not add a scheduler daemon; the workflow runner is an authenticated API entry point that a future
worker or scheduler can call.

## Affected Modules

- `apps/api/app/models/notifications.py`
- `apps/api/app/services/notifications.py`
- `apps/api/app/api/v1/notifications.py`
- `packages/shared-types`
- `packages/validation`
- `packages/api-client`
- `apps/web/src/features/app-shell`
- `apps/web/src/features/settings`

## Data Model

- `notification_preferences`
- `notification_workflow_records`
- `monthly_reviews`

All new tables are owner-scoped with `owner_user_id`. Workflow records are unique per owner,
workflow type, and source key so repeated generation does not duplicate notifications.

## API Routes

- `GET /api/v1/notifications/preferences`
- `PATCH /api/v1/notifications/preferences`
- `POST /api/v1/notifications/read-all`
- `GET /api/v1/notifications/workflows`
- `POST /api/v1/notifications/workflows/run`
- `GET /api/v1/notifications/monthly-reviews`
- `POST /api/v1/notifications/monthly-reviews`

## Acceptance Criteria

- Notification preferences persist per user.
- Workflow generation is idempotent.
- Review, learning, habit, processing-failure, AI-failure, and project-deadline workflow records are
  generated from real owner-scoped records.
- Monthly reviews are owner-scoped.
- Bulk notification read state is owner-scoped.
- No external delivery is attempted.
- Tests cover authorization, cross-user isolation, preferences, idempotency, database constraints,
  API-client contracts, and Settings/App Shell UI state.

## Validation

- Focused backend notification tests: passing.
- Full validation will be run before the phase commit.
