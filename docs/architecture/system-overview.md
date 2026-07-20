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

The current implemented slices provide the infrastructure shell and the standalone authentication
foundation:

- `apps/api`: FastAPI app, database settings, Alembic, health endpoints.
- `apps/web`: Next.js App Router scaffold and web health route.
- `packages/shared-types`: TypeScript contracts shared by frontend packages.
- `packages/validation`: Zod schemas that validate API contract payloads.
- `packages/api-client`: Typed API client for health and auth.
- Identity domain: Aetherium-owned `users` and `sessions` tables, Argon2id password hashing,
  server-side session revocation, and product-specific cookies.
- User-owned foundation: preferences, non-visual world profile state, domain events, notifications,
  audit logs, ownership checks, and pagination.

## Backend Boundaries

Backend domains will be added incrementally:

- Additional world configuration and user world state beyond the current non-visual profile.
- Files and knowledge.
- AI conversations and mentors.
- Learning.
- Habits, goals, tasks, and projects.
- Achievements and domain events.
- Analytics, notifications, audit, and security.

Route handlers must remain thin as domains are added. Business rules should live in services or
domain modules where separation improves testing and clarity.

The implemented auth and user-owned routes follow this boundary: route handlers own HTTP concerns,
shared validation schemas define request and response shapes, and business rules live in services
plus reusable dependencies.

## API Style

- REST under `/api/v1`.
- Consistent JSON response schemas.
- Pagination, filtering, sorting, idempotency, and authorization will be introduced with the first
  data-owning domains.
- Authentication is under `/api/v1/auth`; protected endpoints use the reusable current-user
  dependency rather than route-local cookie parsing.
- User-owned foundation routes are under `/api/v1/settings`, `/api/v1/world`,
  `/api/v1/domain-events`, `/api/v1/notifications`, and `/api/v1/audit-logs`.
- Streaming AI responses will use server-sent events or another explicit streaming response later.

## Configuration

Runtime configuration comes from environment variables. `.env.example` contains variable names only.
Production secrets must be supplied through deployment secret management, not source control.

## Deployment Assumption

The first production-capable architecture assumes separately deployed web, API, worker, PostgreSQL,
Redis, and object storage services. Docker Compose is a development convenience, not the production
orchestration contract.
