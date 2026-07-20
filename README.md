# Aetherium

Aetherium is planned as an immersive personal learning operating system: a practical command
interface backed by an optional cinematic world presentation layer.

This repository currently contains the Phase 0 documentation baseline and early non-3D vertical
slices: the infrastructure scaffold, standalone password authentication with server-side sessions,
the user-owned foundation, the protected Command Mode application shell, and Personal Vault file
storage. It does not yet implement visual 3D world navigation, file ingestion, search indexing, AI
chat, habits, or learning features.

Aetherium is a standalone product. It uses its own repository, database, Redis namespace,
object-storage buckets, environment variables, Docker resources, CI workflow, and future
authentication/session system. See `docs/architecture/product-independence.md` and
`docs/architecture/environment-isolation.md`.

## Implemented Scaffold

- pnpm workspace and Turborepo structure.
- FastAPI scaffold with versioned health endpoints.
- PostgreSQL async connection configuration and Alembic migration setup.
- Next.js App Router scaffold.
- Shared TypeScript API types, Zod validation, and a minimal typed API client.
- Standalone user and session tables with Argon2id password hashing.
- Registration, email/password login, logout, and current-user endpoints under `/api/v1/auth`.
- Authenticated Command Mode shell guarded by the Aetherium session cookie.
- User-owned preferences, non-visual world profile state, domain events, notifications, audit logs,
  ownership helpers, and paginated list endpoints.
- Responsive Command Mode application shell under `/app` with sidebar navigation, mobile navigation,
  `Ctrl/Cmd + K` command palette, notification panel, profile menu, settings page, and real
  API-backed loading, empty, and error states.
- Personal Vault storage under `/api/v1/files` with user-owned file metadata, presigned upload and
  download URLs, collections, tags, favorites, soft deletion, permanent deletion, and a Library UI.
- Non-visual `/app/world` route that clearly marks visual World Mode as future work.
- Docker Compose development infrastructure for Aetherium-isolated PostgreSQL, Redis, MinIO, API,
  and web services.
- CI workflow for independence checks, formatting, linting, type checks, tests, build, and Alembic
  migration smoke validation.

## Repository Layout

```text
apps/
  api/        FastAPI application scaffold.
  web/        Next.js application scaffold.
packages/
  api-client/     Typed frontend API client helpers.
  shared-types/   Shared TypeScript contracts.
  validation/     Zod schemas for shared contracts.
docs/
  architecture/
  operations/
  product/
  security/
  testing/
scripts/
```

## Prerequisites

- Node.js 22 or later.
- Corepack with pnpm 10.
- Python 3.12 or later.
- Docker Desktop or another Docker Compose-compatible runtime.

## Local Setup

1. Enable pnpm:

   ```powershell
   corepack enable
   corepack prepare pnpm@10.13.1 --activate
   ```

2. Install JavaScript dependencies:

   ```powershell
   pnpm install
   ```

3. Install Python dependencies:

   ```powershell
   py -3 -m pip install -r apps/api/requirements-dev.txt
   ```

4. Create local environment values:

   ```powershell
   Copy-Item .env.example .env
   ```

   Fill the empty values in `.env` with local development values. Docker Compose also provides
   Aetherium-specific development defaults for local containers.

5. Start the development services:

   ```powershell
   docker compose up --build
   ```

## Validation

```powershell
pnpm independence:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
py -3 -m alembic -c apps/api/alembic.ini upgrade head
```

On Unix-like systems, replace `py -3 -m` with `python -m`.

## Health Endpoints

- API liveness: `GET http://localhost:8000/api/v1/health/live`
- API readiness: `GET http://localhost:8000/api/v1/health/ready`
- Web liveness: `GET http://localhost:3000/api/health`

## Authentication Endpoints

- Register: `POST http://localhost:8000/api/v1/auth/register`
- Login: `POST http://localhost:8000/api/v1/auth/login`
- Logout: `POST http://localhost:8000/api/v1/auth/logout`
- Current user: `GET http://localhost:8000/api/v1/auth/me`

