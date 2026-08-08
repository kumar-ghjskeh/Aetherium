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
- Knowledge graph data foundation with owner-scoped nodes and relationships for topics, files,
  lessons, projects, skills, questions, and achievements, plus prerequisites, related-topic queries,
  review recommendations, and a 2D Learning UI panel.
- Notification and review workflows with owner-scoped in-app preferences, idempotent workflow
  records, weekly/monthly review prompts, learning and habit reminders, processing and AI failure
  notices, project deadline reminders, monthly review records, bulk read state, and Settings UI
  controls.
- World Mode technical foundation with a non-visual location registry, deep-link contracts, future
  scene-manifest schema, world feature flags, protected current/visited/unlocked location APIs, and
  an API-backed `/app/world` data-contract page.
- Production hardening baseline with request IDs, structured API access logs, default API security
  headers, non-sensitive observability status, backup/restore documentation updates, and a CI guard
  that keeps visual World Mode deferred.
- Deployment preparation with separate development/staging/production environment boundaries,
  migration and rollback procedures, health-check documentation, release checklist, a
  validation-only deployment-readiness workflow, and the final 3D readiness checkpoint.
- Visual World Mode W0 design foundation with ADR 0025, world architecture, art direction, layout,
  performance budgets, asset policy, visual testing plan, troubleshooting docs, and the W0-W25 task
  roadmap.
- Visual World Mode W1 runtime foundation with approved browser-native 3D dependencies, `/app/world`
  lazy-loading, WebGL2 and reduced-motion fallbacks, diagnostic scene rendering, graphics preset
  controls, runtime diagnostics, and a dependency/asset policy guard.
- Visual World Mode W2 player-controller foundation with normalized keyboard and gamepad input,
  deterministic movement-state logic, a Rapier capsule controller in the diagnostic runtime,
  procedural stylized avatar feedback, pause handling, and player telemetry.
- Visual World Mode W3 camera foundation with pure camera math, smooth third-person follow,
  mouse/wheel/gamepad orbit input, distance/FOV/smoothing settings, basic collision shortening,
  reduced-motion-aware behavior, sprint FOV/shake controls, and camera telemetry.
- Visual World Mode W4 interaction framework with typed interaction contracts, diagnostic
  deep-link-backed interaction terminals, radius/facing priority, keyboard/gamepad activation,
  permission/loading/error states, Command Mode routing, accessible prompts, and interaction tests.
- Visual World Mode W5 manifest foundation with source-controlled typed registries for ten future
  districts, backend location mappings, assets, spawns, fast travel, interactions, environment
  zones, audio zones, camera routes, themes, and deterministic registry validation.
- Visual World Mode W6 terrain and environment foundation with deterministic 800 m procedural
  terrain, mountain perimeter, river ribbon, waterfall sheets, route surfaces, bounded cloud/mist
  and rock props, data-driven district foundation markers, terrain-bound player reset, and terrain
  generation tests.
- Visual World Mode W7 Central Plaza vertical slice with a procedural plaza landmark, terminal pods,
  real user overview data, Command Mode deep links, and plaza mapping tests.
- Visual World Mode W8 Knowledge Library with a procedural district exterior, bounded file,
  collection, and tag displays, vault interaction terminals, and file-mapping tests.
- Visual World Mode W9 AI Observatory with a procedural dome, mentor probes, real AI/provider usage
  mapping, observatory interaction terminals, and mentor-state tests.
- Visual World Mode W10 Habit Garden with procedural terraces, habit plant beds, real habit and
  achievement mapping, garden interaction terminals, and habit-to-plant tests.
- Visual World Mode W11 Learning Academy with procedural academy wings, course halls, lesson
  stations, real learning/mastery mapping, read-only module and lesson list contracts, a fixed
  `/app/world` progress panel, and learning Academy tests.
- Visual World Mode W12 Coding Arena with a procedural circular arena, compiler core, workspace
  consoles, exercise pylons, real coding/project mapping, an honest sealed runner state, privacy
  filtering for raw code and AI request content, and Coding Arena tests.
- Visual World Mode W13 Project Dock with a procedural waterfront workshop, project berths,
  milestone signals, blocker beacons, one bounded owner-scoped project detail, privacy filtering for
  sensitive project context, and Project Dock tests.

Still out of scope unless explicitly requested:

- OAuth, social login, email delivery, password reset, MFA, and magic links.
- External email, push, SMS, and deployed scheduler notification delivery.
- Remaining district art, cinematic travel paths, map travel, audio, atmosphere, performance
  optimization, automated visual regression, accessibility polish, or visual world progression until
  the corresponding approved World Mode phase is active.
- Automatic production deployment.

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

Run `pnpm independence:check` before completing infrastructure changes. Run `pnpm world:check`
before completing work that could affect World Mode dependencies or assets. Run
`pnpm deployment:check` before completing deployment-preparation changes.

## Visual World Mode

The visual World Mode architecture and W1-W13 runtime and district foundations are documented.
Follow `docs/architecture/decisions/0025-visual-world-mode-architecture.md`,
`docs/world/world-mode-architecture.md`, and `docs/tasks/world/world-mode-roadmap.md` for W7 and
later. Do not add unregistered assets, paid assets, editor-heavy engine dependencies, or any
browser-exposed secret.

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
- Preserve request IDs and structured logs without adding request bodies, cookies, raw prompts,
  private file bodies, object keys, or provider secrets.
