# ADR 0013: Habit Tracking Foundation

## Status

Accepted.

## Context

Phase 9 needs a functional Command Mode habit system without implementing visual World Mode. Habits
are personal progress data, so they need owner scoping, durable history, non-shaming streak logic,
and future compatibility with analytics, achievements, reminders, and the eventual Habit Garden.

## Decision

Aetherium stores habits as first-class owner-scoped records with separate schedule, target, log,
streak, daily check-in, and weekly review tables.

The service:

- Uses `owner_user_id` on every habit table.
- Treats cross-user identifiers as `not_found`.
- Supports daily, selected-weekday, and weekly-target schedules.
- Supports completion, duration, count, and quantity habit value types.
- Upserts one log per owner/habit/date instead of creating duplicate daily logs.
- Emits an idempotent `habit.logged` domain event keyed by user, habit, and log date.
- Writes sanitized audit logs for habit creation, updates, archive, logs, check-ins, and reviews.
- Derives streak and completion summaries from stored schedules and logs.
- Keeps missed days from deleting historical progress.
- Exposes only non-visual Habit Garden progress signals in Command Mode.

Habit reminders, external delivery, achievements, analytics dashboards, and visual Habit Garden
graphics are deferred to later approved slices.

## Consequences

- Habit history remains durable and useful for later analytics and achievement rules.
- The data model can support future World Mode without creating a separate habit state model.
- Summary metrics are transparent and limited to stored data.
- Daily mood and energy remain optional context and are not medical claims.
- Later reminder workflows can consume the same schedules without changing the core habit API.
