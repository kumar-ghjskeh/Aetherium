# World Layout

## Scale

The target connected world is approximately `800 m x 800 m`.

The world is a central valley with a distant mountain ring. A river enters from the northern
mountains, splits around the Central Plaza, flows through the Habit Garden and Project Dock, and
exits toward lower southern terraces.

Traversal goals:

- 60 to 90 seconds between neighboring districts at jog speed.
- Around 3 minutes across the main world.
- Fast travel available everywhere.
- Cinematic travel optional and skippable.
- No vehicles.

## Coordinate System

Use meters as world units. The Central Plaza is near origin.

```text
                         North

      AI Observatory     Learning Academy     Knowledge Library
       (-198,-252)          (-60,-334)           (184,-246)

       Coding Arena       Central Plaza        Progress Tower
        (-324,76)             (0,0)              (340,-52)

        Project Dock       Habit Garden      Personal Sanctuary
        (-148,276)          (238,196)            (334,312)

                        Achievement Hall
                          (78,344)

                         South
```

Y elevation is intentionally omitted in the map. Actual layout will use terraces and ramps for
verticality.

The source of truth for these coordinates is
`apps/web/src/features/world/manifests/locations.manifest.ts`. Future terrain, pathing, district
loading, audio zones, and fast-travel systems should consume the W5 manifests instead of duplicating
location maps in scene components.

## District Plan

### Central Plaza

Spawn point, world map, continue activity, daily overview, notification terminal, and fast-travel
terminal. It must show distant landmarks and set the lighting benchmark.

### Knowledge Library

Northwest district connected by a bridge and waterfall path. It maps files, collections, tags,
favorites, and recent files to shelves, tablets, and reading tables.

### AI Observatory

Northern high terrace with dome, rotating rings, and four mentor probes. It maps mentors,
conversations, provider status, and document-QA panels.

### Habit Garden

Southwest terraces with water channels and plant beds. It maps habits, streaks, completion rate, and
weekly consistency to growth and gentle bloom states.

### Learning Academy

Western campus wings. It maps subjects, courses, modules, lessons, quizzes, flashcards, and mastery
illumination.

### Coding Arena

Southeast circular arena. It maps snippets, exercises, project-linked code, AI explain/review, and
the safe unavailable runner state.

### Project Dock

Southern river dock and workshop. It maps projects, milestones, blockers, tasks, linked files, and
construction states.

### Progress Tower

Eastern vertical landmark. It maps analytics summaries, trends, and unsupported metric states into
readable panels.

### Achievement Hall

Southeast/east monument path. It maps real achievements, certificates, completed projects, and
world-unlock identifiers.

### Personal Sanctuary

South-central elevated overlook. It maps profile, privacy, settings, favorite resources, and future
world customization.

## Routes

Primary walking routes:

- Plaza to Library through stone bridge and waterfall.
- Plaza to Observatory through ascending switchback.
- Plaza to Garden through river path.
- Garden to Project Dock along water.
- Dock to Coding Arena through metal causeway.
- Plaza to Academy through tree-lined path.
- Plaza to Progress Tower through open causeway.
- Progress Tower to Achievement Hall through gold-lit arcade.
- Plaza to Sanctuary through quiet elevated path.

## Loading Boundaries

Each district has:

- Hero geometry boundary.
- Prop/decoration boundary.
- Interaction boundary.
- Audio zone boundary.
- Optional data panel boundary.

The runtime may keep the current district and nearby district loaded, while distant districts use
low-detail silhouettes.

## Current Terrain Foundation

W6 implements the first generated world base in
`apps/web/src/features/world/engine/terrain-system.ts` and
`apps/web/src/features/world/components/environments/world-environment-scene.tsx`.

Current generated elements:

