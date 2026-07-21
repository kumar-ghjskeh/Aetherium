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
- `0004_file_vault`: creates user-owned Personal Vault metadata, upload records, file versions,
  collections, tags, favorites, and deletion state.
- `0005_file_ingestion`: creates durable file-processing jobs, extraction results, chunks, embedding
  job placeholders, and processing failures.
- `0006_hybrid_search`: creates owner-scoped recent searches and PostgreSQL full-text expression
  indexes for implemented search targets.

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

## Personal Vault Schema

All Personal Vault tables include `owner_user_id` and backend queries must filter on that owner.
Cross-user IDs are treated as not found.

### `files`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Display name, original file name, sanitized file name, file extension, file kind, MIME type, and
  byte size.
- Current object bucket, key, ETag, storage version ID, and checksum metadata.
- Processing status, deletion status, malware scan status, and deleted timestamp.
- Timestamps.

The file record is the source of truth for original object storage and visible processing state.
Extracted chunks are stored in the ingestion tables below. User-facing search, embeddings, and
retrieval are added by later phases.

### `file_versions`

- UUID primary key.
- `owner_user_id` and `file_id`.
- Version number.
- Original and sanitized file names, MIME type, byte size, object bucket, object key, optional ETag,
  storage version ID, checksum, and upload record ID.
- Timestamps.

Versions preserve original uploaded objects and give permanent deletion a clear set of storage
objects to remove.

### `upload_records`

- UUID primary key.
- `owner_user_id`.
- Optional `file_id` after completion.
- Original and sanitized file name, MIME type, byte size, file extension, file kind, object bucket,
  object key, checksum, status, expiration timestamp, completion timestamp, and idempotency keys.
- Timestamps.

Upload initiation and completion are idempotent per owner and idempotency key.

### `collections`, `collection_items`, `tags`, `file_tags`, `file_favorites`

- Collections and tags are owner-scoped metadata records with normalized-name uniqueness per owner.
- Join tables include `owner_user_id` and unique owner/file relationship constraints.
- Favorites are represented as owner/file rows so they can be queried without mutating file
  metadata.

Collection membership, tags, and favorites do not grant access by themselves. File ownership remains
the authorization boundary.

## File Ingestion Schema

All ingestion tables include `owner_user_id` and are queried through owner-scoped services. The
worker does not accept a client-supplied owner identifier; it loads ownership from PostgreSQL.

### `processing_jobs`

- UUID primary key.
- `owner_user_id` and `file_id`.
- Per-owner idempotency key.
- Status, stage, attempt count, max attempts, lock timestamp, start/completion timestamps, next
  attempt timestamp, and last bounded error.
- JSON metadata, currently including the Aetherium queue name.
- Indexes for owner/file history and queued-job polling.

### `extraction_results`

- UUID primary key.
- `owner_user_id`, `file_id`, and unique `processing_job_id`.
- Extraction status, extractor name, text character count, chunk count, source metadata, and
  optional bounded error message.

### `file_chunks`

- UUID primary key.
- `owner_user_id`, `file_id`, and `processing_job_id`.
- Sequence number unique per file.
- Extracted chunk text, normalized `search_text`, token estimate, page number or section label,
  status, source metadata, and optional future embedding payload.

Chunks are ready for the later search phase but are not exposed as global search results yet.

### `embedding_jobs`

- UUID primary key.
- `owner_user_id`, `file_id`, and unique `processing_job_id`.
- Status, provider/model placeholders, attempt counts, retry timing, completion timestamp, and last
  bounded error.

Embedding jobs are skipped by default until the AI gateway and semantic-search phases implement
provider adapters and user consent controls.

### `processing_failures`

- UUID primary key.
- `owner_user_id`, `file_id`, and `processing_job_id`.
- Failure kind, bounded error code/message, retryable flag, and timestamps.

Failure rows support user-visible processing state and audit/debug workflows without storing raw
document bodies.

## Search Schema

### `recent_searches`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Query text and normalized query.
- JSON array of requested entity types.
- JSON filters.
- Result count.
- Timestamps.

Recent searches are user-owned product data. They do not grant access to results; every search query
still filters by current owner.

PostgreSQL deployments also include full-text expression indexes over:

- File display name, original file name, and file kind.
- File chunk `search_text`.
- Collection name and description.
- Tag name.

## Planned Later Tables

Later schema slices will cover:

- `world_locations`, `user_world_state`.
- `mentors`, `conversations`, `messages`, `message_sources`.
- `subjects`, `topics`, `topic_relations`, `resources`.
- `courses`, `modules`, `lessons`, `quizzes`, `questions`, `attempts`.
- `flashcards`, `review_events`, `study_sessions`, `mastery_records`.
- `habits`, `habit_schedules`, `habit_logs`.
- `goals`, `milestones`, `tasks`, `projects`, `project_files`.
- `achievements`, `achievement_rules`, `user_achievements`.
- `ai_usage_records`.

## Retrieval Model

File chunks currently store extracted text, normalized `search_text`, source metadata, and owner
scope. Later search phases will add full-text ranking structures and optional embeddings.

AI citations must reference retrieved chunks. Answers must not claim file support when retrieval did
not produce evidence.
