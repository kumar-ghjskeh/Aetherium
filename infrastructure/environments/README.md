# Aetherium Environment Notes

This directory documents deployment-environment boundaries. It intentionally contains no real
secrets, provider credentials, Terraform state, kubeconfig files, or cloud account identifiers.

## Development

- Local Docker Compose project: `aetherium`.
- Local services: `aetherium-postgres`, `aetherium-redis`, `aetherium-minio`, `aetherium-api`,
  `aetherium-worker`, and `aetherium-web`.
- Local buckets: `aetherium-private-files-dev`, `aetherium-derived-assets-dev`,
  `aetherium-user-avatars-dev`.

## Staging

Staging must use production-like but separate resources:

- Aetherium staging database and role.
- Aetherium staging Redis namespace.
- Aetherium staging object buckets.
- Staging-only secrets.
- Staging-only web and API domains.
- Staging-only AI-provider credentials or disabled external AI calls.
- Staging-only logs, metrics, and backups.

## Production

Production must use dedicated Aetherium resources:

- Production database and role.
- Production Redis instance or isolated logical database.
- Production object buckets.
- Production session, signing, and future encryption secrets.
- Production web and API domains with TLS.
- Production AI-provider credentials.
- Production backup and restore targets.
- Production logs, metrics, alerting, and error tracking.

Provider-specific infrastructure code can be added here only after a future ADR selects a hosting
approach and documents secret management, networking, rollback, and backup behavior.
