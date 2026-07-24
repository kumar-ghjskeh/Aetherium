# Phase W8 - Knowledge Library

## Scope

W8 implements the first functional non-plaza district: the Knowledge Library. The district remains a
World Mode presentation layer over the existing Personal Vault APIs.

Included:

- Procedural Knowledge Library exterior at the W5 manifest coordinates.
- Dome, entry facade, columns, luminous rings, collection shelves, file displays, tag constellation,
  and instanced tablet slots.
- Real vault overview from files, collections, and tags.
- Near-district DOM panel that opens real Command Mode Library and AI routes.
- Library interaction terminals for browsing collections, searching files, and asking AI about
  files.
- Tests for vault-to-world mapping, interaction manifest routing, and `/app/world` vault-data
  loading.

Excluded:

- Downloaded models, textures, audio, glTF/GLB assets, or interior rooms.
- In-world file mutation controls; favorites, upload, tagging, downloads, previews, and deletion
  stay in the existing Command Mode Library.
- Screenshot-regression automation, which remains scheduled for W23.

## Affected Modules

- `apps/web/src/features/world/world-page.tsx`
- `apps/web/src/features/world/components/canvas/world-runtime-canvas.tsx`
- `apps/web/src/features/world/components/environments/world-environment-scene.tsx`
- `apps/web/src/features/world/components/locations/knowledge-library.tsx`
- `apps/web/src/features/world/components/ui/knowledge-library-panel.tsx`
- `apps/web/src/features/world/engine/knowledge-library-system.ts`
- `apps/web/src/features/world/manifests/interactions.manifest.ts`
- `apps/web/src/app/globals.css`

## Data Integration

The Knowledge Library overview uses existing owner-scoped Personal Vault endpoints:

- `files.list`
- `files.listCollections`
- `files.listTags`

The world maps:

- Collections to shelf labels.
- Files to bounded tablet/crystal displays.
- Favorites to gold-toned displays.
- Ready files to blue-violet displays.
- Processing and failed files to distinct non-color-only details in the near-location panel.
- Tags to a small tag constellation.

No private document text, object keys, raw file chunks, session tokens, cookies, or AI provider keys
are placed in world manifests.

## Security and Privacy Notes

- W8 adds read-only vault visualization in World Mode.
- File mutations still route to the existing authenticated Command Mode Library.
- AI document Q&A still requires the existing explicit file-content consent flow in AI Hall.
- Empty vault states display honest absence instead of fake shelf contents.

## Performance Notes

- The Library renders a bounded number of featured file displays.
- Tablet/book-like filler slots use a single instanced mesh.
- No large textures, post-processing, dense foliage, audio, or external assets are introduced.
- Reduced-motion mode disables the library ring animation.

## Validation Checklist

- [x] Focused Web type check passes.
- [x] Focused Web tests pass.
- [x] Full repository CI passes.
- [x] Alembic SQL smoke validation passes.
- [x] Git author and committer are `Sai Kumar <saikumarthota120@gmail.com>`.
- [x] Phase commit is pushed without co-author trailers.

## Known Limitations

- The library is an exterior vertical slice, not a navigable interior.
- File preview, download, favorite, tag, upload, and delete actions intentionally remain in Command
  Mode until richer in-world panels are built.
- Browser screenshot capture and frame-metric automation are not active until W23.
