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

Keyword search over owner-scoped files, extracted chunks, collections, and tags is implemented under
`/api/v1/search`. Semantic ranking, AI retrieval, reranking, citation-backed answer generation, and
mentor conversations are not implemented yet.

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

The later AI retrieval implementation should build on PostgreSQL:

- Full-text search.
- pgvector embeddings.
- Hybrid ranking.
- Metadata filtering.
- Permission-aware retrieval.
- Chunk-level citations.

No separate vector database should be introduced until PostgreSQL is measured and found
insufficient.

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
