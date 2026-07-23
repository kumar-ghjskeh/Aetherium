# Observability

Aetherium observability must remain product-specific and must not collect unnecessary personal
analytics.

## Current Runtime Controls

- API request IDs are accepted through `AETHERIUM_REQUEST_ID_HEADER`, defaulting to `X-Request-ID`.
- Unsafe or oversized request IDs are replaced with generated UUIDs.
- Every API response includes the request ID and `X-Aetherium-Process-Time-Ms`.
- API access logs are JSON-formatted under `AETHERIUM_LOG_NAMESPACE`, defaulting to `aetherium`.
- Access logs include method, path, status, duration, request ID, service, and client host.
- Access logs do not include request bodies, passwords, cookies, session tokens, raw prompts,
  provider secrets, private file contents, object keys, or full query strings.
- `GET /api/v1/health/observability` reports non-sensitive observability and security-control
  status.

## Metrics Boundaries

Current product metrics are read from owner-scoped records through domain APIs. Operational metrics
remain an integration point and should use the Aetherium namespace when exported.

Initial metric categories for deployment are:

- API request rate, latency, and error count by route template.
- Health and readiness status.
- File-processing job counts by status and failure type.
- AI usage records by feature, provider, token totals, cost estimate, and normalized error type.
- Search latency and result counts, without storing raw private search content in external systems.
- Worker polling, retry, and dead-letter counts.
- Database connection pool health.

## Error Tracking

`AETHERIUM_ERROR_TRACKING_DSN` is an optional integration point. The DSN value must never be
returned by the API or logged. Error tracking must scrub:

- Cookies and authentication headers.
- Raw session tokens and signing material.
- Passwords.
- Private document bodies and extracted chunks.
- Raw AI prompts and responses unless a future privacy review explicitly enables sampling.
- Provider API keys and object-storage credentials.

## Product Analytics

Product analytics are separate from operational telemetry. The existing user preference
`product_analytics_enabled` controls future product analytics collection. Disabling product
analytics must not disable operational security logging required to operate the service safely.
