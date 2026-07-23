# Aetherium

Aetherium is planned as an immersive personal learning operating system: a practical command
interface backed by an optional cinematic world presentation layer.

This repository currently contains the Phase 0 documentation baseline and early non-3D vertical
slices: the infrastructure scaffold, standalone password authentication with server-side sessions,
the user-owned foundation, the protected Command Mode application shell, and Personal Vault file
storage with background ingestion, global search, the provider-neutral AI gateway, AI mentor
conversations, citation-backed document Q&A, habit tracking, the learning and mastery engine, and
the Project Dock foundation, progress analytics, the achievement progression foundation, personal
profile/privacy settings, the Coding workspace foundation, and the non-visual knowledge graph data
foundation. It does not yet implement visual 3D world navigation.

Aetherium is a standalone product. It uses its own repository, database, Redis namespace,
object-storage buckets, environment variables, Docker resources, CI workflow, and future
authentication/session system. See `docs/architecture/product-independence.md` and
`docs/architecture/environment-isolation.md`.

## Implemented Scaffold

- pnpm workspace and Turborepo structure.
- FastAPI scaffold with versioned health endpoints.
- PostgreSQL async connection configuration and Alembic migration setup.
- Next.js App Router scaffold.
- Shared TypeScript API types, Zod validation, and a minimal typed API client.
- Standalone user and session tables with Argon2id password hashing.
- Registration, email/password login, logout, and current-user endpoints under `/api/v1/auth`.
- Authenticated Command Mode shell guarded by the Aetherium session cookie.
- User-owned preferences, non-visual world profile state, domain events, notifications, audit logs,
  ownership helpers, and paginated list endpoints.
- Responsive Command Mode application shell under `/app` with sidebar navigation, mobile navigation,
  `Ctrl/Cmd + K` command palette, notification panel, profile menu, settings page, and real
  API-backed loading, empty, and error states.
- Personal Vault storage under `/api/v1/files` with user-owned file metadata, presigned upload and
  download URLs, collections, tags, favorites, soft deletion, permanent deletion, and a Library UI.
- Background file ingestion with durable processing jobs, a standalone `aetherium-worker`, text
  extraction, chunk storage, failure visibility, retry APIs, and Library retry controls.
- Global search under `/api/v1/search` over files, extracted chunks, collections, tags, AI
  conversations, habits, learning topics, projects, and project tasks, with recent searches and
  Command Palette integration.
- Provider-neutral AI gateway under `/api/v1/ai` with provider metadata, owner-scoped consent
  policies, feature model configuration, chat completions, streaming responses, embeddings, usage
  records, rate limits, retries, and fallback. External provider calls are disabled unless both the
  environment and user consent allow them.
- AI mentors under `/api/v1/mentors` with fictional default mentors, custom mentor creation, mentor
  permissions, owner-scoped conversations, messages, memory settings, exports, edit/resend,
  regeneration, and a Command Mode AI Hall UI. Mentor chat uses the AI gateway and does not
  automatically attach private files or other product data.
- Citation-backed document Q&A under `/api/v1/ai/document-qa`, using explicit document-QA
  file-content consent, owner-scoped ready chunk retrieval, bounded semantic reranking when
  embeddings exist, validated source labels, and citation links back to the Library.
- Habit tracking under `/api/v1/habits` with owner-scoped habits, schedules, targets, logs, streaks,
  daily check-ins, weekly reviews, weekly/monthly summaries, domain events, audit logs, global
  search integration, and a Command Mode Habits UI.
- Learning under `/api/v1/learning` with owner-scoped subjects, topics, prerequisites, courses,
  modules, lessons, study sessions, quizzes, questions, attempts, flashcards, reviews, transparent
  mastery records, learning goals, study roadmaps, global search integration, and a Command Mode
  Learning UI.
- Project Dock under `/api/v1/projects` with owner-scoped projects, milestones, project tasks,
  notes, links, file links, topic links, technologies, blockers, activity history, project
  completion events, global search integration, and a Command Mode Projects UI.
- Progress analytics under `/api/v1/analytics` with owner-scoped summary metrics, trend buckets,
  available/unavailable metric flags, accessible Command Mode charts, and no synthetic activity.
