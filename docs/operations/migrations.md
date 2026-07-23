# Migration Procedure

Aetherium uses Alembic under `apps/api/alembic`.

## Pre-Migration Checklist

- Confirm the target environment and database name.
- Confirm `AETHERIUM_DATABASE_URL` points to the intended Aetherium database.
- Confirm no other private product shares the database or schema.
- Confirm the commit has passed `pnpm run ci`.
- Confirm a current backup or point-in-time recovery point exists.
- Review new migration scripts for destructive operations, long locks, unbounded data rewrites, and
  owner-scope changes.
- Run migrations in staging first.

## Commands

Generate SQL for review:

```powershell
py -3 -m alembic -c apps/api/alembic.ini upgrade head --sql
```

Apply migrations:

```powershell
py -3 -m alembic -c apps/api/alembic.ini upgrade head
```

Show current revision:

```powershell
py -3 -m alembic -c apps/api/alembic.ini current
```

On Unix-like systems, replace `py -3 -m` with `python -m`.

## Rollback Planning

Every release must document:

- Previous revision.
- Target revision.
- Whether downgrade is safe.
- Whether rollback requires restoring from backup.
- Expected lock duration and tables touched.
- Data compatibility between old and new API/worker versions.

Do not run destructive production migrations without an explicit backup-restore rollback plan.
