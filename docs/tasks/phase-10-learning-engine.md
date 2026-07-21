# Phase 10 Task: Learning And Mastery Engine

## Boundary

Implement the non-visual Command Mode learning system. Do not implement the Research Laboratory,
Knowledge Observatory visualization, achievement rewards, AI-generated study plans, or visual 3D
world graphics in this phase.

## Affected Modules

- FastAPI domain, models, schemas, services, dependencies, and `/api/v1/learning` router.
- Alembic migration history.
- Global search service.
- Shared TypeScript types, Zod validation, and API client.
- Next.js Command Mode `/app/learning` route.
- Documentation and tests.

## Security And Privacy

- Every learning table includes `owner_user_id`.
- Cross-user subject, topic, course, lesson, quiz, flashcard, goal, and roadmap identifiers return
  not-found style responses or empty owner-scoped results.
- Lesson completion and quiz attempts create idempotent domain events and sanitized audit logs.
- Mastery is a transparent heuristic from stored learning signals; it is not represented as a
  scientific measurement or diagnosis.
- Learning data is not sent to AI providers in this phase.

## Implementation Checklist

- [x] Add learning domain enums.
- [x] Add learning database models.
- [x] Add Alembic migration `0010_learning_engine`.
- [x] Add learning service with subjects, topics, prerequisites, courses, modules, lessons, study
      sessions, quizzes, questions, attempts, flashcards, reviews, mastery records, goals, and
      roadmaps.
- [x] Add `/api/v1/learning` routes.
- [x] Add shared TypeScript contracts and Zod schemas.
- [x] Add typed API-client learning methods.
- [x] Add Command Mode Learning page.
- [x] Add active learning-topic search integration.
- [x] Add backend, API-client, and frontend tests.
- [x] Update architecture, security, testing, roadmap, README, and agent docs.

## Validation

Focused validation completed during implementation:

- `node scripts\python-task.mjs pytest apps\api\tests\test_learning.py`
- `pnpm --filter @aetherium/api-client test`
- `pnpm --filter @aetherium/web test -- learning-page.test.tsx`

Full validation must pass before this phase is committed.
