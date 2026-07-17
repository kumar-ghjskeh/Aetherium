# ADR 0003: Aetherium Is A Standalone Product

## Status

Accepted

## Context

Aetherium must be independent from all other private applications. It needs its own repository, data
stores, credentials, sessions, storage buckets, workers, AI configuration, deployment resources,
logs, monitoring, backups, and user records.

## Decision

Aetherium is intentionally standalone. It may use normal third-party open-source dependencies, but
it must not import from, connect to, reuse, or assume any other private product or private
deployment infrastructure.

The project will use:

- Aetherium-specific environment variables.
- Aetherium-prefixed Docker Compose resources.
- Aetherium-owned PostgreSQL, Redis, object storage, and Alembic history.
- The `aetherium:` Redis key prefix.
- Product-specific session cookie names such as `aetherium_session` when authentication is
  implemented.
- Automated independence checks in CI.

## Consequences

- Local development resources are less likely to collide with generic development containers,
  volumes, networks, databases, or buckets.
- Production deployments must provision separate credentials and infrastructure for Aetherium.
- Future shared infrastructure or cross-product authentication would require a new ADR and security
  review.
- CI now fails when known prohibited references or generic resource names are reintroduced.
