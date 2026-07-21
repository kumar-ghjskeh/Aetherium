# ADR 0008: Background File Ingestion Worker

## Status

Accepted.

## Context

The Personal Vault stores original files and metadata, but search and document Q&A require extracted
text chunks with reliable owner scope and failure visibility. File extraction can be slow or fail
because of parser limitations, unsupported formats, object-storage outages, or malformed files.

The first ingestion slice must be standalone, observable, retryable, and safe to run separately from
HTTP request handling. It must not send user files to AI providers before the AI consent and
retrieval architecture exists.

## Decision

Aetherium uses PostgreSQL as the durable source of truth for file processing jobs, extraction
results, chunks, embedding job placeholders, and processing failures. Upload completion creates an
idempotent `processing_jobs` row and marks the file as queued.

The `aetherium-worker` process polls queued jobs, reads original objects through the Aetherium
S3-compatible storage abstraction, extracts text, chunks text, records extraction metadata, and
updates file processing status. It commits completed and visible failed states itself. Queued-job
selection uses skip-locked row locking where supported so multiple worker processes do not
deliberately claim the same job.

The worker is a separate Docker Compose service with Aetherium-owned database, Redis namespace, and
object-storage configuration. Redis remains configured with the `aetherium:` namespace for current
and future background-worker coordination, while durable job state stays in PostgreSQL for this
slice.

Embeddings are represented by `embedding_jobs`, but embedding generation is skipped by default until
a later semantic search phase wires those jobs to the provider-neutral AI gateway with explicit user
consent controls.

## Consequences

- HTTP upload completion stays responsive and does not parse files inline.
- Processing state survives process restarts because job records live in PostgreSQL.
- Failed extraction is visible to the user and can be retried without creating duplicate chunks.
- Owner scope is preserved in jobs, chunks, failures, extraction results, and embedding jobs.
- Text chunks are ready for the later full-text search phase, but no search endpoint or retrieval
  claim is made yet.
- Parser sandboxing, malware scanning execution, and OCR remain future hardening work.
