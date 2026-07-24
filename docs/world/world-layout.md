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

## Deterministic Generation

Use fixed seeds for:

- Rock placement.
- Tree placement.
- Flower clusters.
- Ambient particles.
- Repeated books/tablets.
- Minor path props.

Seeded generation must be source-controlled and stable for screenshot tests.
