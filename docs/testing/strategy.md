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
- Alembic migration smoke validation against PostgreSQL in CI.
- Ruff formatting and linting.
- mypy type checking.

Frontend and shared packages:

- TypeScript strict type checking.
- ESLint.
- Prettier.
- Vitest for shared client contracts.
- React Testing Library coverage for auth form validation, invalid credentials, auth state,
  protected Command Mode redirect, and logout state clearing.
- API-client contract tests for the user-owned foundation endpoints.
- Next.js build validation.

## Future Backend Tests

- pytest unit tests for additional services.
- pytest integration tests against PostgreSQL for user-owned domains.
- Factory fixtures for user-owned records.
- Authorization tests for every critical endpoint.
- File ingestion job tests with parser failure cases.
- AI gateway contract tests with fake providers.

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
