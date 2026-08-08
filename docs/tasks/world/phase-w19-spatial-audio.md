# Phase W19 - Spatial World Audio

## Boundary

Add optional zone-based World Mode audio through the browser Web Audio API. This phase uses no
downloaded audio, external service, backend schema change, migration, or new dependency.

## Implementation

- Combine the existing ten audio-zone manifests with location coordinates and radii.
- Generate deterministic filtered noise ambience and two quiet harmonic music layers.
- Spatialize ambience from district positions and update the listener from player state.
- Add procedural footsteps, interaction, mentor, achievement, and travel cues.
- Require explicit user activation before creating or resuming an `AudioContext`.
- Hydrate saved background-music and ambient-audio booleans from real user preferences.
- Provide transient master, music, ambient, and effects volume; mute; reduced-sensory; and caption
  controls for the current visit.
- Suspend audio when the browser tab is hidden and clean up all sources on unmount.
- Provide readable captions for zone, interaction, travel, and pause events.

## Security And Privacy

- No microphone, media device, geolocation, user content, or external audio URL is accessed.
- No private data enters the deterministic audio profiles.
- Browser audio state remains presentation-only; mutations still use authenticated APIs.

## Performance

- One looping noise source, one low-pass filter, one HRTF panner, and two quiet oscillators.
- One-shot cues create short-lived nodes only after audio is enabled.
- Player/listener updates are throttled to 80 milliseconds.
- Low preset reduces ambient mix gain; hidden tabs suspend the audio context.

## Validation Checklist

- [x] Zone mapping and unique-profile tests.
- [x] Preference, mute, reduced-sensory, and volume tests.
- [x] Explicit activation and sound-caption tests.
- [x] Hidden-tab suspension tests.
- [x] Strict TypeScript validation.
- [x] Full repository CI.
- [x] Production build.
- [x] Alembic SQL smoke validation.
- [ ] Commit and push.

Browser audio output and cross-browser rendering evidence join the repeatable W23 visual/runtime
harness. Core functionality remains available with audio off.
