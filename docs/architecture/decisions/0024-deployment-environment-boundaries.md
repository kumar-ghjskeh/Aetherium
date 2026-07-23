# ADR 0024 - Deployment Environment Boundaries

## Status

Accepted.

## Context

Aetherium now has enough non-visual product surface to prepare deployment operations. The product
must remain standalone and must not share private infrastructure with other products. Deployment
preparation must define environment separation without committing provider-specific secrets or
performing an automatic deployment.

## Decision

- Maintain separate `development`, `staging`, and `production` environments.
- Require each environment to provide independent Aetherium-owned PostgreSQL, Redis, object-storage
  buckets, secrets, AI-provider configuration, API URL, web URL, cookie settings, worker runtime,
  observability configuration, and backup targets.
- Treat Docker Compose as local development only.
- Use GitHub Actions for validation. The deployment-readiness workflow performs no deployment and
  exists only to validate documentation and boundaries.
- Keep deployment provider choice open. A future ADR must document provider-specific hosting,
  network, secret-management, and rollback details before production deployment.
- Run database migrations as an explicit release step with backup and rollback planning.

## Consequences

- Aetherium can be deployed to any suitable provider without coupling the repository to one private
  platform too early.
- Environment variables remain Aetherium-specific and provider-neutral.
- Production readiness requires an operator to supply real infrastructure, secrets, DNS, TLS,
  monitoring, backups, and restore drills outside source control.
- Visual World Mode remains blocked until the next approved phase.
