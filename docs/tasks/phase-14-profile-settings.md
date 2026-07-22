# Phase 14 - Personal Profile And Settings

## Scope

Implement the non-visual personal profile and settings foundation.

Included:

- Owner-scoped profile metadata.
- Display-name updates through the profile API.
- Avatar preset metadata and optional owned vault-file avatar references.
- Resume, portfolio, and external profile links.
- Favorite project and resource records.
- Certificate metadata.
- Privacy settings coordinated with existing AI memory and product analytics preferences.
- Data export request records.
- Account deletion request records.
- Command Mode Settings/Profile UI.
- Backend, frontend, API-client, migration, and documentation updates.

Excluded:

- 3D avatars or visual world personalization.
- Actual data-export package generation.
- Actual account deletion execution.
- Email delivery or external privacy workflow delivery.
- Public profile discovery.

## Architecture Notes

- All new user-owned tables include `owner_user_id`.
- Profile avatar uploads are represented as metadata or links to an already-owned active Personal
  Vault file. This phase does not add a separate avatar upload pipeline.
- Privacy controls expose profile-context AI consent, AI memory, and product analytics in one API
  response, while the existing `user_preferences` table remains the source of truth for AI memory
  and analytics opt-in flags.
- Export and deletion requests are durable request records with idempotency keys, audit logs, and
  in-app notifications. Fulfillment and destructive deletion are later hardening work.
- Favorite projects and resources validate referenced ownership at write time.

## Validation Plan

- Backend tests for profile creation/update, avatar-file ownership, links, favorites, certificates,
  privacy toggles, export/deletion requests, cross-user isolation, authentication, and database
  constraints.
- API-client contract tests for `/api/v1/users`.
- Frontend tests for Settings/Profile loading, validation, successful saves, privacy toggles,
  request creation, and error states.
- Alembic upgrade/downgrade/head SQL validation.
- Full repository CI.

## Completion Notes

- Added migration `0013_profile_settings`.
- Added backend profile/settings API tests in `apps/api/tests/test_profile.py`.
- Added API-client contract coverage for the `/api/v1/users` route group.
- Added React Testing Library coverage for the Command Mode Settings page.
- Fixed a date-sensitive habit test fixture by setting an explicit `startsOn` date.
- Validated Alembic upgrade, downgrade, and full-head SQL generation.
- Full `pnpm run ci` passed after the deterministic habit fixture fix.
