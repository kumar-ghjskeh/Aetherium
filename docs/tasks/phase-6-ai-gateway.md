# Phase 6 - Provider-Neutral AI Gateway

## Boundary

Implement the backend AI gateway foundation and typed client contracts needed by later mentors,
document Q&A, learning, and coding features. This phase does not add mentor conversations,
user-facing AI chat UI, citation-backed answers, semantic retrieval, or any visual World Mode work.

## Affected Modules

- `apps/api/app/domain`: AI provider, feature, consent, usage, and request enums.
- `apps/api/app/models`: owner-scoped AI consent, model configuration, and usage tables.
- `apps/api/app/services`: provider-neutral gateway, adapter registry, retry/fallback, usage
  logging, consent checks, and rate limiting.
- `apps/api/app/api/v1`: `/api/v1/ai` route group.
- `packages/shared-types`, `packages/validation`, and `packages/api-client`: AI API contracts.
- `docs/architecture`, `docs/security`, `docs/operations`, and `docs/testing`.

## Security And Privacy Implications

- External provider calls must be opt-in per feature through Aetherium-owned consent policies.
- The gateway must not automatically retrieve files, conversations, projects, learning records,
  habit data, or profile data.
- Usage records must store metadata, token counts, cost estimates, status, and errors, but not raw
  prompts, raw generated text, provider secrets, API keys, cookies, or session tokens.
- Provider credentials must come only from `AETHERIUM_` environment variables.
- Test and development deterministic providers must be disabled in production unless a future ADR
  approves otherwise.

## Migration Implications

Add a non-destructive migration after `0006_hybrid_search` for:

- `ai_consent_policies`
- `ai_model_configurations`
- `ai_usage_records`

All tables are owner-scoped and cascade with the owning user.

## Performance Implications

- Gateway requests are bounded by configured timeouts, retry counts, max output tokens, rate limits,
  and pagination.
- Streaming uses the same adapter interface but does not persist raw streamed content in this phase.
- Usage lists are paginated.

## Acceptance Criteria

- Provider metadata is exposed without secrets.
- Consent defaults deny external provider calls.
- Model configuration is feature-specific and owner-scoped.
- Chat and embedding gateway calls are provider-neutral and record usage metadata.
- OpenAI-compatible, Anthropic-compatible, and Ollama-compatible adapter classes exist behind a
  common interface.
- Retry, timeout, fallback, rate-limit, token, and cost-tracking foundations are implemented.
- Cross-user access to consent, configuration, and usage data is impossible.
- Tests cover successful deterministic calls, denied external calls, fallback, rate limiting, usage
  logging, and authorization.
- No visual 3D implementation or 3D dependencies are added.
