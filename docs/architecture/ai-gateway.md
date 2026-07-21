# AI Gateway And Retrieval Architecture

## Role

The AI gateway will provide provider-neutral access to model features while enforcing user consent,
rate limits, cost tracking, and source attribution rules.

## Current Status

The provider-neutral gateway foundation is implemented under `/api/v1/ai`.

Implemented:

- Provider metadata for Aetherium deterministic, OpenAI-compatible, Anthropic-compatible, and
  Ollama-compatible adapters.
- Owner-scoped consent policies that default to no external provider access and no automatic data
  category access.
- Owner-scoped feature model configurations.
- Chat completion, streaming-response, and embedding gateway endpoints.
- Metadata-only usage records for provider, model, feature, operation, status, token counts, cost
  estimate placeholder, latency, fallback, and normalized errors.
- Rate-limit, retry, timeout, and fallback foundations.
- AI mentor conversations under `/api/v1/mentors`, including fictional default mentors, custom
  mentors, owner-scoped conversations, messages, memory settings, exports, edit/resend,
  regeneration, and stop-generation API behavior.
- Citation-backed document Q&A under `/api/v1/ai/document-qa`, including explicit file-content
  consent enforcement, owner-scoped ready-chunk retrieval, optional file and collection filters,
  bounded source context, AI gateway generation, validated citation labels, and no-evidence
  responses that do not fabricate sources.

Keyword search over owner-scoped files, extracted chunks, collections, tags, and AI conversation
titles is implemented under `/api/v1/search`. Global semantic result ranking is still disabled in
the search endpoint. Document Q&A can use stored chunk embeddings for bounded reranking when
embeddings exist; otherwise it falls back to lexical retrieval.

## Mentor Chat Boundary

Mentor chat calls the AI gateway with:

- The mentor's owner-scoped system instructions.
- A bounded window of the current conversation's complete messages.
- No uploaded file chunks, projects, habits, learning records, profile data, or citations.

The mentor system prompt explicitly states that mentors are fictional AI and must not claim access
to private content unless Aetherium provides retrieved context. Durable data changes remain separate
application actions that require user approval.

## Required Capabilities

Adapters support or reserve contracts for:

- Chat completions.
- Streaming.
- Embeddings.
- Structured outputs.
- Tool calling.
- Timeouts and retry policies.
- Rate limits.
- Token and cost accounting.
- Provider fallback.
- Per-feature model configuration.
- User consent controls.

Initial adapter targets:

- OpenAI-compatible APIs.
- Anthropic-compatible APIs.
- Ollama-compatible local endpoints.

## Retrieval Boundary

Document Q&A retrieval builds on PostgreSQL-owned records:

- Full-text search.
- Stored chunk embeddings when present.
- Hybrid ranking.
- Metadata filtering.
- Permission-aware retrieval.
- Chunk-level citations.

No separate vector database should be introduced until PostgreSQL is measured and found
insufficient.

The current document-QA implementation retrieves only `file_chunks` whose owner matches the
authenticated user, whose file is active, and whose chunk status is ready. File and collection
filters are validated against the same owner. AI consent can further restrict document Q&A to
specific collection IDs.

## Privacy Rules

- Do not send user content to external providers without feature-level consent.
- External provider calls require both environment enablement and user consent.
- Do not automatically attach uploaded files, conversations, projects, learning records, habits, or
  profile data to gateway requests.
- Do not silently modify user data from AI suggestions.
- Require confirmation before destructive changes or externally visible actions.
- Do not log raw sensitive prompts or full private documents by default.

## Citation Rule

AI answers based on uploaded content must cite retrieved source chunks. If retrieval did not support
an answer, the UI and response metadata must not imply that it came from the user's files.

The document-QA service returns citation objects only for retrieved chunks and strips invalid inline
source labels from model output. If the model returns source-backed text without labels, Aetherium
adds a source-reference footer using the validated retrieved labels. If no chunks support the
question, Aetherium returns `insufficient_evidence` without calling a model.
