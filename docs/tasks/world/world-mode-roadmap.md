# World Mode Roadmap

This roadmap implements the visual Aetherium world in controlled phases. Each phase must be
validated, committed, and pushed independently before the next phase is marked complete.

## Global Acceptance Gate

- `/app/world` loads successfully and falls back to Command Mode when 3D is unavailable.
- Command Mode remains unaffected and fully usable.
- All ten districts can be reached through walking, fast travel, and Command Mode deep links.
- Every district uses real Aetherium APIs or real empty states, never fake product data.
- Reduced motion, low graphics, unsupported WebGL, loading failures, and tab backgrounding are
  handled safely.
- Visual screenshots, console checks, interaction checks, and performance probes pass before final
  acceptance.

## Phase Table

| Phase | Scope                                                                                                                                    | Commit                                    | Required Validation                                                                                           |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| W0    | Visual World ADR, architecture docs, art direction, layout, budgets, asset register, visual testing, and task roadmap.                   | `docs: define visual world architecture`  | Docs review, `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm world:check`, production build. |
| W1    | Lazy-loaded runtime bundle, canvas wrapper, fallback states, diagnostics, minimal diagnostic scene.                                      | `feat: add world runtime foundation`      | Unit tests, RTL fallback tests, build, bundle isolation check, world guard update.                            |
| W2    | Third-person player controller, input mapping, character capsule, movement states, basic collision.                                      | `feat: add world player controller`       | Movement unit tests, interaction state tests, Playwright smoke, console check.                                |
| W3    | Smooth third-person camera, collision, FOV transitions, interaction and cinematic modes.                                                 | `feat: add cinematic world camera`        | Camera state tests, reduced-motion tests, screenshot checks.                                                  |
| W4    | Generic interaction framework for panels, mentors, files, lessons, habits, projects, analytics, achievements, travel, and notifications. | `feat: add world interaction framework`   | Interaction tests, permission tests, loading/error states.                                                    |
| W5    | Typed manifests for locations, assets, spawns, travel, interactions, environments, audio, and themes.                                    | `feat: add data driven world manifests`   | Schema tests, deterministic registry tests, route mapping tests.                                              |
| W6    | Terrain, river, waterfalls, paths, mountains, atmosphere, water, sky, and environment foundation.                                        | `feat: add world terrain and environment` | Fixed-seed tests, screenshots, performance probe.                                                             |
| W7    | Polished Central Plaza vertical slice with real overview data and functional interactions.                                               | `feat: add central plaza vertical slice`  | Spawn/approach/day/sunset/low/reduced-motion screenshots, no console errors, API-backed interactions.         |
| W8    | Interactive Knowledge Library using real file, collection, tag, favorite, and recent-file data.                                          | `feat: add interactive knowledge library` | Library data integration tests, instancing checks, file-open flows.                                           |
| W9    | AI Observatory with fictional mentor probes and real conversation panels.                                                                | `feat: add ai observatory`                | Mentor state tests, streaming tests, citation display tests.                                                  |
| W10   | Habit Garden driven by real habit logs, streaks, completion rates, and achievement state.                                                | `feat: add data driven habit garden`      | Habit integration tests, growth rule tests, no shame-based states.                                            |
| W11   | Learning Academy for subjects, courses, lessons, quizzes, flashcards, mastery, and roadmaps.                                             | `feat: add learning academy`              | Learning integration tests, mastery display checks, accessible fallback.                                      |
| W12   | Coding Arena with Monaco panel, snippets, exercises, AI review, and unavailable safe-run state.                                          | `feat: add coding arena`                  | Coding UI tests, no unsafe execution checks.                                                                  |
| W13   | Project Dock for projects, milestones, blockers, linked files, activity, and project AI context.                                         | `feat: add project dock`                  | Project integration tests, blocker state tests.                                                               |
| W14   | Progress Tower with real analytics panels and accessible chart handoff.                                                                  | `feat: add progress tower`                | Analytics data tests, chart accessibility tests.                                                              |
| W15   | Achievement Hall with real achievements, certificates, milestones, and project exhibits.                                                 | `feat: add achievement hall`              | Achievement data tests, no fake reward checks.                                                                |
| W16   | Personal Sanctuary with profile, favorites, certificates, privacy, graphics, audio, and preset avatar metadata.                          | `feat: add personal sanctuary`            | Profile/settings integration tests, privacy controls.                                                         |
| W17   | World map, markers, fast travel, cinematic travel, route highlighting, location sync, visited/unlocked state.                            | `feat: add world navigation and travel`   | Travel tests, skip animation tests, location persistence tests.                                               |
| W18   | Time, weather, sky variation, mist, wind, and performance-tiered atmosphere.                                                             | `feat: add dynamic world atmosphere`      | Preset tests, reduced-weather tests, screenshot set.                                                          |
| W19   | Zone-based audio, footsteps, interface sounds, mentor sounds, music layers, volume controls.                                             | `feat: add spatial world audio`           | Audio preference tests, tab pause tests, caption/label checks.                                                |
| W20   | Seamless Command Mode overlay, world pause, deep links, Open Now and Travel There flows.                                                 | `feat: integrate command and world modes` | Route integration tests, preserved location tests, search destination tests.                                  |
| W21   | Graphics presets, automatic performance manager, runtime metrics overlay, optimization pass.                                             | `perf: optimize world rendering`          | Performance probes at 1080p Low, 1080p Balanced, 1440p Balanced, no production debug overlay by default.      |
| W22   | Asset workflow, compression scripts, license checks, duplicate and missing asset checks, bundle reports.                                 | `chore: add world asset pipeline`         | Asset register checks, license checks, bundle-size checks.                                                    |
| W23   | Automated visual regression suite for districts, times of day, presets, reduced motion, loading failure, and fallback.                   | `test: add visual world regression suite` | Playwright screenshots, console/network checks, frame metrics.                                                |
| W24   | World accessibility support for keyboard, controller, labels, reduced motion, high contrast, captions, controls, and fallback.           | `feat: add world accessibility support`   | Accessibility tests, keyboard-only pass, reduced-motion pass.                                                 |
| W25   | Final polish, remove debug/placeholder artifacts, tune lighting/camera/collision/audio/UI, complete acceptance checks.                   | `feat: complete aetherium world mode`     | Full validation, visual suite, performance results, clean console, clean working tree.                        |

## Completion Status

All 26 phases, W0 through W25, are implemented. W25 closes the approved World Mode roadmap after the
full unit, integration, browser, visual, accessibility, policy, production-build, and migration
validation gates pass. Any subsequent visual expansion is maintenance or a separately approved
roadmap, not unfinished work from this plan.

## Branch Plan

Use one branch per major phase when the repository state allows it. Branch names should be short and
match the phase, such as `docs/visual-world-architecture`, `feat/world-runtime`,
`feat/world-player`, and `perf/world-optimization`.

## Reporting

Every phase report must include:

- Phase completed.
- Summary.
- Files changed.
- Dependencies added.
- Assets added and licenses.
- API integrations.
- Tests and visual tests.
- Performance results.
- Known limitations.
- Commands run.
- Build status.
- Commit hash.
- Push status.
- Next phase.
