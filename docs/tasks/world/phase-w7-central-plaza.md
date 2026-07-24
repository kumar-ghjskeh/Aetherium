# Phase W7 - Central Plaza Vertical Slice

## Scope

W7 implements the first polished visual district slice for World Mode without adding downloaded
assets or final district interiors.

Included:

- Central Plaza procedural geometry with a circular plaza, Aetherium crystal, arches, water
  channels, and six terminal pods.
- Real-data plaza overview loaded from existing authenticated APIs.
- Central Plaza terminal interactions wired through the existing world interaction framework.
- Compact accessible DOM overlay for live overview state.
- Tests for plaza data mapping and `/app/world` overview API loading.

Excluded:

- Final open-world district buildings outside the plaza.
- Visual 3D implementations for Library, Observatory, Garden, Academy, Arena, Dock, Tower, Hall, or
  Sanctuary.
- Downloaded models, textures, audio, or external assets.
- Screenshot-regression automation, which remains scheduled for W23.

## Affected Modules

- `apps/web/src/features/world/world-page.tsx`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/features/world/components/environments/world-environment-scene.tsx`
- `apps/web/src/features/world/components/locations/central-plaza.tsx`
- `apps/web/src/features/world/components/ui/central-plaza-overview-panel.tsx`
- `apps/web/src/features/world/engine/central-plaza-system.ts`
- `apps/web/src/features/world/manifests/interactions.manifest.ts`
- `apps/web/src/app/globals.css`

## Data Integration

The plaza overview uses existing owner-scoped endpoints:

- `auth.me`
- `habits.getSummary`
- `habits.list`
- `notifications.list`
- `files.list`
- `projects.list`
- `learning.listGoals`
- `mentors.list`
- `analytics.summary`

No private document text, AI provider keys, object-storage keys, session tokens, or raw cookies are
sent into manifests or logs.

## Security and Privacy Notes

- All displayed data is read through authenticated API-client methods.
- The browser receives only normal API response DTOs already used by Command Mode.
- Terminal activation routes to Command Mode; mutations are not introduced in W7.
- Missing data uses honest empty-state labels rather than fabricated progress.

## Performance Notes

- Plaza assets are procedural Three.js primitives only.
- The slice adds a bounded number of meshes and six text labels.
- Animation is limited to crystal rotation and water-channel opacity changes, both disabled by
  reduced-motion mode.
- No textures, glTF/GLB assets, post-processing, dense foliage, or audio are added in this phase.

## Validation Checklist

- [x] Focused Web type check passes.
- [x] Focused Web tests pass.
- [x] Full repository CI passes.
- [x] Alembic SQL smoke validation passes.
- [x] Git author and committer are `Sai Kumar <saikumarthota120@gmail.com>`.
- [x] Phase commit is pushed without co-author trailers.

## Known Limitations

- Browser screenshot capture and console/performance probes are not automated until W23.
- Terrain physics still uses the W6 fixed traversal collider.
- The plaza terminals open Command Mode routes; richer in-world terminal panels arrive in later
  integration phases.
