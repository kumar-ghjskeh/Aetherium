# Product Independence

Aetherium is a standalone product. It must not depend on another private application, another
private repository, another product database, shared private deployment infrastructure, or shared
private user data.

## Independence Boundary

Aetherium owns its own:

- GitHub repository: `kumar-ghjskeh/Aetherium`.
- PostgreSQL database, roles, credentials, and Alembic migration history.
- Redis instance or logical database plus the `aetherium:` key namespace.
- Object-storage buckets with an `aetherium` prefix for private originals, derived assets, and user
  avatars.
- MinIO development instance.
- FastAPI backend under this repository.
- API namespace under `/api/v1` for the current scaffold.
- Future authentication, session, encryption, and signing secrets.
- Background workers, including the `aetherium-worker` file-ingestion process.
- Future AI-provider configuration and consent policy.
- File-ingestion chunks plus future search indexes and embedding storage.
- Next.js web frontend.
- Domain names, deployment configuration, logs, monitoring, backups, and restore procedures.
- User records and all product data.

## Prohibited Coupling

Aetherium must not:

- Import source code from another private project.
- Reference another private repository.
- Connect to another product database.
- Reuse another product schema, cookies, sessions, Redis keys, object buckets, APIs, data, or
  deployment resources.
- Assume another product is running.
- Add cross-product single sign-on or shared private packages without a new architecture decision
  reversing this boundary.

Normal third-party open-source packages remain allowed when they are declared in this repository and
validated by CI.

## Current Audit Result

The current scaffold, Personal Vault slice, and background file-ingestion slice contain no
references to another private product, another private repository, another product database, another
product API, or another product object bucket. The audit found generic environment and Docker
resource names in the initial scaffold; those were replaced with Aetherium-specific names.

## Enforcement

`pnpm independence:check` fails on known prohibited private-product references, private repository
URLs outside `kumar-ghjskeh/Aetherium`, generic environment names in `.env.example`, and generic
Docker Compose resource names.