- Achievements under `/api/v1/achievements` with seeded non-visual achievement definitions,
  idempotent domain-event processing, progress counters, user achievements, reward definitions,
  future world-unlock records, global search integration, and a Command Mode Achievements UI.
- Personal profile and settings under `/api/v1/users` with owner-scoped profile metadata, avatar
  preset or owned vault-image references, profile links, favorite projects/resources, certificates,
  privacy controls, AI memory and analytics preferences, data-export request records, account
  deletion request records, and a Command Mode Settings UI.
- Coding workspace under `/api/v1/coding` with owner-scoped snippets, coding exercises, submitted
  attempts, AI explain/review requests through the provider-neutral gateway, a Monaco-backed Command
  Mode editor, and an explicit unavailable code-runner contract. Aetherium does not execute
  arbitrary user code inside the API, worker, database, or web containers.
- Knowledge graph under `/api/v1/knowledge` with owner-scoped nodes and relationships for topics,
  files, lessons, projects, skills, questions, and achievements, approved system sync, related-topic
  and prerequisite queries, review recommendations, and a 2D Learning UI panel.
- Non-visual `/app/world` route that clearly marks visual World Mode as future work.
- Docker Compose development infrastructure for Aetherium-isolated PostgreSQL, Redis, MinIO, API,
  worker, and web services.
- CI workflow for independence checks, formatting, linting, type checks, tests, build, and Alembic
  migration smoke validation.

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
  operations/
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

   Fill the empty values in `.env` with local development values. Docker Compose also provides
   Aetherium-specific development defaults for local containers.

5. Start the development services:

   ```powershell
   docker compose up --build
   ```

## Validation

```powershell
pnpm independence:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
py -3 -m alembic -c apps/api/alembic.ini upgrade head
```

On Unix-like systems, replace `py -3 -m` with `python -m`.

## Health Endpoints

- API liveness: `GET http://localhost:8000/api/v1/health/live`
- API readiness: `GET http://localhost:8000/api/v1/health/ready`
- Web liveness: `GET http://localhost:3000/api/health`

## Authentication Endpoints

- Register: `POST http://localhost:8000/api/v1/auth/register`
- Login: `POST http://localhost:8000/api/v1/auth/login`
- Logout: `POST http://localhost:8000/api/v1/auth/logout`
- Current user: `GET http://localhost:8000/api/v1/auth/me`

The browser stores authentication only in the HttpOnly `aetherium_session` cookie. Tokens are never
stored in localStorage or sessionStorage.

## Command Mode Routes

- Overview: `http://localhost:3000/app`
- Library: `http://localhost:3000/app/library`
- AI Hall: `http://localhost:3000/app/ai`
- Learning: `http://localhost:3000/app/learning`
- Coding: `http://localhost:3000/app/coding`
- Habits: `http://localhost:3000/app/habits`
- Projects: `http://localhost:3000/app/projects`
- Analytics: `http://localhost:3000/app/analytics`
- Achievements: `http://localhost:3000/app/achievements`
- Settings: `http://localhost:3000/app/settings`
- Future World Mode placeholder: `http://localhost:3000/app/world`

All `/app` routes are protected by the Aetherium auth state. Unauthenticated users are redirected to
`/login?next=/app`.

## User-Owned Foundation Endpoints

- Preferences: `GET/PATCH http://localhost:8000/api/v1/settings/preferences`
- Non-visual world profile: `GET/PATCH http://localhost:8000/api/v1/world/profile`
- Non-visual world location visit: `POST http://localhost:8000/api/v1/world/visit`
- Domain events: `GET/POST http://localhost:8000/api/v1/domain-events`
- Notifications: `GET http://localhost:8000/api/v1/notifications`
- Mark notification read: `POST http://localhost:8000/api/v1/notifications/{id}/read`
- Audit logs: `GET http://localhost:8000/api/v1/audit-logs`

## Personal Profile And Settings Endpoints

- Profile: `GET/PATCH http://localhost:8000/api/v1/users/profile`
- Profile links: `GET/POST http://localhost:8000/api/v1/users/profile/links`
- Delete profile link: `DELETE http://localhost:8000/api/v1/users/profile/links/{id}`
- Favorite projects: `GET/POST http://localhost:8000/api/v1/users/profile/favorite-projects`
- Remove favorite project:
  `DELETE http://localhost:8000/api/v1/users/profile/favorite-projects/{project_id}`
