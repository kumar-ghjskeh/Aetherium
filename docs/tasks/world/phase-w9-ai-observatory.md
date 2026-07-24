# Phase W9 - AI Observatory

## Scope

W9 implements the AI Observatory as the first mentor-focused World Mode district. The district
remains a read-only presentation layer over the existing Aetherium AI mentor, conversation,
provider, model-configuration, and usage APIs.

Included:

- Procedural AI Observatory exterior at the W5 manifest coordinates.
- Dome, rotating orbital rings, entry terminal wall, columns, mentor probes, and gateway status
  terminals.
- Real mentor overview from existing AI mentor records.
- Real conversation count, configured-provider count, enabled-model count, and recent usage count.
- Near-district DOM panel that opens existing Command Mode AI Hall and Settings surfaces.
- Observatory interaction terminals for mentor chat, document Q&A, and AI settings.
- Tests for mentor-to-probe mapping, provider/error state mapping, interaction routing, and
  `/app/world` AI data loading.

Excluded:

- New backend AI routes, new AI providers, or new AI secrets.
- In-world streaming chat UI. The readable, citation-capable AI Hall panel remains the active chat
  surface for this slice.
- Spatial audio, downloaded probe models, glTF/GLB assets, shader effects, or complex AI avatars.
- Automated screenshot-regression coverage, which remains scheduled for W23.

## Affected Modules

- `apps/web/src/features/world/world-page.tsx`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/features/world/components/environments/world-environment-scene.tsx`
- `apps/web/src/features/world/components/locations/ai-observatory.tsx`
- `apps/web/src/features/world/components/ui/ai-observatory-panel.tsx`
- `apps/web/src/features/world/engine/ai-observatory-system.ts`
- `apps/web/src/features/world/manifests/interactions.manifest.ts`
- `apps/web/src/app/globals.css`

## Data Integration

The AI Observatory overview uses existing owner-scoped authenticated endpoints:

- `mentors.list`
- `mentors.listConversations`
- `ai.listProviders`
- `ai.listModelConfigs`
- `ai.listUsage`

The world maps:

- Mentors to bounded probe displays.
- Existing conversations to greeting-ready probe state.
- Archived mentors to offline probe state.
- Disabled mentor conversation permission to waiting state.
- Recent failed or rate-limited AI usage to provider-error probe state.
- Configured provider and enabled model counts to terminal and overlay metrics.

No raw prompts, session cookies, provider API keys, provider secrets, private document text, or raw
file chunks are placed in world manifests.

## Security and Privacy Notes

- W9 is read-only in World Mode.
- Mentor conversations, document Q&A, provider settings, and consent controls continue through
  existing authenticated Command Mode routes.
- Document Q&A still requires the existing explicit file-content consent flow.
- Provider errors are summarized as status and do not expose raw provider response bodies.

## Performance Notes

- The Observatory renders a bounded set of up to six mentor probes.
- Probe states use procedural primitive meshes and low-cost emissive materials.
- One local point light and three animated orbital rings are used for district identity.
- Reduced-motion mode disables observatory ring and probe animation.
- No textures, downloaded assets, post-processing, spatial audio, or dense particle systems are
  introduced.

## Validation Checklist

- [x] Focused Web type check passes.
- [x] Focused Web tests pass.
- [x] Full repository CI passes.
- [x] Alembic SQL smoke validation passes.
- [x] Git author and committer are `Sai Kumar <saikumarthota120@gmail.com>`.
- [x] Phase commit is pushed without co-author trailers.

## Known Limitations

- The Observatory is an exterior and probe-room slice, not a walkable interior.
- In-world chat activation routes to AI Hall instead of streaming directly inside the 3D canvas.
- Probe states are derived from existing persisted AI records; no fake live speaking/listening state
  is shown.
- Browser screenshot capture and frame-metric automation are not active until W23.
