# Production Hardening

This document records the Phase 19 hardening baseline. It is not a substitute for a deployment
security review.

## Security Review Baseline

- User-owned services use authenticated `User` dependencies and owner-scoped queries.
- Cross-user identifiers are treated as `not_found` across implemented private domains.
- Session cookies are HttpOnly, product-specific, SameSite-configured, and Secure in production.
- State-changing cookie-authenticated requests validate allowed origins.
- Auth and AI gateway rate limits use the Aetherium namespace.
- File uploads validate names, extensions, MIME types, sizes, checksums, and owner scope.
- Object storage uses private buckets and expiring presigned URLs.
- AI external calls require environment enablement and feature-level user consent.
- Document Q&A retrieves owner-scoped ready chunks and validates citations before returning them.
- Code execution remains unavailable unless a separate isolated sandbox is implemented and reviewed.

## API Headers

FastAPI applies these headers by default:

- `X-Request-ID`
- `X-Aetherium-Process-Time-Ms`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Cross-Origin-Opener-Policy: same-origin`
- restrictive `Permissions-Policy`
- restrictive `Content-Security-Policy` for non-doc API responses
- `Strict-Transport-Security` in production

The web frontend still needs deployment-specific CSP tuning because Next.js assets, fonts, images,
and future media sources depend on the selected hosting environment.

## Dependency And Phase Guards

CI runs:

- `pnpm independence:check`
- `pnpm world:check`
- formatting, linting, type checking, tests, and production builds

`pnpm world:check` blocks visual 3D renderer/game dependencies and visual-world asset files until
the approved visual 3D phase begins.

## Remaining Security Work

- Distributed Redis-backed rate limiting before horizontal API scaling.
- Real malware scanning and quarantine.
- Parser sandboxing and resource limits for untrusted file extraction.
- Deployment-specific CSP for the web runtime.
- Dependency vulnerability scanning in CI with approved network access.
- External error tracking and metrics exporters with secret scrubbing.
- Execution workflows for encrypted data exports and account deletion.
- Load tests, restore drills, and security review in staging.
