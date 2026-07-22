# Phase 13 - Achievements And Progression Foundation

## Boundary

Implement non-visual achievement progression from stored Aetherium domain events. Do not implement
visual Achievement Hall rewards, 3D world objects, rendered unlocks, particles, scenes, map travel,
or any visual World Mode behavior.

## Affected Modules

- `apps/api/app/domain/achievements.py`
- `apps/api/app/models/achievements.py`
- `apps/api/app/services/achievements.py`
- `apps/api/app/api/v1/achievements.py`
- `apps/api/alembic/versions/0012_achievement_engine.py`
- `apps/api/app/services/search.py`
- `packages/shared-types`
- `packages/validation`
- `packages/api-client`
- `apps/web/src/features/achievements`
- `docs/architecture`

## Implementation Plan

1. Add achievement definitions, rules, rewards, user achievements, counters, processed-event rows,
   and future world-unlock tables.
2. Seed built-in definitions for First File, Deep Reader, Seven-Day Rhythm, Project Builder, Quiz
   Explorer, Memory Master, and Coding Starter.
3. Process current-user domain events through active rules and record processed owner/event/rule
   rows idempotently.
4. Emit `achievement.unlocked` events, in-app notifications, and sanitized audit logs.
5. Store future world-unlock identifiers without rendering any visual world.
6. Expose list, summary, and explicit process endpoints under `/api/v1/achievements`.
7. Add achievement search results to the existing global search contract.
8. Build an API-backed Command Mode Achievements page with loading, empty/filter, error, progress,
   and world-unlock states.
9. Add backend, API-client, and frontend tests, then run full validation.

## Security And Privacy

- Achievement progress, user achievements, and world unlocks are owner-scoped.
- Processing never reads another user's events.
- Unique constraints prevent duplicate awards and duplicate event/rule processing.
- Progression points and unlocks do not gate access to user data.
- Future world unlocks are identifiers only and do not trigger visual assets or external calls.

## Migration Impact

Adds migration `0012_achievement_engine`.

## Acceptance Criteria

- Default achievement definitions are available.
- Processing is idempotent.
- Threshold rules update progress before unlock.
- Cross-user achievements remain isolated.
- User achievements produce notifications, audit logs, and `achievement.unlocked` events.
- Achievement search results open the Command Mode Achievements page.
- No visual 3D implementation is added.