The browser stores authentication only in the HttpOnly `aetherium_session` cookie. Tokens are never
stored in localStorage or sessionStorage.

## Command Mode Routes

- Overview: `http://localhost:3000/app`
- Library: `http://localhost:3000/app/library`
- AI Hall: `http://localhost:3000/app/ai`
- Learning: `http://localhost:3000/app/learning`
- Coding: `http://localhost:3000/app/coding`
- Habits: `http://localhost:3000/app/habits`
- Projects: `http://localhost:3000/app/projects`
- Analytics: `http://localhost:3000/app/analytics`
- Achievements: `http://localhost:3000/app/achievements`
- Settings: `http://localhost:3000/app/settings`
- Future World Mode placeholder: `http://localhost:3000/app/world`

All `/app` routes are protected by the Aetherium auth state. Unauthenticated users are redirected to
`/login?next=/app`.

## User-Owned Foundation Endpoints

- Preferences: `GET/PATCH http://localhost:8000/api/v1/settings/preferences`
- Non-visual world profile: `GET/PATCH http://localhost:8000/api/v1/world/profile`
- Non-visual world location visit: `POST http://localhost:8000/api/v1/world/visit`
- Domain events: `GET/POST http://localhost:8000/api/v1/domain-events`
- Notifications: `GET http://localhost:8000/api/v1/notifications`
- Mark notification read: `POST http://localhost:8000/api/v1/notifications/{id}/read`
- Audit logs: `GET http://localhost:8000/api/v1/audit-logs`

## Personal Vault Endpoints

- Start upload: `POST http://localhost:8000/api/v1/files/uploads`
- Complete upload: `POST http://localhost:8000/api/v1/files/uploads/{id}/complete`
- List files: `GET http://localhost:8000/api/v1/files`
- File detail: `GET/PATCH/DELETE http://localhost:8000/api/v1/files/{id}`
- Restore file: `POST http://localhost:8000/api/v1/files/{id}/restore`
- Permanent delete: `DELETE http://localhost:8000/api/v1/files/{id}/permanent`
- Download URL: `GET http://localhost:8000/api/v1/files/{id}/download`
- Favorites: `POST/DELETE http://localhost:8000/api/v1/files/{id}/favorite`
- Collections: `GET/POST http://localhost:8000/api/v1/files/collections`
- Add to collection: `POST http://localhost:8000/api/v1/files/collections/{collection_id}/items`
- Remove from collection:
  `DELETE http://localhost:8000/api/v1/files/collections/{collection_id}/items/{file_id}`
- Tags: `GET http://localhost:8000/api/v1/files/tags`
- File tags: `POST/DELETE http://localhost:8000/api/v1/files/{id}/tags`

## Local Resource Names

- Compose project: `aetherium`
- Network: `aetherium_internal`
- Containers: `aetherium-postgres`, `aetherium-redis`, `aetherium-minio`, `aetherium-minio-init`,
  `aetherium-api`, `aetherium-web`
- Volumes: `aetherium_postgres_data`, `aetherium_redis_data`, `aetherium_minio_data`,
  `aetherium_web_node_modules`, `aetherium_web_next`
- Development database: `aetherium_app_dev`
- Development database role: `aetherium_app`
- Private files bucket: `aetherium-private-files-dev`
- Derived assets bucket: `aetherium-derived-assets-dev`
- User avatars bucket: `aetherium-user-avatars-dev`
- Redis key prefix: `aetherium:`
- Session cookie: `aetherium_session`

## Current Limitations

- Docker is scaffolded but not required for unit tests.
- API readiness requires PostgreSQL.
- Email verification, password reset, OAuth, MFA, and magic links are not implemented yet.
- Personal Vault stores originals and metadata only; text extraction, chunking, search indexing,
  embeddings, and AI citations are not implemented yet.
- No AI provider, habit workflow, learning domain, project workspace, real analytics, or visual 3D
  scene exists yet.
