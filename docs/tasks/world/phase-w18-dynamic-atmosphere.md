# Phase W18 - Dynamic World Atmosphere

## Boundary

Add deterministic time-of-day and performance-tiered local weather to the existing World Mode
runtime. This phase does not add backend state, migrations, external weather services, downloaded
assets, spatial audio, post-processing, or new dependencies.

## Implementation

- Add pure time interpolation for an eight-minute cycle and fixed day, sunset, and night states.
- Add deterministic automatic weather plus explicit clear, mist, and light-rain states.
- Cap clouds, mist, and rain by Low, Balanced/Automatic, and High graphics presets.
- Remove moving precipitation and wind in reduced-motion mode.
- Replace the original static sky/light/cloud ownership with one dynamic atmosphere scene layer.
- Expose compact keyboard-accessible transient controls inside World Mode.
- Keep controls honest: they apply only to the current visit because no backend atmosphere
  preference contract exists.

## Security And Privacy

- No user data is included in atmosphere seeds or manifests.
- No browser geolocation, external weather API, credential, or additional network request is used.
- Existing authenticated data boundaries are unchanged.

## Performance

- Atmosphere uses bounded procedural primitives and one point field for rain.
- Reduced motion removes moving precipitation.
- Low mode is capped at 3 clouds, 6 mist puffs, and 140 rain points.
- Balanced/Automatic is capped at 6 clouds, 12 mist puffs, and 360 rain points.
- High is capped at 9 clouds, 18 mist puffs, and 620 rain points.
- The prior static cloud and mist props are filtered to prevent duplicate effect cost.

## Validation Checklist

- [x] Time interpolation and fixed phase tests.
- [x] Deterministic automatic-weather tests.
- [x] Preset and reduced-motion budget tests.
- [x] Settings-store and accessible control tests.
- [x] Strict TypeScript validation.
- [x] Full repository CI.
- [x] Production build.
- [x] Alembic SQL smoke validation.
- [ ] Commit and push.

Browser screenshots and measured frame probes remain intentionally assigned to W23, where the
repeatable Playwright visual harness is introduced.
