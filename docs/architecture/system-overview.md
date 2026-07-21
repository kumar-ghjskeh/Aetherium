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
                          +-- AI Gateway
                          +-- Background Worker
                          |
                          +-- PostgreSQL + pgvector
                          +-- Redis
                          +-- S3-compatible storage
```

## Current Scaffold

The current implemented slices provide the infrastructure shell, standalone authentication
foundation, user-owned foundation, protected Command Mode shell, Personal Vault storage, background
file ingestion, global search, provider-neutral AI gateway, AI mentor conversations, and
citation-backed document Q&A:

- `apps/api`: FastAPI app, database settings, Alembic, health endpoints.
- `apps/web`: Next.js App Router scaffold, web health route, auth UI, and protected `/app` Command
  Mode route family.
- `packages/shared-types`: TypeScript contracts shared by frontend packages.
- `packages/validation`: Zod schemas that validate API contract payloads.
- `packages/api-client`: Typed API client for health, auth, user-owned foundation, Personal Vault,
  search, AI gateway, document Q&A, and mentor conversation APIs.
- Identity domain: Aetherium-owned `users` and `sessions` tables, Argon2id password hashing,
  server-side session revocation, and product-specific cookies.
- User-owned foundation: preferences, non-visual world profile state, domain events, notifications,
  audit logs, ownership checks, and pagination.
- Command Mode shell: responsive navigation, command palette, notifications panel, profile menu,
  settings controls, and real API-backed loading, empty, and error states.
- Personal Vault: user-owned file metadata, presigned upload/download contracts, S3-compatible
  object storage abstraction, collections, tags, favorites, soft deletion, permanent deletion, and a
  Library page that avoids fake search or AI data while showing real processing state.
- File ingestion: durable processing jobs, a standalone worker process, text extraction, chunk
  storage, failure records, retry APIs, and Library retry controls.
- Search: owner-scoped global search over files, extracted chunks, collections, tags, and AI
  conversation titles with recent search persistence and Command Palette integration.
  Semantic/vector ranking remains disabled until a later retrieval slice wires embedding jobs to the
  AI gateway with consent.
- AI gateway: provider metadata, owner-scoped consent policies, feature model configurations, chat
  completions, streaming responses, embeddings, metadata-only usage records, rate limits, retries,
  and fallback.
- AI mentors: fictional default mentors, custom mentors, explicit mentor permissions, owner-scoped
  conversations and messages, memory settings, exports, edit/resend, regeneration, and Command Mode
  AI Hall UI. Mentor chat uses bounded conversation context and does not retrieve files in this
  slice.
- Document Q&A: explicit document-QA file-content consent, owner-scoped active ready-chunk
  retrieval, optional file and collection filters, bounded semantic reranking when stored embeddings
  exist, AI gateway generation, and validated source citations linked back to the Library.

## Frontend Boundaries

Command Mode is implemented under `/app` and uses the same auth and foundation APIs that future
World Mode will use. Domain sections that do not have backend data yet render explicit empty states
instead of fake content. The `/app/world` route is a non-visual placeholder and must not include
Three.js, React Three Fiber, scene assets, or player/camera controls until the visual world phase.

## Backend Boundaries

Backend domains will be added incrementally:

- Additional world configuration and user world state beyond the current non-visual profile.
- Global semantic search and knowledge extraction on top of the current Personal Vault, ingestion,
  search, and AI gateway records.
- Mentor tools that can reuse citation-backed retrieval after explicit user approval.
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
- Personal Vault routes are under `/api/v1/files` and use owner-scoped services plus presigned
  object-storage URLs.
- File ingestion routes are under `/api/v1/files` and expose owner-scoped processing jobs, retries,
  and extracted chunks.
- Search routes are under `/api/v1/search` and expose owner-scoped query results plus recent
  searches.
- AI gateway routes are under `/api/v1/ai` and expose provider metadata, consent policies, model
  configuration, usage records, chat completions, streaming responses, embeddings, and document Q&A.
- AI mentor routes are under `/api/v1/mentors` and expose mentors, permissions, conversations,
  messages, memory settings, exports, edit/resend, regeneration, and stop-generation behavior.

## Configuration

Runtime configuration comes from environment variables. `.env.example` contains variable names only.
Production secrets must be supplied through deployment secret management, not source control.

## Deployment Assumption

The first production-capable architecture assumes separately deployed web, API, worker, PostgreSQL,
Redis, and object storage services. Docker Compose is a development convenience, not the production
orchestration contract.
