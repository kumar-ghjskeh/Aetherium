# Phase 4 Task - Background File Ingestion

## Boundary

Implement asynchronous file ingestion for files already stored in the Personal Vault.

Included:

- Durable processing jobs.
- Worker process scaffold.
- Object-storage reads through the existing S3-compatible abstraction.
- Text extraction for text, Markdown, CSV, JSON, source-code files, PDF, DOCX, and metadata-only
  image handling.
- Chunk creation with owner, file, sequence, token estimate, page or section metadata, and
  index-ready text.
- Processing failure records, retry state, visible file processing status, and retry API/UI.
- Owner-scoped job and chunk APIs.

Excluded:

- User-facing full-text search endpoint.
- Semantic retrieval.
- Real embedding provider calls.
- AI document Q&A and citations.
- Malware scanning execution.
- Visual 3D World Mode.

## Affected Modules

- `apps/api/app/models/file_ingestion.py`
- `apps/api/app/services/file_ingestion.py`
- `apps/api/app/services/file_extractors.py`
- `apps/api/app/services/file_chunking.py`
- `apps/api/app/api/v1/files.py`
- `apps/worker`
- `apps/web/src/features/file-vault/library-page.tsx`
- `packages/shared-types`
- `packages/validation`
- `packages/api-client`

## Security And Privacy

- All processing rows include `owner_user_id`.
- Worker processing loads file ownership from PostgreSQL and never trusts client-supplied owner
  identifiers.
- Object keys are still not exposed through API responses.
- Failures are recorded with bounded messages and without raw document bodies.
- Extracted chunks remain in Aetherium PostgreSQL and are not sent to external AI providers in this
  phase.
- Redis and worker configuration use the `aetherium:` namespace.

## Migration

Migration `0005_file_ingestion` adds:

- `processing_jobs`
- `extraction_results`
- `file_chunks`
- `embedding_jobs`
- `processing_failures`

## API

- `GET /api/v1/files/processing-jobs`
- `POST /api/v1/files/processing-jobs/{job_id}/retry`
- `GET /api/v1/files/{file_id}/processing-jobs`
- `POST /api/v1/files/{file_id}/processing-jobs`
- `GET /api/v1/files/{file_id}/chunks`

## Validation

Required before completing the phase:

- Python formatting, linting, type checking, and tests.
- Worker formatting, linting, and type checking.
- TypeScript linting, type checking, tests, and build.
- Full `pnpm run ci`.
- Alembic upgrade, downgrade SQL, and re-upgrade SQL validation.
- Product-independence check.
- Scan confirming no visual 3D implementation dependencies or assets were added.
