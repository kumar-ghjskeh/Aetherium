# API Plan

## Versioning

All backend routes use `/api/v1`.

Current routes:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users/profile`
- `PATCH /api/v1/users/profile`
- `GET /api/v1/users/profile/links`
- `POST /api/v1/users/profile/links`
- `DELETE /api/v1/users/profile/links/{link_id}`
- `GET /api/v1/users/profile/favorite-projects`
- `POST /api/v1/users/profile/favorite-projects`
- `DELETE /api/v1/users/profile/favorite-projects/{project_id}`
- `GET /api/v1/users/profile/favorite-resources`
- `POST /api/v1/users/profile/favorite-resources`
- `DELETE /api/v1/users/profile/favorite-resources/{favorite_id}`
- `GET /api/v1/users/profile/certificates`
- `POST /api/v1/users/profile/certificates`
- `DELETE /api/v1/users/profile/certificates/{certificate_id}`
- `GET /api/v1/users/privacy`
- `PATCH /api/v1/users/privacy`
- `GET /api/v1/users/data-export-requests`
- `POST /api/v1/users/data-export-requests`
- `GET /api/v1/users/account-deletion-requests`
- `POST /api/v1/users/account-deletion-requests`
- `GET /api/v1/settings/preferences`
- `PATCH /api/v1/settings/preferences`
- `GET /api/v1/world/profile`
- `PATCH /api/v1/world/profile`
- `POST /api/v1/world/visit`
- `GET /api/v1/domain-events`
- `POST /api/v1/domain-events`
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/{notification_id}/read`
- `GET /api/v1/audit-logs`
- `POST /api/v1/files/uploads`
- `POST /api/v1/files/uploads/{upload_id}/complete`
- `GET /api/v1/files`
- `GET /api/v1/files/{file_id}`
- `PATCH /api/v1/files/{file_id}`
- `DELETE /api/v1/files/{file_id}`
- `POST /api/v1/files/{file_id}/restore`
- `DELETE /api/v1/files/{file_id}/permanent`
- `GET /api/v1/files/{file_id}/download`
- `POST /api/v1/files/{file_id}/favorite`
- `DELETE /api/v1/files/{file_id}/favorite`
- `GET /api/v1/files/collections`
- `POST /api/v1/files/collections`
- `POST /api/v1/files/collections/{collection_id}/items`
- `DELETE /api/v1/files/collections/{collection_id}/items/{file_id}`
- `GET /api/v1/files/tags`
- `POST /api/v1/files/{file_id}/tags`
- `DELETE /api/v1/files/{file_id}/tags/{tag_id}`
- `GET /api/v1/files/processing-jobs`
- `POST /api/v1/files/processing-jobs/{job_id}/retry`
- `GET /api/v1/files/{file_id}/processing-jobs`
- `POST /api/v1/files/{file_id}/processing-jobs`
- `GET /api/v1/files/{file_id}/chunks`
- `POST /api/v1/search`
- `GET /api/v1/search/recent`
- `GET /api/v1/ai/providers`
- `GET /api/v1/ai/consent`
- `PATCH /api/v1/ai/consent/{feature}`
- `GET /api/v1/ai/model-configs`
- `PUT /api/v1/ai/model-configs/{feature}`
- `GET /api/v1/ai/usage`
- `POST /api/v1/ai/chat/completions`
- `POST /api/v1/ai/chat/completions/stream`
- `POST /api/v1/ai/embeddings`
- `POST /api/v1/ai/document-qa`
- `GET /api/v1/mentors`
- `POST /api/v1/mentors`
- `GET /api/v1/mentors/{mentor_id}`
- `PATCH /api/v1/mentors/{mentor_id}`
- `POST /api/v1/mentors/{mentor_id}/archive`
- `GET /api/v1/mentors/{mentor_id}/permissions`
- `PATCH /api/v1/mentors/{mentor_id}/permissions`
- `GET /api/v1/mentors/conversations`
- `POST /api/v1/mentors/conversations`
- `GET /api/v1/mentors/conversations/{conversation_id}`
- `PATCH /api/v1/mentors/conversations/{conversation_id}`
- `DELETE /api/v1/mentors/conversations/{conversation_id}`
- `POST /api/v1/mentors/conversations/{conversation_id}/archive`
- `PATCH /api/v1/mentors/conversations/{conversation_id}/memory`
- `GET /api/v1/mentors/conversations/{conversation_id}/messages`
- `POST /api/v1/mentors/conversations/{conversation_id}/messages`
- `PATCH /api/v1/mentors/conversations/{conversation_id}/messages/{message_id}`
- `POST /api/v1/mentors/conversations/{conversation_id}/messages/{message_id}/regenerate`
- `POST /api/v1/mentors/conversations/{conversation_id}/stop`
- `GET /api/v1/mentors/conversations/{conversation_id}/export`
- `GET /api/v1/habits`
- `POST /api/v1/habits`
- `GET /api/v1/habits/summary`
- `GET /api/v1/habits/check-ins/{check_in_date}`
- `PUT /api/v1/habits/check-ins/{check_in_date}`
- `GET /api/v1/habits/weekly-reviews`
- `POST /api/v1/habits/weekly-reviews`
- `GET /api/v1/habits/{habit_id}`
- `PATCH /api/v1/habits/{habit_id}`
- `POST /api/v1/habits/{habit_id}/archive`
- `GET /api/v1/habits/{habit_id}/logs`
- `POST /api/v1/habits/{habit_id}/logs`
- `GET /api/v1/learning/subjects`
- `POST /api/v1/learning/subjects`
- `GET /api/v1/learning/topics`
- `POST /api/v1/learning/topics`
- `POST /api/v1/learning/topics/{topic_id}/prerequisites`
- `GET /api/v1/learning/topics/{topic_id}/mastery`
- `GET /api/v1/learning/resources`
- `POST /api/v1/learning/resources`
- `GET /api/v1/learning/courses`
- `POST /api/v1/learning/courses`
- `POST /api/v1/learning/courses/{course_id}/modules`
- `POST /api/v1/learning/modules/{module_id}/lessons`
- `POST /api/v1/learning/lessons/{lesson_id}/complete`
- `GET /api/v1/learning/study-sessions`
- `POST /api/v1/learning/study-sessions`
- `PATCH /api/v1/learning/study-sessions/{session_id}/end`
- `GET /api/v1/learning/quizzes`
- `POST /api/v1/learning/quizzes`
- `POST /api/v1/learning/quizzes/{quiz_id}/questions`
- `POST /api/v1/learning/quizzes/{quiz_id}/attempts`
- `GET /api/v1/learning/flashcards`
- `POST /api/v1/learning/flashcards`
- `POST /api/v1/learning/flashcards/{flashcard_id}/reviews`
- `GET /api/v1/learning/goals`
- `POST /api/v1/learning/goals`
- `GET /api/v1/learning/roadmaps`
- `POST /api/v1/learning/roadmaps`
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/{project_id}`
- `PATCH /api/v1/projects/{project_id}`
- `POST /api/v1/projects/{project_id}/archive`
- `POST /api/v1/projects/{project_id}/milestones`
- `PATCH /api/v1/projects/milestones/{milestone_id}`
- `POST /api/v1/projects/{project_id}/tasks`
- `PATCH /api/v1/projects/tasks/{task_id}`
- `POST /api/v1/projects/{project_id}/notes`
- `POST /api/v1/projects/{project_id}/links`
- `POST /api/v1/projects/{project_id}/files`
- `POST /api/v1/projects/{project_id}/topics`
- `POST /api/v1/projects/{project_id}/technologies`
- `POST /api/v1/projects/{project_id}/blockers`
- `PATCH /api/v1/projects/blockers/{blocker_id}`
- `GET /api/v1/projects/{project_id}/activity`
- `GET /api/v1/analytics/summary`
- `GET /api/v1/achievements`
- `GET /api/v1/achievements/summary`
- `POST /api/v1/achievements/process`
- `GET /api/v1/coding/snippets`
- `POST /api/v1/coding/snippets`
- `GET /api/v1/coding/snippets/{snippet_id}`
- `PATCH /api/v1/coding/snippets/{snippet_id}`
- `POST /api/v1/coding/snippets/{snippet_id}/archive`
- `GET /api/v1/coding/exercises`
- `POST /api/v1/coding/exercises`
- `POST /api/v1/coding/exercises/{exercise_id}/attempts`
- `GET /api/v1/coding/assistant/requests`
- `POST /api/v1/coding/assistant/explain`
- `POST /api/v1/coding/assistant/review`
- `GET /api/v1/coding/runner/status`
- `GET /api/v1/knowledge/nodes`
- `POST /api/v1/knowledge/nodes`
- `GET /api/v1/knowledge/relationships`
- `POST /api/v1/knowledge/relationships`
- `POST /api/v1/knowledge/sync`
- `GET /api/v1/knowledge/topics/{topic_id}/related`
- `GET /api/v1/knowledge/topics/{topic_id}/prerequisites`
- `GET /api/v1/knowledge/recommendations`
- `GET /api/v1/knowledge/summary`

Planned route groups:

- `/api/v1/goals`
- `/api/v1/tasks`

## Authentication Routes

`POST /api/v1/auth/register` creates a user and authenticated session. It sets the HttpOnly
`aetherium_session` cookie.

`POST /api/v1/auth/login` verifies credentials and creates a new authenticated session. Login
failures use the same non-revealing error for nonexistent accounts and incorrect passwords.

`POST /api/v1/auth/logout` revokes the current session when present and clears the cookie.

`GET /api/v1/auth/me` returns the authenticated user's public profile or an unauthenticated error.

## Personal Profile And Settings Routes

`GET/PATCH /api/v1/users/profile` reads and updates owner-scoped profile metadata. Display-name
updates also update the authenticated `users` row so `/auth/me` stays consistent. Avatar updates
either select a preset or reference an owned active image file from the Personal Vault.

`GET/POST /api/v1/users/profile/links` lists and creates owner-scoped profile links. Duplicate
owner/type/URL combinations are rejected, and URLs must use `http://` or `https://`.

