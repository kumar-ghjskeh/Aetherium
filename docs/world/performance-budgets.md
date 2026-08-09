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

## Current W13 Project Dock Budget

The W13 Project Dock adds one bounded project district slice:

- Procedural dock exterior and water-slip meshes only.
- Up to five project berths derived from the current project page.
- Up to six milestone signals and four blocker beacons from one featured project detail.
- One low-cost crane-arm animation, berth beacon animation, and local point light.
- One additional owner-scoped project-detail request per `/app/world` refresh when a project exists.
- Reduced-motion mode disables crane and berth-beacon animation.

W13 does not add textures, downloaded assets, spatial audio, post-processing, project mutation,
custom shaders, live particles, or in-canvas project editing. Browser screenshot and frame-metric
automation remain scheduled for W23.

## Current W14 Progress Tower Budget

The W14 Progress Tower adds one bounded analytics district slice:

- Procedural tower exterior and observation crown meshes only.
- Up to twelve metric floors derived from the current weekly analytics summary.
- Up to eight same-unit study-minute trend columns.
- Four structural fins, two low-cost animated crown rings, and one local point light.
- No additional API request; W14 reuses the analytics summary already loaded for Central Plaza.
- Reduced-motion mode disables crown animation.

W14 does not add textures, downloaded assets, spatial audio, post-processing, analytics mutation,
custom shaders, live particles, or in-canvas charting. Browser screenshot and frame-metric
automation remain scheduled for W23.

## Current W15 Achievement Hall Budget

The W15 Achievement Hall adds one bounded milestone district slice:

- Procedural hall, colonnade, memorial wall, laurels, and display geometry only.
- Up to ten earned achievement trophies, six certificate plaques, five completed-project exhibits,
  and six world-unlock crystals.
- Two additional bounded API requests for achievement definitions and certificate metadata.
- Shared World Mode project page expanded from five to 25 records; each district retains its own
  render cap.
- One local point light and bounded trophy, laurel, and crystal animation.
- Reduced-motion mode disables all decorative hall animation.

W15 does not add textures, downloaded assets, spatial audio, post-processing, achievement or record
mutation, custom shaders, or live particles. Browser screenshot and frame-metric automation remain
scheduled for W23.

## Current W16 Personal Sanctuary Budget

The W16 Personal Sanctuary adds one bounded profile/settings district slice:

- Procedural terrace, reflective ring, open pavilion, abstract profile focus, two favorite alcoves,
  certificate walk, privacy shields, and preference beacons.
- Up to five favorite projects, five favorite resources, five certificates, and four link labels in
  the privacy-filtered view model.
- Five additional bounded owner-scoped profile/settings requests.
- One local point light and one low-cost symbolic-avatar animation.
- Reduced-motion mode disables profile-focus animation.

W16 does not add textures, downloaded assets, spatial audio, post-processing, uploaded avatar
rendering, profile mutation, custom shaders, or live particles. Browser screenshot and frame-metric
automation remain scheduled for W23.

## Current W17 Navigation Budget

The W17 navigation slice adds:

- Ten memoized destination records and ten bounded procedural location markers.
- A DOM world map that renders only while open.
- One deterministic terrain trimesh collider generated from the visible terrain data.
- Arrival checks throttled to 750 ms.
- Travel interpolation in the existing frame loop with no per-frame React component state.
- Marker animation limited to the current and selected destination.

W17 adds no downloaded map, model, texture, or audio assets. Browser travel screenshots, console
checks, and frame metrics remain scheduled for W23.

## Current W18 Atmosphere Budget

W18 replaces the static environment sky, lights, cloud meshes, and mist meshes with one dynamic
atmosphere owner:

- Eight-minute interpolated day cycle plus deterministic day, sunset, and night inspection states.
- Low: 3 clouds, 6 mist puffs, and at most 140 rain points.
- Balanced/Automatic: 6 clouds, 12 mist puffs, and at most 360 rain points.
- High: 9 clouds, 18 mist puffs, and at most 620 rain points.
- Rain uses one point-field draw call; time interpolation updates Three.js objects directly rather
  than React state per frame.
- Reduced motion removes rain points and wind animation.
- Old W6 cloud and mist props are filtered out to avoid duplicated transparent geometry.

W18 adds no textures, downloaded assets, network weather calls, post-processing, or external
dependencies. Measured browser frame budgets remain scheduled for W23.

## Current W19 Audio Budget

W19 adds one browser audio graph after explicit user activation:

