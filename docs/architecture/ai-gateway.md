# AI Gateway And Retrieval Architecture

## Role

The AI gateway will provide provider-neutral access to model features while enforcing user consent,
rate limits, cost tracking, and source attribution rules.

## Current Status

No AI provider integration is implemented in the current slice.

## Required Capabilities

Future adapters must support:

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

## Retrieval

The first retrieval implementation should use PostgreSQL:

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
- Do not silently modify user data from AI suggestions.
- Require confirmation before destructive changes or externally visible actions.
- Do not log raw sensitive prompts or full private documents by default.

## Citation Rule

AI answers based on uploaded content must cite retrieved source chunks. If retrieval did not support
an answer, the UI and response metadata must not imply that it came from the user's files.
