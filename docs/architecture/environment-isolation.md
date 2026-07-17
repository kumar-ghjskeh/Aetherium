# Environment Isolation

Aetherium uses product-specific environment variables wherever practical. Production configuration
must supply separate credentials and endpoints for every Aetherium runtime dependency.

## Variable Naming

Use the `AETHERIUM_` prefix for backend, worker, storage, Redis, AI, session, logging, backup, and
deployment configuration.

Public browser variables use the `NEXT_PUBLIC_AETHERIUM_` prefix.

## Required Isolation Variables

Core runtime:

- `AETHERIUM_APP_ENV`
- `AETHERIUM_DATABASE_URL`
- `AETHERIUM_REDIS_URL`
- `AETHERIUM_REDIS_KEY_PREFIX`
- `AETHERIUM_OBJECT_STORAGE_ENDPOINT`
- `AETHERIUM_OBJECT_STORAGE_BUCKET`
- `AETHERIUM_SESSION_COOKIE_NAME`
- `AETHERIUM_SIGNING_SECRET`
- `AETHERIUM_ENCRYPTION_SECRET`
- `AETHERIUM_CORS_ORIGINS`
- `NEXT_PUBLIC_AETHERIUM_API_BASE_URL`

Development infrastructure:

- `AETHERIUM_POSTGRES_DB`
- `AETHERIUM_POSTGRES_USER`
- `AETHERIUM_POSTGRES_PASSWORD`
- `AETHERIUM_POSTGRES_PORT`
- `AETHERIUM_REDIS_PORT`
- `AETHERIUM_MINIO_ROOT_USER`
- `AETHERIUM_MINIO_ROOT_PASSWORD`
- `AETHERIUM_MINIO_API_PORT`
- `AETHERIUM_MINIO_CONSOLE_PORT`

Future provider configuration:

- `AETHERIUM_AI_PROVIDER_DEFAULT`
- `AETHERIUM_AI_OPENAI_API_KEY`
- `AETHERIUM_AI_ANTHROPIC_API_KEY`
- `AETHERIUM_AI_OLLAMA_BASE_URL`

## Redis Namespace

All Aetherium Redis keys must start with `aetherium:`. The API settings reject any configured Redis
key prefix that does not start with that namespace.

## Session Cookies

The future session cookie must use a product-specific name. The current configuration reserves
`aetherium_session` and rejects the generic name `session`.

## Object Storage

Development and production buckets must use an `aetherium` prefix. The default development bucket is
`aetherium-files-dev`; CI uses `aetherium-ci-files`.
