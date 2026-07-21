# Backup And Restore

Aetherium backup and restore procedures must be isolated from other private products.

## Backup Scope

Back up these Aetherium-owned resources independently:

- PostgreSQL database and Alembic revision state.
- Authentication records in PostgreSQL, including users and hashed session-token records.
- User-owned foundation records in PostgreSQL, including preferences, world profiles, domain events,
  notifications, and sanitized audit logs.
- Personal Vault records in PostgreSQL, including files, file versions, upload records, collections,
  tags, favorites, and deletion state.
- File-ingestion records in PostgreSQL, including processing jobs, extraction results, chunks,
  embedding job placeholders, and processing failures.
- Search records in PostgreSQL, including recent-search metadata and PostgreSQL full-text search
  indexes.
- Object-storage buckets with uploaded originals, generated derivatives, future avatars, and future
  exports.
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

The `0002_auth_foundation` migration introduces the current user and session tables. Restores must
keep those tables consistent with the same Aetherium deployment secrets used to sign and hash
session tokens; rotating secrets after a restore should revoke existing sessions deliberately.

The `0003_user_owned_foundation` migration introduces user-owned preferences, non-visual world
profiles, domain events, notifications, and audit logs. Restores must preserve owner UUIDs and
domain-event idempotency keys so future achievement and progression processors do not replay
duplicates.

The `0004_file_vault` migration introduces Personal Vault metadata. Restores must keep PostgreSQL
file records and object-storage buckets consistent. If object storage is restored to a different
bucket name during disaster recovery, update Aetherium environment variables before serving
downloads and run a targeted integrity check against restored file versions.

The `0005_file_ingestion` migration introduces processing jobs, extraction results, chunks,
embedding job placeholders, and processing failures. Restores must keep chunk rows aligned with the
restored `files` records. If object storage was only partially restored, failed or stale processing
jobs should be retried after object integrity checks rather than deleting extracted chunks blindly.

The `0006_hybrid_search` migration introduces recent-search records and PostgreSQL full-text search
indexes over file metadata, file chunks, collections, and tags. Recent-search rows are user-owned
metadata and should be restored with the main database. Full-text expression indexes may be rebuilt
after restore if needed; they do not replace the underlying user-owned records.
