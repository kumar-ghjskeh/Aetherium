# Audio System

## Goal

World audio should add atmosphere without making study tiring or inaccessible. It must be optional,
volume-controlled, and paused or reduced when the tab is inactive.

## Audio Zones

Each district has a zone:

- Central Plaza: soft wind, water, distant crystal tone.
- Knowledge Library: muffled water, paper/tablet ambience, low chime.
- AI Observatory: dome resonance, subtle probe tones.
- Habit Garden: soft wind, water, foliage movement.
- Learning Academy: quiet bells, hall ambience.
- Coding Arena: low electronic hum, terminal ticks.
- Project Dock: river, wood, distant machinery.
- Progress Tower: airy data pulse.
- Achievement Hall: warm hall resonance.
- Personal Sanctuary: low interior ambience.

## Categories

- Master.
- Music.
- Effects.
- Ambient.
- Interface.

Settings must support mute and reduced sensory mode.

## Implementation Contract

- Audio loads by district.
- Audio is not required for core functionality.
- Audio pauses or fades when tab is hidden.
- Complex panels reduce ambient audio.
- Captions or text alternatives are provided for meaningful audio cues.
- No autoplay surprise beyond browser-permitted, user-initiated behavior.

## W19 Implementation

World Mode uses one procedural Web Audio graph after explicit user activation:

- A deterministic noise buffer passes through a district-tuned low-pass filter and HRTF panner.
- Two quiet oscillators provide district-specific harmonic identity.
- Short-lived oscillator envelopes provide footsteps, interaction, mentor, achievement, and travel
  cues.
- Player state updates listener position and direction at a throttled cadence.
- Zone transitions use the source-controlled audio and location manifests.
- Hidden tabs suspend the `AudioContext`; unmounting stops sources and closes it.

The engine does not access a microphone, media device, geolocation, private user content, or an
external audio URL.

## Settings

Saved `backgroundMusicEnabled` and `ambientAudioEnabled` preferences remain authoritative. The
backend currently has no volume fields, so master/music/ambient/effects volume, mute,
reduced-sensory mode, and sound captions are explicitly visit-scoped controls. They do not claim
persistence.

Core Aetherium workflows never require audio. Meaningful zone, interaction, travel, and pause cues
have an `aria-live` text caption.

## Asset Policy

Audio assets must follow the same license register rules as visual assets. Procedural or original
short loops are preferred where practical.

## Tests

- Settings mapping.
- Hidden-tab pause.
- Zone transition state.
- Mute behavior.
- Reduced sensory behavior.
