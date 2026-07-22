# Phase 15 - Coding Workspace Foundation

## Scope

Implement the non-visual Coding workspace foundation.

Included:

- Owner-scoped saved code snippets.
- Optional snippet links to owned projects and Personal Vault files.
- Owner-scoped coding exercises.
- Exercise attempts that record submitted answers without execution.
- AI code explanation and review through the provider-neutral AI gateway.
- CodeRunner interface with an unavailable provider.
- Monaco-backed Command Mode Coding UI.
- Shared TypeScript contracts, Zod validation, and API-client methods.
- Backend, frontend, migration, API-client, and documentation updates.

Excluded:

- Arbitrary code execution.
- Sandboxed execution provider implementation.
- Dependency installation or package execution inside user snippets.
- Programming Tower visual presentation.
- 3D scenes, world graphics, player controls, or avatar systems.

## Architecture Notes

- All coding tables include `owner_user_id`.
- Services validate owned project, file, topic, exercise, and snippet references before creating
  relationships.
- Cross-user identifiers return not-found style errors.
- Assistant requests use the `coding_assistant` AI feature and do not silently include project
  context.
- Audit logs store sanitized metadata such as IDs, language, and content length, not raw code.
- The active runner provider reports `unavailable`; no Aetherium service container executes user
  code in this phase.

## Validation Plan

- Backend tests for snippet lifecycle, owner-scoped reference checks, exercise creation, attempts,
  AI explain/review, runner status, audit sanitization, validation failures, authentication,
  cross-user isolation, pagination, and database constraints.
- API-client contract tests for all `/api/v1/coding` methods.
- Frontend tests for Coding workspace loading, empty/error states, validation, snippet
  save/update/archive, assistant requests, exercise creation, starter-code use, attempt submission,
  and unavailable runner messaging.
- Alembic upgrade/downgrade/head SQL validation.
- Full repository CI and product-independence checks.

## Completion Notes

- Added migration `0014_coding_workspace`.
- Added `/api/v1/coding` route group.
- Added shared Coding workspace contracts and API-client methods.
- Added Command Mode `/app/coding` workspace UI.
- Added backend tests in `apps/api/tests/test_coding.py`.
- Added frontend tests in `apps/web/src/features/coding/coding-workspace-page.test.tsx`.
- Added API-client contract coverage for Coding workspace endpoints.
- Full `pnpm run ci` passed.
- Alembic offline upgrade SQL and downgrade SQL generation passed for `0014_coding_workspace`.
- Online Alembic upgrade/downgrade could not run in this shell because local PostgreSQL refused the
  connection and Docker is not installed or not on PATH.