`DELETE /api/v1/users/profile/links/{link_id}` deletes only the authenticated user's profile link.
Cross-user IDs return `not_found`.

`GET/POST /api/v1/users/profile/favorite-projects` lists and creates favorite project records.
Favorites must reference projects owned by the authenticated user.

`DELETE /api/v1/users/profile/favorite-projects/{project_id}` removes only the authenticated user's
favorite-project row.

`GET/POST /api/v1/users/profile/favorite-resources` lists and creates favorite file, learning
resource, or external-link records. File and learning-resource favorites must reference owned
records; external links require a title and HTTP(S) URL.

`DELETE /api/v1/users/profile/favorite-resources/{favorite_id}` removes only the authenticated
user's favorite-resource row.

`GET/POST /api/v1/users/profile/certificates` lists and creates owner-scoped certificate metadata.
Certificate file attachments must reference owned vault files.

`DELETE /api/v1/users/profile/certificates/{certificate_id}` deletes only the authenticated user's
certificate metadata.

`GET/PATCH /api/v1/users/privacy` reads and updates profile privacy controls. Global AI memory and
product analytics flags are routed through `user_preferences` so settings have one source of truth.

`GET/POST /api/v1/users/data-export-requests` records idempotent owner-scoped export requests. This
slice records the request and notification only; export generation is future work.

