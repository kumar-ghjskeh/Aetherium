# ADR 0011 - AI Mentors And Conversations

## Status

Accepted.

## Context

Aetherium needs mentor-style AI interactions without coupling product logic to one model provider or
silently sending broad private context to AI services. Phase 6 introduced the provider-neutral AI
gateway, consent policies, model configuration, rate limits, usage records, retries, and fallback.

Phase 7 adds persistent mentors and conversations but must not implement citation-backed document
Q&A, semantic retrieval, destructive AI tools, voice, or visual World Mode.

## Decision

Mentors, mentor permissions, conversations, memory settings, messages, and message sources are
stored as owner-scoped Aetherium records in PostgreSQL.

Default mentors are fictional and copied into each user's own rows on first access:

- Lyra: general learning mentor.
- Orion: coding mentor.
- Sage: research mentor.
- Nova: productivity mentor.

Mentor chat uses the provider-neutral AI gateway with bounded conversation history. It passes no
uploaded file chunks, projects, habits, learning records, profile data, or citations in this phase.
The gateway remains responsible for provider selection, consent, rate limiting, usage tracking, and
provider error normalization.

Mentor permissions are stored now as explicit allowlists and access flags, but they are not treated
as permission to silently attach every matching data category. Later retrieval and tool phases must
still perform explicit context assembly and user-consent checks.

Conversation memory settings are per conversation and can only be enabled when the user's global AI
memory preference allows it.

## Consequences

- Command Mode and future World Mode can use the same mentor and conversation APIs.
- Cross-user isolation is enforced with `owner_user_id` predicates and tested at the API boundary.
- Usage records remain metadata-only and do not duplicate raw prompts or responses.
- Citation-backed answers remain impossible to claim until Phase 8 implements retrieval and citation
  validation.
- Stop-generation exists as an API contract but returns an honest conflict until streaming
  generation state can be cancelled safely.
