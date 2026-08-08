# Phase W13 - Project Dock

## Scope

W13 implements Project Dock as a data-driven World Mode district. The district remains a read-only
presentation layer over Aetherium's existing owner-scoped project records and routes all project
mutations to Command Mode.

Included:

- Procedural waterfront Project Dock at the W5 manifest coordinates.
- Dock floor, water slips, construction berths, workshop control room, crane, milestone signals, and
  blocker beacons.
- Real project names and statuses from the bounded owner-scoped project list.
- Real featured-project milestones, task completion, open blockers, linked-file count, technologies,
  and activity count.
- Evidence-backed construction height for the featured project using real task or milestone
  completion.
- Status-derived construction states for projects whose detail is not loaded.
- Near-district DOM panel for readable project status and Command Mode actions.
- Project Dock interaction terminals for the featured project, work review, blockers, project
  context, and approval-controlled AI access.
- `/app/world` implementation progress updated through W13.

Excluded:

- Project mutations inside the 3D canvas.
- Silent AI changes to projects, milestones, tasks, files, or blockers.
- Project descriptions, objectives, notes, URLs, file identifiers, task descriptions, blocker
  descriptions, activity descriptions, or activity metadata in the scene view model.
- Walkable interiors, spatial audio, downloaded models, textures, glTF/GLB assets, shaders, or
  particles.
- Automated screenshot-regression coverage, which remains scheduled for W23.

## Affected Modules

- `apps/web/src/features/world/world-page.tsx`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/features/world/components/environments/world-environment-scene.tsx`
- `apps/web/src/features/world/components/locations/project-dock.tsx`
- `apps/web/src/features/world/components/ui/project-dock-panel.tsx`
- `apps/web/src/features/world/components/ui/world-roadmap-progress.tsx`
- `apps/web/src/features/world/engine/project-dock-system.ts`
- `apps/web/src/features/world/manifests/interactions.manifest.ts`
- `apps/web/src/app/globals.css`

## Data Integration

Project Dock uses authenticated owner-scoped endpoints:

- `projects.list` for a shared page of up to 25 current projects; Project Dock renders at most five
  berths.
- `projects.get` for one featured active project or the first current project.

The world maps:

- Projects to bounded construction berths.
- Active projects to under-construction structures.
- Paused projects to quiet moored frames.
- Completed projects to finished structures.
- Featured-project task or milestone completion to evidence-backed construction height.
- Milestones to bounded dock signals with explicit text status.
- Open blockers to bounded warning beacons and readable panel labels.
- Linked files, technologies, and recent activity to aggregate counts only.

No project mutation is performed by World Mode. The AI Hall action opens the existing AI interface
without preauthorizing access or modifying the selected project.

## Security and Privacy Notes

- W13 introduces no backend route, migration, secret, or mutation.
- Project list and detail APIs already require the authenticated owner and enforce cross-user
  isolation in the project service.
- The view model intentionally omits descriptions, objectives, repository URLs, note titles and
  bodies, link URLs, file IDs, task descriptions, blocker descriptions, activity descriptions, and
  metadata.
- Project updates, blocker changes, file attachments, and AI-assisted actions remain server
  authorized in Command Mode.

## Accessibility Notes

- The panel uses semantic sections, definition lists, lists, navigation, and explicit status text.
- Construction status, blocker state, and milestone state are never communicated by color alone.
- Blockers use readable titles and a distinct warning treatment.
- Reduced-motion mode stops crane, berth-beacon, and decorative dock animation.
- Every interaction has a keyboard and gamepad action plus a Command Mode route.

## Performance Notes

- The dock renders up to five project berths, six milestone signals, and four blocker beacons.
- Only one project detail request is added to the bounded shared World Mode project page.
- Geometry is procedural with no external model, texture, or audio memory cost.
- One local point light and bounded low-cost crane and beacon animation are added.
- No project editor, charting package, file body, or AI conversation bundle renders inside the
  canvas.

## Validation Checklist

- [x] Focused Web type check passes.
- [x] Focused World Mode and project tests pass.
- [x] Full repository CI passes.
- [x] Alembic SQL smoke validation passes.
- [x] Git author and committer are `Sai Kumar <saikumarthota120@gmail.com>`.
- [x] Phase commit is pushed without co-author trailers.

## Known Limitations

- Project Dock is an exterior slice and does not yet include a walkable workshop interior.
- Only the first active project receives detailed milestone, task, blocker, file, technology, and
  activity mapping during a World Mode load.
- Project edits and AI assistance remain in existing Command Mode surfaces.
- Browser screenshot capture and frame-metric automation are not active until W23.
