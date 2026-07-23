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
file ingestion, global search, provider-neutral AI gateway, AI mentor conversations, citation-backed
document Q&A, habit tracking, the learning and mastery engine, the Project Dock foundation, and
progress analytics, the achievement progression foundation, personal profile/privacy settings, and
the Coding workspace foundation, the non-visual knowledge graph data foundation, and in-app
notification/review workflows:

- `apps/api`: FastAPI app, database settings, Alembic, health endpoints.
- `apps/web`: Next.js App Router scaffold, web health route, auth UI, and protected `/app` Command
  Mode route family.
- `packages/shared-types`: TypeScript contracts shared by frontend packages.
- `packages/validation`: Zod schemas that validate API contract payloads.
- `packages/api-client`: Typed API client for health, auth, user-owned foundation, Personal Vault,
  search, AI gateway, document Q&A, mentor conversation, habit, learning, project, analytics,
  achievements, personal profile settings, and coding APIs.
- Identity domain: Aetherium-owned `users` and `sessions` tables, Argon2id password hashing,
  server-side session revocation, and product-specific cookies.
- User-owned foundation: preferences, non-visual world profile state, domain events, notifications,
  audit logs, ownership checks, and pagination.
- World Mode data foundation: static location registry, owner-scoped current/visited/unlocked
  location state, deep-link contracts, future scene-manifest schema, feature flags, and an
  API-backed `/app/world` contract page.
- Command Mode shell: responsive navigation, command palette, notifications panel, profile menu,
  settings controls, and real API-backed loading, empty, and error states.
- Personal Vault: user-owned file metadata, presigned upload/download contracts, S3-compatible
  object storage abstraction, collections, tags, favorites, soft deletion, permanent deletion, and a
  Library page that avoids fake search or AI data while showing real processing state.
- File ingestion: durable processing jobs, a standalone worker process, text extraction, chunk
  storage, failure records, retry APIs, and Library retry controls.
- Search: owner-scoped global search over files, extracted chunks, collections, tags, AI
  conversation titles, active habits, learning topics, projects, and project tasks with recent
  search persistence and Command Palette integration. Semantic/vector ranking remains disabled until
  a later retrieval slice wires embedding jobs to the AI gateway with consent.
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
- Habits: owner-scoped habits, schedules, targets, logs, streak metrics, daily check-ins, weekly
  reviews, idempotent `habit.logged` domain events, audit logs, search results, and a Command Mode
  Habits UI. The Habit Garden is represented only as non-visual progress data in this slice.
- Learning: owner-scoped subjects, topics, prerequisites, courses, modules, lessons, study sessions,
  quizzes, questions, attempts, flashcards, reviews, mastery records, learning goals, study
  roadmaps, idempotent lesson and quiz domain events, search results, and a Command Mode Learning
  UI. Research Laboratory and Knowledge Observatory visuals are deferred.
- Project Dock: owner-scoped projects, milestones, project tasks, notes, links, file links, topic
  links, technologies, blockers, project activity, idempotent completion events, search results, and
  a Command Mode Projects UI. Project AI mutation tools are deferred.
- Progress analytics: read-only owner-scoped summaries and trend buckets derived from stored
  learning, habit, file, AI usage, and project rows. Metrics that do not have implemented source
  events are marked unavailable instead of being invented.
- Achievements: seeded non-visual definitions, idempotent rules over domain events, owner-scoped
  progress counters, user achievements, reward definitions, future world-unlock records, search
  results, and Command Mode Achievements UI. Visual Achievement Hall rewards are deferred.
- Profile and settings: owner-scoped profile metadata, avatar preset or owned vault-image
  references, profile links, favorite projects/resources, certificates, privacy controls,
  data-export request records, account deletion request records, and Command Mode Settings UI.
- Coding workspace: owner-scoped snippets, exercises, submitted attempts, AI explain/review
  requests, Monaco editor UI, project/file linking, and an unavailable code-runner provider that
  prevents arbitrary user code from executing in the API, worker, database, or web containers.
- Knowledge graph: owner-scoped nodes and relationships for topics, files, lessons, projects,
  skills, questions, and achievements, plus approved source sync, related-topic and prerequisite
  queries, transparent review recommendations, and a 2D Learning UI panel.
- Notification workflows: owner-scoped in-app notification preferences, idempotent workflow records,
  weekly/monthly review prompts, learning and habit reminders, processing and AI failure notices,
  project deadline reminders, monthly review records, bulk read state, and Settings UI controls.
  External delivery is deferred.
- Production hardening and deployment preparation: request IDs, security headers, structured logs,
  observability status, environment separation, migration and rollback procedures, release
  checklist, deployment-readiness validation, and final 3D readiness checkpoint.

## Frontend Boundaries

Command Mode is implemented under `/app` and uses the same auth and foundation APIs that future
World Mode will use. Domain sections that do not have backend data yet render explicit empty states
instead of fake content. The `/app/world` route is an API-backed non-visual data-contract page and
must not include Three.js, React Three Fiber, scene assets, or player/camera controls until the
visual world phase.

## Backend Boundaries

Backend domains will be added incrementally:

- Additional world configuration and user world state beyond the current non-visual profile.
- Global semantic search and AI-assisted knowledge extraction on top of the current Personal Vault,
  ingestion, search, AI gateway, and knowledge graph records.
- Mentor tools that can reuse citation-backed retrieval after explicit user approval.
- Future sandboxed code execution as a separate isolated service behind the `CodeRunner` interface.
- Goals and global tasks beyond project-scoped tasks.
- Audit expansion and security hardening.

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
- Habit routes are under `/api/v1/habits` and expose habits, logs, summaries, daily check-ins, and
  weekly reviews.
- Learning routes are under `/api/v1/learning` and expose subjects, topics, prerequisites,
  resources, courses, modules, lessons, study sessions, quizzes, questions, attempts, flashcards,
  reviews, mastery records, learning goals, and study roadmaps.
- Project routes are under `/api/v1/projects` and expose projects, milestones, project tasks, notes,
  links, file links, topic links, technologies, blockers, and activity history.
- Analytics routes are under `/api/v1/analytics` and expose read-only summary metrics and trend
  buckets.
- Achievement routes are under `/api/v1/achievements` and expose progress lists, summaries, and
  explicit event processing.
- Personal profile and privacy routes are under `/api/v1/users` and expose profile metadata, profile
  links, favorites, certificates, privacy settings, and metadata-only export/deletion request
  records.
- Coding routes are under `/api/v1/coding` and expose snippets, exercises, submitted attempts, AI
  explain/review requests, and code-runner status without executing code.
- Knowledge graph routes are under `/api/v1/knowledge` and expose owner-scoped graph nodes,
  relationships, sync, related-topic context, prerequisites, review recommendations, and summary
  counts without rendering a visual graph.
- Notification workflow routes are under `/api/v1/notifications` and expose owner-scoped
  preferences, workflow records, in-app generation, monthly reviews, and read-state updates without
  external delivery.

## Configuration

Runtime configuration comes from environment variables. `.env.example` contains variable names only.
Production secrets must be supplied through deployment secret management, not source control.

## Deployment Assumption

The first production-capable architecture assumes separately deployed web, API, worker, PostgreSQL,
Redis, object storage, logging, monitoring, and backup services. Docker Compose is a development
convenience, not the production orchestration contract. The repository includes deployment
preparation and validation-only workflows, but it does not deploy automatically.
