# Security Threat Model

## Assets

- User accounts and sessions.
- Password hashes.
- Session signing secrets.
- Uploaded files and extracted text.
- AI conversations and prompts.
- Habit, goal, project, and learning records.
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
| XSS from rendered user content            | Sanitize rendered documents and use CSP/security headers in later UI slices.                  |
| Malicious uploads                         | Validate type and size; use a malware scanning integration point before later parsing.        |
| Object-key disclosure                     | Use server-generated object keys and return only expiring presigned URLs to owners.           |
| AI data leakage                           | Require consent controls and provider-scoped policies.                                        |
| Prompt injection from retrieved files     | Source-bounded document-QA prompts, no automatic mutation tools, and citation validation.     |
| Fabricated citations                      | Return citations only for retrieved owner-scoped chunks and no-evidence responses when empty. |
| Habit privacy leakage                     | Owner-scoped habit tables, not-found cross-user behavior, and no external sharing by default. |
| Learning privacy leakage                  | Owner-scoped learning tables, not-found cross-user behavior, and no AI sharing by default.    |
| Project privacy leakage                   | Owner-scoped project tables, not-found cross-user behavior, and no AI sharing by default.     |
| Insecure code execution                   | Use mock code runner first; require isolated sandbox before real execution.                   |
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
- Preferences, world profile, domain events, notifications, and audit logs require authentication.
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
- CI runs independence checks, formatting, linting, type checks, tests, build, and migration smoke
  validation.

## Future Required Controls

- Email verification delivery.
- Password reset.
- Optional MFA.
- Persistent distributed rate limiting for horizontally scaled production.
- Audit-log retention policy.
- Security headers and CSP.
- Dependency vulnerability scanning.
- Actual malware scanning service and quarantine workflow.
- Background extraction sandboxing and resource limits for PDFs, DOCX, images, and source files.
- Malware-scanning execution before or during ingestion.
- Deeper semantic-search prompt-injection review before global semantic ranking or mentor tools use
  retrieved chunks automatically.
- Production validation of provider-specific request mappings before broad external-provider use.
- Account deletion and data export.
- Authorization tests for every critical user-owned endpoint.
