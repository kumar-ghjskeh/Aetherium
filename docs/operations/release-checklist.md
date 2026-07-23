# Release Checklist

## Before Release

- Confirm target environment: development, staging, or production.
- Confirm commit hash and branch.
- Confirm `pnpm run ci` passed.
- Confirm `pnpm deployment:check`, `pnpm independence:check`, and `pnpm world:check` passed.
- Confirm no visual 3D dependencies or assets are present.
- Confirm `.env.example` has no secret values.
- Review environment variables for Aetherium-specific infrastructure.
- Review migration SQL.
- Confirm backup or point-in-time recovery.
- Confirm rollback plan.
- Confirm staging smoke tests.

## Deployment

- Build web, API, and worker artifacts from the same commit.
- Apply migrations before serving code that requires them.
- Deploy API and worker with matching environment variables.
- Deploy web with the matching API base URL.
- Keep previous artifacts available.

## After Release

- Verify API liveness, readiness, and observability.
- Verify web health.
- Verify login and `/api/v1/auth/me`.
- Verify Command Mode `/app`.
- Verify `/app/world` is non-visual and future-facing.
- Verify worker processing status.
- Review structured logs for elevated errors.
- Review metrics and backup status.
- Record release notes, commit hash, migrations, and known limitations.
