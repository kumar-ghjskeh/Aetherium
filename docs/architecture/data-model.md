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
- `0007_ai_gateway`: creates owner-scoped AI consent policies, model configurations, and usage
  records.
- `0008_ai_mentors`: creates owner-scoped mentors, mentor permissions, conversations, memory
  settings, messages, and message sources.
- `0009_habit_tracking`: creates owner-scoped habits, schedules, targets, logs, streaks, daily
  check-ins, and weekly reviews.
- `0010_learning_engine`: creates owner-scoped subjects, topics, topic relations, learning
  resources, courses, modules, lessons, study sessions, quizzes, questions, attempts, flashcards,
  flashcard reviews, mastery records, learning goals, and study roadmaps.
- `0011_project_dock`: creates owner-scoped projects, milestones, project tasks, notes, links, file
  links, topic links, technologies, blockers, and project activity.
- `0012_achievement_engine`: creates achievement definitions, achievement rules, reward definitions,
  user achievements, progress counters, processed event/rule rows, and non-visual world unlock
  records.
- `0013_profile_settings`: creates personal profile metadata, profile links, favorite profile
  projects/resources, certificates, privacy settings, data-export requests, and account deletion
  request records.
- `0014_coding_workspace`: creates owner-scoped coding snippets, coding exercises, exercise
  attempts, and coding assistant request records.
- `0015_knowledge_graph`: creates owner-scoped knowledge graph nodes and relationships for
  non-visual topic, file, lesson, project, skill, question, and achievement connections.

Progress analytics add no new tables in Phase 12. The analytics service is a read-only aggregation
layer over existing owner-scoped tables.

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

## Personal Profile And Settings Schema

All profile and settings tables include `owner_user_id`, except profile responses that also include
public fields from the authenticated `users` row. Cross-user identifiers return not-found style
responses.

### `user_profiles`

- UUID primary key.
- Unique `owner_user_id` foreign key to `users.id`.
- Optional headline, bio, location, and website URL.
- Avatar kind constrained to preset or vault-file reference.
- Optional avatar preset name.
- Optional `avatar_file_id` reference to an owned active image in `files`.
- Timestamps.

Display name remains on `users` so authentication and profile responses share one source of truth.

### `profile_links`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Link type, title, and HTTP(S) URL.
- Unique owner/type/URL constraint.
- Owner/type index and timestamps.

### `profile_favorite_projects`

- UUID primary key.
- `owner_user_id` and `project_id`.
- Unique owner/project constraint.
- Timestamps.

Favorite projects are presentation metadata. They do not change project ownership or access.

### `profile_favorite_resources`

- UUID primary key.
- `owner_user_id`.
- Resource type constrained to file, learning resource, or external link.
- Optional owned file reference.
- Optional owned learning-resource reference.
- Title, optional URL, optional notes, and timestamps.

File and learning-resource references must be owned by the authenticated user before a favorite is
created.

### `certificates`

- UUID primary key.
- `owner_user_id`.
- Title, optional issuer, issue/expiration dates, credential URL, optional owned file reference,
  notes, and timestamps.

Certificates store metadata only. They do not imply verification by Aetherium.

### `privacy_settings`

- UUID primary key.
- Unique `owner_user_id`.
- Profile visibility, show-email flag, AI-profile-context flag, profile search-indexing flag, and
  include-profile-in-exports flag.
- Timestamps.

Global AI memory and product analytics preferences continue to live in `user_preferences`; the
privacy API updates those fields there rather than duplicating them.

### `data_export_requests`

- UUID primary key.
- `owner_user_id`.
- Idempotency key unique per owner.
- Status, requested/completed timestamps, optional download URL, optional expiration, included
  categories, optional note, and timestamps.

Phase 14 records export requests and notifications only. Actual export generation is future work.

### `account_deletion_requests`

- UUID primary key.
- `owner_user_id`.
- Idempotency key unique per owner.
- Status, requested/scheduled/canceled timestamps, optional reason, bounded metadata JSON, and
  timestamps.