- Favorite resources: `GET/POST http://localhost:8000/api/v1/users/profile/favorite-resources`
- Remove favorite resource:
  `DELETE http://localhost:8000/api/v1/users/profile/favorite-resources/{id}`
- Certificates: `GET/POST http://localhost:8000/api/v1/users/profile/certificates`
- Delete certificate: `DELETE http://localhost:8000/api/v1/users/profile/certificates/{id}`
- Privacy settings: `GET/PATCH http://localhost:8000/api/v1/users/privacy`
- Data-export requests: `GET/POST http://localhost:8000/api/v1/users/data-export-requests`
- Account deletion requests: `GET/POST http://localhost:8000/api/v1/users/account-deletion-requests`

## Personal Vault Endpoints

- Start upload: `POST http://localhost:8000/api/v1/files/uploads`
- Complete upload: `POST http://localhost:8000/api/v1/files/uploads/{id}/complete`
- List files: `GET http://localhost:8000/api/v1/files`
- File detail: `GET/PATCH/DELETE http://localhost:8000/api/v1/files/{id}`
- Restore file: `POST http://localhost:8000/api/v1/files/{id}/restore`
- Permanent delete: `DELETE http://localhost:8000/api/v1/files/{id}/permanent`
- Download URL: `GET http://localhost:8000/api/v1/files/{id}/download`
- Favorites: `POST/DELETE http://localhost:8000/api/v1/files/{id}/favorite`
- Collections: `GET/POST http://localhost:8000/api/v1/files/collections`
- Add to collection: `POST http://localhost:8000/api/v1/files/collections/{collection_id}/items`
- Remove from collection:
  `DELETE http://localhost:8000/api/v1/files/collections/{collection_id}/items/{file_id}`
- Tags: `GET http://localhost:8000/api/v1/files/tags`
- File tags: `POST/DELETE http://localhost:8000/api/v1/files/{id}/tags`
- Processing jobs: `GET http://localhost:8000/api/v1/files/processing-jobs`
- Retry processing job: `POST http://localhost:8000/api/v1/files/processing-jobs/{job_id}/retry`
- File processing jobs: `GET/POST http://localhost:8000/api/v1/files/{id}/processing-jobs`
- File chunks: `GET http://localhost:8000/api/v1/files/{id}/chunks`

## Search Endpoints

- Run search: `POST http://localhost:8000/api/v1/search`
- Recent searches: `GET http://localhost:8000/api/v1/search/recent`

## Habit Endpoints

- Habits: `GET/POST http://localhost:8000/api/v1/habits`
- Habit detail: `GET/PATCH http://localhost:8000/api/v1/habits/{id}`
- Archive habit: `POST http://localhost:8000/api/v1/habits/{id}/archive`
- Habit logs: `GET/POST http://localhost:8000/api/v1/habits/{id}/logs`
- Habit summary: `GET http://localhost:8000/api/v1/habits/summary`
- Daily check-in: `GET/PUT http://localhost:8000/api/v1/habits/check-ins/{date}`
- Weekly reviews: `GET/POST http://localhost:8000/api/v1/habits/weekly-reviews`

## Learning Endpoints

- Subjects: `GET/POST http://localhost:8000/api/v1/learning/subjects`
- Topics: `GET/POST http://localhost:8000/api/v1/learning/topics`
- Topic prerequisites: `POST http://localhost:8000/api/v1/learning/topics/{topic_id}/prerequisites`
- Topic mastery: `GET http://localhost:8000/api/v1/learning/topics/{topic_id}/mastery`
- Learning resources: `GET/POST http://localhost:8000/api/v1/learning/resources`
- Courses: `GET/POST http://localhost:8000/api/v1/learning/courses`
- Course modules: `POST http://localhost:8000/api/v1/learning/courses/{course_id}/modules`
- Lessons: `POST http://localhost:8000/api/v1/learning/modules/{module_id}/lessons`
- Complete lesson: `POST http://localhost:8000/api/v1/learning/lessons/{lesson_id}/complete`
- Study sessions: `GET/POST http://localhost:8000/api/v1/learning/study-sessions`
- End study session: `PATCH http://localhost:8000/api/v1/learning/study-sessions/{session_id}/end`
- Quizzes: `GET/POST http://localhost:8000/api/v1/learning/quizzes`
- Questions: `POST http://localhost:8000/api/v1/learning/quizzes/{quiz_id}/questions`
- Attempts: `POST http://localhost:8000/api/v1/learning/quizzes/{quiz_id}/attempts`
- Flashcards: `GET/POST http://localhost:8000/api/v1/learning/flashcards`
- Flashcard reviews: `POST http://localhost:8000/api/v1/learning/flashcards/{flashcard_id}/reviews`
- Learning goals: `GET/POST http://localhost:8000/api/v1/learning/goals`
- Study roadmaps: `GET/POST http://localhost:8000/api/v1/learning/roadmaps`

