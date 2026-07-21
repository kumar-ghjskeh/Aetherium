# Phase 7 - AI Mentors And Conversations

## Boundary

Implement persistent fictional mentors and owner-scoped conversations on top of the provider-neutral
AI gateway. This phase adds the Command Mode AI Hall workflow and durable conversation history, but
does not implement citation-backed document Q&A, semantic retrieval, task/project/habit mutation
tools, voice, or any visual World Mode work.

## Affected Modules

- `apps/api/app/domain`: mentor, conversation, message, memory, and permission enums/defaults.
- `apps/api/app/models`: owner-scoped mentors, mentor permissions, conversations, messages, message
  sources, and memory settings.
- `apps/api/app/services`: mentor initialization, conversation lifecycle, gateway-backed message
  generation, export, archive/delete, regenerate, and edit/resend behavior.
- `apps/api/app/api/v1`: `/api/v1/mentors` route group.
- `packages/shared-types`, `packages/validation`, and `packages/api-client`: mentor and conversation
  contracts.
- `apps/web/src/app/app/ai` and `apps/web/src/features/ai`: AI Hall Command Mode UI.
- Architecture, security, roadmap, and testing documentation.

## Security And Privacy Implications

- All mentor and conversation records include `owner_user_id` and must be queried through owner
  predicates.
- Default mentors are copied into user-owned rows on first access; no shared private mentor state is
  used.
- Mentor instructions and conversation messages may be sent to the configured AI provider only
  through the AI gateway, which enforces environment enablement, user consent, rate limits, and
  usage logging.
- This phase does not attach files, collections, projects, learning records, habit data, or profile
  data to prompts.
- Tool metadata is stored as allowlists only. No AI response can silently mutate user data.
- Conversation export returns only the authenticated user's records.

## Migration Implications

Add a non-destructive migration after `0007_ai_gateway` for:

- `mentors`
- `mentor_permissions`
- `conversations`
- `conversation_memory_settings`
- `messages`
- `message_sources`

All tables are owner-scoped and cascade with the owning user. Message usage records reference
`ai_usage_records` with `ON DELETE SET NULL`.

## Performance Implications

- Conversation and message lists are paginated.
- Message generation uses bounded conversation context rather than unbounded history.
- Exports remain JSON-sized for the current pagination limits.
- Gateway timeouts, retries, max tokens, and rate limits continue to bound provider calls.

## Acceptance Criteria

- Initial fictional mentors Lyra, Orion, Sage, and Nova are available to every user as owner-scoped
  records.
- Users can create custom mentors, update mentor metadata, and manage mentor permissions.
- Users can create, rename, archive, delete, and export conversations.
- Users can send messages and receive persisted assistant replies through the AI gateway.
- Users can regenerate assistant replies and edit/resend their own messages.
- Stop-generation API exists and fails honestly when no generation is active.
- Conversation memory settings are persisted and honor the user's AI memory preference.
- Cross-user access to mentors, conversations, messages, permissions, and exports is impossible.
- Tests cover successful flows, validation failures, authorization boundaries, no raw usage logging,
  and frontend loading/empty/error states.
- No visual 3D implementation or 3D dependencies are added.
