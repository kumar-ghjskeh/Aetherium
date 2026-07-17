# Testing Strategy

## Goals

- Validate core behavior before broad UI polish.
- Keep tests close to each vertical slice.
- Add authorization tests before exposing user-owned data.
- Avoid tests that require external AI providers.

## Current Slice

Backend:

- FastAPI health endpoint tests with dependency overrides.
- Alembic migration smoke validation against PostgreSQL in CI.
- Ruff formatting and linting.
- mypy type checking.

Frontend and shared packages:

- TypeScript strict type checking.
- ESLint.
- Prettier.
- Vitest for shared client contracts.
- Next.js build validation.

## Future Backend Tests

- pytest unit tests for services.
- pytest integration tests against PostgreSQL.
- Factory fixtures for user-owned records.
- Authorization tests for every critical endpoint.
- File ingestion job tests with parser failure cases.
- AI gateway contract tests with fake providers.

## Future Frontend Tests

- React Testing Library for Command Mode workflows.
- Playwright for end-to-end vertical slices.
- axe-core accessibility checks.
- Reduced-motion and keyboard-only coverage.

## Future World Tests

- Scene state tests.
- Interaction tests for selected objects and fast travel.
- Stable visual regression screenshots.
- Performance budget checks for representative scenes.

## CI Gates

The minimal CI gate for the scaffold is:

- Dependency installation.
- Alembic migration smoke validation.
- Prettier check.
- ESLint.
- TypeScript type checks.
- Ruff.
- mypy.
- pytest.
- Vitest.
