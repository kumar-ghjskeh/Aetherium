# Phase W14 - Progress Tower

## Scope

W14 implements Progress Tower as a data-driven World Mode district. The district remains a read-only
presentation layer over Aetherium's existing owner-scoped analytics summary and routes detailed
chart reading to the accessible Command Mode analytics page.

Included:

- Procedural vertical Progress Tower at the W5 manifest coordinates.
- Tower core, metric floors, rotating crown, observation crystal, and bounded study-trend columns.
- Real weekly analytics metrics, availability states, explanations, period range, and generated
  timestamp from the existing analytics summary.
- Same-unit study-minute trend comparison without combining unrelated metric units.
- Honest unavailable and no-activity states with no synthetic values.
- Near-district DOM panel for readable metrics, explanations, and Command Mode actions.
- Progress Tower interaction terminals for analytics, learning, habits, and projects.
- `/app/world` implementation progress updated through W14.

Excluded:

- Analytics mutation or synthetic activity.
- Cross-unit visual ranking, unsupported projections, forecasts, or mastery claims.
- In-canvas complex charts, which remain in the semantic Command Mode analytics interface.
- Walkable interiors, spatial audio, downloaded models, textures, glTF/GLB assets, shaders, or
  particles.
- Automated screenshot-regression coverage, which remains scheduled for W23.

## Affected Modules

- `apps/web/src/features/world/world-page.tsx`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/features/world/components/environments/world-environment-scene.tsx`
- `apps/web/src/features/world/components/locations/progress-tower.tsx`
- `apps/web/src/features/world/components/ui/progress-tower-panel.tsx`
- `apps/web/src/features/world/components/ui/world-roadmap-progress.tsx`
- `apps/web/src/features/world/engine/progress-tower-system.ts`
- `apps/web/src/features/world/manifests/interactions.manifest.ts`
- `apps/web/src/app/globals.css`

## Data Integration

Progress Tower reuses the authenticated owner-scoped `analytics.summary({ period: "week" })`
response already loaded for Central Plaza. W14 adds no extra API request.

The world maps:

- Each metric to one bounded tower floor with its explicit availability state.
- Positive, zero, and unavailable states to distinct signal strengths without comparing unrelated
  units.
- Study-minute trend buckets to bounded columns normalized only against other study-minute buckets.
- Metric labels, exact formatted values, and backend explanations to the readable DOM panel.
- Detailed charts and tables to `/app/analytics`.

No world value is inferred from time spent in World Mode, and unavailable metrics remain visibly
unavailable.

## Security and Privacy Notes

- W14 introduces no backend route, migration, secret, mutation, or additional analytics collection.
- The analytics endpoint already requires the authenticated owner and queries owner-scoped records.
- The scene receives aggregate analytics DTOs only; it does not receive file bodies, habit notes,
  project details, AI prompts, session tokens, or provider secrets.
- World Mode does not write analytics records or enable product analytics when the user has opted
  out.

## Accessibility Notes

- The nearby panel uses semantic sections, definition lists, lists, navigation, and explicit text.
- Metric availability, exact value, and explanation are never communicated by color alone.
- The 3D trend visualization compares study minutes only; the Command Mode handoff provides a
  semantic table and labeled bars for detailed reading.
- Reduced-motion mode stops the rotating crown.
- Every interaction has a keyboard and gamepad action plus a Command Mode route.

## Performance Notes

- The district renders at most twelve metric floors, eight study-trend columns, four structural
  fins, two crown rings, and one local point light.
- W14 reuses the analytics request already made by `/app/world` and adds no network round trip.
- Geometry is procedural with no external model, texture, or audio memory cost.
- Only one low-cost crown rotation runs per frame and is disabled in reduced-motion mode.
- Complex charting stays outside the canvas.

## Validation Checklist

- [x] Focused Web type check passes.
- [x] Focused World Mode and analytics tests pass.
- [x] Full repository CI passes.
- [x] Alembic SQL smoke validation passes.
- [x] Git author and committer are `Sai Kumar <saikumarthota120@gmail.com>`.
- [x] Phase commit is pushed without co-author trailers.

## Known Limitations

- Progress Tower is an exterior slice and does not yet include a walkable observation interior.
- The world currently presents the weekly summary already loaded by `/app/world`; alternate periods
  remain selectable in Command Mode.
- File-open and coding-session metrics remain unavailable because the analytics backend explicitly
  marks them unsupported.
- Browser screenshot capture and frame-metric automation are not active until W23.
