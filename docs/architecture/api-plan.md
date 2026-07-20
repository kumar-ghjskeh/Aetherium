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

Planned route groups:

- `/api/v1/users`
- `/api/v1/world`
- `/api/v1/files`
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
- `/api/v1/settings`

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

## Generated Client

The first scaffold uses hand-authored shared types and Zod schemas. Once the API surface is broader,
the project should either generate a typed client from OpenAPI or keep a contract-tested manual
client.
