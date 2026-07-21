# Phase 5 Task - Hybrid Global Search

## Boundary

Implement a real global search foundation over currently implemented Aetherium data.

Included:

- Owner-scoped `/api/v1/search` route.
- Search results for file metadata, extracted file chunks, collections, and tags.
- PostgreSQL full-text ranking where available.
- SQLite-compatible fallback for tests.
- Entity-type filtering, pagination, sorting, snippets, match reasons, open URLs, and future world
  location identifiers.
- Recent search persistence.
- Command Palette search UI integration.

Excluded:

- Semantic embeddings and vector ranking.
- AI conversations, learning topics, habits, projects, tasks, and achievements before those tables
  exist.
- Citation-backed AI answers.
- Visual 3D search/map rendering.

## Affected Modules

- `apps/api/app/models/search.py`
- `apps/api/app/services/search.py`
- `apps/api/app/api/v1/search.py`
- `packages/shared-types`
- `packages/validation`
- `packages/api-client`
- `apps/web/src/features/app-shell/app-shell.tsx`

## Security And Privacy

- Every query includes `owner_user_id` predicates.
- File-content results are returned only for chunks owned by the current user and attached to active
  files.
- Search snippets are plain text, not trusted HTML.
- Recent searches store query text and filters only for the authenticated owner.
- No user content is sent to external AI providers in this phase.

## Current Target Coverage

Implemented targets:

- Files.
- File content chunks.
- Collections.
- Tags.

Reserved targets for later phases:

- Notes.
- AI conversations.
- Learning topics.
- Projects.
- Tasks.
- Habits.
- Achievements.

## Validation

Required before completing the phase:

- Backend tests for success, filters, recent searches, empty results, authentication, cross-user
  isolation, and pagination.
- API-client contract tests.
- Frontend Command Palette search tests.
- Full repository CI.
- Alembic upgrade/downgrade/re-upgrade SQL validation.
- Product-independence check.
- No visual 3D dependency or asset scan.
