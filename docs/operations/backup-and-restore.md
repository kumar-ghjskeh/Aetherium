# Backup And Restore

Aetherium backup and restore procedures must be isolated from other private products.

## Backup Scope

Back up these Aetherium-owned resources independently:

- PostgreSQL database and Alembic revision state.
- Object-storage buckets with uploaded originals, generated derivatives, and future exports.
- Redis only for durable queues or future state that cannot be safely reconstructed.
- Deployment configuration metadata, excluding raw secrets.
- Future audit logs required for security investigations.

## Development Backup Notes

Local Docker volumes are:

- `aetherium_postgres_data`
- `aetherium_redis_data`
- `aetherium_minio_data`

These volumes are development-only and should not be treated as production backups.

## Production Backup Requirements

Production must provide:

- Scheduled PostgreSQL logical or physical backups.
- Point-in-time recovery where supported.
- Object-storage versioning or lifecycle-managed backups.
- Separate backup credentials with least privilege.
- Restore tests in an isolated Aetherium environment.
- Documented retention periods.

## Restore Rules

Restore Aetherium data only into an Aetherium database, Aetherium object bucket, and Aetherium Redis
namespace. Do not merge data from another private product or restore Aetherium data into another
product environment.

## Alembic

Alembic history under `apps/api/alembic` belongs only to Aetherium. Do not reuse migration history
from another project or apply Aetherium migrations to another product database.
