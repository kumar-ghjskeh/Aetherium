# Health Checks

## API

- Liveness: `GET /api/v1/health/live`
- Readiness: `GET /api/v1/health/ready`
- Observability controls: `GET /api/v1/health/observability`

Readiness currently checks database connectivity. Future deployment checks should add Redis,
object-storage, worker, and migration-state probes without exposing secrets.

Expected production headers:

- `X-Request-ID`
- `X-Aetherium-Process-Time-Ms`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Content-Security-Policy` on non-doc API responses
- `Strict-Transport-Security`

## Web

- Web liveness: `GET /api/health`
- Protected shell smoke check: authenticated access to `/app`
- World placeholder smoke check: authenticated access to `/app/world`, confirming visual World Mode
  is still unavailable.

## Worker

The worker does not expose an HTTP endpoint in this scaffold. Deployment monitoring should verify:

- Process liveness.
- Poll loop activity.
- Processing-job status counts.
- Retry counts.
- Dead-letter or exhausted-attempt counts.
- Access to PostgreSQL and object storage.

## Smoke Tests

Run after deploy:

- Register or log in with a staging-only account.
- Call `/api/v1/auth/me`.
- Load `/app`.
- List notifications and preferences.
- Create and delete a staging-only file upload record if storage is configured.
- Verify no external AI call happens unless explicitly enabled and consented.
- Verify `pnpm world:check` passes for the deployed commit.
