# World Mode Architecture

## Purpose

World Mode is Aetherium's optional spatial presentation layer. It turns real user-owned learning,
files, mentors, habits, projects, analytics, achievements, profile, and notifications into an
explorable 3D campus while preserving Command Mode as the fastest and most accessible interface.

## Runtime Layers

```text
/app/world route
  |
  +-- WorldShell
        |
        +-- capability checks
        +-- reduced-motion checks
        +-- lazy 3D runtime import
        +-- Command Mode fallback
        |
        +-- WorldCanvas
              |
              +-- scene registry
              +-- location manifests
              +-- interaction system
              +-- player controller
              +-- camera system
              +-- performance manager
              +-- diagnostics
```

Server state flows through the existing typed API client. Transient scene state stays in Zustand
stores and is discarded when World Mode unmounts unless a deliberate backend sync occurs through an
existing endpoint such as `/api/v1/world/visit`.

## Proposed Source Structure

```text
apps/web/src/features/world/
  components/
    canvas/
    character/
    camera/
    environments/
    locations/
    interactions/
    navigation/
    ui/
    effects/
    audio/
    diagnostics/
  engine/
    world-runtime.ts
    asset-loader.ts
    scene-registry.ts
    interaction-system.ts
    navigation-system.ts
    performance-manager.ts
    weather-manager.ts
    time-manager.ts
    save-sync.ts
  manifests/
    world.manifest.ts
    locations.manifest.ts
    assets.manifest.ts
    interactions.manifest.ts
    travel.manifest.ts
    environments.manifest.ts
    audio.manifest.ts
  state/
    world-store.ts
    player-store.ts
    camera-store.ts
    interaction-store.ts
    settings-store.ts
  hooks/
  schemas/
  workers/
  tests/
  index.ts
```

## Data Flow

- Authentication and user identity come from the existing auth provider.
- Preferences come from `/api/v1/settings/preferences`.
- World profile and visit state come from `/api/v1/world/*`.
- Location and deep-link contracts come from the existing world APIs.
- Files, collections, and tags come from `/api/v1/files`.
- Mentors and conversations come from `/api/v1/mentors` and `/api/v1/ai`.
- Habits come from `/api/v1/habits`.
- Learning data comes from `/api/v1/learning` and `/api/v1/knowledge`.
- Projects come from `/api/v1/projects`.
- Analytics come from `/api/v1/analytics`.
- Achievements come from `/api/v1/achievements`.
- Profile and privacy settings come from `/api/v1/users`.

The scene never infers ownership. Cross-user protection remains backend-enforced.

## Route And Bundle Boundary

World Mode must be lazy-loaded from `/app/world`. Importing Command Mode pages must not import
Three.js, physics, post-processing, audio engines, or world assets.

The first implementation should use a dynamic client boundary:

- Static `/app/world` page renders a shell.
- The shell performs capability and preference checks.
- The shell dynamically imports the visual runtime only when allowed.
- Failed imports or runtime errors render Command Mode fallback actions.

## Runtime State

World runtime state should be split by responsibility:

- `world-store`: active location, loading stage, seed, paused state, feature flags.
- `player-store`: position, velocity mode, grounded state, input mode, interaction lock.
- `camera-store`: orbit values, follow target, distance, FOV, cinematic state.
- `interaction-store`: nearby interactions, focused interaction, active panel.
- `settings-store`: graphics preset, sensory settings, camera preferences, diagnostics enabled.

Avoid per-frame React state updates. Per-frame values should live in refs, stores designed for frame
use, or physics state.

## Scene Registry

The scene registry maps manifest IDs to lazy loaders. A location can be active, nearby, dormant, or
unloaded. The registry decides which chunks are loaded based on player position, fast-travel target,
camera path, and performance preset.

W5 implements the initial source-controlled manifest layer:

- `world.manifest.ts` combines registries for themes, assets, locations, spawns, fast travel, camera
  routes, interactions, environment zones, and audio zones.
- `locations.manifest.ts` maps ten future visual district IDs to the existing backend world location
  identifiers and Command Mode routes.
- `interactions.manifest.ts` defines diagnostic interaction terminals that are converted to runtime
  interactions only after backend location unlock state and deep-link contracts are loaded.
- `scene-registry.ts` validates manifest references and exposes deterministic location, fast-travel,
  and interaction lookups.

These manifests are not an authorization boundary. They contain no private user data, object keys,
AI provider configuration, cookies, or secrets. Runtime actions must still use owner-scoped
Aetherium APIs.

## Terrain Foundation

W6 introduces a deterministic terrain engine:

- `terrain-system.ts` owns height sampling, river-center calculation, terrain mesh data, river
  ribbon data, central routes, preset-scaled environment budgets, and seeded prop placement.
- `world-environment-scene.tsx` renders the generated terrain, water, waterfall sheets, route lines,
  foundation markers, and bounded environment props.
- The generated environment consumes W5 manifests for location positions and theme colors.
- Player bounds use the terrain world size to reset safely when the player exits the generated 800 m
  area.

The current collision surface is still conservative and flat. Terrain-following collision,
district-specific collision meshes, final pathfinding, and authored travel routes remain later work.

## Interaction Boundary

World interactions are generic contracts:

- Prompt and accessible label.
- Interaction radius.
- Keyboard and gamepad action.
- Backend route or Command Mode deep link.
- Permission state.
- Loading, error, and disabled states.

Complex reading, coding, AI chat, analytics, and settings workflows open existing 2D panels or
Command Mode routes. The world pauses or throttles while those panels are active.

## Failure Modes

World Mode must handle:

- Unsupported WebGL2.
- Context loss.
- Asset load failure.
- Physics initialization failure.
- API failure.
- Hidden-tab pause.
- Reduced-motion fallback.
- Low-performance fallback.

Every failure state must present a path back to Command Mode.
