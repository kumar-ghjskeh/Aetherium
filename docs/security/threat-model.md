# Security Threat Model

## Assets

- User accounts and sessions.
- Password hashes.
- Session signing secrets.
- Uploaded files and extracted text.
- AI conversations and prompts.
- Habit, goal, project, and learning records.
- Personal profile metadata, privacy settings, certificates, favorite resources, data-export
  requests, and account deletion request records.
- Code snippets, coding exercises, submitted attempts, and coding assistant requests.
- Notification preferences, workflow records, and monthly review notes.
- Search indexes and embeddings.
- Object storage credentials.
- AI provider credentials.
- Audit logs.

## Trust Boundaries

- Browser to Next.js.
- Browser to FastAPI.
- FastAPI to PostgreSQL, Redis, and object storage.
- FastAPI or worker to AI providers.
- Worker to file parsers and future code execution sandboxes.

## Initial Risks

| Risk                                      | Mitigation                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Unauthenticated access to private records | Reusable current-user dependency and authorization tests before user-owned endpoints.         |
| Password compromise                       | Argon2id hashes; no plaintext password storage; password policy validation.                   |
| Session token database exposure           | Store only HMAC-SHA256 token hashes; raw token only in HttpOnly cookie.                       |
| Session fixation or stale sessions        | New session on login/register; expiration and revocation support.                             |
| CSRF against cookie-auth endpoints        | Allowed-origin validation on state-changing auth routes; SameSite=Lax cookies.                |
| Credential stuffing                       | Aetherium-owned rate-limit abstraction on registration and login.                             |
| Email enumeration                         | Login uses one generic invalid-credential response for nonexistent users and wrong passwords. |
| SQL injection                             | Use SQLAlchemy expressions and parameterized queries.                                         |
| XSS from rendered user content            | Sanitize rendered documents and apply default API security headers and CSP.                   |
| Malicious uploads                         | Validate type and size; use a malware scanning integration point before later parsing.        |
| Object-key disclosure                     | Use server-generated object keys and return only expiring presigned URLs to owners.           |
| AI data leakage                           | Require consent controls and provider-scoped policies.                                        |
| Prompt injection from retrieved files     | Source-bounded document-QA prompts, no automatic mutation tools, and citation validation.     |
| Fabricated citations                      | Return citations only for retrieved owner-scoped chunks and no-evidence responses when empty. |
| Habit privacy leakage                     | Owner-scoped habit tables, not-found cross-user behavior, and no external sharing by default. |
| Learning privacy leakage                  | Owner-scoped learning tables, not-found cross-user behavior, and no AI sharing by default.    |
| Project privacy leakage                   | Owner-scoped project tables, not-found cross-user behavior, and no AI sharing by default.     |
| Analytics inference leakage               | Owner-scoped aggregation queries and unavailable flags instead of invented unsupported data.  |
| Achievement replay or double awards       | Unique processed event/rule rows and unique owner/achievement constraints.                    |
| Profile privacy leakage                   | Owner-scoped profile tables, conservative visibility defaults, and owned file references.     |
| Unsafe data deletion                      | Deletion requests are metadata-only until a reviewed execution workflow exists.               |
| Export leakage                            | Export requests are owner-scoped records; generation/download is deferred to a hardened flow. |
| Notification workflow spam or leakage     | Owner-scoped generation, category preferences, idempotent records, and no external delivery.  |
| Insecure code execution                   | Use mock code runner first; require isolated sandbox before real execution.                   |
| Code sent to AI without consent           | Route coding assistant through feature consent and avoid automatic project context.           |
| Secret leakage                            | Keep secrets out of source and logs.                                                          |
| Cross-tenant data access                  | Include tenant/owner scoping in schema and data-access tests.                                 |
| Sensitive audit-log data                  | Sanitize audit metadata before persistence and avoid raw secrets or tokens.                   |

## Current Controls

- No secrets are committed.
- `.env.example` contains variable names only.
- Authentication is standalone and uses Aetherium-owned users, sessions, cookies, secrets, and
  database tables.
- Session cookie is HttpOnly, product-specific, SameSite=Lax, and Secure in production.
- Login and registration are rate limited.
- Security-relevant auth events are logged without passwords, raw session tokens, cookies, or full
  request bodies.
- User-owned foundation tables are scoped by `owner_user_id`.
- Preferences, world profile, world-location contract APIs, domain events, notifications, and audit
  logs require authentication.
- World-location APIs expose only registry metadata and authenticated profile-derived state. They do
  not expose private file contents, AI prompts, object keys, or visual assets.
- Notification mutation and list routes filter by owner.
- Domain events are idempotent per user and idempotency key.
- Persistent audit logs sanitize metadata before storage.
- Personal Vault tables are scoped by `owner_user_id` and route through owner-checked services.
- Upload initiation validates file name, extension, MIME type, declared size, and idempotency key.
- Original files are stored in Aetherium-owned private object buckets through server-generated keys.
- Download access uses short-lived presigned URLs and never exposes object keys in normal file
  responses.
