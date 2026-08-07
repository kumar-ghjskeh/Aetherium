# Phase W12 - Coding Arena

## Scope

W12 implements the Coding Arena as a data-driven World Mode district. The district remains a
read-only presentation layer over Aetherium's existing owner-scoped coding workspace and project
records.

Included:

- Procedural circular Coding Arena at the W5 manifest coordinates.
- Arena floor, tiered stands, compiler core, rotating code rails, workspace consoles, exercise
  pylons, and a sealed runner vault.
- Real saved-snippet titles, languages, and linked-project names from owner-scoped APIs.
- Real exercise titles, languages, and difficulty states from owner-scoped APIs.
- Real AI explain/review request counts and latest request status without displaying private code,
  prompts, or responses in the scene.
- Honest code-runner availability, supported-language, and isolation-requirement state.
- Near-district DOM panel for readable coding status and Command Mode actions.
- Arena interaction terminals for workspace, exercises, AI review, runner status, and linked
  projects.
- `/app/world` implementation progress updated through W12.

Excluded:

- Arbitrary code execution or a sandbox provider.
- Editing code, submitting attempts, or invoking AI inside the 3D canvas.
- Raw code, exercise prompts, starter code, solution notes, AI prompts, AI responses, provider
  credentials, or secrets in scene view models or manifests.
- Walkable interiors, spatial audio, downloaded models, textures, glTF/GLB assets, shaders, or
  particles.
- Automated screenshot-regression coverage, which remains scheduled for W23.

## Affected Modules

- `apps/web/src/features/world/world-page.tsx`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/features/world/components/environments/world-environment-scene.tsx`
- `apps/web/src/features/world/components/locations/coding-arena.tsx`
- `apps/web/src/features/world/components/ui/coding-arena-panel.tsx`
- `apps/web/src/features/world/components/ui/world-roadmap-progress.tsx`
- `apps/web/src/features/world/engine/coding-arena-system.ts`
- `apps/web/src/features/world/manifests/interactions.manifest.ts`
- `apps/web/src/app/globals.css`

## Data Integration

The Coding Arena overview uses authenticated owner-scoped endpoints:

- `coding.listSnippets`
- `coding.listExercises`
- `coding.listAssistantRequests`
- `coding.getRunnerStatus`
- `projects.list`

The world maps:

- Saved snippets to a bounded set of workspace consoles.
- Snippet language to console accent color.
- Linked projects to readable project labels.
- Coding exercises to bounded practice pylons.
- Exercise difficulty to explicit color and text states.
- AI explain/review history to count and completion/failure status only.
- Runner availability to a sealed or ready execution boundary.
- Runner security requirements to readable status labels.

No raw code, notes, prompts, responses, object keys, session cookies, provider keys, or secrets are
placed in world manifests or the Coding Arena view model.

## Security and Privacy Notes

- W12 introduces no backend mutation, migration, execution provider, or new credential.
- All Coding Arena records come from existing authenticated owner-scoped APIs.
- The pure mapping layer intentionally omits snippet content, snippet notes, exercise prompt,
  starter code, solution notes, assistant prompt, assistant code excerpt, and assistant response.
- The unavailable runner is displayed as unavailable and does not imply that code was executed.
- Coding mutations remain in Command Mode and continue to use existing server authorization.

## Accessibility Notes

- The near-district panel uses semantic headings, definition lists, lists, navigation, and an
  explicit execution-boundary label.
- Runner state is communicated by text and border treatment, not color alone.
- Exercise difficulty is displayed as text in addition to its accent color.
- Reduced-motion mode stops compiler-ring and exercise-ring animation.
- All Coding Arena actions remain available through keyboard-accessible Command Mode links.

## Performance Notes

- The Arena renders up to six snippet consoles and six exercise pylons.
- Project labels reuse the bounded project page already loaded for Central Plaza.
- Geometry is procedural with no external model, texture, or audio memory cost.
- One local point light and bounded low-cost ring animation are added.
- No raw editor content or Monaco bundle is rendered inside the canvas; the existing coding route
  remains the full editor surface.

## Validation Checklist

- [x] Focused Web type check passes.
- [x] Focused World Mode and coding tests pass.
- [x] Full repository CI passes.
- [x] Alembic SQL smoke validation passes.
- [x] Git author and committer are `Sai Kumar <saikumarthota120@gmail.com>`.
- [x] Phase commit is pushed without co-author trailers.

## Known Limitations

- The Arena is an exterior slice and does not yet include a walkable interior.
- Monaco editing, snippet mutation, exercise attempts, and AI explain/review route to the existing
  Command Mode workspace.
- Code execution remains unavailable until a separately isolated provider satisfies every published
  security requirement.
- Browser screenshot capture and frame-metric automation are not active until W23.
