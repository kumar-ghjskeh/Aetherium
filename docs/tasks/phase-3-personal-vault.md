# Phase 3 Task: Personal Vault File Storage

## Boundary

Implement secure user-owned file storage for Command Mode Library. This phase covers file metadata,
presigned upload and download contracts, collections, tags, favorites, and deletion state.

This phase does not implement background ingestion, text extraction, search indexing, embeddings, AI
question answering, or visual World Mode.

## Affected Modules

- `apps/api/app/models`: file vault persistence models.
- `apps/api/alembic/versions`: migration for file vault tables.
- `apps/api/app/domain`: file type, status, storage, and deletion enums.
- `apps/api/app/services`: file vault service and S3-compatible storage abstraction.
- `apps/api/app/api/v1`: `/api/v1/files` route group.
- `packages/shared-types`: shared file vault contracts.
- `packages/validation`: Zod validation for file vault contracts.
- `packages/api-client`: typed file vault API client methods.
- `apps/web/src/app/app/library`: Command Mode Library UI.
- `docs`: architecture, API, data model, operations, testing, and security updates.

## Security And Privacy

- Every file vault table is user-owned through `owner_user_id`.
- Direct object storage keys are generated server-side and are not exposed in normal API responses.
- Upload initiation validates file name, extension, content type, and declared size.
- Object storage buckets must use Aetherium-specific names.
- Download URLs are presigned and expiring.
- Cross-user access returns not-found style errors.
- File deletion has soft-delete and permanent-delete paths; permanent deletion requires a
  soft-deleted record.
- Malware scanning is represented as an integration point; no scanner is implemented in this slice.
- Audit logs record sanitized metadata only.

## API Scope

- `POST /api/v1/files/uploads`
- `POST /api/v1/files/uploads/{upload_id}/complete`
- `GET /api/v1/files`
- `GET /api/v1/files/{file_id}`
- `PATCH /api/v1/files/{file_id}`
- `DELETE /api/v1/files/{file_id}`
- `POST /api/v1/files/{file_id}/restore`
- `DELETE /api/v1/files/{file_id}/permanent`
- `GET /api/v1/files/{file_id}/download`
- `POST /api/v1/files/{file_id}/favorite`
- `DELETE /api/v1/files/{file_id}/favorite`
- `GET /api/v1/files/collections`
- `POST /api/v1/files/collections`
- `POST /api/v1/files/collections/{collection_id}/items`
- `DELETE /api/v1/files/collections/{collection_id}/items/{file_id}`
- `GET /api/v1/files/tags`
- `POST /api/v1/files/{file_id}/tags`
- `DELETE /api/v1/files/{file_id}/tags/{tag_id}`

## Validation Plan

- Backend tests for upload validation, idempotent completion, file listing, download URL ownership,
  rename, favorite, tags, collections, soft delete, permanent delete, cross-user isolation,
  unauthenticated access, and database constraints.
- API-client contract tests for file vault methods.
- Frontend tests for Library loading, empty, error, and successful list/action states.
- Full repository validation through `pnpm run ci`.
- Alembic upgrade, downgrade, and re-upgrade SQL validation.

## Completion Evidence

- Added `0004_file_vault` migration for file, upload, version, collection, tag, favorite, and join
  tables.
- Added owner-scoped file vault service methods and `/api/v1/files` REST routes.
- Added S3-compatible storage abstraction for presigned upload and download URLs.
- Added shared TypeScript contracts, Zod schemas, and API client methods for the file vault.
- Replaced the Library empty state with a real API-backed Personal Vault UI.
- Added backend, API-client, and frontend tests for the implemented storage workflows.
