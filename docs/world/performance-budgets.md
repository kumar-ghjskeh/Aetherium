# World Performance Budgets

## Primary Target

Primary device:

- RTX 4060 laptop GPU.
- 32 GB RAM.
- 2560 x 1440 display.
- Balanced preset.
- Approximately 60 FPS target.

Secondary targets:

- 1080p Low: usable 30 FPS on weaker hardware.
- 1080p Balanced: approximately 60 FPS on mid-range hardware.
- 1440p Balanced: approximately 60 FPS on RTX 4060 laptop.

## Presets

| Budget             | Low             | Balanced                        | High                      |
| ------------------ | --------------- | ------------------------------- | ------------------------- |
| Pixel ratio        | 0.75 to 1.0     | adaptive 1.0 to 1.25            | 1.25 to 1.5               |
| Shadows            | minimal         | selected hero shadows           | broader selected shadows  |
| Vegetation density | 30 percent      | 60 percent                      | 100 percent               |
| Water              | simple material | animated normal/reflection-lite | improved reflection-lite  |
| Particles          | off or sparse   | bounded                         | moderate                  |
| Post-processing    | off             | bloom/AO if stable              | bloom/AO/DOF where stable |
| View distance      | short           | medium                          | long                      |
| Physics            | essential only  | essential plus nearby triggers  | same as balanced          |

Automatic mode starts with Balanced and steps down when frame budgets fail repeatedly.

## Frame Budgets

- 60 FPS frame budget: 16.7 ms.
- 30 FPS frame budget: 33.3 ms.
- Balanced target on RTX 4060 laptop: average under 16.7 ms after warmup.
- Low preset floor: average under 33.3 ms after warmup.

## Scene Budgets

Initial budgets before measurement:

- Draw calls near player: under 350 in Balanced.
- Triangles near player: under 800k in Balanced.
- Active physics bodies near player: under 160.
- Dynamic shadow casters: under 12 in Balanced.
- Texture memory estimate: under 512 MB in Balanced.
- Initial `/app/world` runtime JS should be route-lazy and should not load district art on Command
  Mode routes.

These numbers are starting constraints and must be revised with measured data.

## Current W6 Baseline

The W6 terrain foundation uses code-generated geometry only:

- Terrain grid: `96 x 96` cells, approximately `18,432` triangles.
- River ribbon: `96` segments, approximately `192` triangles.
- Route ribbons: nine source-manifest routes rendered as low-cost lines.
- District foundation markers: ten simple marker groups.
- Environment props by preset:
  - Low: 18 rocks, 8 mist puffs, 5 clouds.
  - Balanced/Automatic: 30 rocks, 16 mist puffs, 9 clouds.
  - High: 44 rocks, 24 mist puffs, 14 clouds.

This baseline intentionally avoids dense foliage, large textures, downloaded assets, heavy
post-processing, and terrain-following physics. Browser screenshot and frame-metric automation
remain scheduled for W23.

## Current W7 Central Plaza Budget

The W7 Central Plaza vertical slice keeps the first polished district bounded:

- Procedural plaza primitives only; no downloaded geometry, textures, or audio.
- Six terminal pods and six in-scene text labels.
- One central emissive crystal group and one local point light.
- Four simple arch groups.
- Two low-cost animated water-channel meshes.
- Reduced-motion mode disables crystal and water-channel animation.

Until W23 visual automation is active, W7 validation relies on deterministic unit tests, type
checks, production build validation, and the existing runtime diagnostics overlay.

## Current W8 Knowledge Library Budget

The W8 Knowledge Library adds one bounded district slice:

- Procedural exterior meshes only.
- One instanced mesh for tablet/book-like shelf filler slots.
- Up to twelve featured file displays from the current vault page.
- Up to six collection shelf displays and eight tag markers.
- One local point light and two low-cost animated rings.
- Reduced-motion mode disables ring animation.

