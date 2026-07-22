# ADR 0015: Project Dock Foundation

## Status

Accepted.

## Context

Phase 11 needs a functional project workspace for objectives, milestones, tasks, notes, resources,
technologies, blockers, and activity history. The system must be useful in Command Mode now while
remaining compatible with later analytics, achievements, AI project assistance, coding workspace,
and visual World Mode slices.

## Decision

Aetherium stores project records as owner-scoped relational data and keeps project activity as an
append-only history derived from explicit project mutations.

The service:

- Uses `owner_user_id` on every project table.
- Treats cross-user identifiers as `not_found`.
- Separates project records from milestones, tasks, notes, links, file links, topic links,
  technologies, blockers, and activity rows.
- Validates owned Personal Vault files and owned learning topics before linking them to projects.
- Records project activity for user-visible history.
- Emits an idempotent `project.completed` domain event when a project is completed.
- Writes sanitized audit logs for project mutations.
- Exposes project and project-task metadata through owner-scoped global search.

Project-specific AI context is not an automatic AI tool in this phase. The data model makes future
AI project assistance possible, but future AI flows must still require explicit user consent and
approval before sending or mutating project data.

## Consequences

- Users can plan and track projects without waiting for the coding workspace.
- Future analytics and achievements can consume project activity and completion events.
- Future AI mentors can request narrowly scoped project context after consent instead of receiving
  all project data by default.
- Future World Mode can map projects to non-visual location identifiers and progression events
  without introducing duplicate world-specific project state.