Phase 14 records account deletion requests only. No destructive deletion runs in this slice.

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
Extracted chunks are stored in the ingestion tables below. User-facing metadata, chunk search, and
citation-backed document Q&A retrieval are implemented; global semantic search remains a later
optimization.

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

Chunks are exposed through owner-scoped file detail APIs, the global search result contract, and the
document-QA retrieval service. Document Q&A only retrieves ready chunks whose file is active and
owned by the authenticated user.

### `embedding_jobs`

- UUID primary key.
- `owner_user_id`, `file_id`, and unique `processing_job_id`.
- Status, provider/model placeholders, attempt counts, retry timing, completion timestamp, and last
  bounded error.

Embedding jobs are skipped by default until a later semantic-search slice wires those jobs to the AI
gateway with explicit user consent controls. Document Q&A can rerank chunks with stored embeddings
when they already exist, but it does not require embeddings to answer.

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
- Conversation title.
- Habit name and description.
- Topic name and description.

## AI Gateway Schema

### `ai_consent_policies`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Feature identifier.
- External-provider consent flag.
- Per-category consent flags for file content, collections, conversations, projects, learning
  records, habit data, and profile data.
- Optional allowed collection IDs for later retrieval scopes.
- Unique owner/feature constraint.
- Timestamps.

Consent rows default to no external provider access and no automatic data-category access.

### `ai_model_configurations`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Feature identifier.
- Provider name and provider kind.
- Model name.
- Optional fallback provider and model.
- Temperature, maximum output tokens, and enabled flag.
- Unique owner/feature constraint.
- Timestamps.

### `ai_usage_records`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Request ID unique per owner.
- Feature, provider, model, operation, status, token counts, cost estimate placeholder, latency, and
  fallback flag.
- Optional normalized error code and bounded message.
- Timestamps and owner/feature indexes.

Usage records are metadata-only and must not store raw prompts, raw responses, provider API keys,
cookies, or session tokens.

## AI Mentor Schema

All AI mentor records are owner-scoped. Default mentors are copied into each user's own rows on
first access so no mutable mentor state is shared between users.

### `mentors`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Slug unique per owner.
- Name, fictional identity, optional avatar reference, description, system instructions, tone,
  preferred model name, default flag, archive timestamp, and timestamps.

### `mentor_permissions`

- UUID primary key.
- `owner_user_id` and unique `mentor_id`.
- JSON allowlist of mentor tools.
- JSON allowed collection IDs for later retrieval scopes.
- Boolean access flags for files, conversations, projects, learning records, habits, and profile
  data.

Permissions default to no automatic private data access. The current mentor-chat service passes no
file, project, habit, learning, or profile data to the AI gateway.

### `conversations`

- UUID primary key.
- `owner_user_id` and `mentor_id`.
- Title, active/archive/delete status, archive/delete timestamps, last-message timestamp, and
  timestamps.
- Owner/status indexes for bounded conversation lists.

### `conversation_memory_settings`

- UUID primary key.
- `owner_user_id` and unique `conversation_id`.
- Memory enabled flag, memory policy, optional bounded memory summary, and timestamps.

Memory can only be enabled when the user's global AI memory preference allows it.

### `messages`

- UUID primary key.
- `owner_user_id` and `conversation_id`.
- Role, content, complete/failed status, optional AI usage record reference, provider/model
  metadata, bounded error fields, edit/regeneration lineage, and timestamps.

Messages store user prompts and assistant responses as user-owned conversation data. AI usage
records remain metadata-only and do not duplicate raw prompts.

### `message_sources`

- UUID primary key.
- `owner_user_id` and `message_id`.
- Source type, optional source identifier, title, URL, page/section metadata, snippet, source
  metadata JSON, and created timestamp.

Message sources are present for future citation-backed retrieval. Phase 7 mentor chat does not
fabricate citations or claim file support.

## Retrieval Model

