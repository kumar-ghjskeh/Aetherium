# API Plan

## Versioning

All backend routes use `/api/v1`.

Current routes:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/settings/preferences`
- `PATCH /api/v1/settings/preferences`
- `GET /api/v1/world/profile`
- `PATCH /api/v1/world/profile`
- `POST /api/v1/world/visit`
- `GET /api/v1/domain-events`
- `POST /api/v1/domain-events`
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/{notification_id}/read`
- `GET /api/v1/audit-logs`
- `POST /api/v1/files/uploads`
- `POST /api/v1/files/uploads/{upload_id}/complete`
- `GET /api/v1/files`
- `GET /api/v1/files/{file_id}`
- `PATCH /api/v1/files/{file_id}`
- `DELETE /api/v1/files/{file_id}`
- `POST /api/v1/files/{file_id}/restore`
- `DELETE /api/v1/files/{file_id}/permanent`
- `GET /api/v1/files/{file_id}/download`
- `POST /api/v1/files/{file_id}/favorite`
- `DELETE /api/v1/files/{file_id}/favorite`
- `GET /api/v1/files/collections`
- `POST /api/v1/files/collections`
- `POST /api/v1/files/collections/{collection_id}/items`
- `DELETE /api/v1/files/collections/{collection_id}/items/{file_id}`
- `GET /api/v1/files/tags`
- `POST /api/v1/files/{file_id}/tags`
- `DELETE /api/v1/files/{file_id}/tags/{tag_id}`

Planned route groups:

- `/api/v1/users`
- `/api/v1/search`
- `/api/v1/ai`
- `/api/v1/mentors`
- `/api/v1/learning`
- `/api/v1/habits`
- `/api/v1/goals`
- `/api/v1/tasks`
- `/api/v1/projects`
- `/api/v1/achievements`
- `/api/v1/analytics`

## Authentication Routes

`POST /api/v1/auth/register` creates a user and authenticated session. It sets the HttpOnly
`aetherium_session` cookie.

`POST /api/v1/auth/login` verifies credentials and creates a new authenticated session. Login
failures use the same non-revealing error for nonexistent accounts and incorrect passwords.

`POST /api/v1/auth/logout` revokes the current session when present and clears the cookie.

`GET /api/v1/auth/me` returns the authenticated user's public profile or an unauthenticated error.

## Error Shape

API errors use:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "Email or password is incorrect."
  }
}
```

Validation errors may include field-level messages under `error.fields`.

## Idempotency

Important mutation endpoints will accept an idempotency key, especially:

- File upload finalization.
- Habit logging.
- Task creation from AI suggestions.
- Goal or milestone changes.
- Destructive operations.

Auth registration and login are not idempotent because they create new server-side sessions.

`POST /api/v1/domain-events` requires a per-user `idempotencyKey`. A retry with the same key returns
the existing event instead of inserting a duplicate.

`POST /api/v1/world/visit` also requires an `idempotencyKey`; duplicate requests do not create
duplicate visit events.

## User-Owned Foundation Routes

`GET /api/v1/settings/preferences` returns the authenticated user's preferences, creating defaults
for users that predate the foundation migration.

`PATCH /api/v1/settings/preferences` updates only submitted preference fields and records a
`user.preference_updated` domain event plus a sanitized audit log.

`GET /api/v1/world/profile` returns non-visual world state for the authenticated user.

`PATCH /api/v1/world/profile` updates non-visual profile preferences such as navigation method,
tutorial completion, and spawn location. Spawn locations must already be unlocked.

`POST /api/v1/world/visit` records a visit to an unlocked non-visual location identifier and creates
an idempotent `world.location_visited` domain event.

`GET /api/v1/domain-events`, `GET /api/v1/notifications`, and `GET /api/v1/audit-logs` are paginated
with bounded `limit` and `offset` parameters.

`POST /api/v1/notifications/{notification_id}/read` marks only the authenticated user's notification
as read. Cross-user IDs return `not_found`.

## Personal Vault Routes

`POST /api/v1/files/uploads` validates file name, extension, MIME type, size, and idempotency key,
then creates an owner-scoped upload record and returns an expiring presigned `PUT` URL.

`POST /api/v1/files/uploads/{upload_id}/complete` finalizes a pending upload for the authenticated
owner, optionally verifies the object in storage, creates the file record and first file version,
records a `file.uploaded` domain event, and writes a sanitized audit log. Repeated completion with
the same idempotency key returns the existing file.

`GET /api/v1/files` is paginated and supports metadata filtering by file name, favorite-only,
collection, tag, and deleted-record visibility. It does not search extracted text yet.

`GET /api/v1/files/{file_id}`, `PATCH /api/v1/files/{file_id}`, `DELETE /api/v1/files/{file_id}`,
`POST /api/v1/files/{file_id}/restore`, and `DELETE /api/v1/files/{file_id}/permanent` all enforce
owner scope. Permanent deletion requires an existing soft-deleted record and removes stored object
versions before deleting metadata.

`GET /api/v1/files/{file_id}/download` returns an expiring presigned `GET` URL for the authenticated
owner. The API does not expose object keys in normal file responses.

Collection, favorite, and tag routes are owner-scoped and designed as metadata-only organization for
the current slice. Background ingestion, content search, and AI retrieval will consume the same file
records in later phases.

## Generated Client

The first scaffold uses hand-authored shared types and Zod schemas. Once the API surface is broader,
the project should either generate a typed client from OpenAPI or keep a contract-tested manual
client.
