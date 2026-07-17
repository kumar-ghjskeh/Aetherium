# Security Threat Model

## Assets

- User accounts and sessions.
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

| Risk                                      | Mitigation                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| Unauthenticated access to private records | Add auth and authorization tests before user-owned endpoints.                    |
| SQL injection                             | Use SQLAlchemy expressions and parameterized queries.                            |
| XSS from rendered user content            | Sanitize rendered documents and use CSP/security headers.                        |
| Malicious uploads                         | Validate type and size, isolate parsing, add malware scanning integration point. |
| AI data leakage                           | Require consent controls and provider-scoped policies.                           |
| Insecure code execution                   | Use mock code runner first; require isolated sandbox before real execution.      |
| Secret leakage                            | Keep secrets out of source and logs.                                             |
| Cross-tenant data access                  | Include tenant/owner scoping in schema and data-access tests.                    |

## Current Slice Controls

- No secrets are committed.
- `.env.example` contains variable names only.
- Health readiness does not expose database details.
- CI runs lint, type checks, tests, and migration smoke validation.

## Future Required Controls

- Secure sessions with HttpOnly cookies.
- CSRF protection where applicable.
- Rate limiting.
- Audit logs for sensitive operations.
- Account deletion and data export.
- Security headers and CSP.
- Dependency vulnerability scanning.
- Presigned object access.
- Authorization tests for every critical endpoint.
