# Phase 2 Task: Command Mode Application Shell

## Boundary

Implement the authenticated Command Mode shell for these routes:

- `/app`
- `/app/library`
- `/app/ai`
- `/app/learning`
- `/app/coding`
- `/app/habits`
- `/app/projects`
- `/app/analytics`
- `/app/achievements`
- `/app/settings`
- `/app/world`

The shell may use the existing authentication and user-owned foundation APIs. It must not implement
the domain behavior for files, AI, habits, learning, projects, achievements, analytics, or visual
World Mode.

## Affected Modules

- `apps/web/src/app/app`: protected App Router route group.
- `apps/web/src/features/app-shell`: shell, command palette, notifications panel, dashboard, and
  section empty-state components.
- `apps/web/src/app/globals.css`: responsive Command Mode styles.
- `packages/api-client`: already exposes the foundation APIs used by the shell.
- `docs`: update route and roadmap status.

## Security And Privacy

- The shell must rely on the existing `AuthProvider` and `/api/v1/auth/me` session check.
- Anonymous users are redirected to `/login?next=/app`.
- The notifications panel reads only the authenticated user's notifications through the API.
- No private data is hard-coded into the UI.

## Accessibility

- Desktop sidebar and mobile navigation must use semantic navigation landmarks.
- Interactive controls require visible focus states and labels.
- Command palette opens with `Ctrl/Cmd + K`, traps interaction in a modal-like dialog, and can close
  with Escape.
- Disabled future actions must be announced as unavailable and must not appear functional.
- Reduced-motion preferences should be respected through CSS.

## Performance

- No 3D dependencies or large asset bundles are introduced.
- Shell data fetches are limited to preferences, world profile, and a bounded notification page.

## Validation Plan

- React Testing Library tests for authenticated rendering, anonymous redirects, command palette
  keyboard behavior, notifications panel behavior, and unavailable API state.
- Full repository validation through `pnpm run ci`.

## Implementation Status

Status: completed.

Completed:

- Protected `/app` route family wired through the existing auth state.
- Responsive sidebar and mobile navigation.
- Top application bar with command palette, notifications, and profile actions.
- `Ctrl/Cmd + K` command palette with real navigation actions and disabled future actions.
- API-backed preferences, world profile, and bounded notifications loading.
- Settings page backed by the existing preferences API.
- Explicit empty states for future Library, AI, Learning, Coding, Habits, Projects, Analytics, and
  Achievements functionality.
- Non-visual `/app/world` page that displays world profile identifiers and clearly defers visual
  World Mode.
- Legacy `/command` route redirects to `/app`.

Validation completed:

- `pnpm run ci` passed.
- Alembic upgrade SQL generation passed.
- Alembic downgrade SQL generation from `0003_user_owned_foundation` to `0002_auth_foundation`
  passed.
- Alembic re-upgrade SQL generation from `0002_auth_foundation` to `head` passed.
- 3D implementation scan returned no matches in app and package source.
