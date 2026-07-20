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
- Background extraction sandboxing for PDFs, DOCX, images, and source files.
- Account deletion and data export.
- Authorization tests for every critical user-owned endpoint.
