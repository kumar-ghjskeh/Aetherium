# ADR 0012: Citation-Backed Document Q&A

## Status

Accepted.

## Context

Phase 8 needs users to ask questions about processed Personal Vault files without adding fake
citations, broad AI data access, or a second retrieval data model. Existing slices already provide
owner-scoped files, ready chunks, optional chunk embeddings, AI consent policies, model
configuration, usage records, and provider-neutral chat/embedding calls.

## Decision

Aetherium implements document Q&A as a source-bound AI gateway feature under
`POST /api/v1/ai/document-qa`.

The service:

- Requires explicit `document_qa` file-content consent before retrieved chunks can be sent to an AI
  provider.
- Retrieves only owned, active, ready `file_chunks`.
- Validates optional file and collection filters against the authenticated user.
- Honors consent-scoped `allowedCollectionIds` when configured.
- Uses bounded lexical retrieval and optional reranking from stored chunk embeddings.
- Sends only bounded source excerpts to the AI gateway.
- Returns citation objects only for retrieved chunks.
- Removes invalid inline citation labels from model output.
- Returns `insufficient_evidence` without calling a model when retrieval finds no supporting chunks.

Document Q&A responses are not persisted as conversations in this slice. AI usage records remain
metadata-only and do not duplicate raw prompts, file chunks, or generated answers.

## Consequences

- The feature is useful immediately with existing ingestion and chunk tables.
- No migration is required for Phase 8.
- User consent remains explicit and feature-specific.
- Citations are reliable response metadata even if a provider returns weak inline citation text.
- Global semantic search still remains disabled until the ingestion worker generates embeddings
  consistently and pgvector-backed ranking is implemented.
- Persistent document-QA conversations can be added later by linking responses to the existing
  conversation/message-source schema.
