# Deployment Boundaries

Aetherium production deployments must use independent infrastructure. Docker Compose is only the
local development contract.

## Required Production Separation

Production must provide Aetherium-owned or Aetherium-dedicated resources for:

- PostgreSQL database and role.
- Redis instance or isolated logical database with the `aetherium:` key namespace.
- Object-storage bucket with an `aetherium` prefix.
- API runtime.
- Web runtime.
- Background workers.
- AI-provider credentials and model configuration.
- Signing and encryption secrets.
- Logging, monitoring, alerting, backup, and restore configuration.
- Domain names and TLS certificates.

## Environment Policy

Production must use `AETHERIUM_` and `NEXT_PUBLIC_AETHERIUM_` environment variables. It must not
supply generic shared variables for database, Redis, storage, session, or AI configuration.

## API Boundary

The public backend namespace is `/api/v1`. Aetherium must not proxy or depend on another private
product API for core product data.

## Authentication Boundary

Authentication is not implemented yet. When it is added, it must create Aetherium-owned users,
sessions, cookies, secrets, revocation state, and audit records. Cross-product single sign-on is out
of scope unless a future ADR explicitly changes this decision.

## Deployment Review Checklist

Before deploying a new environment, verify:

- Database host, database name, role, and password are Aetherium-specific.
- Redis endpoint and key prefix are Aetherium-specific.
- Object bucket name starts with `aetherium`.
- Session cookie name includes `aetherium` and is not generic.
- AI-provider credentials are configured specifically for Aetherium.
- Logs and metrics have an Aetherium namespace.
- Backups and restore targets are separate from other products.
