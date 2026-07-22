# ADR 0016 - Progress Analytics As A Read Model

## Status

Accepted.

## Context

Phase 12 needs useful progress analytics before every future event source exists. Aetherium already
stores learning, habit, file-ingestion, AI usage, and project records, but it does not yet record
file-open events or coding sessions. The product requirements prohibit fake analytics and require
user ownership.

## Decision

Implement progress analytics as a read-only service over existing owner-scoped tables. The API
returns typed metric rows with an `available` flag. Metrics with implemented source records are
computed from those records. Metrics without source events are returned as unavailable instead of
zero-filled or fabricated.

The first route is `GET /api/v1/analytics/summary`, which supports `week`, `month`, `quarter`, and
`year` periods. The Command Mode Analytics page renders summary cards, trend bars, and an accessible
table from the same response.

## Consequences

- Analytics require no Phase 12 migration and inherit existing ownership constraints.
- The dashboard can ship without misleading users about unsupported data.
- Future tracking sources can become available by adding explicit domain events or tables and then
  updating the read model.
- Analytics remain independent from external product analytics and do not send personal data to
  third-party providers.
