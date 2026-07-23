# World Mode Troubleshooting

## Blank Canvas

Check:

- WebGL2 support.
- Browser console errors.
- Failed dynamic import.
- Canvas size.
- Suspense fallback state.
- Context loss events.
- Asset load failures.

Safe behavior: show Command Mode fallback and record a non-sensitive diagnostic.

## Poor Performance

Check:

- Current graphics preset.
- Pixel ratio.
- Draw calls.
- Triangles.
- Texture estimate.
- Active physics bodies.
- Particle count.
- Shadow caster count.
- Hidden-tab pause behavior.

Safe behavior: step down to a lower preset or offer Command Mode fallback.

## Missing Asset

Check:

- Asset manifest entry.
- Repository path.
- Asset register entry.
- File case sensitivity.
- Compression output.
- Network request status.

Safe behavior: use an approved placeholder only in development diagnostics. Production should show
an error state or fallback rather than pretending the asset loaded.

## Broken Interaction

Check:

- Interaction manifest.
- Radius and position.
- Accessibility label.
- Command Mode route.
- API permission state.
- Loading and error handling.

Safe behavior: keep Command Mode link available.

## Input Problems

Check:

- Focused DOM element.
- Pointer lock or capture state.
- Keyboard layout assumptions.
- Gamepad connection state.
- Pause/panel lock state.

Safe behavior: release pointer and keep keyboard Command Mode navigation available.

## Privacy Concern

Check:

- No credentials in manifests.
- No private object keys in client state.
- No raw sensitive prompts in logs.
- No raw private document body in diagnostics.
- Existing API authorization for every data fetch.

Safe behavior: remove the data from the visual panel and route the user to the owner-scoped Command
Mode workflow.
