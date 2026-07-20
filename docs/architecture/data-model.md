# Data Model

## Design Rules

- UUID primary keys for durable user-owned entities.
- `created_at` and `updated_at` timestamps on mutable records.
- Tenant or owner identifiers on every user-owned table.
- Database constraints for ownership, uniqueness, status values, and relationship integrity.
- Permission checks in backend data-access paths, not only frontend filtering.
- Search and retrieval indexes designed with access control in mind.

## Current Physical Schema

Current migrations:

- `0001_initial_extensions`: enables the PostgreSQL `vector` extension when available.
- `0002_auth_foundation`: creates Aetherium-owned `users` and `sessions` tables.
- `0003_user_owned_foundation`: creates preferences, non-visual world profile state, domain events,
  notifications, and audit logs.

### `users`

- `id` UUID primary key.
- `email` original submitted email.
- `normalized_email` unique normalized email used for identity comparison.
- `password_hash` Argon2id password hash.
- `display_name`.
- `is_active`.
- `is_email_verified`.
- `last_login_at`.
- `deleted_at` for future soft deletion.
- `created_at` and `updated_at`.

### `sessions`

- `id` UUID primary key.
- `user_id` foreign key to `users.id`.
- `token_hash` unique HMAC-SHA256 hash of the opaque session token.
- `last_used_at`.
- `expires_at`.
- `revoked_at`.
- `user_agent` conservative optional client metadata.
- `created_at` and `updated_at`.

## Ownership Foundation

User-owned tables reference the authenticated user's UUID through `owner_user_id`, or reference a
parent record that is already owned by a user. Queries must include ownership predicates in backend
data-access paths.

Cross-user access attempts return not-found style responses where revealing the existence of a
record would leak ownership information.

### `user_preferences`

- UUID primary key.
- `owner_user_id` unique foreign key to `users.id`.
- Theme and default interface mode.
- Reduced-motion, background music, ambient audio, camera effects, AI memory, and product analytics
  preferences.
- Performance preset, time zone, and locale.
- Timestamps.

### `world_profiles`

- UUID primary key.
- `owner_user_id` unique foreign key to `users.id`.
- Current and last visited non-visual location identifiers.
- Preferred navigation method.
- Tutorial completion state.
- World-state version.
- Spawn location.
- JSON arrays of visited and unlocked location identifiers.
- Timestamps.

No 3D scenes, assets, movement, or rendering state are stored in this table.

### `domain_events`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Event type constrained to approved product event identifiers.
- Idempotency key unique per owner.
- JSON payload.
- Occurrence timestamp and record timestamps.

### `notifications`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Optional source domain-event foreign key.
- Type, severity, title, body, optional action URL.
- `read_at` for read and unread state.
- Timestamps.

### `audit_logs`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Action, optional entity type and entity UUID.
- Sanitized JSON metadata.
- Timestamps.

Audit metadata must not contain passwords, raw session tokens, cookies, secrets, API keys, or full
sensitive request bodies.

## Planned Later Tables

Later schema slices will cover:

- `world_locations`, `user_world_state`.
- `files`, `file_versions`, `file_chunks`.
- `collections`, `collection_items`, `tags`, `file_tags`.
- `mentors`, `conversations`, `messages`, `message_sources`.
- `subjects`, `topics`, `topic_relations`, `resources`.
- `courses`, `modules`, `lessons`, `quizzes`, `questions`, `attempts`.
- `flashcards`, `review_events`, `study_sessions`, `mastery_records`.
- `habits`, `habit_schedules`, `habit_logs`.
- `goals`, `milestones`, `tasks`, `projects`, `project_files`.
- `achievements`, `achievement_rules`, `user_achievements`.
- `ai_usage_records`.

## Retrieval Model

File chunks will store extracted text, source metadata, full-text search vectors, optional
embeddings, and permission scope inherited from the source file and collection membership.

AI citations must reference retrieved chunks. Answers must not claim file support when retrieval did
not produce evidence.