- File organization metadata, favorites, soft deletion, restoration, and permanent deletion are
  owner-scoped.
- Permanent deletion requires an existing soft-deleted record and removes known stored object
  versions before deleting the file metadata.
- Malware scanning is modeled as a status and integration point; no scanner is active in this slice.
- Upload completion queues owner-scoped file-processing jobs without parsing files in the request.
- The worker reads originals through Aetherium-owned object storage and records bounded processing
  failures without logging raw document bodies.
- Extracted chunks include `owner_user_id` and remain in Aetherium PostgreSQL; they are not sent to
  AI providers in this slice.
- Processing retries are owner-scoped and limited by configured attempts.
- Embedding jobs are skipped by default until a semantic-search slice wires them to the AI gateway
  with explicit consent controls.
- Global search is owner-scoped across files, chunks, collections, tags, AI conversation titles,
  habit metadata, learning topic metadata, project metadata, project task metadata, and recent
  searches.
- Search snippets are plain text and must not be rendered as trusted HTML.
- Recent searches store only the authenticated user's query, filters, and result count; they do not
  grant access to results.
- The AI gateway uses Aetherium-owned provider configuration, consent policies, model
  configurations, and usage records.
- External AI calls are disabled unless `AETHERIUM_AI_EXTERNAL_CALLS_ENABLED` and feature-level user
  consent both allow them.
- AI consent policies default to no external-provider access and no automatic access to files,
  collections, conversations, projects, learning records, habit data, or profile data.
- AI usage records store metadata, token counts, cost estimates, latency, fallback state, and
  bounded errors, but not raw prompts, raw responses, provider secrets, cookies, or session tokens.
- Gateway calls are rate limited through the Aetherium namespace and normalize provider errors.
- AI mentors, mentor permissions, conversations, messages, memory settings, and message sources are
  owner-scoped and protected by reusable authentication dependencies.
- Default mentors are fictional and copied into each user's own rows; no shared private mentor state
  is mutable across tenants.
- Mentor chat uses bounded conversation history and does not automatically attach uploaded files,
  projects, habits, learning records, profile data, or citations.
- Conversation memory can only be enabled when the user's global AI memory preference allows it.
- Conversation exports are owner-scoped and return only the authenticated user's messages and stored
  sources.
- Stop-generation currently reports an honest conflict when no active generation exists instead of
  displaying a false success state.
- Document Q&A requires explicit `document_qa` file-content consent before sending retrieved chunks
  to the AI gateway.
- Document Q&A validates optional file and collection filters against the authenticated owner and
  can restrict retrieval to consent-approved collections.
- Document Q&A retrieves only active ready chunks, strips invalid inline source labels from model
  output, and returns citation objects only for retrieved chunks.
- If no source chunks support the question, Document Q&A returns `insufficient_evidence` without
  calling a model or fabricating sources.
- Habit records, schedules, targets, logs, streaks, daily check-ins, and weekly reviews are scoped
  by `owner_user_id`.
- Habit logging writes idempotent `habit.logged` domain events and sanitized audit logs without
  storing secrets or authentication material.
- Habit summaries and the non-visual Habit Garden signal are derived only from stored habit logs and
  schedules; no fake analytics are displayed.
- Mood and energy check-in fields are optional personal context fields and are not positioned as
  diagnosis or treatment data.
- Active habit metadata is searchable only inside the authenticated user's own search scope.
- Learning subjects, topics, resources, courses, lessons, study sessions, quizzes, questions,
  attempts, flashcards, goals, roadmaps, and mastery records are scoped by `owner_user_id`.
- Learning services treat cross-user identifiers as `not_found` and preserve owner scope through
  prerequisites, course/module/lesson creation, quiz attempts, flashcard reviews, goals, and
  roadmaps.
- Lesson completion and quiz attempts write idempotent domain events and sanitized audit logs
  without storing secrets, cookies, raw session tokens, or provider credentials.
- Mastery records explain the stored signals behind the score and do not claim diagnostic accuracy.
- Active learning-topic metadata is searchable only inside the authenticated user's own search
  scope.
- Project records, milestones, tasks, notes, links, file links, topic links, technologies, blockers,
  and activity rows are scoped by `owner_user_id`.
- Project services treat cross-user project and child identifiers as `not_found` and validate owned
  active files and topics before creating project links.
- Project completion writes an idempotent `project.completed` domain event and sanitized audit logs.
- Project activity metadata is sanitized and must not include secrets, cookies, raw session tokens,
  provider credentials, or private file bodies.
- Active project and project-task metadata is searchable only inside the authenticated user's own
  search scope.
- Project-specific AI assistance is not a mutation tool in this slice; future AI actions must use
  explicit consent and user approval before sending or changing project data.
- Progress analytics require authentication and aggregate only the authenticated user's existing
  owner-scoped learning, habit, file, AI usage, and project records.
