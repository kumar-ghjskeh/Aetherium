# Visual Testing Strategy

## Goals

World Mode visual tests must prove that the world loads, renders, performs, and falls back safely.
They must also catch broken assets, blank canvases, console errors, failed requests, and unstable
interactions.

## Test Stack

- Vitest for deterministic manifests and engine utilities.
- React Testing Library for loading, fallback, error, and panel behavior.
- Playwright for browser rendering, screenshots, console checks, failed network checks, and
  interaction smoke tests.
- Fixed seeds for repeatable visual snapshots.

## Standard Test Account

Visual tests should create or seed a local test account with deterministic non-sensitive data:

- One recent file.
- One collection and tag.
- One mentor conversation.
- One daily habit with logs.
- One subject, topic, course, lesson, quiz, and mastery record.
- One project with milestone, task, and blocker.
- One achievement state.

Seed data must be local and test-only. Do not use private user data.

## Required Captures

After visual phases begin, capture:

- Central Plaza spawn.
- Plaza approach.
- Knowledge Library.
- AI Observatory.
- Habit Garden.
- Learning Academy.
- Coding Arena.
- Project Dock.
- Progress Tower.
- Achievement Hall.
- Personal Sanctuary.
- Day, sunset, and night.
- Low preset.
- Balanced preset.
- Reduced-motion mode.
- Loading failure fallback.
- Unsupported 3D fallback.

## Assertions

Each Playwright visual test must check:

- Page loaded.
- Canvas is nonblank when rendering is expected.
- Command Mode fallback appears when rendering is disabled or unsupported.
- No critical browser console errors.
- No failed app-owned network requests except deliberately mocked failures.
- Loading state resolves.
- Interaction prompt appears for focused objects.
- Screenshot dimensions are stable.
- Frame metrics are above the phase floor.

## Performance Capture

Capture per scenario:

- Average FPS after warmup.
- Average frame time.
- Draw calls.
- Triangles.
- Loaded asset count.
- Active physics bodies.
- Preset.
- Viewport.

Early diagnostic phases may use relaxed thresholds. Final polish must meet the budgets in
`performance-budgets.md`.

## Baseline Policy

Screenshots must be generated from fixed seeds and deterministic camera positions. Baseline updates
require an intentional phase commit and a note in the phase completion report.

## Current W7 Status

W7 introduces the first visible Central Plaza district slice, but automated Playwright screenshot,
console, and frame-metric capture remain scheduled for W23. Until that harness exists, W7 relies on:

- Deterministic data-mapping tests for the plaza overview.
- DOM tests for authenticated `/app/world` loading and fallback behavior.
- Type checks and production build validation.
- The existing runtime diagnostics overlay for manual inspection.

W8 adds the Knowledge Library district and uses the same interim validation approach. It adds
deterministic vault-to-world mapping tests and verifies `/app/world` loads file, collection, and tag
DTOs for the district. Fixed screenshot capture for the Library remains part of the W23 visual
regression suite.

W9 adds the AI Observatory district and uses the same interim validation approach. It adds
deterministic mentor/probe mapping tests and verifies `/app/world` loads conversation, provider,
model-configuration, and AI usage DTOs for the district. Fixed screenshot capture for the
Observatory remains part of the W23 visual regression suite.

W10 adds the Habit Garden district and uses the same interim validation approach. It adds
deterministic habit-to-plant mapping tests and verifies `/app/world` loads habit summary, active
habit, and achievement summary DTOs for the district. Fixed screenshot capture for the Garden
remains part of the W23 visual regression suite.

W11 adds the Learning Academy district and uses the same interim validation approach. It adds
deterministic learning-record-to-wing/hall/station mapping tests, backend ownership tests for module
and lesson lists, and verifies `/app/world` loads subjects, topics, courses, modules, lessons,
sessions, quizzes, flashcards, goals, roadmaps, and bounded mastery DTOs for the district. Fixed
screenshot capture for the Academy remains part of the W23 visual regression suite.

W12 adds the Coding Arena district and uses the same interim validation approach. It adds
deterministic tests for snippet, exercise, project, AI request, and runner-status mapping; verifies
that raw code and private request content are omitted from the world view model; and verifies that
`/app/world` loads the bounded coding pages and runner contract. Fixed screenshot capture for the
Arena remains part of the W23 visual regression suite.

W13 adds Project Dock and uses the same interim validation approach. It adds deterministic tests for
project construction state, real task progress, milestone signals, blockers, linked context, and
privacy filtering; it also verifies that `/app/world` loads only one featured project detail. Fixed
screenshot capture for Project Dock remains part of the W23 visual regression suite.

W14 adds Progress Tower and uses the same interim validation approach. It adds deterministic tests
for metric availability, exact value formatting, honest no-activity states, same-unit study-trend
normalization, and accessible Command Mode handoffs. Fixed screenshot capture for Progress Tower
remains part of the W23 visual regression suite.

W15 adds Achievement Hall and uses the same interim validation approach. It adds deterministic tests
for unlocked-only trophy exhibits, exact points and dates, certificate and completed-project
mapping, world-unlock records, privacy filtering, honest empty states, and accessible Command Mode
handoffs. Fixed screenshot capture for Achievement Hall remains part of the W23 visual regression
suite.

W16 adds Personal Sanctuary and uses the same interim validation approach. It adds deterministic
tests for preset-avatar metadata, favorites, certificates, privacy and preference states, strict
private-field filtering, honest empty states, and accessible Command Mode handoffs. Fixed screenshot
capture for Personal Sanctuary remains part of the W23 visual regression suite.

W17 adds deterministic tests for destination/backend mapping, terrain-aware travel points, cinematic
interpolation, exact arrival, reduced-motion travel, locked-destination rejection, map keyboard
behavior, skip behavior, store transitions, and authenticated arrival persistence. Fixed map and
travel screenshot capture remains part of the W23 visual regression suite.

W18 adds fixed day, sunset, and night controls specifically so visual tests do not depend on wall
clock time. It also adds explicit clear, mist, and light-rain controls, deterministic automatic
weather tests, preset caps, and reduced-motion precipitation tests. The W23 suite must capture the
three fixed times, Balanced weather states, Low mode, and reduced motion through these controls.

W19 adds injectable audio-runtime tests for explicit activation, saved preference hydration, volume
changes, sound captions, and hidden-tab suspension. W23 browser scenarios must enable audio with a
user gesture, verify that activation produces no console error, verify tab suspension, and run at
least one Balanced performance capture with audio active.

## Failure Policy

If tests show a black canvas, missing asset, persistent console error, browser crash, or performance
below the required floor, stop the phase and report the diagnostic evidence instead of claiming
success.
