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

## Deterministic Generation

Use fixed seeds for:

- Rock placement.
- Tree placement.
- Flower clusters.
- Ambient particles.
- Repeated books/tablets.
- Minor path props.

Seeded generation must be source-controlled and stable for screenshot tests.
