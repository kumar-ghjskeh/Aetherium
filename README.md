# Aetherium

Aetherium is planned as an immersive personal learning operating system: a practical command
interface backed by an optional cinematic world presentation layer.

This repository currently contains the Phase 0 documentation baseline and the first Phase 1
foundation slice. It does not yet implement authentication, 3D world navigation, file ingestion, AI
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

## Local Resource Names

- Compose project: `aetherium`
- Network: `aetherium_internal`
- Containers: `aetherium-postgres`, `aetherium-redis`, `aetherium-minio`, `aetherium-minio-init`,
  `aetherium-api`, `aetherium-web`
- Volumes: `aetherium_postgres_data`, `aetherium_redis_data`, `aetherium_minio_data`,
  `aetherium_web_node_modules`, `aetherium_web_next`
- Development database: `aetherium_app_dev`
- Development database role: `aetherium_app`
- Development object bucket: `aetherium-files-dev`
- Redis key prefix: `aetherium:`

## Current Limitations

- Docker is scaffolded but not required for unit tests.
- API readiness requires PostgreSQL.
- No user-facing product feature is complete yet.
- No authentication, file upload, AI provider, or 3D scene exists yet.
