# Roadmap

## Phase 0 - Product And Architecture

Status: baseline documented in this repository.

- Product requirements.
- System overview.
- Data model plan.
- API plan.
- World engine plan.
- AI gateway and retrieval plan.
- Threat model.
- Testing strategy.
- ADRs for assumptions.

## Phase 1 - Vertical-Slice MVP

Current approved slice:

- Docker development infrastructure.
- FastAPI scaffold.
- PostgreSQL connection and Alembic.
- Next.js scaffold.
- Shared validation and API types.
- Health endpoints.
- CI validation.
- Standalone password authentication and server-side sessions.
- User-owned data foundation for preferences, non-visual world state, domain events, notifications,
  audit logs, ownership checks, and pagination.
- Command Mode app shell with protected `/app` routes, responsive sidebar and mobile navigation,
  command palette, notifications panel, profile menu, settings integration, and a non-visual future
  World Mode route.
- Personal Vault file storage with user-owned metadata, presigned uploads/downloads, collections,
  tags, favorites, deletion state, and a Library UI.

Later Phase 1 slices:

- Async file processing and extracted text.
- Search.
- One general AI mentor with citations.
- One daily habit and habit logging.
- User profile beyond the current `/auth/me` public profile.
- Non-visual world data expansion only until the visual 3D phase is explicitly started.

## Phase 2 - Learning System

- Subjects and topics.
- Courses, modules, lessons.
- Quizzes and flashcards.
- Study sessions.
- Transparent mastery heuristic.
- Research Laboratory.
- Knowledge Observatory prototype.

## Phase 3 - AI Mentor Expansion

- Multiple mentors.
- Custom mentor creation.
- Provider selection.
- Voice behind feature flags.
- Study plans and quiz generation.
- Memory controls.
- Cost and token dashboard.

## Phase 4 - Projects And Coding

- Project Workshop.
- Milestones and project tasks.
- Git links.
- Code editor.
- Mock code runner moving toward a sandboxed provider.
- Programming Tower.
- Coding challenges.

## Phase 5 - World Progression

- Domain event processing.
- Achievements.
- World unlocks.
- Building evolution.
- Achievement Hall.
- Personal Home customization.

## Phase 6 - Production Hardening

- Security review.
- Accessibility audit.
- Load testing.
- Performance optimization.
- Backup and recovery testing.
- Monitoring and deployment pipelines.
- Account deletion, data export, and privacy controls.
