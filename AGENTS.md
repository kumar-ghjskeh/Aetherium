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
- Personal Vault file storage with user-owned metadata, presigned upload/download contracts,
  collections, tags, favorites, deletion state, and Library UI.
- Background file ingestion with durable processing jobs, a standalone worker process, extraction
  results, chunks, failure records, retry APIs, and visible Library retry state.
- Global search over files, extracted chunks, collections, tags, AI conversations, habits, learning
  topics, projects, and project tasks, with recent searches and Command Palette integration.
- Provider-neutral AI gateway foundation with consent policies, model configuration, usage records,
  deterministic test/local adapter, OpenAI-compatible, Anthropic-compatible, and Ollama-compatible
  adapter boundaries, rate limits, retries, and fallback support.
- AI mentors and conversations with fictional default mentors, custom mentor creation, mentor
  permissions, owner-scoped conversations, messages, memory settings, exports, edit/resend,
  regeneration, stop-generation API behavior, AI Hall UI, and conversation search.
- Citation-backed document Q&A under `/api/v1/ai/document-qa`, with explicit file-content consent,
  owner-scoped ready-chunk retrieval, validated source citations, and an AI Hall document panel.
- Habit tracking with owner-scoped habits, schedules, targets, logs, streaks, daily check-ins,
  weekly reviews, summary metrics, Command Mode Habits UI, domain events, and audit logs.
- Learning and mastery engine with owner-scoped subjects, topics, prerequisites, courses, lessons,
  study sessions, quizzes, flashcards, goals, roadmaps, transparent mastery records, learning-topic
  search, and Command Mode Learning UI.
- Project Dock foundation with owner-scoped projects, milestones, project tasks, notes, links, file
  links, topic links, technologies, blockers, activity history, project completion events, project
  search, and Command Mode Projects UI.
- Progress analytics with owner-scoped summary metrics, period trends, real-data-only empty states,
  unavailable metric flags, and Command Mode Analytics UI.
- Achievements and progression foundation with seeded definitions, idempotent domain-event rules,
  progress counters, user achievements, reward definitions, future world-unlock records, search
  integration, and Command Mode Achievements UI.
- Personal profile and settings with owner-scoped profile metadata, avatar preset or owned
  vault-image references, profile links, favorite projects/resources, certificates, privacy
  controls, data-export request records, account deletion request records, and Command Mode Settings
  UI.
- Coding workspace foundation with owner-scoped snippets, exercises, attempts, AI explain/review
  requests, Monaco editor UI, project/file linking, and an unavailable code-runner contract that
  does not execute arbitrary code.

Still out of scope unless explicitly requested:

- OAuth, social login, email delivery, password reset, MFA, and magic links.
- 3D world scenes, React Three Fiber, player controls, map travel, or world progression.
- Knowledge graph or visual world progression.

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