File chunks currently store extracted text, normalized `search_text`, source metadata, optional
embedding payloads, and owner scope. Global search uses those chunks for owner-scoped full-text
results.

Document Q&A reuses these tables without adding a new migration. It validates optional file and
collection filters, applies AI consent collection scopes, retrieves bounded ready chunks, optionally
uses existing embeddings for reranking, and returns citation objects that point to the retrieved
chunk and Library URL.

AI citations must reference retrieved chunks. Answers must not claim file support when retrieval did
not produce evidence. No-evidence document-QA responses return `insufficient_evidence` without
creating an AI usage record.

## Habit Tracking Schema

All habit tables include `owner_user_id`. Habit APIs query through the authenticated user's owner
scope, and cross-user identifiers return not-found style responses.

### `habits`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Name, optional description, active/archive status, value type, optional display color, archive
  timestamp, and timestamps.
- Owner/status indexes and PostgreSQL full-text index over name and description.

### `habit_schedules`

- UUID primary key.
- `owner_user_id` and unique `habit_id`.
- Schedule type: daily, selected weekdays, or weekly target.
- JSON weekday list, weekly target count, start date, time zone, and timestamps.

Selected-weekday schedules must include at least one weekday at the service layer. Weekly-target
schedules must include a target between one and seven.

### `habit_targets`

- UUID primary key.
- `owner_user_id` and unique `habit_id`.
- Positive target value, optional unit, day/week target period, and timestamps.

### `habit_logs`

- UUID primary key.
- `owner_user_id`, `habit_id`, log date, value, optional unit, optional note, completion status, and
  timestamps.
- Unique owner/habit/date constraint so repeated logging updates the same day's record.

Logging an active habit creates an idempotent `habit.logged` domain event and sanitized audit log.
Archived habits cannot be logged, but their historical logs remain available.

### `habit_streaks`

- UUID primary key.
- `owner_user_id` and unique `habit_id`.
- Current streak, best streak, recovery streak, 30-day completion rate, last logged date, and
  timestamps.

Streaks are recalculated from stored logs and schedules. A missed day does not delete historical
progress.

### `daily_check_ins`

- UUID primary key.
- `owner_user_id`, check-in date, optional mood, optional energy, notes, and timestamps.
- Unique owner/date constraint.

Mood and energy are optional personal context fields and are not medical measurements.

### `weekly_reviews`

- UUID primary key.
- `owner_user_id`, normalized week start, wins, challenges, next steps, period, metadata, and
  timestamps.
- Unique owner/week constraint.

## Learning Schema

All learning tables include `owner_user_id`. Learning APIs query through the authenticated user's
owner scope, and cross-user identifiers return not-found style responses.

### `subjects`

- UUID primary key.
- `owner_user_id` foreign key to `users.id`.
- Name, normalized name, optional description, status, and timestamps.
- Unique owner/normalized-name constraint and PostgreSQL full-text index over name and description.

### `topics`

- UUID primary key.
- `owner_user_id` and optional `subject_id`.
- Name, normalized name, optional description, status, and timestamps.
- Unique owner/normalized-name constraint and PostgreSQL full-text index over name and description.

### `topic_relations`

- UUID primary key.
- `owner_user_id`, source topic, target topic, relation type, and timestamps.
- Unique owner/source/target/relation-type constraint.
- Prerequisites are represented as `requires` relations.

### `learning_resources`

- UUID primary key.
- `owner_user_id` and optional `topic_id`.
- Title, resource type, optional URL, optional file ID, optional notes, and timestamps.
- File-linked resources must reference files owned by the same user at the service layer.

### `courses`, `course_modules`, and `lessons`

- Courses store owner-scoped title, optional subject, description, status, and timestamps.
- Course modules store owner, course, title, position, optional description, and timestamps.
- Lessons store owner, module, optional topic, title, position, content summary, status, completion
  state, estimated duration, and timestamps.
