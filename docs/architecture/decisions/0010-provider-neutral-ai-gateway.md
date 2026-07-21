# ADR 0010: Provider-Neutral AI Gateway Foundation

## Status

Accepted

## Context

Aetherium needs AI features across mentors, file Q&A, learning, projects, and coding, but it must
not bind product logic to one provider or silently send private user data to external systems. The
repository already has owner-scoped users, files, chunks, search, audit logs, and settings, but no
AI runtime, provider adapters, consent model, or usage accounting.

## Decision

Implement an Aetherium-owned AI gateway with:

- A provider-neutral adapter interface for chat, streaming chat, embeddings, structured outputs, and
  tool-calling payloads.
- Adapter classes for OpenAI-compatible, Anthropic-compatible, and Ollama-compatible APIs.
- A deterministic internal adapter for tests and local development only.
- Owner-scoped consent policies that default to no external provider access and no automatic data
  category access.
- Owner-scoped feature model configurations.
- Owner-scoped usage records for provider, model, token counts, cost estimates, status, latency, and
  normalized errors.
- Gateway-level rate limiting, retries, timeout configuration, and provider fallback.

The gateway will expose low-level `/api/v1/ai` endpoints for later features to consume. This phase
does not create mentors, conversations, document Q&A, semantic retrieval, or user-facing AI chat UI.

## Consequences

- Later AI features can share one service boundary and one privacy policy instead of calling
  providers directly.
- External calls remain blocked until a user explicitly enables them for the relevant feature.
- Usage records can support future AI cost dashboards without storing raw prompts or responses.
- The deterministic local adapter lets CI test gateway behavior without network access or paid
  services.
- Provider-specific request mapping still needs broader production validation before enabling real
  external providers at scale.
