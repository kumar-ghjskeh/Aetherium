# Player Controller

## Goal

The player controller should feel smooth, responsive, and stable for exploration. It is not a
combat, vehicle, climbing, or multiplayer controller.

## Input Contract

Initial inputs:

- WASD and arrow keys for movement.
- Mouse for camera orbit.
- Shift for sprint.
- E for interact.
- M for map.
- Tab for Command Mode overlay.
- Ctrl/Cmd + K for command palette.
- Escape for pause/settings.
- Gamepad abstraction for movement, camera, interact, map, and pause.

Input mapping must be testable without rendering.

## Movement States

- Idle.
- Walk.
- Jog.
- Sprint.
- Braking.
- Turning.
- Falling.
- Landing.
- Interaction alignment.
- Paused.
- Panel locked.

State transitions must be deterministic and covered by tests.

## Physics Contract

Use a capsule character body with:

- Ground detection.
- Slope limits.
- Step handling.
- Collision response.
- Falling and landing.
- Movement-disabled states.

Collision geometry should be simple and authored for traversal, not copied from visual mesh detail.

## Character Strategy

The first character should be a stylized cloaked humanoid with a masked or non-detailed face. If
licensed animation assets are not available, use procedural or simple open-license clips and focus
on clean blending.

## Animation Contract

Required animation states:

- Idle.
- Walk.
- Jog.
- Sprint.
- Turn.
- Stop.
- Land.
- Interact.

Animation blending must avoid snapping. Reduced-motion mode can simplify nonessential animation but
should keep essential orientation and interaction feedback.

## Quality Checks

- Movement is camera-relative.
- Sprint has acceleration and deceleration, not an instant speed toggle.
- Character does not jitter on flat ground.
- Character does not climb unintended steep slopes.
- Pause and panel states stop player movement.
- Interaction alignment does not trap the player.
