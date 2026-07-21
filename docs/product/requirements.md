# Aetherium Product Requirements

## Vision

Aetherium is a personal learning operating system that represents files, projects, habits, learning
progress, AI tools, and goals through two synchronized experiences:

- Command Mode: a fast, accessible 2D productivity application.
- World Mode: an optional immersive 3D presentation layer over the same data.

The backend is the source of truth. World Mode must never maintain an independent data model for
documents, habits, AI conversations, projects, learning progress, or achievements.

## Target Users

- University students.
- Software developers and engineers.
- Researchers.
- Self-directed learners.
- Professionals managing multiple technical learning goals.

The initial product is optimized for one active user while preserving tenant-aware architecture for
future account support.

## Product Principles

- Practicality before spectacle.
- Command Mode fallback when 3D is unavailable, slow, disabled, or inaccessible.
- User ownership of data, export, deletion, AI consent, and analytics controls.
- Honest gamification based on meaningful learning or productivity events.
- Accessibility for all core workflows without World Mode.
- Security and privacy from the first implementation slice.

## Phase 1 Vertical Slice Goal

The full Phase 1 MVP will eventually include authentication, Central Plaza, Command Mode, basic
World Mode, Library, Habit Garden, file ingestion, search, one AI mentor, citations, habit logging,
tests, and Docker development infrastructure.

Implemented Phase 1 foundation slices:

- Docker development infrastructure.
- FastAPI scaffold.
- PostgreSQL connection and Alembic.
- Next.js scaffold.
- Shared validation and API types.
- Health endpoints.
- CI validation.
- Standalone password authentication.
- Server-side sessions using an Aetherium-specific cookie.
- User-owned data foundation for preferences, non-visual world profile state, domain events,
  notifications, audit logs, ownership checks, and pagination.
- Protected Command Mode shell with `/app` routes, responsive navigation, command palette,
  notification panel, profile menu, settings controls backed by the preferences API, and a
  non-visual `/app/world` placeholder.
- Personal Vault storage for user-owned files, presigned uploads/downloads, collections, tags,
  favorites, deletion state, and a real Library UI.
- Background file ingestion for uploaded files, including durable processing jobs, worker-based text
  extraction, chunk storage, visible failure state, and retry controls.
- Global search for implemented data, including files, extracted chunks, collections, tags, recent
  searches, and Command Palette integration.

3D functionality, AI, semantic retrieval, citation-backed Q&A, and habits are intentionally
deferred.

## Non-Goals For Current Slice

- No OAuth, social login, email delivery, password reset, MFA, or magic links.
- No 3D scene or world interaction.
- No semantic embeddings or citation-backed file Q&A.
- No AI provider calls.
- No habit, task, project, or learning domain behavior.
- No claims that user-facing product workflows are complete.
- No visual World Mode implementation.

## Success Criteria For Current Slice

- A developer can install dependencies and run validation commands.
- FastAPI exposes liveness and readiness endpoints.
- Readiness verifies PostgreSQL connectivity.
- Alembic can run against PostgreSQL.
- Next.js exposes a minimal scaffold and web health endpoint.
- Shared TypeScript contracts and Zod schemas exist for health and authentication responses.
- CI validates formatting, linting, type checks, tests, and migrations.
- A user can register, log in, call `/auth/me`, log out, and access the protected Command Mode shell
  only while authenticated.
- A signed-in user can navigate the protected `/app` route family, open the command palette with
  `Ctrl/Cmd + K`, inspect notifications, and update implemented preference fields.
- A signed-in user can upload supported files into the Personal Vault, list them in Library, create
  collections, add tags, mark favorites, request expiring download URLs, soft delete, restore, and
  permanently delete their own files.
- Uploaded files are queued for background processing; the worker can extract supported content into
  owner-scoped chunks, record failures, and expose retry state without sending content to an AI
  provider.
- A signed-in user can search their own file metadata, extracted chunks, collections, and tags from
  Command Mode without seeing another user's records.
