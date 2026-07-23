# Deployment Preparation

Aetherium is prepared for deployment but is not automatically deployed by this repository.

## Runtime Units

Deploy these units separately:

- Web runtime for the Next.js application.
- API runtime for FastAPI under `/api/v1`.
- Worker runtime for background file ingestion and future scheduled workflows.
- PostgreSQL with pgvector enabled.
- Redis with the `aetherium:` key namespace.
- S3-compatible object storage with Aetherium-prefixed private buckets.
- Observability, logging, alerting, backup, and restore systems.

## Required Environments

- `development`: local Docker Compose or developer-owned services.
- `staging`: production-like, isolated Aetherium infrastructure for migrations, restore drills,
  security review, and acceptance testing.
- `production`: customer/user data environment with separate secrets, credentials, buckets,
  database, Redis, logs, monitoring, backups, and domains.

## Deployment Rules

- Do not deploy from a dirty working tree.
- Do not deploy a commit that has not passed `pnpm run ci`.
- Do not deploy a migration without a backup and rollback plan.
- Do not reuse local development secrets in staging or production.
- Do not share database roles, Redis keys, object buckets, AI-provider keys, cookies, or logging
  sinks with another private product.
- Do not enable external AI calls unless the environment and user consent policies both allow them.
- Do not enable a real code runner until a separately isolated sandbox has been reviewed.
- Do not add visual 3D dependencies or assets before the visual World Mode phase.

## Release Order

1. Build immutable web, API, and worker artifacts from the same commit.
2. Run CI, deployment-readiness, independence, and visual-world deferral checks.
3. Confirm staging backups and run migrations in staging.
4. Run staging smoke tests for health, auth, protected APIs, file upload contracts, ingestion jobs,
   search, AI disabled/consent behavior, and Command Mode build.
5. Capture production backup or verify point-in-time recovery before migration.
6. Run production migrations.
7. Deploy API and worker artifacts.
8. Deploy web artifact with matching `NEXT_PUBLIC_AETHERIUM_API_BASE_URL`.
9. Verify health, readiness, observability, logs, and critical authenticated flows.
10. Keep rollback artifacts available until post-release checks pass.

## No Automatic Deployment

The repository includes `.github/workflows/deployment-readiness.yml`, but that workflow validates
deployment boundaries only. It does not provision infrastructure, publish images, change DNS, run
production migrations, or deploy services.
