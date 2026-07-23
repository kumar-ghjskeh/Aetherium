# Testing Strategy

## Goals

- Validate core behavior before broad UI polish.
- Keep tests close to each vertical slice.
- Add authorization tests before exposing user-owned data.
- Avoid tests that require external AI providers.

## Current Slice

Backend:

- FastAPI health endpoint tests with dependency overrides.
- FastAPI hardening tests for request-ID echo/replacement, default API security headers,
  observability status, and configuration guardrails.
- Authentication API tests for registration, login, logout, current user, session expiration,
  revocation, cookie settings, rate limiting, cross-user isolation, and database uniqueness.
- User-owned foundation API tests for preference persistence, world profile updates, world
  location-registry contracts, idempotent domain events, notification read state, audit
  sanitization, pagination, unauthenticated access, cross-user isolation, and database uniqueness.
- Personal Vault backend tests for upload validation, idempotent upload initiation and completion,
  file listing, rename, favorites, collections, tags, download URL ownership, soft deletion,
  restoration, permanent deletion, unauthenticated access, cross-user isolation, and database
  constraints.
- File-ingestion backend tests for upload-created queue jobs, idempotent queueing, worker
  processing, chunk creation, visible failures, retry behavior, owner-scoped jobs and chunks, and
  derivative cleanup on permanent deletion.
- Search backend tests for result production across files, chunks, collections, and tags; entity
  filters; pagination; recent searches; authentication; and cross-user isolation.
- AI gateway backend tests for provider metadata, default owner-scoped consent and model
  configuration, deterministic chat and embeddings, usage records that exclude raw prompts,
  external-provider blocking, data-category consent, rate limiting, fallback behavior,
  unauthenticated access, cross-user isolation, database uniqueness, and settings guardrails.
- AI mentor backend tests for default mentor creation, custom mentor creation, permission updates,
  conversation lifecycle, gateway-backed messages, no raw prompt duplication in usage records,
  memory preference enforcement, edit/resend, regeneration, export, stop-generation conflict,
  searchable conversation titles, unauthenticated access, cross-user isolation, and database
  uniqueness.
- Document-QA backend tests for explicit file-content consent, source-backed answers, validated
  citations, no-evidence responses, usage records, collection consent scoping, unauthenticated
  access, validation failures, and cross-user isolation.
- Habit backend tests for creation, validation failures, pagination, logging, summary metrics,
  idempotent domain events, audit logs, check-ins, weekly reviews, archive behavior, search
  integration, unauthenticated access, cross-user isolation, and database uniqueness.
- Learning backend tests for subjects, topics, prerequisites, mastery records, course/module/lesson
  completion events, quiz attempts, flashcard reviews, study sessions, learning goals, roadmaps,
  validation failures, search integration, unauthenticated access, cross-user isolation, and
  database uniqueness.
- Project backend tests for project creation, pagination, milestones, tasks, notes, links, owned
  file links, owned topic links, technologies, blockers, activity history, completion events, audit
  logs, search integration, validation failures, unauthenticated access, cross-user isolation, and
  database uniqueness.
- Analytics backend tests for owner-scoped summary metrics, unavailable unsupported signals,
  authentication, invalid period validation, and cross-user isolation.
- Achievement backend tests for default definition seeding, idempotent event processing, threshold
  progression, search integration, notifications, unauthenticated access, cross-user isolation, and
  database uniqueness.
- Profile/settings backend tests for profile defaults and updates, avatar ownership validation,
  profile links, favorite projects/resources, certificates, privacy preference synchronization,
  data-export request idempotency, account deletion confirmation, unauthenticated access, cross-user
  isolation, and database constraints.
- Coding backend tests for snippet lifecycle, project/file/topic ownership checks, exercise and
  attempt submission, AI explain/review requests, unavailable runner status, audit-log sanitization,
  unauthenticated access, cross-user isolation, validation failures, pagination, and database
  constraints.
- Notification workflow backend tests for preference persistence, workflow idempotency, real
  owner-scoped candidate generation, disabled-category behavior, monthly review ownership, bulk read
  state, unauthenticated access, and database uniqueness.
- Alembic migration smoke validation against PostgreSQL in CI.
- Ruff formatting and linting.
- mypy type checking.
- Separate Ruff and mypy validation for the `apps/worker` ingestion process.

Frontend and shared packages:

- TypeScript strict type checking.
- ESLint.
- Prettier.
- Vitest for shared client contracts.
- React Testing Library coverage for auth form validation, invalid credentials, auth state,
  protected Command Mode redirect, and logout state clearing.
- React Testing Library coverage for the Command Mode shell, including authenticated API-backed
  rendering, anonymous redirect, `Ctrl/Cmd + K` command palette navigation, notification read state,
  notification bulk-read state, shell data error state, and settings persistence through the shared
  API client.
- API-client contract tests for the user-owned foundation endpoints.
- API-client contract tests for Personal Vault upload, file, collection, tag, favorite, and download
  methods.
