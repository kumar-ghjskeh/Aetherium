# ADR 0006: Command Mode Shell Before Domain Features

## Status

Accepted.

## Context

The non-3D roadmap requires a usable authenticated application shell before file storage, AI,
habits, learning, projects, analytics, and visual World Mode are implemented. The shell must expose
navigation to planned areas without implying that unfinished workflows are available.

## Decision

Implement `/app` as the protected Command Mode route family and use the existing authentication and
user-owned foundation APIs as the only real data sources for this slice.

Routes for future domains render explicit empty states. Command palette actions for unimplemented
mutations are disabled with clear reasons. `/app/world` is limited to non-visual world profile data
and a message that visual World Mode is future work.

## Consequences

- Users can orient themselves in the product and update implemented settings without fake data.
- Future slices have stable route targets for deep links and command-palette actions.
- No 3D dependencies, scene assets, player movement, camera controls, or visual world placeholders
  are introduced by this phase.
