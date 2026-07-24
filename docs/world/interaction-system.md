# Interaction System

## Goal

World interactions connect spatial objects to existing Aetherium data and Command Mode workflows.
They must be generic, accessible, permission-aware, and honest about loading or error states.

## Current Implementation Status

W4 implements the reusable interaction foundation and diagnostic interaction terminals. It includes
typed interaction contracts, radius detection, facing-aware priority ranking, activation state
resolution, permission/loading/error/disabled state modeling, accessible 2D prompts, keyboard and
gamepad activation contracts, simple diagnostic markers, and Command Mode route activation through
existing world deep-link data.

Final district-specific props, custom panels, backend mutation interactions, fast travel, and
cinematic interaction framing remain scheduled for later World Mode phases.

## Interaction Types

- Open application panel.
- Start AI conversation.
- Open file collection.
- Start lesson.
- Open habit dashboard.
- Open project.
- Open analytics.
- Open achievement display.
- Fast travel.
- Continue last activity.
- Read notification.
- Enter location.

## Contract

Every interaction includes:

- Stable ID.
- Location ID.
- World position and radius.
- Prompt text.
- Accessibility label.
- Keyboard action.
- Gamepad action.
- Command Mode route.
- Optional backend route.
- Required permission state.
- Loading state.
- Error state.
- Disabled state.

## Interaction Flow

1. Player enters an interaction radius.
2. Interaction store ranks nearby actions by distance and facing.
3. Prompt appears with label and action key.
4. User activates the action.
5. Runtime pauses or aligns movement when needed.
6. System opens a world panel, starts an API request, or deep-links into Command Mode.
7. Errors are shown in a readable 2D panel with a Command Mode fallback.

## Highlighting

Use focused outlines, rim lighting, or subtle material shifts. Avoid excessive bloom. Highlighting
must have a non-color cue such as shape, prompt text, icon, or motion.

## Permission And Privacy

The client may hide unavailable interactions for ergonomics, but server authorization remains
required. Do not infer access from manifests alone.

## Tests

- Interaction radius detection.
- Priority ordering.
- Disabled and permission states.
- Keyboard and gamepad activation mapping.
- Command route generation.
- API error display.
- Reduced-motion prompt behavior.