W8 does not add textures, downloaded assets, spatial audio, post-processing, dense foliage, or
interior room loading. Browser screenshot and frame-metric automation remain scheduled for W23.

## Current W9 AI Observatory Budget

The W9 AI Observatory adds one bounded mentor district slice:

- Procedural observatory exterior meshes only.
- Up to six mentor probes derived from the current mentor page.
- Three status terminals showing real mentor, conversation, provider, model, and usage counts.
- One local point light and three low-cost animated orbital rings.
- Reduced-motion mode disables ring and probe animation.

W9 does not add textures, downloaded assets, spatial audio, post-processing, live particle systems,
provider-side mutations, or custom shader work. Browser screenshot and frame-metric automation
remain scheduled for W23.

## Current W10 Habit Garden Budget

The W10 Habit Garden adds one bounded habit district slice:

- Procedural garden terrace meshes only.
- Up to eight habit plant beds derived from the current habit page.
- Up to five permanent milestone crystals derived from achievement summary and world unlock records.
- One local point light, one animated pond material, and two low-cost water-channel meshes.
- Reduced-motion mode disables pond opacity animation and plant sway.

W10 does not add textures, downloaded assets, spatial audio, post-processing, dense foliage systems,
live particles, mutation controls, or custom shader work. Browser screenshot and frame-metric
automation remain scheduled for W23.

## Current W11 Learning Academy Budget

The W11 Learning Academy adds one bounded learning district slice:

- Procedural academy exterior meshes only.
- Up to five subject wing displays derived from the current subject/topic pages.
- Up to six course hall displays derived from current courses, modules, and lessons.
- Up to eight lesson stations derived from current lessons, quizzes, and flashcards.
- Up to six bounded mastery requests per `/app/world` load for district illumination.
- One local point light, one low-cost animated academy ring group, and station-ring animation.
- Fixed DOM roadmap-progress panel with no canvas asset cost.
- Reduced-motion mode disables decorative ring and station-ring animation.

W11 does not add textures, downloaded assets, spatial audio, post-processing, live particles,
mutation controls, interior classrooms, or custom shader work. Browser screenshot and frame-metric
automation remain scheduled for W23.

## Current W12 Coding Arena Budget

The W12 Coding Arena adds one bounded coding district slice:

- Procedural arena exterior and floor meshes only.
- Up to six workspace consoles derived from the current saved-snippet page.
- Up to six exercise pylons derived from the current coding-exercise page.
- One compiler core with three low-cost animated rings and one local point light.
- One sealed runner-vault display backed by the existing runner-status contract.
- Monaco and raw editor content remain outside the canvas and retain their existing lazy Command
  Mode boundary.
- Reduced-motion mode disables compiler-ring and exercise-ring animation.

W12 does not add textures, downloaded assets, spatial audio, post-processing, code execution, custom
shaders, live particles, or in-canvas editor rendering. Browser screenshot and frame-metric
automation remain scheduled for W23.

## Runtime Diagnostics

Diagnostics must report:

- FPS.
- Frame time.
- Draw calls.
- Triangles.
- Active meshes.
- Loaded assets.
- Texture estimate where available.
- Physics bodies.
- Current preset.
- Device pixel ratio.
- Hidden-tab pause status.
- Memory warnings when available.

Diagnostics are development-only unless debug mode is explicitly enabled.

## Performance Techniques

Required:

- Lazy route and district loading.
- Instanced meshes for repeated objects.
- LOD meshes for major buildings, vegetation, and props.
- Frustum culling.
- Limited dynamic lights.
- Adaptive pixel ratio.
- Bounded particle counts.
- Physics sleeping.
- Hidden-tab pause.
- Suspense boundaries.
- Resource cleanup on unmount.

Avoid:

- Thousands of independent React mesh components.
- Per-frame React state updates.
- Loading all districts at startup.
- Full-screen expensive effects by default.
- Transparent surfaces stacked across large screen areas.
- Dynamic shadows on every object.
- Large uncompressed textures.
