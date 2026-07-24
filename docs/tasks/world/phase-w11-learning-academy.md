# Phase W11 - Learning Academy

## Scope

W11 implements the Learning Academy as a data-driven World Mode district. The district remains a
read-only presentation layer over Aetherium's existing owner-scoped learning records.

Included:

- Procedural Learning Academy exterior at the W5 manifest coordinates.
- Campus hall, wing structures, lesson stations, mastery beacon, and low-cost rotating rings.
- Real subject wings from owner-scoped subjects and topics.
- Real course halls from owner-scoped courses, modules, and lessons.
- Real lesson stations from owner-scoped lessons, with practice and review states from quizzes and
  flashcards.
- Mastery illumination from bounded topic mastery records.
- Near-district DOM panel for readable study status and Command Mode actions.
- Academy interaction terminals for lesson resume, quiz practice, flashcard review, roadmaps, and AI
  mentor access.
- Fixed `/app/world` implementation-progress panel showing completed and remaining visual World Mode
  phases.
- Read-only API/client contracts for listing course modules and lessons without fabricating world
  data.

Excluded:

- New learning mutation workflows inside World Mode.
- Physical locks that block access to owned learning records.
- Interior classrooms, dense crowds, live quiz panels, spatial audio, downloaded models, textures,
  glTF/GLB assets, shaders, or particles.
- Automated screenshot-regression coverage, which remains scheduled for W23.

## Affected Modules

- `apps/api/app/api/v1/learning.py`
- `apps/api/app/schemas/learning.py`
- `apps/api/app/services/learning.py`
- `apps/api/tests/test_learning.py`
- `packages/shared-types/src/index.ts`
- `packages/validation/src/index.ts`
- `packages/api-client/src/index.ts`
- `packages/api-client/src/index.test.ts`
- `apps/web/src/features/world/world-page.tsx`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/features/world/components/environments/world-environment-scene.tsx`
- `apps/web/src/features/world/components/locations/learning-academy.tsx`
- `apps/web/src/features/world/components/ui/learning-academy-panel.tsx`
- `apps/web/src/features/world/components/ui/world-roadmap-progress.tsx`
- `apps/web/src/features/world/engine/learning-academy-system.ts`
- `apps/web/src/features/world/manifests/interactions.manifest.ts`
- `apps/web/src/app/globals.css`

## Data Integration

The Learning Academy overview uses authenticated owner-scoped endpoints:

- `learning.listSubjects`
- `learning.listTopics`
- `learning.listCourses`
- `learning.listModules`
- `learning.listLessons`
- `learning.listSessions`
- `learning.listQuizzes`
- `learning.listFlashcards`
- `learning.listGoals`
- `learning.listRoadmaps`
- `learning.getMastery` for a bounded set of up to six topics

The world maps:

- Subjects to bounded Academy wings.
- Courses to bounded course halls.
- Modules and lessons to course structure counts.
- Lessons to station markers with active, completed, practice, or review state.
- Quizzes and flashcards to practice and review cues.
- Topic mastery to wing, hall, and beacon illumination.
- Learning goals and roadmaps to the readable near-district panel.

No lesson content, raw notes, session notes, private request bodies, session cookies, or secrets are
placed in world manifests.

## Security and Privacy Notes

- W11 introduces only read-only module and lesson list contracts.
- Service-layer filters validate optional course, module, and topic IDs through existing ownership
  helpers.
- Cross-user list filters return `404` when another user's course, module, or topic ID is supplied.
- World Mode keeps learning mutations in Command Mode and does not silently complete lessons, create
  attempts, create flashcards, or change goals.
- Prerequisites are presented as guidance. They do not physically lock access to owned learning
  records.

## Performance Notes

- The Academy renders up to five subject wings, six course halls, and eight lesson stations.
- Mastery requests are bounded to at most six topic records per `/app/world` load.
- Geometry is procedural with no external asset or texture memory cost.
- Reduced-motion mode disables decorative ring and station-ring rotation.
- No dense interiors, model downloads, post-processing, spatial audio, or custom shaders are
  introduced.

## Validation Checklist

- [x] Focused backend learning tests pass.
- [x] Focused API-client tests pass.
- [x] Focused Web type check passes.
- [x] Focused Web tests pass.
- [x] Full repository CI passes.
- [x] Alembic SQL smoke validation passes.
- [x] Git author and committer are `Sai Kumar <saikumarthota120@gmail.com>`.
- [x] Phase commit is pushed without co-author trailers.

## Known Limitations

- The Academy is an exterior slice and does not yet include walkable interior classrooms.
- Lesson completion, quizzes, flashcards, study sessions, roadmaps, and mentor conversations route
  to existing Command Mode interfaces.
- Module and lesson lists are broad owner-scoped pages; future phases may add richer course detail
  endpoints if needed.
- Browser screenshot capture and frame-metric automation are not active until W23.