- Position constraints keep module and lesson ordering deterministic.
- Completing a lesson emits an idempotent `lesson.completed` event and updates mastery with an
  exercise-completion signal when the lesson is linked to a topic.

### `study_sessions`

- UUID primary key.
- `owner_user_id`, mode, optional subject/topic/course/lesson references, optional started and ended
  timestamps, duration, notes, and timestamps.
- Study time is stored for history but does not increase mastery by itself.

### `quizzes`, `questions`, and `attempts`

- Quizzes store owner, optional topic/lesson, title, status, and timestamps.
- Questions store owner, quiz, prompt, question type, answer, options, explanation, difficulty,
  position, and timestamps.
- Attempts store owner, quiz, optional topic, score, max score, accuracy, submitted answers, hint
  count, completion status, and timestamps.
- Completed attempts emit an idempotent `quiz.completed` event and update mastery with quiz,
  confidence, and hint signals.

### `flashcards` and `flashcard_reviews`

- Flashcards store owner, optional topic, front, back, status, and timestamps.
- Flashcard reviews store owner, flashcard, optional topic, rating, confidence, next due date, and
  timestamps.
- Reviews update topic mastery with recall, confidence, and recency signals when linked to a topic.

### `mastery_records`

- UUID primary key.
- `owner_user_id` and unique `topic_id`.
- Mastery score from zero to one, transparent calculation JSON, signal counters, last reviewed
  timestamp, confidence average, and timestamps.
- The score is a transparent heuristic from stored quiz accuracy, successful recall, exercise
  completion, confidence, review recency, hint usage, and future project evidence. It is not a
  scientific measurement.

### `learning_goals` and `study_roadmaps`

- Learning goals store owner, optional subject/topic, title, description, target date, status, and
  timestamps.
- Study roadmaps store owner, title, description, JSON step list, status, and timestamps.
- These records are non-visual foundations for later reminders, analytics, and AI-assisted planning.

### `projects`

- UUID primary key and `owner_user_id`.
- Name, description, objective, optional repository URL, status, start/target dates, archived and
  completed timestamps, and timestamps.
- Owner/name uniqueness prevents duplicate active project names per user.
- PostgreSQL deployments include a full-text expression index over name, objective, and description.

### `project_milestones` and `project_tasks`

- Milestones store owner, project, title, description, status, due date, position, completion
  timestamp, and timestamps.
- Project tasks store owner, project, optional milestone, title, description, status, priority, due
  date, completion timestamp, and timestamps.
- Task and milestone ownership is enforced through both direct owner fields and parent-project
  service checks.
- PostgreSQL deployments include a project-task full-text expression index.

### Project Context Tables

- `project_notes` store owner, project, title, body, and timestamps.
- `project_links` store owner, project, title, URL, and timestamps.
- `project_files` links an owned project to an owned Personal Vault file with optional description.
- `project_topics` links an owned project to an owned learning topic.
- `project_technologies` stores unique owner/project technology names.
- `project_blockers` stores owner, project, title, description, open/resolved status, resolved
  timestamp, and timestamps.
- `project_activity` stores append-only owner/project activity entries with typed activity,
  description, sanitized metadata JSON, and creation timestamp.

## Analytics Read Model

Progress analytics are computed on demand from existing user-owned records:

- Study minutes from completed `study_sessions`.
- Lesson completions from completed `lessons`.
- Quiz accuracy from completed `attempts`.
- Topic mastery from `mastery_records`.
- Habit completions and completion rate from `habit_logs`.
- Processed files from ready `files`.
- AI requests and tokens from successful `ai_usage_records`.
- Project progress from owned project tasks and completed projects.

Unsupported signals such as file-open events and coding sessions are represented as unavailable
metric rows until source events exist. The analytics layer must not create synthetic activity or
infer cross-user data.

## Achievement Progression Schema

Achievement definitions and rules are global Aetherium-owned configuration rows. User-specific
progress and unlock state is owner-scoped.

### `achievement_definitions`

