# Deployment Boundaries

Aetherium production deployments must use independent infrastructure. Docker Compose is only the
local development contract.

## Required Production Separation

Production must provide Aetherium-owned or Aetherium-dedicated resources for:

- PostgreSQL database and role.
- Redis instance or isolated logical database with the `aetherium:` key namespace.
- Object-storage buckets with an `aetherium` prefix for private originals, derived assets, and user
  avatars.
- API runtime.
- Web runtime.
- Background workers, including file-ingestion workers.
- PostgreSQL full-text search indexes and future Aetherium-owned embedding storage.
- AI-provider credentials and model configuration.
- Session signing, encryption, and future token secrets.
- Logging, monitoring, alerting, backup, and restore configuration.
- Domain names and TLS certificates.

## Environment Policy

Production must use `AETHERIUM_` and `NEXT_PUBLIC_AETHERIUM_` environment variables. It must not
supply generic shared variables for database, Redis, storage, session, auth, or AI configuration.

## API Boundary

The public backend namespace is `/api/v1`. Aetherium must not proxy or depend on another private
product API for core product data.

## Authentication Boundary

Authentication is implemented as an Aetherium-owned email/password and server-side session system.
It uses Aetherium users, sessions, cookies, signing secrets, revocation state, and audit events.
Cross-product single sign-on remains out of scope unless a future ADR explicitly changes this
decision.

## Cookie Policy

Production must use:

- A non-default `AETHERIUM_SESSION_SIGNING_SECRET`.
- Secure session cookies.
- Explicit `AETHERIUM_CORS_ORIGINS` matching deployed frontend origins.
- An environment-appropriate `AETHERIUM_SESSION_COOKIE_DOMAIN` when API and web run on sibling
  subdomains.

## Deployment Review Checklist

Before deploying a new environment, verify:

- Database host, database name, role, and password are Aetherium-specific.
- Redis endpoint and key prefix are Aetherium-specific.
- Object bucket names start with `aetherium` and are not shared with another product.
- Presigned upload and download URL lifetimes are explicitly configured.
- Production enables `AETHERIUM_FILE_VAULT_VERIFY_UPLOADS`.
- File-ingestion workers use Aetherium database, Redis namespace, and object-storage credentials
  only.
- `AETHERIUM_FILE_INGESTION_QUEUE_NAME` starts with `aetherium:`.
- Embedding generation remains disabled unless semantic search explicitly wires the AI gateway into
  ingestion for that environment with feature-level user consent.
- External AI calls remain disabled unless `AETHERIUM_AI_EXTERNAL_CALLS_ENABLED=true` and the target
  feature has user consent. Production must not use the deterministic test/local provider.
- AI usage records must remain metadata-only and must not store raw prompts, raw responses, provider
  keys, session cookies, or full private documents.
- Global search uses only Aetherium-owned PostgreSQL records and must not federate into another
  product index or API.
- File-parser dependencies and worker resource limits are reviewed before processing untrusted
  production documents at scale.
- Session cookie name includes `aetherium` and is not generic.
- Session signing secret is not the development default.
- AI-provider credentials are configured specifically for Aetherium.
- Logs and metrics have an Aetherium namespace.
- API request IDs and structured logs are enabled, and external observability systems scrub
  passwords, cookies, session tokens, raw prompts, private file bodies, provider secrets, and object
  keys.
- API security headers are enabled. Production should also set web-runtime CSP at the hosting or
  Next.js layer.
- CI keeps `pnpm independence:check` and `pnpm world:check` enabled until the visual 3D phase is
  explicitly opened by a future ADR.
- Backups and restore targets are separate from other products.
