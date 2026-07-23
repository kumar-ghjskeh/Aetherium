# Environments

Each Aetherium environment must be independent.

## Development

Purpose:

- Local development and automated tests.
- Disposable data.
- Local Docker Compose with Aetherium-prefixed services and volumes.

Allowed:

- Non-Secure cookies over local HTTP.
- Development-only MinIO credentials.
- Disabled external AI provider calls by default.
- Deterministic AI provider in tests only.

Not allowed:

- Production user data.
- Production secrets.
- Shared private-product databases, buckets, Redis namespaces, cookies, or APIs.

## Staging

Purpose:

- Production-like validation before release.
- Migration tests.
- Restore drills.
- Security, accessibility, performance, and smoke testing.

Required:

- Separate PostgreSQL database and role.
- Separate Redis instance or isolated logical database with `aetherium:` keys.
- Separate object-storage buckets, such as `aetherium-staging-private-files`.
- Separate session signing and encryption secrets.
- Separate AI-provider keys or disabled external AI calls.
- Separate logs, metrics, backups, and error tracking.
- Staging web and API domains with TLS.

Staging must never point at production data stores or production object buckets.

## Production

Purpose:

- Real user data and service operation.

Required:

- Production-only PostgreSQL, Redis, buckets, secrets, API domains, web domains, AI-provider
  credentials, logs, monitoring, backups, and restore targets.
- Secure cookies.
- Narrow `AETHERIUM_CORS_ORIGINS`.
- `AETHERIUM_FILE_VAULT_VERIFY_UPLOADS=true`.
- Non-default `AETHERIUM_SESSION_SIGNING_SECRET`.
- External AI disabled unless explicitly configured and user consent exists.
- Scheduled backups and tested restore procedure.
- Dependency, security, and migration review before release.

Production must not use Docker Compose as the orchestration contract.