- `800 m x 800 m` terrain mesh with a central low valley and raised mountain perimeter.
- River ribbon following a deterministic north-south curve.
- Three waterfall sheets near the river path.
- Terrain-colored route surfaces from Central Plaza to each non-plaza district.
- Bounded procedural rocks, mist, and clouds scaled by graphics preset.
- Data-driven district foundation markers at the W5 location-manifest coordinates.
- Conservative terrain-bound reset when the player leaves the generated world area.

Current limitations:

- Physics uses a stable fixed traversal collider rather than a terrain-following heightfield.
- District markers are foundation anchors, not final buildings or final art.
- No dense foliage, spatial audio, dynamic weather, final route navigation, or district interiors
  exist yet.

## Current Central Plaza Slice

W7 replaces the central foundation marker with the first procedural Central Plaza vertical slice in
`apps/web/src/features/world/components/locations/central-plaza.tsx`.

Current plaza elements:

- Circular central plaza platform.
- Central Aetherium crystal/tower landmark.
- Four stone-and-metal arch silhouettes.
- Cross-shaped low-cost water channels.
- Six terminal pods for continue activity, daily overview, notifications, world map, fast travel,
  and mentors.
- Compact DOM overview panel showing real user, habit, notification, file, project, learning,
  mentor, and analytics summary data.

Current limitations:

- Terminal pods route to existing Command Mode pages through the W4 interaction framework.
- The overview is intentionally compact; complex reading, coding, and settings flows remain in
  Command Mode.
- Browser screenshot automation and measured frame budgets remain scheduled for W23.

## Current Knowledge Library Slice

W8 adds the first functional non-plaza district in
`apps/web/src/features/world/components/locations/knowledge-library.tsx`.

Current Knowledge Library elements:

- Procedural dome and entry facade at the `knowledge-library` manifest coordinates.
- Luminous rings, columns, collection shelves, bounded featured-file displays, tag constellation,
  and instanced tablet slots.
- Near-district overlay backed by real Personal Vault file, collection, and tag API responses.
- Library-specific interaction terminals for browsing vault records, searching files, and opening AI
  document workflows.

Current limitations:

- The district is an exterior slice; it does not include a walkable interior.
- File reading, download, tagging, favoriting, upload, deletion, and AI document Q&A remain in
  existing Command Mode surfaces.
- No downloaded models, textures, audio, glTF/GLB assets, or shelf-room interiors are introduced.

## Current AI Observatory Slice

W9 adds the first AI mentor district in
`apps/web/src/features/world/components/locations/ai-observatory.tsx`.

Current AI Observatory elements:

- Procedural dome, circular terrace, rotating orbital rings, entry terminal wall, columns, and
  mentor probes at the `ai-observatory` manifest coordinates.
- Probe states derived from real mentor archive state, mentor permissions, conversations, and recent
  AI usage failures.
- Near-district overlay backed by real mentor, conversation, provider, model-configuration, and AI
  usage API responses.
- Observatory-specific interaction terminals for opening mentor chat, document Q&A, and AI settings
  in Command Mode.

Current limitations:

- The district does not yet include a walkable interior or live in-world streaming chat panel.
- Mentor conversations, citation-backed document Q&A, provider configuration, and consent controls
  remain in existing Command Mode surfaces.
- Spatial audio identities for probes are deferred to W19; W9 provides visual state identities only.
- No downloaded models, textures, audio, glTF/GLB assets, custom shaders, or AI avatar models are
  introduced.

## Current Habit Garden Slice

W10 adds the first habit district in
`apps/web/src/features/world/components/locations/habit-garden.tsx`.

Current Habit Garden elements:

- Procedural terraced garden, central pond, water channels, canopy light, bounded habit plant beds,
  and permanent milestone crystals at the `habit-garden` manifest coordinates.
- Plant stages derived from active habit completion today, current streaks, 30-day completion rate,
  recovery streaks, and recent log counts.
- Near-district overlay backed by real habit summary, active habit, achievement summary, and world
  unlock data.
- Garden-specific interaction terminals for opening habit logging, creating habits, and reviewing
  habit milestones in Command Mode.

