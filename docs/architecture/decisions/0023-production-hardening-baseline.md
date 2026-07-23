# ADR 0023 - Production Hardening Baseline

## Status

Accepted.

## Context

Aetherium has accumulated user-owned domains, file ingestion, AI gateway behavior, notifications,
analytics, achievements, coding records, and non-visual World Mode contracts. Before deployment
preparation, the API needs consistent request correlation, baseline security headers, observability
configuration, and automated protection against accidentally entering the visual 3D phase early.

## Decision

- Add an API middleware layer that assigns or validates an `X-Request-ID`, stores it on
  `request.state`, echoes it in responses, and logs structured request-completion records.
- Use JSON structured logs under an Aetherium log namespace. Access logs include method, path,
  response status, duration, request ID, client host, and service only.
- Apply security headers to API responses by default:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: no-referrer`
  - `Cross-Origin-Opener-Policy: same-origin`
  - restrictive `Permissions-Policy`
  - restrictive `Content-Security-Policy` for non-documentation API responses
  - `Strict-Transport-Security` in production
- Expose `/api/v1/health/observability` as a non-sensitive status endpoint for runtime hardening
  controls.
- Add `pnpm world:check` and include it in `pnpm run ci` to block visual 3D renderer/game
  dependencies and visual-world asset files before the approved phase.

## Consequences

- Logs are easier to correlate across API, worker, reverse proxy, and future observability systems.
- The API has a conservative header baseline before deployment, while the web frontend can still
  define its own CSP later.
- Observability reports only whether integration points are configured; it does not expose raw DSNs
  or secrets.
- Visual World Mode remains explicitly deferred by an automated repository check.

## Follow-Up Work

- Add reverse-proxy and web-runtime CSP in deployment-specific infrastructure.
- Add external error tracking and metrics exporters when credentials and provider choices are
  approved.
- Replace in-memory rate limiting with Redis-backed distributed limits before horizontal API scale.
- Add load testing and full restore drills in staging.
