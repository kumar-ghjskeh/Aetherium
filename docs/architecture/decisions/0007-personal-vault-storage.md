# ADR 0007: Personal Vault Storage Boundary

## Status

Accepted.

## Context

Aetherium needs user-owned file storage before background ingestion, search, and document Q&A can be
implemented. The storage layer must remain standalone, preserve user ownership, support future
derived artifacts, and avoid leaking private storage implementation details to the frontend.

## Decision

Aetherium stores file metadata, upload records, versions, collections, tags, favorites, and deletion
state in PostgreSQL. Original file bodies are stored in Aetherium-owned S3-compatible object
storage.

The development buckets are:

- `aetherium-private-files-dev`
- `aetherium-derived-assets-dev`
- `aetherium-user-avatars-dev`

Production must provide separate Aetherium-owned bucket names with the same logical separation.

The API generates opaque object keys server-side and does not expose those keys in normal file
responses. Browser uploads and downloads use short-lived presigned URLs. Upload initiation validates
file name, extension, MIME type, declared size, and idempotency key. Upload completion creates the
file record, first file version, `file.uploaded` domain event, and sanitized audit log.

Background text extraction, chunking, embeddings, full-text indexing, malware scanning execution,
and document Q&A are explicitly deferred to later phases. This slice only records processing and
malware-scan status fields needed by those later workflows.

## Consequences

- Command Mode Library can manage real user-owned files without waiting for ingestion.
- Future ingestion jobs have a stable source of truth for originals and file versions.
- Object keys remain private implementation details.
- Production deployments must enable upload verification and provide independent S3-compatible
  credentials.
- Direct browser uploads require storage CORS configuration for the deployed frontend origin.