`GET/POST /api/v1/users/account-deletion-requests` records idempotent owner-scoped deletion requests
after the exact confirmation phrase is submitted. This slice does not delete data.

## Error Shape

API errors use:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "Email or password is incorrect."
  }
}
```

Validation errors may include field-level messages under `error.fields`.

## Idempotency

Important mutation endpoints will accept an idempotency key, especially:

- File upload finalization.
- Data-export request recording.
- Account deletion request recording.
- Habit logging.
- Task creation from AI suggestions.
- Goal or milestone changes.
- Destructive operations.

Auth registration and login are not idempotent because they create new server-side sessions.

`POST /api/v1/domain-events` requires a per-user `idempotencyKey`. A retry with the same key returns
the existing event instead of inserting a duplicate.

`POST /api/v1/world/visit` also requires an `idempotencyKey`; duplicate requests do not create
duplicate visit events.

## User-Owned Foundation Routes

`GET /api/v1/settings/preferences` returns the authenticated user's preferences, creating defaults
for users that predate the foundation migration.

`PATCH /api/v1/settings/preferences` updates only submitted preference fields and records a
`user.preference_updated` domain event plus a sanitized audit log.

`GET /api/v1/world/profile` returns non-visual world state for the authenticated user.

`PATCH /api/v1/world/profile` updates non-visual profile preferences such as navigation method,
tutorial completion, and spawn location. Spawn locations must already be unlocked.

`POST /api/v1/world/visit` records a visit to an unlocked non-visual location identifier and creates
an idempotent `world.location_visited` domain event.

`GET /api/v1/domain-events`, `GET /api/v1/notifications`, and `GET /api/v1/audit-logs` are paginated
with bounded `limit` and `offset` parameters.

`POST /api/v1/notifications/{notification_id}/read` marks only the authenticated user's notification
as read. Cross-user IDs return `not_found`.

## Personal Vault Routes

`POST /api/v1/files/uploads` validates file name, extension, MIME type, size, and idempotency key,
then creates an owner-scoped upload record and returns an expiring presigned `PUT` URL.

`POST /api/v1/files/uploads/{upload_id}/complete` finalizes a pending upload for the authenticated
owner, optionally verifies the object in storage, creates the file record and first file version,
records a `file.uploaded` domain event, and writes a sanitized audit log. Repeated completion with
the same idempotency key returns the existing file.

`GET /api/v1/files` is paginated and supports metadata filtering by file name, favorite-only,
collection, tag, and deleted-record visibility. It does not search extracted text yet.

`GET /api/v1/files/{file_id}`, `PATCH /api/v1/files/{file_id}`, `DELETE /api/v1/files/{file_id}`,
`POST /api/v1/files/{file_id}/restore`, and `DELETE /api/v1/files/{file_id}/permanent` all enforce
owner scope. Permanent deletion requires an existing soft-deleted record and removes stored object
versions before deleting metadata.

`GET /api/v1/files/{file_id}/download` returns an expiring presigned `GET` URL for the authenticated
owner. The API does not expose object keys in normal file responses.

Collection, favorite, and tag routes are owner-scoped and designed as metadata-only organization for
the current slice.

## File Ingestion Routes

`POST /api/v1/files/uploads/{upload_id}/complete` also creates an idempotent queued processing job
for the completed file.

`GET /api/v1/files/processing-jobs` returns the authenticated user's processing jobs with bounded
pagination.

`GET /api/v1/files/{file_id}/processing-jobs` lists jobs for one owned file. Cross-user file IDs
return `not_found`.

`POST /api/v1/files/{file_id}/processing-jobs` queues processing for an owned active file and
returns the existing job for duplicate idempotency.

`POST /api/v1/files/processing-jobs/{job_id}/retry` requeues only the authenticated user's failed
job when it has retry attempts remaining.

`GET /api/v1/files/{file_id}/chunks` returns extracted chunks for an owned active file. This is a
low-level owner-scoped data API for future search and retrieval work, not a global search endpoint.

## Search Routes

`POST /api/v1/search` searches the authenticated user's implemented Aetherium data and records a
recent search. Current result producers cover file metadata, file chunks, collections, tags, AI
conversation titles, and active habit metadata. The response includes snippets, match reasons, open
URLs, and future world-location identifiers. `semanticEnabled` is `false` until embeddings and AI
retrieval controls are implemented.

`GET /api/v1/search/recent` lists only the authenticated user's recent searches with bounded
pagination.

## AI Gateway Routes

`GET /api/v1/ai/providers` returns provider metadata and configured status without exposing secrets.

`GET /api/v1/ai/consent` returns owner-scoped AI consent policies for each supported feature.
Policies default to no external provider access and no automatic data-category access.

`PATCH /api/v1/ai/consent/{feature}` updates the authenticated user's feature consent policy and
writes a sanitized audit log.

`GET /api/v1/ai/model-configs` returns owner-scoped feature model configuration.

`PUT /api/v1/ai/model-configs/{feature}` updates the selected provider, model, fallback,
temperature, max output tokens, and enabled state for one feature.

`GET /api/v1/ai/usage` returns paginated metadata-only usage records. Usage records do not include
raw prompts or model responses.

`POST /api/v1/ai/chat/completions`, `POST /api/v1/ai/chat/completions/stream`, and
`POST /api/v1/ai/embeddings` call the provider-neutral gateway. External providers require
environment enablement and explicit user consent. These routes do not retrieve files or create
mentor conversations in this slice.

`POST /api/v1/ai/document-qa` answers questions against the authenticated user's processed Personal
Vault chunks. It requires document-QA feature consent for file-content access, accepts optional
owned file and collection filters, retrieves only active ready chunks, optionally reranks candidates
with stored embeddings, calls the provider-neutral gateway with bounded source excerpts, and returns
validated source citations. If no supporting chunks are found, it returns an `insufficient_evidence`
response with no citations and no AI usage record instead of fabricating an answer.

## AI Mentor Routes

`GET /api/v1/mentors` returns the authenticated user's default and custom mentors. Default fictional
mentors are created as owner-scoped rows on first access.

`POST /api/v1/mentors`, `PATCH /api/v1/mentors/{mentor_id}`, and
`POST /api/v1/mentors/{mentor_id}/archive` manage custom mentor metadata. Default mentors cannot be
archived.

`GET/PATCH /api/v1/mentors/{mentor_id}/permissions` reads and updates explicit mentor data-access
flags and tool allowlists. The current mentor chat still sends no private domain data unless later
retrieval phases add approved context assembly.

`GET/POST /api/v1/mentors/conversations` lists and creates owner-scoped conversations with bounded
pagination.

`GET/PATCH/DELETE /api/v1/mentors/conversations/{conversation_id}` reads, renames, and soft-deletes
owned conversations. Cross-user IDs return `not_found`.

`POST /api/v1/mentors/conversations/{conversation_id}/archive` archives an owned conversation.

`PATCH /api/v1/mentors/conversations/{conversation_id}/memory` persists conversation memory settings
and rejects enabling memory while the user's global AI memory preference is disabled.

`GET/POST /api/v1/mentors/conversations/{conversation_id}/messages` lists messages and sends a new
user message. Assistant replies are generated through the AI gateway with bounded conversation
context and usage tracking.

`PATCH /api/v1/mentors/conversations/{conversation_id}/messages/{message_id}` edits and resends a
user message as a new turn, preserving history.

`POST /api/v1/mentors/conversations/{conversation_id}/messages/{message_id}/regenerate` regenerates
an assistant message as a new turn linked to the original.

`POST /api/v1/mentors/conversations/{conversation_id}/stop` exists for the future streaming
generation workflow and currently returns an honest conflict when no active generation exists.

`GET /api/v1/mentors/conversations/{conversation_id}/export` returns an owner-scoped JSON export of
the conversation, mentor metadata, messages, and any stored message sources.

## Habit Routes

`GET/POST /api/v1/habits` lists and creates active owner-scoped habits with bounded pagination.
Habit creation stores one habit record plus schedule, target, and streak records.

`GET/PATCH /api/v1/habits/{habit_id}` reads and updates an owned habit. Cross-user IDs return
`not_found`. Schedule changes are validated so selected-weekday and weekly-target habits cannot
persist invalid schedule state.

`POST /api/v1/habits/{habit_id}/archive` archives an owned habit without deleting its historical
logs. Archived habits cannot be logged.

`GET/POST /api/v1/habits/{habit_id}/logs` lists and upserts dated habit logs. Logging creates an
idempotent `habit.logged` domain event keyed by user, habit, and date, writes a sanitized audit log,
and refreshes streak metrics.

`GET /api/v1/habits/summary` returns weekly or monthly summary metrics derived from stored active
habits and logs only. It does not fabricate analytics.

`GET/PUT /api/v1/habits/check-ins/{check_in_date}` reads or saves optional mood, energy, and notes
for the authenticated user.

`GET/POST /api/v1/habits/weekly-reviews` lists and saves owner-scoped weekly review notes. Submitted
dates are normalized to the week start.

## Learning Routes

`GET/POST /api/v1/learning/subjects` lists and creates owner-scoped subjects with normalized-name
uniqueness.

`GET/POST /api/v1/learning/topics` lists and creates owner-scoped topics, optionally scoped to an
owned subject.

`POST /api/v1/learning/topics/{topic_id}/prerequisites` creates an owner-scoped prerequisite
relation between two owned topics.

`GET /api/v1/learning/topics/{topic_id}/mastery` returns the current transparent mastery record for
an owned topic, creating an initial zero-score record when needed.

`GET/POST /api/v1/learning/resources` lists and creates owner-scoped learning resources. File-linked
resources must reference an owned file.

`GET/POST /api/v1/learning/courses`, `POST /api/v1/learning/courses/{course_id}/modules`, and
`POST /api/v1/learning/modules/{module_id}/lessons` manage owner-scoped course structure.

`POST /api/v1/learning/lessons/{lesson_id}/complete` marks an owned lesson complete, emits an
idempotent `lesson.completed` event, writes a sanitized audit log, and updates topic mastery when
the lesson is topic-linked.

`GET/POST /api/v1/learning/study-sessions` and
`PATCH /api/v1/learning/study-sessions/{session_id}/end` record study history, confidence, and notes
without increasing mastery from elapsed time alone.

`GET/POST /api/v1/learning/quizzes`, `POST /api/v1/learning/quizzes/{quiz_id}/questions`, and
`POST /api/v1/learning/quizzes/{quiz_id}/attempts` manage quizzes, questions, and completed
attempts. Attempts emit idempotent `quiz.completed` events and update mastery from answer accuracy,
confidence, and hint signals.

`GET/POST /api/v1/learning/flashcards` and `POST /api/v1/learning/flashcards/{flashcard_id}/reviews`
manage flashcards and reviews. Reviews update mastery when the flashcard is topic-linked.

`GET/POST /api/v1/learning/goals` and `GET/POST /api/v1/learning/roadmaps` manage non-visual
learning goals and study roadmaps for later analytics, reminders, and AI-assisted planning.

## Project Routes

`GET/POST /api/v1/projects` lists and creates owner-scoped projects. Listing is paginated and can
include archived projects only when explicitly requested.

`GET/PATCH /api/v1/projects/{project_id}` returns project detail with child records or updates
project metadata and status. Completing a project emits an idempotent `project.completed` domain
event.

`POST /api/v1/projects/{project_id}/archive` archives an owned project without deleting its history.

`POST /api/v1/projects/{project_id}/milestones` and
`PATCH /api/v1/projects/milestones/{milestone_id}` manage owner-scoped milestones.

`POST /api/v1/projects/{project_id}/tasks` and `PATCH /api/v1/projects/tasks/{task_id}` manage
owner-scoped project tasks.

`POST /api/v1/projects/{project_id}/notes`, `POST /api/v1/projects/{project_id}/links`, and
`POST /api/v1/projects/{project_id}/technologies` attach explicit project context.

`POST /api/v1/projects/{project_id}/files` links only owned active Personal Vault files.

`POST /api/v1/projects/{project_id}/topics` links only owned active learning topics.

`POST /api/v1/projects/{project_id}/blockers` and `PATCH /api/v1/projects/blockers/{blocker_id}`
track open and resolved project blockers.

`GET /api/v1/projects/{project_id}/activity` returns paginated owner-scoped project activity.

## Analytics Routes

`GET /api/v1/analytics/summary` returns read-only owner-scoped progress analytics for `week`,
`month`, `quarter`, or `year`. Metrics are derived from stored study sessions, completed lessons,
quiz attempts, mastery records, habit logs, processed files, AI usage records, and project tasks.
Signals that are not implemented yet, such as file-open tracking or coding sessions, are returned
with `available: false` rather than fabricated zero values.

## Achievement Routes

`GET /api/v1/achievements` lists seeded achievement definitions with the authenticated user's
progress counts, target counts, unlock status, reward metadata, and future world-unlock records.

`GET /api/v1/achievements/summary` returns total/unlocked/locked achievement counts, descriptive
points, recent unlocks, and non-visual world-unlock identifiers.

`POST /api/v1/achievements/process` consumes the authenticated user's unprocessed domain events
against active achievement rules. Processed event/rule pairs are recorded idempotently so retries do
not double-count or double-award achievements.

## Coding Workspace Routes

`GET/POST /api/v1/coding/snippets` lists and creates owner-scoped saved code snippets with bounded
pagination. Snippets may optionally link to an owned active project or Personal Vault file.

`GET/PATCH /api/v1/coding/snippets/{snippet_id}` reads and updates only the authenticated user's
snippet. Cross-user IDs return `not_found`.

`POST /api/v1/coding/snippets/{snippet_id}/archive` archives an owned snippet without deleting
associated attempts or assistant-request history.

`GET/POST /api/v1/coding/exercises` lists and creates owner-scoped coding exercises. Exercises may
link to an owned learning topic or project. This route stores prompts and starter code only; it does
not run code.

`POST /api/v1/coding/exercises/{exercise_id}/attempts` records a submitted answer for an owned
exercise and optional owned snippet. Attempts are submission records, not execution results.

`GET /api/v1/coding/assistant/requests` lists metadata and responses for the authenticated user's
coding assistant requests.

`POST /api/v1/coding/assistant/explain` and `POST /api/v1/coding/assistant/review` send bounded code
context to the provider-neutral AI gateway for the `coding_assistant` feature. Project context is
included only when the payload requests it and AI project-data consent allows it. Usage records stay
metadata-only.

`GET /api/v1/coding/runner/status` returns the current code-runner capability. The Phase 15 provider
is intentionally `unavailable`; Aetherium does not execute arbitrary code in the API, worker,
database, or web containers.

## Knowledge Graph Routes

`GET/POST /api/v1/knowledge/nodes` lists and creates owner-scoped graph nodes. Source-backed nodes
are synchronized from approved Aetherium records; manual creation is limited to skill nodes in this
phase.

`GET/POST /api/v1/knowledge/relationships` lists and creates owner-scoped graph relationships. The
service verifies that source and target nodes both belong to the authenticated user before creating
an edge.

`POST /api/v1/knowledge/sync` idempotently synchronizes approved source records such as topics,
files, lessons, projects, questions, and achievements into graph nodes and relationships.

`GET /api/v1/knowledge/topics/{topic_id}/related` returns bounded related-topic context for an owned
learning topic.

`GET /api/v1/knowledge/topics/{topic_id}/prerequisites` returns prerequisite topic nodes for an
owned learning topic.

`GET /api/v1/knowledge/recommendations` returns transparent review recommendations based on current
mastery and stale review timestamps. It does not claim scientific certainty.

`GET /api/v1/knowledge/summary` returns owner-scoped graph counts and weak/stale topic counts for
Command Mode UI panels.

## Generated Client

The first scaffold uses hand-authored shared types and Zod schemas. Once the API surface is broader,
the project should either generate a typed client from OpenAPI or keep a contract-tested manual
client.
