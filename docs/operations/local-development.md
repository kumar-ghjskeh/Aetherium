# Local Development

Aetherium local development is isolated by default. Docker Compose uses the `aetherium` project
name, Aetherium-prefixed service names, explicit container names, a dedicated network, and
Aetherium-prefixed volumes.

## Resources

| Resource                     | Local name                   |
| ---------------------------- | ---------------------------- |
| Compose project              | `aetherium`                  |
| Network                      | `aetherium_internal`         |
| API service/container        | `aetherium-api`              |
| Web service/container        | `aetherium-web`              |
| PostgreSQL service/container | `aetherium-postgres`         |
| Redis service/container      | `aetherium-redis`            |
| MinIO service/container      | `aetherium-minio`            |
| MinIO bucket init container  | `aetherium-minio-init`       |
| PostgreSQL volume            | `aetherium_postgres_data`    |
| Redis volume                 | `aetherium_redis_data`       |
| MinIO volume                 | `aetherium_minio_data`       |
| Web dependency volume        | `aetherium_web_node_modules` |
| Web build volume             | `aetherium_web_next`         |
| Development database         | `aetherium_app_dev`          |
| Development database role    | `aetherium_app`              |
| Development object bucket    | `aetherium-files-dev`        |
| Redis key prefix             | `aetherium:`                 |

## Startup

1. Copy `.env.example` to `.env`.
2. Fill local-only values, or rely on the Docker Compose development defaults where acceptable.
3. Run:

   ```powershell
   docker compose up --build
   ```

The API reads `AETHERIUM_DATABASE_URL` and `AETHERIUM_REDIS_URL`. Docker Compose sets those values
for local containers so they point at `aetherium-postgres` and `aetherium-redis` on the private
Compose network.

## Authentication Defaults

Local development uses:

- Cookie name: `aetherium_session`.
- Cookie Secure flag: `false`, because local development uses HTTP.
- Cookie SameSite: `lax`.
- Allowed frontend origin: `http://localhost:3000`.
- API origin: `http://localhost:8000`.

Do not use the development session signing secret in production.

## Validation

Run:

```powershell
pnpm independence:check
pnpm run ci
```

`pnpm run ci` includes the independence check, formatting, linting, type checks, tests, and build.

## Isolation Rules

Do not point local Aetherium services at another private product database, Redis instance, object
bucket, API, or authentication system. If local ports conflict, change the `AETHERIUM_*_PORT`
variables rather than renaming services to generic names.
