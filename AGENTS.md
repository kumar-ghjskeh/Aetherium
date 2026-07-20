# Aetherium Agent Guide

## Current Phase

Aetherium is moving through the approved non-3D roadmap as vertical slices. Product features should
be implemented only when their slice is explicitly requested.

Implemented foundation slices:

- Docker development infrastructure.
- FastAPI application scaffold.
- PostgreSQL connection and Alembic.
- Next.js application scaffold.
- Shared validation and API types.
- Health endpoints.
- CI validation.
- Standalone architecture isolation checks and documentation.
- Standalone password authentication and server-side sessions.
- User-owned data foundation for preferences, non-visual world profile state, domain events,
  notifications, audit logs, ownership checks, and pagination.
- Command Mode application shell with protected `/app` routes, responsive navigation, command
  palette, notification panel, profile menu, settings integration, and a non-visual `/app/world`
  placeholder.

Still out of scope unless explicitly requested:

- OAuth, social login, email delivery, password reset, MFA, and magic links.
- 3D world scenes, React Three Fiber, player controls, map travel, or world progression.
- File upload, document ingestion, AI chat, retrieval, habits, learning, projects, achievements, or
  analytics.

## Product Independence

Aetherium is a standalone product. Do not import source code from another private project, reference
another private repository, connect to another product database, reuse another schema, share cookies
or session secrets, share Redis keys, reuse object-storage buckets, depend on another private API,
copy private product data, assume another product is running, add cross-product single sign-on, add
shared private packages, or share private deployment infrastructure.

Use Aetherium-owned resources and names:

- `AETHERIUM_` environment variables for backend/runtime configuration.
- `NEXT_PUBLIC_AETHERIUM_` environment variables for browser-exposed configuration.
- `aetherium:` Redis key prefix.
- `aetherium_session` or another product-specific future session cookie name.
- Aetherium-prefixed Docker services, containers, networks, volumes, databases, roles, and buckets.

Run `pnpm independence:check` before completing infrastructure changes.

## Engineering Rules

- Preserve one backend source of truth for future World Mode and Command Mode.
- Keep modules small and independently testable.
- Avoid placeholder UI that appears functional.
- Do not commit secrets. `.env.example` must contain variable names only.
- Add or update tests with each implemented behavior.
- Run the smallest relevant checks during development and full validation before handoff.
- Document architectural assumptions in ADRs under `docs/architecture/decisions/`.

## Repository Standards

- Use pnpm workspaces and Turborepo for JavaScript and TypeScript packages.
- Use TypeScript strict mode.
- Use FastAPI, Pydantic, SQLAlchemy 2, Alembic, PostgreSQL, Redis, and MinIO for the backend
  foundation.
- Keep backend domain logic outside route handlers as features are added.
- Use REST APIs under `/api/v1` for the first version.
- Prefer explicit schemas and typed clients over untyped data shapes.

## Local Development

- Copy `.env.example` to `.env` and fill local-only values before running Docker Compose.
- Start services with `docker compose up --build`.
- Run API tests with `py -3 -m pytest apps/api/tests` on Windows or
  `python -m pytest apps/api/tests` on Unix-like systems.
- Run JavaScript validation with `pnpm lint`, `pnpm typecheck`, and `pnpm test`.

## Security Notes

- Treat authentication, file ingestion, AI retrieval, and code execution as high-risk features.
- Never silently send user content to external AI providers.
- Require explicit confirmation before destructive or externally visible actions.
- Do not log passwords, session secrets, bearer tokens, full private documents, raw session tokens,
  authentication cookies, or raw sensitive prompts by default.