Current limitations:

- The district does not yet include dense vegetation systems, spatial audio, weather ambience, or
  advanced seasonal effects.
- Habit logging, creation, archiving, check-ins, weekly reviews, and milestone sync remain in
  existing Command Mode surfaces.
- Missing days are represented as readiness or dormancy; the current visual slice does not implement
  negative decay.
- No downloaded models, textures, audio, glTF/GLB assets, custom shaders, or particle systems are
  introduced.

## Current Learning Academy Slice

W11 adds the first learning district in
`apps/web/src/features/world/components/locations/learning-academy.tsx`.

Current Learning Academy elements:

- Procedural academy hall, wing structures, course halls, lesson stations, mastery beacon, and
  rotating study rings at the `learning-academy` manifest coordinates.
- Subject wings derived from real subjects, topics, course counts, and bounded mastery records.
- Course halls derived from real courses, modules, and lesson counts.
- Lesson stations derived from real lessons, with practice and review states from quizzes and
  flashcards.
- Near-district overlay backed by real learning pages, active goals, roadmaps, and mastery signals.
- Academy-specific interaction terminals for lesson resume, quizzes, flashcards, roadmaps, and AI
  mentor access in Command Mode.

Current limitations:

- The district does not yet include walkable interior classrooms, live quizzes, or flashcard panels
  inside World Mode.
- Study sessions, lesson completion, quiz attempts, flashcard review, course creation, roadmaps, and
  mentor conversations remain in existing Command Mode surfaces.
- Prerequisites are shown as guidance and never physically lock access to owned learning records.
- No downloaded models, textures, audio, glTF/GLB assets, custom shaders, or particle systems are
  introduced.

## Current Coding Arena Slice

W12 adds the coding district in `apps/web/src/features/world/components/locations/coding-arena.tsx`.

Current Coding Arena elements:

- Procedural circular arena, tiered stands, central compiler core, rotating code rails, workspace
  consoles, exercise pylons, and sealed runner vault at the `coding-arena` manifest coordinates.
- Workspace consoles derived from real saved-snippet titles, languages, and linked projects.
- Practice pylons derived from real exercise titles, languages, and difficulty states.
- Near-district overlay backed by real snippet, exercise, AI request, runner status, and project API
  responses.
- Arena-specific interaction terminals for workspace, exercises, AI review, runner status, and
  linked projects in Command Mode.

Current limitations:

- The district does not execute code and does not imply that an unavailable runner is operational.
- Editing, attempts, AI explain/review requests, and project updates remain in existing Command Mode
  surfaces.
- Raw code, notes, prompts, responses, starter code, and solution notes are omitted from scene view
  models.
- No downloaded models, textures, audio, glTF/GLB assets, custom shaders, or particle systems are
  introduced.

## Current Project Dock Slice

W13 adds the project district in
`apps/web/src/features/world/components/locations/project-dock.tsx`.

Current Project Dock elements:

- Procedural waterfront dock, water slips, workshop control room, crane, construction berths,
  milestone signals, and blocker beacons at the `project-dock` manifest coordinates.
- Project berths derived from real project names and statuses.
- Evidence-backed construction height from real task or milestone completion for one featured
  project.
- Near-district overlay backed by a bounded project page and one owner-scoped project detail.
- Dock-specific interaction terminals for project work, blockers, linked context, and opening the AI
  Hall without granting mutation approval.

Current limitations:

- The district does not mutate projects or silently apply AI suggestions.
- Only one featured project detail is loaded per World Mode refresh.
- Sensitive project descriptions, notes, URLs, file IDs, task details, blocker details, and activity
  metadata are omitted from the scene view model.
- No downloaded models, textures, audio, glTF/GLB assets, custom shaders, or particle systems are
  introduced.

## Current Progress Tower Slice

W14 adds the analytics district in
`apps/web/src/features/world/components/locations/progress-tower.tsx`.

Current Progress Tower elements:

