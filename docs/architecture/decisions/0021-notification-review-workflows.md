# ADR 0021: In-App Notification And Review Workflow Foundation

## Status

Accepted.

## Context

Aetherium needs review prompts, reminders, and failure notices before external notification delivery
exists. These workflows must be useful in Command Mode, owner-scoped, idempotent, and independent
from any third-party email, push, or scheduler provider.

## Decision

Implement Phase 17 as an in-app workflow foundation:

- Store per-user notification workflow preferences in `notification_preferences`.
- Store generated workflow attempts in `notification_workflow_records`.
- Store monthly review notes in `monthly_reviews`.
- Generate in-app notifications through an authenticated `POST /api/v1/notifications/workflows/run`
  endpoint.
- Keep workflow records unique by owner, workflow type, and source key.
- Derive workflow candidates only from owner-scoped Aetherium records.
- Keep external delivery providers out of scope for this phase.

The runner supports weekly review, monthly review, due learning review, due habit reminder,
processing-failure, AI-provider-failure, and project-deadline candidates.

## Consequences

- The system can surface meaningful in-app reminders without adding email, push, or a scheduler.
- The same runner can later be called by a worker or scheduled task without changing the data model.
- Users can disable categories before generation.
- Workflow records form an auditable owner-scoped history.
- Time-zone-aware scheduling remains limited to stored reminder hour and UTC generation; richer
  locale scheduling is future work.
