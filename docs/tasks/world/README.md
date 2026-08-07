# World Mode Task Index

This directory tracks the visual World Mode implementation as a separate phase sequence from the
completed non-3D roadmap.

World Mode must remain a presentation layer over Aetherium-owned APIs and user-owned data. Command
Mode remains the fallback and the primary path for complex reading, coding, settings, and data
management workflows.

## Active Stop Rules

- Do not use Unity, Unreal Engine, or another editor-heavy engine.
- Do not use paid assets, paid tools, or assets with unclear licensing.
- Do not expose private user content, object keys, session tokens, AI provider keys, Redis
  credentials, database credentials, or MinIO credentials to the browser runtime.
- Do not duplicate backend business logic in the 3D layer.
- Do not commit generated or downloaded world assets unless they are listed in
  `docs/world/asset-register.md`.
- Keep every practical action reachable through Command Mode.

## Phase Validation

Every phase must pass the relevant validation before commit and push:

- `pnpm format`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- Backend tests when backend contracts change.
- Next.js production build when frontend runtime changes.
- `pnpm world:check` after any World Mode dependency, asset, or route change.
- Playwright visual and console checks once rendering begins.

The phase report must include the commit hash and push status. Commits must use the repository's
configured user author and must not include co-author trailers.

## Roadmap

See `docs/tasks/world/world-mode-roadmap.md`.

## Phase Task Records

- `docs/tasks/world/phase-w0-visual-world-architecture.md`
- `docs/tasks/world/phase-w1-world-runtime-foundation.md`
- `docs/tasks/world/phase-w2-player-controller.md`
- `docs/tasks/world/phase-w3-camera-system.md`
- `docs/tasks/world/phase-w4-interaction-framework.md`
- `docs/tasks/world/phase-w5-world-manifest-generation.md`
- `docs/tasks/world/phase-w6-terrain-environment.md`
- `docs/tasks/world/phase-w7-central-plaza.md`
- `docs/tasks/world/phase-w8-knowledge-library.md`
- `docs/tasks/world/phase-w9-ai-observatory.md`
- `docs/tasks/world/phase-w10-habit-garden.md`
- `docs/tasks/world/phase-w11-learning-academy.md`
- `docs/tasks/world/phase-w12-coding-arena.md`