- UUID primary key.
- Unique slug, title, description, category, rarity, points, active flag, and timestamps.

### `achievement_rules`

- UUID primary key.
- Achievement definition reference.
- Domain-event type, counter key, positive threshold count, payload filters, active flag, and
  timestamps.

### `reward_definitions`

- UUID primary key.
- Achievement definition reference.
- Reward type, title, description, metadata JSON, and timestamps.
- World rewards store future identifiers only; they do not render scenes or unlock core data.

### `user_achievements`

- UUID primary key.
- `owner_user_id`, achievement definition reference, optional source domain event, progress count,
  target count, unlock timestamp, and timestamps.
- Unique owner/definition constraint prevents duplicate unique awards.

### `achievement_progress_counters`

- UUID primary key.
- `owner_user_id`, achievement rule reference, counter key, count, optional last event, and
  timestamps.
- Unique owner/rule constraint stores durable event-derived progress.

### `achievement_processed_events`

- UUID primary key.
- `owner_user_id`, domain event reference, achievement rule reference, and timestamps.
- Unique owner/event/rule constraint makes achievement processing idempotent.

### `world_unlock_records`

- UUID primary key.
- `owner_user_id`, achievement definition reference, reward definition reference, future location
  identifier, source, unlock timestamp, and timestamps.
- Unique owner/location constraint prevents duplicate future world unlock records.

## Coding Workspace Schema

All coding workspace tables include `owner_user_id`. Service methods validate owned project, file,
topic, exercise, and snippet references before writes. Cross-user identifiers return not-found style
responses.

### `code_snippets`

- UUID primary key and `owner_user_id`.
- Title, language, content, notes, active/archive status, and archive timestamp.
- Optional owned project reference and optional owned Personal Vault file reference.
- Timestamps and owner/status indexes for bounded lists.

Snippets are stored product data. They are not executed by the API, worker, database, or web
containers.

### `coding_exercises`

- UUID primary key and `owner_user_id`.
- Title, language, prompt, starter code, optional solution notes, difficulty, and active/archive
  status.
- Optional owned learning topic and project references.
- Timestamps and owner/status/topic/project indexes.

### `coding_exercise_attempts`

- UUID primary key and `owner_user_id`.
- Owned exercise reference.
- Optional owned snippet reference.
- Submitted code, optional notes, optional feedback, submitted/reviewed status, and timestamps.

Attempts record a user's submitted answer. They do not imply that code was compiled or executed.

### `code_assistant_requests`

- UUID primary key and `owner_user_id`.
- Optional snippet and project references.
- Optional AI usage record reference.
- Assistant kind, language, prompt, bounded code excerpt, response, status, provider/model metadata,
  and bounded error fields.

Assistant request rows store user-owned coding assistance history. AI usage records remain
metadata-only and do not duplicate raw prompts or code excerpts.

## Knowledge Graph Schema

### `knowledge_nodes`

Owner-scoped graph nodes for non-visual knowledge relationships. Supported node types are `topic`,
`file`, `lesson`, `project`, `skill`, `question`, and `achievement`.

Rows include owner, node type, stable source identifier, stable source key, title, summary, status,
mastery score, confidence score, last-reviewed timestamp, stale-after timestamp, metadata, and
timestamps. Source-backed nodes are unique per owner, node type, and source key. Manual creation is
limited to user-created skill nodes in the first graph slice.

### `knowledge_relationships`

Owner-scoped graph edges between `knowledge_nodes`.

Rows include owner, source node, target node, relation type, relationship source, weight,
confidence, evidence, metadata, optional created-by event, and timestamps. Supported relationship
types are `requires`, `explains`, `references`, `practices`, `used_in`, `related_to`,
`mastered_through`, and `derived_from`.

A unique constraint over owner, source node, target node, and relation type makes approved sync
idempotent. A check constraint prevents self-edge relationships.

## Planned Later Tables

Later schema slices will cover:

- `world_locations`, `user_world_state`.
- `goals`, global tasks, and goal milestones.