## Project Endpoints

- Projects: `GET/POST http://localhost:8000/api/v1/projects`
- Project detail: `GET/PATCH http://localhost:8000/api/v1/projects/{id}`
- Archive project: `POST http://localhost:8000/api/v1/projects/{id}/archive`
- Milestones: `POST http://localhost:8000/api/v1/projects/{id}/milestones`
- Update milestone: `PATCH http://localhost:8000/api/v1/projects/milestones/{milestone_id}`
- Tasks: `POST http://localhost:8000/api/v1/projects/{id}/tasks`
- Update task: `PATCH http://localhost:8000/api/v1/projects/tasks/{task_id}`
- Notes: `POST http://localhost:8000/api/v1/projects/{id}/notes`
- Links: `POST http://localhost:8000/api/v1/projects/{id}/links`
- File links: `POST http://localhost:8000/api/v1/projects/{id}/files`
- Topic links: `POST http://localhost:8000/api/v1/projects/{id}/topics`
- Technologies: `POST http://localhost:8000/api/v1/projects/{id}/technologies`
- Blockers: `POST http://localhost:8000/api/v1/projects/{id}/blockers`
- Update blocker: `PATCH http://localhost:8000/api/v1/projects/blockers/{blocker_id}`
- Activity: `GET http://localhost:8000/api/v1/projects/{id}/activity`

## Coding Workspace Endpoints

- Snippets: `GET/POST http://localhost:8000/api/v1/coding/snippets`
- Snippet detail: `GET/PATCH http://localhost:8000/api/v1/coding/snippets/{id}`
- Archive snippet: `POST http://localhost:8000/api/v1/coding/snippets/{id}/archive`
- Exercises: `GET/POST http://localhost:8000/api/v1/coding/exercises`
- Exercise attempts: `POST http://localhost:8000/api/v1/coding/exercises/{id}/attempts`
- Assistant requests: `GET http://localhost:8000/api/v1/coding/assistant/requests`
- Explain code: `POST http://localhost:8000/api/v1/coding/assistant/explain`
- Review code: `POST http://localhost:8000/api/v1/coding/assistant/review`
- Runner status: `GET http://localhost:8000/api/v1/coding/runner/status`

## Knowledge Graph Endpoints

- Nodes: `GET/POST http://localhost:8000/api/v1/knowledge/nodes`
- Relationships: `GET/POST http://localhost:8000/api/v1/knowledge/relationships`
- Sync approved records: `POST http://localhost:8000/api/v1/knowledge/sync`
- Related topic context: `GET http://localhost:8000/api/v1/knowledge/topics/{id}/related`
- Topic prerequisites: `GET http://localhost:8000/api/v1/knowledge/topics/{id}/prerequisites`
- Review recommendations: `GET http://localhost:8000/api/v1/knowledge/recommendations`
- Summary: `GET http://localhost:8000/api/v1/knowledge/summary`

## Analytics Endpoints

- Summary: `GET http://localhost:8000/api/v1/analytics/summary?period=month`

## Achievement Endpoints

- Achievements: `GET http://localhost:8000/api/v1/achievements`
- Summary: `GET http://localhost:8000/api/v1/achievements/summary`
- Process events: `POST http://localhost:8000/api/v1/achievements/process`

## AI Gateway Endpoints