- One deterministic two-second noise buffer and looping source.
- One low-pass filter and one HRTF panner for district ambience.
- Two quiet continuous oscillators for district music identity.
- Short-lived one-shot oscillator envelopes for cues.
- Listener and footstep checks throttled to 80 milliseconds.
- Low mode scales ambient gain to 75 percent; reduced sensory mode scales all categories to 55
  percent; hidden tabs suspend the context.

No audio files are fetched, decoded, bundled, or retained. W23 must measure audio-enabled runtime
alongside the rendering scenarios.

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

## Current W20 Command Bridge Budget

W20 adds no frame-loop work while the in-world Command interface is closed. When it is open, the
canvas switches to `frameloop="never"`, Rapier pauses, player input is locked, and world audio is
ducked. The mounted scene and API state remain available so returning to exploration does not reload
district geometry or restart physics.

Transient position persistence subscribes to the player store outside React rendering and writes at
most once every 500 milliseconds. The stored payload is small, validated, expires after twelve
hours, and is written once more during unmount. Static route-to-location lookup uses the existing
ten-entry manifest and does not load Three.js into unrelated Command Mode routes.

## Current W21 Runtime Manager

W21 makes the preset table executable rather than descriptive:

- Low uses a 0.75-1.0 pixel ratio, 520 m camera range, no shadow map, 30 percent vegetation budget,
  sparse particles, and conservative draw/triangle/texture thresholds.
- Balanced uses a 1.0-1.25 pixel ratio, 780 m camera range, one 1024 shadow map, 60 percent
  vegetation budget, bounded particles, 350 draw calls, 800k triangles, and a 512 MB texture
  estimate ceiling.
- High uses a 1.25-1.5 pixel ratio, 1100 m camera range, one 2048 shadow map, full vegetation
  budget, and higher resource ceilings.
- Automatic starts at Balanced. Four consecutive slow or over-budget samples lower pixel ratio
  before lowering the tier; twelve consecutive healthy samples are required to recover quality. This
  hysteresis prevents rapid quality oscillation.

Sampling runs every 750 milliseconds and writes to a dedicated Zustand store, so diagnostics do not
rerender the parent canvas on every sample. The development overlay now reports FPS, frame time,
draw calls, triangles, active meshes, loaded GPU resources, texture-memory estimate, physics bodies,
pixel ratio, and JavaScript heap use where the browser exposes it. Runtime budget violations are
visible and also cause Automatic mode to step down.

The renderer uses ACES filmic tone mapping and the existing hidden-tab and Command-panel pause
boundaries. Actual hardware FPS evidence at 1080p and 1440p remains a W23 browser-harness
measurement; unit tests validate deterministic adaptation and budget enforcement without claiming
hardware results.

## Final W25 Qualification

W25 keeps the entire campus well below the geometry and memory ceilings while increasing visible
environment density through instancing:

- Low: 100 trees and 180 ground-cover instances.
- Balanced/Automatic: 240 trees and 520 ground-cover instances.
- High: 420 trees and 900 ground-cover instances.
- Repeated vegetation remains three instanced mesh families rather than per-item React meshes.
- Balanced and High use restrained bloom and vignette; Low and high-contrast modes bypass the
  post-processing composer.
- One camera-following directional shadow volume covers the active district instead of allocating a
  light per location.
- Ten simplified landmark colliders add ten sleeping static physics bodies at most.

Headed Chromium evidence captured on the target RTX 4060 laptop:

| Viewport  | Preset   | FPS | Frame time | Draw calls | Triangles | Active meshes | Texture estimate |
| --------- | -------- | --: | ---------: | ---------: | --------: | ------------: | ---------------: |
| 1920x1080 | Low      |  60 |    16.6 ms |        142 |    72,506 |           213 |            72 MB |
| 1920x1080 | Balanced |  35 |    28.3 ms |         1* |    91,458 |           218 |           148 MB |
| 2560x1440 | Balanced |  60 |    16.6 ms |         1* |    91,458 |           218 |           148 MB |

`*` Three.js renderer counters report the composed frame at sampling time when the post-processing
composer owns the final pass; active mesh and triangle counters remain separately sampled. The 1080p
Balanced result is above the 30 FPS usability floor but below the 60 FPS aspiration. Automatic mode
retains its sustained-sample degradation path, and the Low preset is the supported fallback.

Headless SwiftShader results are retained only as deterministic regression evidence and are not
hardware qualification.