- Procedural vertical tower, structural fins, metric floors, observation crown, crystal, and bounded
  study-trend columns at the `progress-tower` manifest coordinates.
- Metric floors derived from real weekly analytics values and explicit backend availability states.
- Study columns normalized only within the study-minute trend series, avoiding invalid cross-unit
  comparisons.
- Near-district overlay backed by the real analytics period, generated timestamp, metric values,
  explanations, and trend buckets.
- Tower-specific interaction terminals for detailed analytics, learning, habits, and projects in
  Command Mode.

Current limitations:

- The district does not fabricate unavailable metrics, forecasts, or synthetic activity.
- Detailed charts, alternate periods, tables, and data explanations remain in the accessible Command
  Mode analytics interface.
- The district does not yet include a walkable observation interior or spatial audio.
- No downloaded models, textures, audio, glTF/GLB assets, custom shaders, or particle systems are
  introduced.

## Current Achievement Hall Slice

W15 adds the milestone district in
`apps/web/src/features/world/components/locations/achievement-hall.tsx`.

Current Achievement Hall elements:

- Procedural monumental floor, colonnade, memorial wall, laurels, display pedestals, certificate
  plaques, completed-project models, and world-unlock crystals at the `achievement-hall` manifest
  coordinates.
- Trophy exhibits derived only from real achievement definitions with recorded unlock timestamps.
- Certificate plaques and project models derived from real saved certificates and completed
  projects.
- World-unlock crystals derived from achievement-issued location identifiers.
- Near-district overlay and interactions linking to achievements, certificates, and projects in
  Command Mode.

Current limitations:

- Locked achievement definitions are counted in text but never rendered as earned trophies.
- Achievement synchronization and all record mutations remain in Command Mode.
- The district does not yet include an enclosed walkable interior or spatial audio.
- No downloaded models, textures, audio, glTF/GLB assets, custom shaders, or particle systems are
  introduced.

## Current Personal Sanctuary Slice

W16 adds the profile and settings district in
`apps/web/src/features/world/components/locations/personal-sanctuary.tsx`.

Current Personal Sanctuary elements:

- Procedural elevated terrace, reflective ring, open pavilion, symbolic profile focus, favorite
  alcoves, certificate walk, privacy shields, and preference beacons at the `personal-sanctuary`
  manifest coordinates.
- Preset-avatar metadata mapped to an original abstract form without rendering uploaded private
  images or building an avatar editor.
- Favorite displays derived from real project and resource records, with honest empty states.
- Near-district overlay backed by owner-scoped profile, privacy, favorite, certificate, link, and
  preference records.
- Sanctuary-specific interactions linking to profile/privacy, favorite projects, favorite resources,
  and settings in Command Mode.

Current limitations:

- Profile and setting mutations remain in Command Mode.
- Sensitive profile, credential, resource, and project fields are omitted from the scene model.
- The district does not yet include spatial audio or final graphics controls.
- No downloaded models, textures, audio, glTF/GLB assets, custom shaders, or particle systems are
  introduced.

## Current Navigation Slice

W17 connects all ten districts through the source-controlled location and travel manifests.

Current navigation elements:

- Terrain-aware saved spawn and fast-travel points.
- World map with current, visited, unlocked, locked, and selected destination states.
- Walk highlighting, skippable cinematic travel, instant travel, and Command Mode deep links.
- Backend-synchronized walking and travel arrivals.
- Procedural in-world destination markers and a shared terrain collider.

Current limitations:

- Walk mode does not provide automatic pathfinding.
- Cinematic routes use deterministic terrain-aware interpolation until final camera-path polish.
- Visual screenshot and frame-time validation remain scheduled for W23.

## Deterministic Generation

Use fixed seeds for:

- Rock placement.
- Tree placement.
- Flower clusters.
- Ambient particles.
- Repeated books/tablets.
- Minor path props.

Seeded generation must be source-controlled and stable for screenshot tests.
