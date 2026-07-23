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

## Asset Policy

Audio assets must follow the same license register rules as visual assets. Procedural or original
short loops are preferred where practical.

## Tests

- Settings mapping.
- Hidden-tab pause.
- Zone transition state.
- Mute behavior.
- Reduced sensory behavior.
