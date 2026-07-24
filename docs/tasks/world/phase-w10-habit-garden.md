# Phase W10 - Habit Garden

## Scope

W10 implements the Habit Garden as a data-driven World Mode district. The district remains a
read-only presentation layer over the existing Aetherium habit and achievement APIs.

Included:

- Procedural Habit Garden exterior at the W5 manifest coordinates.
- Terraced garden base, water channels, central pond, canopy light, habit plant beds, and permanent
  milestone features.
- Real habit overview from active habit records and weekly habit summary data.
- Real progression signal from achievement summary and world-unlock records.
- Near-district DOM panel that opens existing Command Mode Habits and Achievements surfaces.
- Garden interaction terminals for logging today, creating habits, and reviewing milestones.
- Tests for habit-to-plant mapping, empty-state honesty, interaction routing, and `/app/world`
  habit/achievement data loading.

Excluded:

- New backend habit routes, new achievement rules, or new domain events.
- In-world habit mutation controls. Creating, logging, archiving, check-ins, and weekly reviews stay
  in the existing Command Mode Habits page.
- Dense foliage systems, downloaded vegetation models, glTF/GLB assets, spatial audio, weather, or
  shader effects.
- Automated screenshot-regression coverage, which remains scheduled for W23.

## Affected Modules

- `apps/web/src/features/world/world-page.tsx`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/features/world/components/environments/world-environment-scene.tsx`
- `apps/web/src/features/world/components/locations/habit-garden.tsx`
- `apps/web/src/features/world/components/ui/habit-garden-panel.tsx`
- `apps/web/src/features/world/engine/habit-garden-system.ts`
- `apps/web/src/features/world/manifests/interactions.manifest.ts`
- `apps/web/src/app/globals.css`

## Data Integration

The Habit Garden overview uses existing owner-scoped authenticated endpoints:

- `habits.getSummary`
- `habits.list`
- `achievements.summary`

The world maps:

- Active habits to bounded plant beds.
- Current streaks and 30-day completion rate to growth stage and plant health.
- Completed-today state to bloom or grove state.
- Recovery streaks to steady growth, not punishment.
- Habit summary growth points to garden light intensity.
- Habit achievements and world unlocks to permanent garden features.

No raw notes, check-in text, private request bodies, session cookies, or secrets are placed in world
manifests.

## Security and Privacy Notes

- W10 is read-only in World Mode.
- Habit mutations continue through existing authenticated Command Mode routes.
- Empty habit state displays an honest empty garden instead of fake progress.
- Missed days are represented as readiness or dormancy, never destructive decay.

## Performance Notes

- The Garden renders a bounded set of up to eight habit plants.
- Plants are procedural primitive meshes with no texture memory cost.
- One local point light, one animated pond material, and simple water channels are used for
  identity.
- Reduced-motion mode disables water opacity and plant sway animation.
- No dense foliage, particles, downloaded assets, post-processing, spatial audio, or custom shader
  work is introduced.

## Validation Checklist

- [x] Focused Web type check passes.
- [x] Focused Web tests pass.
- [x] Full repository CI passes.
- [x] Alembic SQL smoke validation passes.
- [x] Git author and committer are `Sai Kumar <saikumarthota120@gmail.com>`.
- [x] Phase commit is pushed without co-author trailers.

## Known Limitations

- The garden is an exterior slice and does not yet include advanced vegetation density, audio, or
  weather ambience.
- Habit logging, check-ins, reviews, archiving, and habit creation intentionally route to Command
  Mode.
- Browser screenshot capture and frame-metric automation are not active until W23.
