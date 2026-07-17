# Aetherium

Aetherium is planned as an immersive personal learning operating system: a practical command
interface backed by an optional cinematic world presentation layer.

This repository currently contains the Phase 0 documentation baseline and the first Phase 1
foundation slice. It does not yet implement authentication, 3D world navigation, file ingestion, AI
chat, habits, or learning features.

## Implemented Scaffold

- pnpm workspace and Turborepo structure.
- FastAPI scaffold with versioned health endpoints.
- PostgreSQL async connection configuration and Alembic migration setup.
- Next.js App Router scaffold.
- Shared TypeScript API types, Zod validation, and a minimal typed API client.
- Docker Compose development infrastructure for PostgreSQL, Redis, MinIO, API, and web.
- CI workflow for formatting, linting, type checks, tests, and Alembic migration smoke validation.

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

   Fill the empty values in `.env` with local development values.

5. Start the development services:

   ```powershell
   docker compose up --build
   ```

## Validation

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
py -3 -m alembic -c apps/api/alembic.ini upgrade head
```

On Unix-like systems, replace `py -3 -m` with `python -m`.

## Health Endpoints

- API liveness: `GET http://localhost:8000/api/v1/health/live`
- API readiness: `GET http://localhost:8000/api/v1/health/ready`
- Web liveness: `GET http://localhost:3000/api/health`

## Current Limitations

- Docker is scaffolded but not required for unit tests.
- API readiness requires PostgreSQL.
- No user-facing product feature is complete yet.
- No authentication, file upload, AI provider, or 3D scene exists yet.
