# Phase 11 Task: Project Dock Foundation

## Boundary

Implement the non-visual Command Mode project-management foundation. Do not implement the
Programming Tower, code editor, code execution, AI project mutation tools, achievements, analytics,
or visual 3D world graphics in this phase.

## Affected Modules

- FastAPI project domain, models, schemas, services, dependencies, and `/api/v1/projects` router.
- Alembic migration history.
- Global search service.
- Shared TypeScript types, Zod validation, and API client.
- Next.js Command Mode `/app/projects` route.
- Documentation and tests.

## Security And Privacy

- Every project table includes `owner_user_id`.
- Cross-user project, milestone, task, note, link, file, topic, technology, and blocker identifiers
  return not-found style responses or empty owner-scoped results.
- Project file and topic links validate ownership before association.
- Project completion emits an idempotent `project.completed` domain event.
- Project mutations write sanitized audit logs and activity records without secrets, cookies,
  tokens, or private file bodies.
- Project-specific AI context is stored as explicit project data only. AI tools still require future
  explicit consent and approval before using or mutating project records.

## Implementation Checklist

- [x] Add project domain enums.
- [x] Add project database models.
- [x] Add Alembic migration `0011_project_dock`.
- [x] Add project service with projects, milestones, tasks, notes, links, file links, topic links,
      technologies, blockers, activity, completion events, and audit logs.
- [x] Add `/api/v1/projects` routes.
- [x] Add shared TypeScript contracts and Zod schemas.
- [x] Add typed API-client project methods.
- [x] Add Command Mode Project Dock page.
- [x] Add project and project-task search integration.
- [x] Add backend, API-client, and frontend tests.
- [x] Update architecture, security, testing, roadmap, README, and agent docs.

## Validation

Focused validation completed during implementation:

- `node scripts\python-task.mjs pytest apps\api\tests\test_projects.py`
- `pnpm run js:typecheck`
- `pnpm --filter @aetherium/api-client test -- src/index.test.ts`
- `pnpm --filter @aetherium/web test -- src/features/projects/projects-page.test.tsx`

Full validation must pass before this phase is committed.
