# System Overview

## Architecture

```text
User
  |
  +-- Command Mode / Next.js
  |
  +-- World Mode / React Three Fiber later
          |
          +-- Shared API Client
                  |
                  +-- FastAPI /api/v1
                          |
                          +-- Domain Services
                          +-- AI Gateway later
                          +-- Background Jobs later
                          |
                          +-- PostgreSQL + pgvector
                          +-- Redis
                          +-- S3-compatible storage
```

## Current Scaffold

The current slice implements only the infrastructure shell:

- `apps/api`: FastAPI app, database settings, Alembic, health endpoints.
- `apps/web`: Next.js App Router scaffold and web health route.
- `packages/shared-types`: TypeScript contracts shared by frontend packages.
- `packages/validation`: Zod schemas that validate API contract payloads.
- `packages/api-client`: Minimal typed API client.

## Backend Boundaries

Backend domains will be added incrementally:

- Identity and preferences.
- World configuration and user world state.
- Files and knowledge.
- AI conversations and mentors.
- Learning.
- Habits, goals, tasks, and projects.
- Achievements and domain events.
- Analytics, notifications, audit, and security.

Route handlers must remain thin as domains are added. Business rules should live in services or
domain modules where separation improves testing and clarity.

## API Style

- REST under `/api/v1`.
- Consistent JSON response schemas.
- Pagination, filtering, sorting, idempotency, and authorization will be introduced with the first
  data-owning domains.
- Streaming AI responses will use server-sent events or another explicit streaming response later.

## Configuration

Runtime configuration comes from environment variables. `.env.example` contains variable names only.
Production secrets must be supplied through deployment secret management, not source control.

## Deployment Assumption

The first production-capable architecture assumes separately deployed web, API, worker, PostgreSQL,
Redis, and object storage services. Docker Compose is a development convenience, not the production
orchestration contract.
