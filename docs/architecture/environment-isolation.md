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
- `AETHERIUM_OBJECT_STORAGE_DERIVED_ASSETS_BUCKET`
- `AETHERIUM_OBJECT_STORAGE_USER_AVATARS_BUCKET`
- `AETHERIUM_S3_ACCESS_KEY_ID`
- `AETHERIUM_S3_SECRET_ACCESS_KEY`
- `AETHERIUM_S3_REGION`
- `AETHERIUM_CORS_ORIGINS`
- `NEXT_PUBLIC_AETHERIUM_API_BASE_URL`

Authentication runtime:

- `AETHERIUM_SESSION_COOKIE_NAME`
- `AETHERIUM_SESSION_SIGNING_SECRET`
- `AETHERIUM_SESSION_DURATION_SECONDS`
- `AETHERIUM_SESSION_COOKIE_DOMAIN`
- `AETHERIUM_SESSION_COOKIE_PATH`
- `AETHERIUM_SESSION_COOKIE_SAMESITE`
- `AETHERIUM_SESSION_COOKIE_SECURE`
- `AETHERIUM_PASSWORD_MIN_LENGTH`
- `AETHERIUM_ARGON2_TIME_COST`
- `AETHERIUM_ARGON2_MEMORY_COST`
- `AETHERIUM_ARGON2_PARALLELISM`
- `AETHERIUM_AUTH_LOGIN_RATE_LIMIT_ATTEMPTS`
- `AETHERIUM_AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS`
- `AETHERIUM_AUTH_REGISTER_RATE_LIMIT_ATTEMPTS`
- `AETHERIUM_AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS`

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
- `AETHERIUM_MINIO_CORS_ORIGINS`

Personal Vault:

- `AETHERIUM_FILE_VAULT_MAX_UPLOAD_BYTES`
- `AETHERIUM_FILE_VAULT_UPLOAD_URL_EXPIRES_SECONDS`
- `AETHERIUM_FILE_VAULT_DOWNLOAD_URL_EXPIRES_SECONDS`
- `AETHERIUM_FILE_VAULT_VERIFY_UPLOADS`

Background ingestion:

- `AETHERIUM_FILE_INGESTION_MAX_ATTEMPTS`
- `AETHERIUM_FILE_INGESTION_CHUNK_SIZE_CHARS`
- `AETHERIUM_FILE_INGESTION_CHUNK_OVERLAP_CHARS`
- `AETHERIUM_FILE_INGESTION_EMBEDDINGS_ENABLED`
- `AETHERIUM_FILE_INGESTION_QUEUE_NAME`
- `AETHERIUM_WORKER_POLL_SECONDS`

AI gateway:

- `AETHERIUM_AI_PROVIDER_DEFAULT`
- `AETHERIUM_AI_EXTERNAL_CALLS_ENABLED`
- `AETHERIUM_AI_OPENAI_API_KEY`
- `AETHERIUM_AI_OPENAI_BASE_URL`
- `AETHERIUM_AI_OPENAI_CHAT_MODEL`
- `AETHERIUM_AI_OPENAI_EMBEDDING_MODEL`
- `AETHERIUM_AI_ANTHROPIC_API_KEY`
- `AETHERIUM_AI_ANTHROPIC_BASE_URL`
- `AETHERIUM_AI_ANTHROPIC_CHAT_MODEL`
- `AETHERIUM_AI_OLLAMA_BASE_URL`
- `AETHERIUM_AI_OLLAMA_CHAT_MODEL`
- `AETHERIUM_AI_OLLAMA_EMBEDDING_MODEL`
- `AETHERIUM_AI_TIMEOUT_SECONDS`
- `AETHERIUM_AI_MAX_RETRIES`
- `AETHERIUM_AI_RATE_LIMIT_ATTEMPTS`
- `AETHERIUM_AI_RATE_LIMIT_WINDOW_SECONDS`

Observability and deployment:

- `AETHERIUM_LOG_NAMESPACE`
- `AETHERIUM_REQUEST_ID_HEADER`
- `AETHERIUM_SECURITY_HEADERS_ENABLED`
- `AETHERIUM_CONTENT_SECURITY_POLICY`
- `AETHERIUM_METRICS_ENABLED`
- `AETHERIUM_ERROR_TRACKING_DSN`
- `AETHERIUM_BACKUP_BUCKET`

## Redis Namespace

All Aetherium Redis keys must start with `aetherium:`. The API settings reject any configured Redis
key prefix that does not start with that namespace. The default file-ingestion queue name is
`aetherium:file-ingestion`.

## Session Cookies

The session cookie uses `aetherium_session` by default. Generic names such as `session` are
rejected. Local development uses non-Secure cookies over HTTP; production must use Secure cookies
and a non-default session signing secret.

## Object Storage

Development and production buckets must use an `aetherium` prefix. The default development buckets
are:

- `aetherium-private-files-dev`
- `aetherium-derived-assets-dev`
- `aetherium-user-avatars-dev`

Production deployments must use separate Aetherium-owned buckets for private originals, derived
assets, and user avatars. CI must use isolated Aetherium-prefixed bucket names if storage checks are
enabled.

## Profile And Privacy Settings

Personal profile, privacy, certificate, favorite, data-export request, and account deletion request
features do not introduce new runtime secrets. They use Aetherium's existing database, session,
object-storage, and AI-consent configuration. Future export generation or deletion execution
workflows must add only Aetherium-prefixed environment variables and must not reuse another
product's storage, signing, encryption, queue, or notification credentials.

## AI Providers

The default AI provider is disabled unless `AETHERIUM_AI_PROVIDER_DEFAULT` is set. Local tests may
set `AETHERIUM_AI_PROVIDER_DEFAULT=aetherium_deterministic` to exercise gateway contracts without an
external network call. Production rejects that deterministic provider.

External provider calls require both `AETHERIUM_AI_EXTERNAL_CALLS_ENABLED=true` and feature-level
user consent stored in Aetherium's database. OpenAI-compatible and Anthropic-compatible providers
also require Aetherium-specific API keys supplied by the deployment secret manager. Provider keys,
base URLs, model names, timeout settings, retry settings, and rate-limit settings must not be shared
with another private product.

## Environment Separation

Development, staging, and production must each use separate Aetherium-owned database credentials,
Redis endpoints, object buckets, secrets, AI-provider configuration, cookie settings, web/API URLs,
logs, metrics, backup targets, and restore procedures. See `docs/operations/environments.md` and
`docs/operations/environment-variables.md`.
