# ADR 0017 - Event-Driven Non-Visual Achievement Engine

## Status

Accepted.

## Context

Aetherium needs honest progression that rewards meaningful product events without making core data
access depend on gamification. Existing slices already emit owner-scoped domain events for files,
habits, learning, and projects. The visual World Mode phase is still prohibited.

## Decision

Implement achievements as an event-driven, non-visual backend foundation. Global achievement
definitions and rules describe what can be awarded. User-specific progress is stored in owner-scoped
counters, processed event/rule rows, user achievements, and future world-unlock records. Processing
is explicit through `/api/v1/achievements/process` and idempotent through database uniqueness.

World rewards are stored only as future location identifiers. They do not render scenes, create 3D
assets, gate access to user data, or imply visual World Mode exists.

## Consequences

- Existing domain events become the source of truth for progression.
- Retried processing cannot double-count a domain event for the same rule.
- Command Mode can show real achievements before the visual Achievement Hall exists.
- Future World Mode can read unlock identifiers without redefining achievement logic.
- Coding-specific achievements remain locked until a real coding-domain event exists.
