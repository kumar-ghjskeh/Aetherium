# API Plan

## Versioning

All backend routes use `/api/v1`.

Current routes:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

Planned route groups:

- `/api/v1/auth`
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

## Error Shape

Future endpoints should use a consistent error envelope containing:

- `code`
- `message`
- `request_id`
- optional field errors

The health endpoints are intentionally small and do not establish the full error envelope yet.

## Idempotency

Important mutation endpoints will accept an idempotency key, especially:

- File upload finalization.
- Habit logging.
- Task creation from AI suggestions.
- Goal or milestone changes.
- Destructive operations.

## Generated Client

The first scaffold uses hand-authored shared types and Zod schemas. Once the API surface is broader,
the project should either generate a typed client from OpenAPI or keep a contract-tested manual
client.
