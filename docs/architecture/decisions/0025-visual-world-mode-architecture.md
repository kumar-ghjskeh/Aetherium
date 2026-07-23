# ADR 0025 - Visual World Mode Architecture

## Status

Accepted.

## Context

Aetherium has completed the non-3D roadmap and now needs a browser-based visual World Mode that uses
the existing Aetherium backend as the source of truth. The target is a polished stylized 3D learning
world that remains practical, accessible, standalone, and testable by one developer using free
tooling.

The visual world must not replace Command Mode. It must be a progressive presentation layer that can
fail safely, lazy-load only on `/app/world`, and map interactions back to existing owner-scoped
APIs.

## Decision

### Rendering Stack

Aetherium will implement visual World Mode inside the existing Next.js web app using:

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/rapier`
- `three-stdlib`
- `zustand`
- `@react-three/postprocessing`
- `@react-spring/three`
- `gsap` only for deliberate skippable cinematic camera travel

WebGL2 is the stable default renderer. WebGPU may be explored only behind a feature flag after the
WebGL2 runtime is stable.

The existing `pnpm world:check` guard remains active until Phase W1 updates it to allow only this
approved dependency set and to continue blocking unapproved 3D/game dependencies and unregistered
asset files.

### Runtime Boundary

`/app/world` will become a lazy route-level boundary. Three.js, React Three Fiber, physics, visual
assets, and post-processing code must not be imported by unrelated Command Mode routes.

The world runtime will be organized under `apps/web/src/features/world/` with separate engine,
manifest, state, hooks, component, test, and diagnostic layers. Data contracts come from the
existing typed API client.

### World Source Of Truth

World Mode is a presentation layer. It must not duplicate business logic for:

- Files and collections.
- AI mentors and conversations.
- Habits and streaks.
- Learning, lessons, mastery, and flashcards.
- Projects, milestones, tasks, and blockers.
- Analytics.
- Achievements and future world unlocks.
- Profile, preferences, privacy, and notifications.

World interactions call existing authenticated APIs or deep-link into Command Mode. Server
authorization remains the protection boundary.

### Scene Boundaries

The world will use source-controlled typed manifests for:

- World layout.
- Location registry.
- Spawn points.
- Fast-travel points.
- Interaction points.
- Camera paths.
- Environment zones.
- Audio zones.
- Asset references.
- LOD profiles.
- Performance tiers.
- Command Mode routes.

Each major district is a lazy loading boundary. The first runtime phase may include only a
diagnostic scene. Final districts are built phase by phase.

### World Scale

The target connected world is approximately `800 m x 800 m`, with a central valley, mountain ring,
river, waterfalls, forested routes, and ten major locations:

1. Central Plaza
2. Knowledge Library
3. AI Observatory
4. Habit Garden
5. Learning Academy
6. Coding Arena
7. Project Dock
8. Progress Tower
9. Achievement Hall
10. Personal Sanctuary

### Physics

Rapier is the selected physics layer because it is mature for web, integrates with React Three
Fiber, supports character-controller foundations, and avoids building collision and rigid-body
behavior from scratch.

The initial physics scope is character capsule movement, static collision, ground detection, slope
limits, step handling, falling, and interaction alignment. Combat, vehicles, destruction,
multiplayer, and complex simulation are out of scope.

### Progressive Fallback

World Mode must fall back to Command Mode when:

- WebGL2 is unavailable.
- 3D initialization fails.
- Reduced motion or reduced sensory settings require fallback.
- A required visual asset fails without a safe substitute.
- Device memory or performance probes fall below the low preset floor.
- The tab is hidden and rendering must pause.

Fallback must preserve access to `/app` and all existing Command Mode domain pages.

### Performance Strategy

The primary target is an RTX 4060 laptop GPU with 32 GB RAM at 2560 x 1440 on Balanced settings,
targeting approximately 60 FPS. Low mode must remain usable at 1080p on weaker hardware.

World Mode will use:

- Route-level and district-level lazy loading.
- Instancing for repeated vegetation, props, books, crystals, terminals, and displays.
- LOD profiles.
- Frustum culling.
- Limited shadow casters.
- Adaptive pixel ratio.
- Physics sleeping and low body counts.
- Pausing on hidden tabs.
- Memoized scene components.
- Bounded particles.
- Post-processing only by performance tier.

### Accessibility

Every core world action must have a Command Mode equivalent. World Mode must support keyboard and
controller interaction, visible prompts, screen-readable labels through DOM panels, reduced motion,
disabled camera shake, disabled particles, disabled weather, volume controls, high contrast, skip
travel, and no color-only status communication.

### Privacy And Security

The browser remains untrusted. World manifests must not contain credentials, private object keys,
raw file contents, session tokens, AI-provider keys, database URLs, Redis URLs, or MinIO master
credentials.

World panels may show user data only through existing authenticated APIs. Mutations must remain
server-authorized. AI-assisted mutations still require explicit approval.

### Asset Policy

Allowed assets are:

- Original procedural geometry.
- Script-generated Blender outputs.
- CC0 or public-domain assets.
- MIT-compatible utilities.
- Free licensed glTF/GLB assets with clear redistribution rights.

Disallowed assets are:

- Ripped game assets.
- Paid assets.
- Copyrighted characters or brands.
- Proprietary game files.
- Assets with unclear licensing.
- Unattributed downloads.

Every committed visual or audio asset must be recorded in `docs/world/asset-register.md`.

### Testing Strategy

World Mode requires:

- Unit tests for manifests, deterministic generation, input mapping, state transitions, and
  performance tier selection.
- React Testing Library tests for loading, error, fallback, and data-panel behavior.
- Playwright screenshot tests for stable scenes after visual phases begin.
- Console-error and failed-request checks.
- Fixed-seed visual regression captures.
- Performance probes for FPS, frame time, draw calls, triangles, asset counts, physics bodies, and
  memory warnings.

### Browser Support

The stable runtime targets modern Chromium, Firefox, and Safari versions with WebGL2. Unsupported
browsers must render Command Mode fallback.

### Memory Constraints

The runtime must avoid loading every district at startup. Asset manifests must support explicit
unload boundaries, and diagnostics must report loaded assets and approximate texture memory where
available.

## Consequences

- W1 may install the approved 3D dependency set and update `pnpm world:check` accordingly.
- Visual World Mode remains optional and isolated from Command Mode.
- Future world phases have a clear performance, accessibility, privacy, and licensing contract.
- The initial visual goal is stylized cinematic quality, not photorealistic AAA scale.

## Follow-Up Work

- Implement the lazy world runtime foundation in Phase W1.
- Add dependency and asset checks that allow only approved visual-world dependencies.
- Add Playwright visual infrastructure before final district polish.
- Revisit backend scene-manifest values when the visual runtime has a stable feature flag.
