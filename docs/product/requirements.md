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

The current implementation boundary is narrower:

- Docker development infrastructure.
- FastAPI scaffold.
- PostgreSQL connection and Alembic.
- Next.js scaffold.
- Shared validation and API types.
- Health endpoints.
- CI validation.

Authentication, 3D functionality, AI, file handling, and habits are intentionally deferred.

## Non-Goals For Current Slice

- No production authentication.
- No 3D scene or world interaction.
- No file upload or ingestion.
- No AI provider calls.
- No habit, task, project, or learning domain behavior.
- No claims that user-facing product workflows are complete.

## Success Criteria For Current Slice

- A developer can install dependencies and run validation commands.
- FastAPI exposes liveness and readiness endpoints.
- Readiness verifies PostgreSQL connectivity.
- Alembic can run against PostgreSQL.
- Next.js exposes a minimal scaffold and web health endpoint.
- Shared TypeScript contracts and Zod schemas exist for health responses.
- CI validates formatting, linting, type checks, tests, and migrations.
