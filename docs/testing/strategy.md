# Testing Strategy

## Goals

- Validate core behavior before broad UI polish.
- Keep tests close to each vertical slice.
- Add authorization tests before exposing user-owned data.
- Avoid tests that require external AI providers.

## Current Slice

Backend:

- FastAPI health endpoint tests with dependency overrides.
- Authentication API tests for registration, login, logout, current user, session expiration,
  revocation, cookie settings, rate limiting, cross-user isolation, and database uniqueness.
- User-owned foundation API tests for preference persistence, world profile updates, idempotent
  domain events, notification read state, audit sanitization, pagination, unauthenticated access,
  cross-user isolation, and database uniqueness.
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
  shell data error state, and settings persistence through the shared API client.
- API-client contract tests for the user-owned foundation endpoints.
- API-client contract tests for Personal Vault upload, file, collection, tag, favorite, and download
  methods.
- API-client contract tests for processing jobs, retries, and file chunks.
- API-client contract tests for global search and recent-search endpoints.
- API-client contract tests for provider-neutral AI gateway endpoints.
- Next.js build validation.
- React Testing Library coverage for the Library page, including loading, empty, error, upload,
  favorite, tag, delete, processing failure, and retry states.
- React Testing Library coverage for Command Palette global search and result navigation.

## Future Backend Tests

- pytest unit tests for additional services.
- pytest integration tests against PostgreSQL for user-owned domains.
- Factory fixtures for user-owned records.
- Authorization tests for every critical endpoint.
- Broader parser-specific ingestion tests for PDF, DOCX, image/OCR, and malformed document cases.
- AI mentor, conversation, and citation-backed document Q&A tests using fake providers and fixture
  retrieval results.

## Future Frontend Tests

- Broader React Testing Library coverage for Command Mode workflows.
- Playwright for end-to-end vertical slices.
- axe-core accessibility checks.
- Reduced-motion and keyboard-only coverage.

## Future World Tests

- Scene state tests.
- Interaction tests for selected objects and fast travel.
- Stable visual regression screenshots.
- Performance budget checks for representative scenes.

## CI Gates

The minimal CI gate is:

- Independence check.
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
