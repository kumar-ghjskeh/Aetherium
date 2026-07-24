# Camera System

## Goal

The camera should make the world feel cinematic without slowing practical work. It must remain
predictable, adjustable, and accessible.

## Current Implementation Status

W3 implements the diagnostic camera foundation. It includes pure camera math, smooth third-person
follow, mouse drag orbit, wheel distance adjustment, gamepad right-stick orbit, recenter, local
distance/FOV/sensitivity/smoothing settings, reduced-motion-aware FOV behavior, optional sprint
camera shake, and basic collision shortening against diagnostic blockers and world bounds.

Authored cinematic travel paths, final district collision meshes, interaction framing, map overview,
and production visual regression screenshots remain scheduled for later World Mode phases.

## Camera Modes

- Third-person follow.
- Interaction framing.
- Cinematic travel.
- Map/overview.
- Paused panel mode.
- Reduced-motion simplified follow.

## Follow Camera

Required behavior:

- Smooth target follow.
- Configurable lag.
- Shoulder offset.
- Adjustable distance.
- Adjustable FOV.
- Sprint FOV transition.
- Pitch limits.
- Recenter.
- Collision against world geometry.

Camera collision should prefer shortening distance over clipping through buildings or terrain.

## Cinematic Travel

Cinematic travel paths are authored in manifests and must be:

- Optional.
- Skippable.
- Reduced-motion aware.
- Bounded in duration.
- Able to hand off cleanly to player control.

`gsap` may be used only for deliberate cinematic sequences. Normal camera follow should not depend
on animation timelines.

## Settings

User-facing settings:

- Camera sensitivity.
- Invert Y.
- Camera shake.
- FOV.
- Motion smoothing.
- Cinematic travel.
- Reduced motion.

Settings must integrate with existing preferences where possible and remain local/transient when no
backend field exists yet.

## Test Plan

- Unit-test camera preference mapping.
- Unit-test pitch and distance clamping.
- Unit-test reduced-motion camera mode selection.
- Playwright-test no black-screen render and no camera clipping in fixed scenes after W3.
- Verify cinematic skip restores player control.
