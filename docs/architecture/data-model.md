# Data Model

## Design Rules

- UUID primary keys for durable user-owned entities.
- `created_at` and `updated_at` timestamps on mutable records.
- Tenant or owner identifiers on every user-owned table.
- Database constraints for ownership, uniqueness, status values, and relationship integrity.
- Permission checks in backend data-access paths, not only frontend filtering.
- Search and retrieval indexes designed with access control in mind.

## Current Physical Schema

The current implementation contains only an Alembic baseline migration that prepares PostgreSQL for
future vector search support. No user-owned product tables are created in this slice.

Current migration:

- Enables the `vector` extension when available.

## Planned Initial Tables

The Phase 1 and later schema will cover:

- `users`, `user_preferences`, `sessions`.
- `world_profiles`, `world_locations`, `user_world_state`.
- `files`, `file_versions`, `file_chunks`.
- `collections`, `collection_items`, `tags`, `file_tags`.
- `mentors`, `conversations`, `messages`, `message_sources`.
- `subjects`, `topics`, `topic_relations`, `resources`.
- `courses`, `modules`, `lessons`, `quizzes`, `questions`, `attempts`.
- `flashcards`, `review_events`, `study_sessions`, `mastery_records`.
- `habits`, `habit_schedules`, `habit_logs`.
- `goals`, `milestones`, `tasks`, `projects`, `project_files`.
- `achievements`, `achievement_rules`, `user_achievements`.
- `domain_events`, `notifications`, `audit_logs`, `ai_usage_records`.

## Phase 1 Ownership Model

When authentication is implemented, each user-owned record must include either:

- `tenant_id` plus `owner_user_id`, or
- a foreign key to a parent record that is already scoped to a tenant and owner.

Repository and service methods must accept the authenticated principal and enforce ownership in
queries. Authorization tests are required before any user-owned endpoint is considered complete.

## Retrieval Model

File chunks will store:

- Extracted text.
- Source metadata such as page, section, or byte range.
- Full-text search vectors.
- Optional embeddings using pgvector.
- Permission scope inherited from the source file and collection membership.

AI citations must reference retrieved chunks. Answers must not claim file support when retrieval did
not produce evidence.
