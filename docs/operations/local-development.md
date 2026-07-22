# Local Development

Aetherium local development is isolated by default. Docker Compose uses the `aetherium` project
name, Aetherium-prefixed service names, explicit container names, a dedicated network, and
Aetherium-prefixed volumes.

## Resources

| Resource                     | Local name                     |
| ---------------------------- | ------------------------------ |
| Compose project              | `aetherium`                    |
| Network                      | `aetherium_internal`           |
| API service/container        | `aetherium-api`                |
| Worker service/container     | `aetherium-worker`             |
| Web service/container        | `aetherium-web`                |
| PostgreSQL service/container | `aetherium-postgres`           |
| Redis service/container      | `aetherium-redis`              |
| MinIO service/container      | `aetherium-minio`              |
| MinIO bucket init container  | `aetherium-minio-init`         |
| PostgreSQL volume            | `aetherium_postgres_data`      |
| Redis volume                 | `aetherium_redis_data`         |
| MinIO volume                 | `aetherium_minio_data`         |
| Web dependency volume        | `aetherium_web_node_modules`   |
| Web build volume             | `aetherium_web_next`           |
| Development database         | `aetherium_app_dev`            |
| Development database role    | `aetherium_app`                |
| Private files bucket         | `aetherium-private-files-dev`  |
| Derived assets bucket        | `aetherium-derived-assets-dev` |
| User avatars bucket          | `aetherium-user-avatars-dev`   |
| Redis key prefix             | `aetherium:`                   |
| File ingestion queue         | `aetherium:file-ingestion`     |

## Startup

1. Copy `.env.example` to `.env`.
2. Fill local-only values, or rely on the Docker Compose development defaults where acceptable.
3. Run:

   ```powershell
   docker compose up --build
   ```

The API and worker read `AETHERIUM_DATABASE_URL` and `AETHERIUM_REDIS_URL`. Docker Compose sets
those values for local containers so they point at `aetherium-postgres` and `aetherium-redis` on the
private Compose network.

Docker Compose also creates Aetherium-specific MinIO buckets for private originals, derived assets,
and future user avatars. Browser presigned uploads use `AETHERIUM_MINIO_CORS_ORIGINS`, which
defaults to local web origins.

`aetherium-worker` polls durable PostgreSQL processing jobs and reads originals from the local MinIO
bucket. File chunks are stored in PostgreSQL; embeddings are skipped by default until a later
semantic-search slice explicitly wires ingestion to the AI gateway with user consent.

Command Palette search uses the local PostgreSQL database only. It can search the signed-in user's
file metadata, extracted chunks, collections, and tags after ingestion has produced chunks. Recent
searches are stored as Aetherium-owned user metadata in PostgreSQL.

The AI gateway is disabled by default in local development. Tests set
`AETHERIUM_AI_PROVIDER_DEFAULT=aetherium_deterministic` to exercise gateway contracts without
external network calls. To test an external provider locally, set
`AETHERIUM_AI_EXTERNAL_CALLS_ENABLED=true`, provide only Aetherium-specific provider credentials,
and grant feature-level consent through the API.

Personal profile and privacy settings use the existing Aetherium auth/session configuration and do
not require new environment variables. Data-export and account deletion endpoints record
owner-scoped workflow requests only in local development; they do not generate archives or delete
account data.

## Authentication Defaults

Local development uses:

- Cookie name: `aetherium_session`.
- Cookie Secure flag: `false`, because local development uses HTTP.
- Cookie SameSite: `lax`.
- Allowed frontend origin: `http://localhost:3000`.
- API origin: `http://localhost:8000`.
- Private files bucket: `aetherium-private-files-dev`.
- Derived assets bucket: `aetherium-derived-assets-dev`.
- User avatars bucket: `aetherium-user-avatars-dev`.
- File ingestion queue name: `aetherium:file-ingestion`.
- Worker poll interval: `5` seconds.
- AI provider default: disabled unless explicitly configured.
- External AI calls: disabled unless explicitly configured and consented.

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
