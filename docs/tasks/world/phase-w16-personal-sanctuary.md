# Phase W16 - Personal Sanctuary

## Scope

W16 implements Personal Sanctuary as a privacy-conscious World Mode district backed by the existing
owner-scoped profile and settings APIs.

Included:

- Procedural elevated sanctuary at the W5 manifest coordinates.
- Open pavilion, reflective ring, profile focus, favorite alcoves, certificate walk, privacy
  shields, and settings beacons.
- Preset-avatar metadata represented by an original symbolic silhouette rather than a 3D avatar
  editor or uploaded image texture.
- Real profile display name and headline, favorite projects, favorite resources, certificates,
  profile-link metadata, privacy state, and sensory/graphics preferences.
- Near-district semantic panel with honest empty states and Command Mode actions.
- Interaction points for settings, profile/avatar, favorite projects, favorite resources, and
  privacy/controls.

Excluded:

- Profile, privacy, favorite, certificate, or preference mutation inside the canvas.
- Complex avatar editing, face rendering, uploaded avatar image rendering, or photorealistic people.
- Email, biography, physical location, URLs, notes, file identifiers, project descriptions,
  objectives, repository URLs, or credentials in the scene view model.
- Downloaded models, textures, audio, glTF/GLB assets, shaders, or particles.
- Automated screenshot regression, which remains scheduled for W23.

## Data Integration

Personal Sanctuary uses authenticated owner-scoped endpoints:

- `users.getProfile()` and `users.getPrivacy()`.
- `users.listLinks({ limit: 8, offset: 0 })`.
- `users.listFavoriteProjects({ limit: 12, offset: 0 })`.
- `users.listFavoriteResources({ limit: 12, offset: 0 })`.
- The certificate page, project page, and preferences already loaded for other World Mode slices.

The world renders at most five favorite projects, five favorite resources, five certificates, and
four profile-link labels. Detailed management remains in Command Mode.

## Security and Privacy Notes

- W16 adds no backend route, migration, secret, or mutation.
- Existing authenticated owner checks remain the authorization boundary.
- The mapper intentionally omits profile email, verification details, biography, location, URLs,
  notes, raw file references, certificate credentials, and sensitive project fields.
- Browser manifests contain no user records or sensitive configuration.

## Accessibility Notes

- The nearby panel uses semantic headings, definition lists, status lists, navigation, and explicit
  text labels.
- Privacy and settings states are communicated with text, not color alone.
- All district actions have keyboard, gamepad, accessibility, and Command Mode route contracts.
- Reduced-motion mode stops the symbolic avatar motion.

## Performance Notes

- All geometry is procedural and bounded.
- Repeated displays cap at five records per category.
- One bounded local point light is used.
- W16 adds five bounded profile/settings requests but no texture, model, or audio memory.
- No per-frame React state updates are introduced.

## Validation Checklist

- [x] Focused Web type check passes.
- [x] Focused Personal Sanctuary and interaction tests pass.
- [x] Full repository CI passes.
- [x] Alembic SQL smoke validation passes.
- [x] Git author and committer are `Sai Kumar <saikumarthota120@gmail.com>`.
- [x] Phase commit is pushed without co-author trailers.

## Known Limitations

- Profile and settings changes require Command Mode.
- Uploaded avatar images are represented as a generic vault-avatar symbol for privacy and memory
  safety.
- World audio and final graphics controls are completed in W19 and W21.
- Browser screenshots and frame-metric automation remain scheduled for W23.
