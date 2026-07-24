# Aetherium Ready for 3D World Implementation

## Completed Product Capabilities

- Standalone monorepo, Docker development infrastructure, CI validation, and product-independence
  checks.
- FastAPI backend with PostgreSQL, Alembic, Redis configuration, MinIO/object-storage abstraction,
  health endpoints, request IDs, security headers, and structured logs.
- Next.js Command Mode application shell with protected `/app` routes.
- Standalone authentication with password registration, login, logout, server-side sessions,
  HttpOnly cookies, origin protection, and auth rate limiting.
- User-owned preferences, non-visual world profile state, domain events, notifications, audit logs,
  and pagination.
- Personal Vault file metadata, presigned upload/download contracts, collections, tags, favorites,
  soft/permanent deletion, processing status, and Library UI.
- Background file ingestion with durable jobs, extraction results, chunks, retry state, and worker
  processing.
- Global search over implemented owner-scoped domains.
- Provider-neutral AI gateway with consent policies, model configuration, provider adapters, usage
  records, rate limits, retries, fallback, and deterministic test provider.
- AI mentors, conversations, memory controls, exports, edit/resend, regeneration, stop-generation
  contract, and AI Hall UI.
- Citation-backed document Q&A from owner-scoped ready chunks with validated citations.
- Habit tracking, daily check-ins, weekly reviews, streak metrics, and Habits UI.
- Learning and mastery engine with subjects, topics, prerequisites, courses, lessons, quizzes,
  flashcards, study sessions, goals, roadmaps, transparent mastery, and Learning UI.
- Project Dock foundation with projects, milestones, tasks, notes, links, files, topics,
  technologies, blockers, activity, and Projects UI.
- Progress analytics from real stored data only.
- Achievements and progression records with idempotent event processing and future world-unlock
  identifiers.
- Personal profile, privacy settings, data-export request records, and account deletion request
  records.
- Coding workspace foundation with snippets, exercises, attempts, AI explain/review, Monaco editor,
  and an unavailable code-runner contract.
- Knowledge graph data foundation with nodes, relationships, sync, related-topic context,
  prerequisites, and review recommendations.
- In-app notification and review workflows.
- Deployment preparation docs, release checklist, migration and rollback procedures, health-check
  docs, and validation-only deployment-readiness workflow.

## Available APIs For Future World Mode

- `/api/v1/world/profile`
- `/api/v1/world/visit`
- `/api/v1/world/locations`
- `/api/v1/world/locations/unlocked`
- `/api/v1/world/locations/visited`
- `/api/v1/world/locations/{location_id}`
- `/api/v1/world/deep-links`
- `/api/v1/world/scene-manifest`
- `/api/v1/world/feature-flags`
- Domain APIs for files, mentors, habits, learning, projects, analytics, achievements, profile,
  coding, knowledge, notifications, and search.

## Available World-Profile Data

- Current location identifier.
- Last visited location identifier.
- Preferred navigation method.
- Tutorial completion state.
- World-state version.
- Spawn-location identifier.
- Visited-location identifiers.
- Unlocked-location identifiers.

## Available Progression Data

- Domain events such as `file.uploaded`, `file.ingested`, `habit.logged`, `lesson.completed`,
  `quiz.completed`, `project.completed`, `achievement.unlocked`, and `world.location_visited`.
- Achievement definitions, progress counters, user achievements, reward definitions, and future
  world-unlock records.
- Habit, learning, project, analytics, notification, and knowledge-graph records for Command Mode
  surfaces.

## Available Location Identifiers

- `central_plaza`
- `library`
- `ai_hall`
- `programming_tower`
- `research_laboratory`
- `habit_garden`
- `command_center`
- `personal_home`
- `achievement_hall`
- `knowledge_observatory`
- `project_workshop`
- `media_theater`

## Available Deep-Link Contracts

Each world location maps to a Command Mode route such as `/app/library`, `/app/ai`, `/app/habits`,
`/app/learning`, `/app/coding`, `/app/projects`, `/app/analytics`, `/app/achievements`, and
`/app/settings`. Future scene interactions must route through these contracts or owner-scoped APIs.

## Recommended 3D Architecture

- Visual World Mode W1 through W4 are now progressive enhancements over the existing backend and API
  client.
- Keep Command Mode fully usable when WebGL, motion, or performance requirements are not met.
- Lazy-load visual world code separately from the Command Mode shell.
- Keep scene state transient in client state and persist only approved world profile/progression
  state through the backend.
- Use the scene-manifest API to decide which future assets and locations are available.
- `pnpm world:check` now allows only the visual dependencies approved by ADR 0025 while still
  blocking unregistered assets and unrelated game-engine dependencies.

## Recommended Scene Boundaries

- Start with a compact Central Plaza, Library, Habit Garden, and Command Center route.
- Load each district independently.
- Do not bundle every scene into the initial JavaScript payload.
- Keep future AI mentor, file, habit, and project interactions backed by the existing owner-scoped
  APIs.

## Performance Budgets

- Command Mode remains responsive on ordinary laptops.
- Visual World Mode should target 60 FPS on reasonable gaming hardware.
- Low mode should target a usable 30 FPS on integrated graphics.
- Initial payload must not include every future scene.
- Future visual runtime must support reduced motion, low-performance mode, tab throttling, and
  Command Mode fallback.

## Asset Requirements

- No visual assets exist yet.
- Future assets must be original or properly licensed.
- Future object-storage derived assets must use Aetherium-owned buckets.
- No private user file can be embedded into a world scene without explicit user action and owner
  checks.

## Art-Direction Requirements

- Cinematic, calm, readable, and sophisticated.
- Avoid copying protected game maps, assets, characters, brands, or distinctive trade dress.
- Avoid overloaded neon effects and excessive motion.
- Keep every world interaction accessible through Command Mode.

## Security And Privacy Constraints

- Do not expose private object keys, raw file bodies, prompts, cookies, session tokens, or provider
  secrets to the visual runtime.
- Scene interactions must call owner-scoped APIs.
- AI mentors must not silently mutate user data.
- Future audio, telemetry, analytics, and AI access must respect user preferences and consent.
- Visual World Mode must never be required to access user data.

## Remaining Blockers

- W1 visual dependencies are installed only in the web app.
- W2 player movement exists only in the diagnostic runtime and is not yet a finished traversal
  experience.
- W3 camera behavior exists only in the diagnostic runtime and is not yet connected to authored
  cinematic travel paths or final district collision meshes.
- W4 interactions exist only as diagnostic deep-link terminals and are not final district-specific
  props or panels.
- No final scene assets, art pipeline, district terrain, or performance test harness exists.
- WebGL capability detection and the lazy visual-mode router exist for the diagnostic runtime only.
- No Playwright visual regression or canvas-pixel checks exist for 3D scenes.

## Exact First Task For Visual World Mode

Implement W5, the World Manifest And Generation System. Add typed data-driven registries for
locations, assets, spawns, fast-travel points, interactions, environment zones, audio zones, camera
routes, and district themes without building final district art.
