# World Accessibility

## Principle

World Mode is optional. A user must be able to access core Aetherium functionality through Command
Mode without rendering 3D.

## Required Controls

- Keyboard navigation.
- Controller navigation.
- Visible focus states in all DOM panels.
- Accessible interaction labels.
- Reduced motion.
- Disable camera shake.
- Disable cinematic travel.
- Disable particles.
- Disable weather.
- High contrast.
- Text-size compatibility.
- Captions or text alternatives for important audio.
- Audio volume controls.
- Skip travel animation.
- Command Mode fallback.

## Interaction Accessibility

Spatial interactions must also expose:

- Prompt text.
- Accessible label.
- Command Mode route.
- Keyboard action.
- Disabled reason.
- Loading state.
- Error state.

Do not rely on color alone for status. Use labels, shapes, icons, and text.

## Motion And Sensory

Reduced-motion mode:

- Disables cinematic travel by default.
- Disables camera shake.
- Reduces or removes particles.
- Simplifies camera transitions.
- Keeps essential control feedback.

Reduced sensory mode:

- Mutes or lowers ambient audio.
- Disables persistent motion-heavy effects.
- Keeps readable panels and prompts.

## Fallback

Fallback must activate when:

- WebGL2 is unsupported.
- Runtime initialization fails.
- Asset loading fails without safe substitute.
- User preference requires Command Mode.
- Performance floor cannot be met.

Fallback should offer direct links to Command Mode sections and explain the reason plainly.

## Testing

- Keyboard-only navigation.
- Screen-reader labels for panels and interaction lists.
- Reduced-motion rendering.
- High-contrast UI panels.
- Focus trapping and release for modals/panels.
- Command Mode fallback availability.