- Providers: `GET http://localhost:8000/api/v1/ai/providers`
- Consent policies: `GET/PATCH http://localhost:8000/api/v1/ai/consent`
- Model configurations: `GET/PUT http://localhost:8000/api/v1/ai/model-configs`
- Usage records: `GET http://localhost:8000/api/v1/ai/usage`
- Chat completions: `POST http://localhost:8000/api/v1/ai/chat/completions`
- Streaming chat completions: `POST http://localhost:8000/api/v1/ai/chat/completions/stream`
- Embeddings: `POST http://localhost:8000/api/v1/ai/embeddings`
- Document Q&A: `POST http://localhost:8000/api/v1/ai/document-qa`

## AI Mentor Endpoints

- Mentors: `GET/POST http://localhost:8000/api/v1/mentors`
- Mentor detail: `GET/PATCH http://localhost:8000/api/v1/mentors/{id}`
- Archive mentor: `POST http://localhost:8000/api/v1/mentors/{id}/archive`
- Mentor permissions: `GET/PATCH http://localhost:8000/api/v1/mentors/{id}/permissions`
- Conversations: `GET/POST http://localhost:8000/api/v1/mentors/conversations`
- Conversation detail: `GET/PATCH/DELETE http://localhost:8000/api/v1/mentors/conversations/{id}`
- Archive conversation: `POST http://localhost:8000/api/v1/mentors/conversations/{id}/archive`
- Conversation memory: `PATCH http://localhost:8000/api/v1/mentors/conversations/{id}/memory`
- Messages: `GET/POST http://localhost:8000/api/v1/mentors/conversations/{id}/messages`
- Edit and resend:
  `PATCH http://localhost:8000/api/v1/mentors/conversations/{id}/messages/{message_id}`
- Regenerate:
  `POST http://localhost:8000/api/v1/mentors/conversations/{id}/messages/{message_id}/regenerate`
- Stop generation: `POST http://localhost:8000/api/v1/mentors/conversations/{id}/stop`
- Export conversation: `GET http://localhost:8000/api/v1/mentors/conversations/{id}/export`

## Local Resource Names

- Compose project: `aetherium`
- Network: `aetherium_internal`
- Containers: `aetherium-postgres`, `aetherium-redis`, `aetherium-minio`, `aetherium-minio-init`,
  `aetherium-api`, `aetherium-worker`, `aetherium-web`
- Volumes: `aetherium_postgres_data`, `aetherium_redis_data`, `aetherium_minio_data`,
  `aetherium_web_node_modules`, `aetherium_web_next`
- Development database: `aetherium_app_dev`
- Development database role: `aetherium_app`
- Private files bucket: `aetherium-private-files-dev`
- Derived assets bucket: `aetherium-derived-assets-dev`
- User avatars bucket: `aetherium-user-avatars-dev`
- Redis key prefix: `aetherium:`
- File ingestion queue name: `aetherium:file-ingestion`
- Session cookie: `aetherium_session`

## Current Limitations

- Docker is scaffolded but not required for unit tests.
- API readiness requires PostgreSQL.
- Email verification, password reset, OAuth, MFA, and magic links are not implemented yet.
- Personal Vault ingestion extracts text and stores chunks. Global search can find those chunks, and
  document Q&A can answer against them with citations when explicit file-content consent is enabled.
- File-ingestion embedding jobs are still recorded as skipped by default until semantic search wires
  the AI gateway into the worker with explicit consent.
- AI mentors and the Coding workspace are persistent and gateway-backed. The knowledge graph is
  available as non-visual owner-scoped data. Visual 3D scenes do not exist yet.
- The Coding workspace can save snippets, exercises, attempts, and AI explain/review records. Code
  execution is deliberately unavailable until a separate isolated sandbox provider is implemented
  and validated.
- Progress analytics are read-only aggregations from existing stored data. Unsupported metrics such
  as files opened and coding sessions are marked unavailable instead of being fabricated.
- Achievements are non-visual progression records. Future world unlocks are stored as identifiers
  only; no scene, asset, or 3D reward is rendered.
- Profile and privacy settings are functional metadata records. Data-export and account deletion
  request endpoints record owner-scoped workflow requests only; export generation and destructive
  deletion execution are not active yet.
- Learning mastery is a transparent heuristic from stored quiz, review, exercise, confidence, hint,
  recency, and future project-evidence signals. It is not a scientific learning diagnosis.
- Habit reminders and external notifications are deferred to the notification/review workflow slice.
