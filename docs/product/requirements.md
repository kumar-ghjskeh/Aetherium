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
- Global search for implemented data, including files, extracted chunks, collections, tags, AI
  conversations, habits, learning topics, projects, project tasks, recent searches, and Command
  Palette integration.
- Provider-neutral AI gateway foundation for consent policies, model configuration, chat
  completions, streaming responses, embeddings, usage metadata, rate limits, retries, and fallback.
  External provider calls are disabled unless environment configuration and user consent both allow
  them.
- AI mentors and conversations with fictional default mentors, custom mentors, owner-scoped
  messages, memory controls, exports, edit/resend, regeneration, and AI Hall UI.
- Citation-backed document Q&A with explicit file-content consent, owner-scoped retrieval, validated
  source citations, and no-evidence responses when uploaded content cannot support an answer.
- Habit tracking with schedules, targets, logs, streaks, daily check-ins, weekly reviews, summaries,
  search integration, and Command Mode Habits UI.
- Learning and mastery engine with subjects, topics, prerequisites, courses, lessons, study
  sessions, quizzes, flashcards, transparent mastery records, learning goals, roadmaps, search
  integration, and Command Mode Learning UI.
- Project Dock foundation with projects, milestones, project tasks, notes, links, file/topic links,
  technologies, blockers, activity history, search integration, and Command Mode Projects UI.
- Progress analytics based only on stored user-owned records, with unsupported metrics marked
  unavailable instead of fabricated.
- Achievement progression foundation with seeded non-visual achievements, idempotent event
  processing, progress counters, future world-unlock records, and Command Mode Achievements UI.
- Personal profile and privacy settings with profile metadata, avatar presets or owned vault-image
  references, profile links, favorite projects/resources, certificates, AI memory and analytics
  controls, data-export request records, account deletion request records, and Command Mode Settings
  UI.
- Coding workspace foundation with saved snippets, exercises, submitted attempts, AI code
  explanation/review, project/file linking, and an explicit no-execution code-runner status.
- Knowledge graph data foundation with owner-scoped nodes and relationships across topics, files,
  lessons, projects, skills, questions, and achievements, plus non-visual related-topic and review
  recommendations in Command Mode.
- Notification and review workflows with owner-scoped in-app preferences, idempotent workflow
  records, weekly/monthly review prompts, learning and habit reminders, processing and AI failure
  notices, project deadline reminders, monthly review records, and Settings UI controls.

Visual 3D world rendering, visual Knowledge Observatory presentation, external notification
delivery, deployed scheduler delivery, actual export generation, account deletion execution, and
sandboxed code execution are intentionally deferred.

## Non-Goals For Current Slice

- No OAuth, social login, email delivery, password reset, MFA, or magic links.
- No 3D scene or world interaction.
- No arbitrary code execution.
- No visual knowledge graph or Knowledge Observatory implementation.
- No external notification delivery or deployed scheduler.
- No destructive account deletion execution.
- No generated data-export archives or public profile publishing.
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
- A signed-in user can use mentor conversations, document Q&A with explicit file-content consent,
  habit tracking, learning records, projects, analytics, achievements, and profile/privacy settings
  without exposing another user's data.
- A signed-in user can save coding snippets, create coding exercises, submit attempts, and request
  AI code explanation or review without executing arbitrary code in Aetherium service containers.
- A signed-in user can configure in-app notification workflows, run the review workflow generator,
  save monthly review notes, and mark notifications read without affecting another user's records.
