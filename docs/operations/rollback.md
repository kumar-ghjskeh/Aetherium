# Rollback Procedure

Rollback depends on whether the release changed only application code or also changed data.

## Application-Only Rollback

Use when no migration has been applied and no irreversible data job has run:

1. Confirm the previous artifact tag and commit hash.
2. Redeploy previous API, worker, and web artifacts built from the same commit.
3. Verify `/api/v1/health/live`, `/api/v1/health/ready`, and `/api/v1/health/observability`.
4. Verify login, `/api/v1/auth/me`, one protected list endpoint, and the web `/app` shell.
5. Monitor errors and worker job counts.

## Migration Rollback

Use only when the migration has a reviewed downgrade path:

1. Stop workers that might write affected tables.
2. Put the API in maintenance mode if the hosting platform supports it.
3. Run the reviewed Alembic downgrade command.
4. Deploy compatible previous API, worker, and web artifacts.
5. Run health checks and owner-scoped smoke tests.
6. Resume workers after verifying schema compatibility.

## Restore-Based Rollback

Use when downgrade is unsafe or data is corrupted:

1. Stop writes.
2. Restore PostgreSQL to the selected Aetherium recovery point.
3. Restore object-storage buckets to the matching point when file/object consistency is affected.
4. Clear or isolate Redis queues if they contain jobs from the failed release.
5. Deploy compatible artifacts.
6. Verify owner-scoped data boundaries before accepting traffic.

Never restore Aetherium data into another product environment or merge another product's data into
Aetherium.