- API-client contract tests for processing jobs, retries, and file chunks.
- API-client contract tests for global search and recent-search endpoints.
- API-client contract tests for provider-neutral AI gateway endpoints.
- API-client contract tests for citation-backed document-QA responses.
- API-client contract tests for mentor, permission, conversation, message, memory, export,
  edit/resend, regeneration, and stop-generation endpoints.
- API-client contract tests for habit, log, summary, daily check-in, and weekly review endpoints.
- API-client contract tests for learning subjects, topics, prerequisites, resources, courses,
  modules, lessons, study sessions, quizzes, questions, attempts, flashcards, reviews, mastery
  records, goals, and roadmaps.
- API-client contract tests for Project Dock projects, milestones, project tasks, notes, links, file
  links, topic links, technologies, blockers, and activity.
- API-client contract tests for analytics summary responses and period query serialization.
- API-client contract tests for achievement list, summary, and event-processing endpoints.
- API-client contract tests for personal profile, profile links, favorite projects/resources,
  certificates, privacy settings, data-export requests, and account deletion request endpoints.
- API-client contract tests for Coding workspace snippets, exercises, attempts, assistant requests,
  and runner status.
- API-client contract tests for Knowledge Graph nodes, relationships, sync, related-topic context,
  prerequisites, review recommendations, and summary endpoints.
- API-client contract tests for notification preferences, workflow listing, workflow generation,
  bulk read state, and monthly review endpoints.
- API-client contract tests for World Mode location registry, feature flags, deep-link contracts,
  scene-manifest schema, and profile visit endpoints.
- Repository guard coverage through `pnpm world:check`, which allows only ADR-approved visual
  runtime dependencies in the web app and blocks unapproved visual dependencies plus unregistered
  visual-world asset files.
- Deployment-readiness guard coverage through `pnpm deployment:check`, which verifies required
  operations docs, environment variables, and validation-only workflow wiring.
- Next.js build validation.
- React Testing Library coverage for the Library page, including loading, empty, error, upload,
  favorite, tag, delete, processing failure, and retry states.
- React Testing Library coverage for Command Palette global search and result navigation.
- React Testing Library coverage for the AI Hall page, including loading, empty, message-send,
  gateway error, custom mentor creation, permission-update states, document-QA citation rendering,
  and document-QA consent error handling.
- React Testing Library coverage for the Habits page, including loading, empty, error, creation
  validation, creation submission, logging, daily check-in, and weekly review states.
- React Testing Library coverage for the Learning page, including loading, empty, error, subject and
  topic creation validation, mastery display, quiz attempts, study sessions, goals, roadmaps, and
  flashcard reviews.
- React Testing Library coverage for the Projects page, including loading, empty, error, creation
  validation, project creation, status changes, task completion, notes, technologies, blockers, and
  activity-backed selected project state.
- React Testing Library coverage for the Analytics page, including loading, empty, error, period
  changes, real summary rendering, unavailable metrics, and accessible trend tables.
- React Testing Library coverage for the Achievements page, including loading, summary/list
  rendering, filtering, event-processing refreshes, error states, progress bars, and world-unlock
  tables.
- React Testing Library coverage for the Settings page, including loading, empty and error states,
  profile validation, privacy updates, profile record creation, data-export requests, and exact
  account deletion confirmation handling, notification preference updates, workflow generation, and
  monthly review persistence.
- React Testing Library coverage for the Coding workspace page, including loading, empty and error
  states, snippet validation, save/update/archive flows, AI explain/review requests, exercise
  creation, attempt submission, and unavailable runner messaging.
- React Testing Library coverage for the Learning page knowledge graph panel, including graph
  summary rendering, related-topic rows, review recommendations, sync refresh behavior, and error
  state handling through the shared API client.
- React Testing Library coverage for the World page, including API-backed location contracts,
  feature flags, scene-manifest state, runtime capability fallback, reduced-motion fallback, lazy
  runtime loading, and error handling.

## Future Backend Tests

- pytest unit tests for additional services.
- pytest integration tests against PostgreSQL for user-owned domains.
- Factory fixtures for user-owned records.
- Authorization tests for every critical endpoint.
- Broader parser-specific ingestion tests for PDF, DOCX, image/OCR, and malformed document cases.
- Citation validation fuzzing for provider outputs with malformed or adversarial source labels.

## Future Frontend Tests

- Broader React Testing Library coverage for Command Mode workflows.
- Playwright for end-to-end vertical slices.
- axe-core accessibility checks.
- Reduced-motion and keyboard-only coverage.

## Future World Tests

- Runtime capability and fallback tests for unsupported WebGL, reduced motion, low graphics mode,
  asset-loading failure, and tab backgrounding.
- Scene state tests.
- Interaction tests for selected objects and fast travel.
- Stable visual regression screenshots.
- Performance budget checks for representative scenes.

## CI Gates

The minimal CI gate is:

- Independence check.
- Visual-world deferral check.
- Deployment-readiness check.
- Dependency installation.
- Alembic migration smoke validation.
- Prettier check.
- ESLint.
- TypeScript type checks.
- Ruff.
- mypy.
- pytest.
- Vitest.
- Next.js production build.