- Analytics responses mark unsupported signals as unavailable and do not create or display
  fabricated product activity.
- Analytics output is read-only and does not expose raw file bodies, raw prompts, provider secrets,
  cookies, session tokens, or object-storage keys.
- Achievement processing consumes only the authenticated user's domain events and records processed
  owner/event/rule pairs to prevent replay double-counting.
- User achievements, progress counters, and world-unlock records include owner scope and never grant
  access to core private data.
- Future world unlocks are stored as identifiers only; no 3D assets, scene state, or visual rewards
  are loaded in this slice.
- Personal profile metadata, profile links, favorite projects/resources, certificates, privacy
  settings, data-export requests, and account deletion requests are scoped by `owner_user_id`.
- Profile avatar file references must point to active image files owned by the authenticated user.
- Profile favorites validate owned project, file, and learning-resource references before records
  are created.
- Profile privacy defaults to private and does not make profiles public. The current visibility
  options are metadata for later presentation surfaces.
- AI memory and product analytics settings remain in `user_preferences`, and the privacy API updates
  that single source of truth.
- Data-export request endpoints are idempotent per owner and record notifications, but do not
  generate downloadable archives yet.
- Account deletion request endpoints require the exact confirmation phrase and are idempotent per
  owner, but do not delete data in this slice.
- Profile, privacy, export, and deletion request audit logs use sanitized metadata and do not store
  passwords, raw session tokens, cookies, private file bodies, provider credentials, or full
  prompts.
- Coding snippets, exercises, attempts, and assistant requests are scoped by `owner_user_id`.
- Coding services validate owned project, file, topic, exercise, and snippet references before
  writes.
- The Phase 15 code runner is intentionally unavailable. Aetherium does not execute arbitrary user
  code inside the FastAPI service, worker service, PostgreSQL container, or web container.
- Coding assistant explain/review routes use the provider-neutral AI gateway and the
  `coding_assistant` feature. Project context is included only when explicitly requested and allowed
  by AI consent.
- Coding audit logs store action metadata such as language, lengths, and entity IDs; they do not
  store raw code, provider credentials, cookies, session tokens, or secrets.
- Knowledge graph nodes and relationships are scoped by `owner_user_id`.
- Knowledge graph services verify owned source and target nodes before creating relationships.
- Knowledge graph metadata stores approved descriptors and source links only; it must not store raw
  private document text, authentication material, provider secrets, or full sensitive prompts.
- Review recommendations are derived from transparent mastery and review timestamps and must not be
  presented as clinical, medical, or scientifically guaranteed outcomes.
- Notification workflow preferences, workflow records, and monthly reviews are scoped by
  `owner_user_id`.
- Workflow generation derives candidates only from the authenticated user's existing Aetherium
  records and stores idempotent owner/workflow/source rows to prevent duplicate notification spam.
- Workflow-generated notifications are in-app only in this slice. No email, push, SMS, external
  webhook, or third-party notification provider receives user data.
- Bulk notification read state affects only the authenticated user's notifications.
- CI runs independence checks, formatting, linting, type checks, tests, build, and migration smoke
  validation.
- API responses include request IDs, process-time headers, and default security headers.
- API access logs are JSON-formatted under an Aetherium namespace and exclude request bodies,
  cookies, session tokens, raw prompts, private file bodies, object keys, and provider secrets.
- `/api/v1/health/observability` exposes non-sensitive hardening status only.
- CI runs `pnpm world:check` to keep visual 3D dependencies and visual-world assets out of the
  repository until the approved visual phase.
- World Mode route intents are validated against registered Aetherium location IDs and supported
  travel modes before they reach the runtime.
- Exact player position and facing are non-sensitive presentation state stored only in expiring,
  tab-scoped `sessionStorage`; authentication material, private content, and API responses are not
  persisted there.
- Backend world APIs remain the sole authority for owner scope, unlocks, visited locations, and
  durable current-location state. Client manifests and stored coordinates never grant access.

## Future Required Controls

- Email verification delivery.
- Password reset.
- Optional MFA.
- Persistent distributed rate limiting for horizontally scaled production.
- Audit-log retention policy.
- Dependency vulnerability scanning.
- Actual malware scanning service and quarantine workflow.
- Background extraction sandboxing and resource limits for PDFs, DOCX, images, and source files.
- Malware-scanning execution before or during ingestion.
- Deeper semantic-search prompt-injection review before global semantic ranking or mentor tools use
  retrieved chunks automatically.
- Production validation of provider-specific request mappings before broad external-provider use.
- Account deletion execution workflow with confirmation, retention windows, backup interaction, and
  irreversible deletion review.
- Data-export generation, encryption, expiration, and download authorization.
- Authorization tests for every critical user-owned endpoint.
- Production-grade sandboxed code execution before any real runner is enabled, including CPU,
  memory, timeout, network, filesystem, output, language, dependency, and secret-isolation controls.
