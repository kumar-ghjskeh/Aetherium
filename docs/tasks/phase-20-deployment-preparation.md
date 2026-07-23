# Phase 20 - Deployment Preparation

## Boundary

Prepare Aetherium for separate development, staging, and production environments. This phase does
not deploy the product, add real secrets, or implement visual World Mode.

## Affected Modules

- Operations documentation.
- Environment-variable documentation.
- CI/CD validation workflow.
- Deployment-readiness guard script.
- Roadmap readiness documentation for the future visual 3D phase.

## Security And Privacy Implications

- Every environment must use separate Aetherium-owned PostgreSQL, Redis, object-storage buckets,
  secrets, AI-provider credentials, cookie configuration, API URL, web URL, worker configuration,
  logging, monitoring, and backup targets.
- Production must never use local development secrets, deterministic AI provider defaults, generic
  cookies, shared buckets, wildcard credentialed CORS, or disabled upload verification.
- Migration, rollback, backup, restore, export, and account-deletion procedures must preserve owner
  boundaries and avoid cross-product data movement.

## Implementation Plan

1. Add a deployment-readiness check script and wire it into `pnpm run ci`.
2. Add a validation-only GitHub Actions workflow for deployment documentation and boundaries.
3. Create operations docs for deployment, environments, environment variables, migrations, rollback,
   health checks, and release checklist.
4. Add infrastructure environment notes without provisioning or storing secrets.
5. Update existing operations, roadmap, README, AGENTS, system overview, testing, and independence
   docs.
6. Create the final `docs/roadmap/3d-world-readiness.md` stop-checkpoint document.
7. Run full validation and migration SQL smoke checks.

## Acceptance Criteria

- `pnpm deployment:check` passes.
- `pnpm run ci` includes deployment readiness validation.
- Deployment documentation clearly separates development, staging, and production.
- Migration, rollback, backup, restore, and health-check procedures are documented.
- The GitHub workflow validates readiness only and performs no deployment.
- The final 3D readiness document exists.
- No visual 3D code, dependency, asset, or runtime is added.
