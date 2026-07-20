# ADR 0005: User-Owned Data Foundation

## Status

Accepted

## Context

Aetherium now needs the first persistent product data beyond identity. Later slices require a common
ownership model, user preferences, non-visual world state, notifications, domain events, and audit
logs. The implementation must remain standalone and must not introduce visual World Mode.

## Decision

All user-owned foundation tables use UUID primary keys, timestamps, and `owner_user_id` foreign keys
to Aetherium `users.id`.

The foundation adds:

- `user_preferences` for interface, accessibility, audio, performance, locale, AI-memory, and
  analytics preferences.
- `world_profiles` for non-visual location state, unlocked location identifiers, visited location
  identifiers, tutorial status, and navigation preference.
- `domain_events` for append-only product events with per-user idempotency keys.
- `notifications` for in-app read and unread notification state.
- `audit_logs` for sanitized user-visible security and product activity records.

Route handlers must use reusable current-user and ownership helpers. Public APIs must filter by
`owner_user_id`; cross-user mutation attempts return not-found style errors instead of revealing
resource ownership.

Existing users that predate this migration receive default preferences and world profile records
when those resources are first requested. New registrations create the default records and a
`user.registered` domain event in the registration transaction.

## Consequences

- Later slices can consistently attach files, habits, learning records, projects, conversations,
  achievements, and world progression to the authenticated Aetherium user.
- Domain events can drive future achievements without duplicating user actions when clients retry
  requests.
- World Mode remains a data contract only; no Three.js, React Three Fiber, scenes, assets, player
  controls, or visual world placeholders are introduced.
- The current in-memory auth rate limiter remains unchanged; persistent product events and
  notifications are stored in PostgreSQL.
