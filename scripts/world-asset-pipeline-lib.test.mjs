import assert from "node:assert/strict";
import test from "node:test";

import {
  createWorldAssetReport,
  parseWorldAssetManifest,
  validateWorldAssetPipeline
} from "./world-asset-pipeline-lib.mjs";

test("parses the source-controlled TypeScript asset manifest", () => {
  const entries = parseWorldAssetManifest(`
    export const WORLD_ASSETS_MANIFEST: unknown[] = [
      { id: "building-plaza", kind: "procedural", license: "original_procedural", lodProfile: "landmark", notes: "Generated." }
    ];
  `);
  assert.deepEqual(entries, [
    {
      id: "building-plaza",
      kind: "procedural",
      license: "original_procedural",
      lodProfile: "landmark",
      notes: "Generated."
    }
  ]);
});

test("accepts registered procedural assets without runtime files", () => {
  const failures = validateWorldAssetPipeline({
    entries: [
      {
        id: "building-plaza",
        kind: "procedural",
        license: "original_procedural"
      }
    ],
    files: [],
    registerText: "| `building-plaza` |"
  });
  assert.deepEqual(failures, []);
});

test("rejects missing, unregistered, duplicate, and unsafe file assets", () => {
  const failures = validateWorldAssetPipeline({
    entries: [
      {
        attributionRequired: false,
        author: "Aetherium",
        compression: "meshopt",
        id: "library-model",
        kind: "model",
        license: "original",
        path: "apps/web/public/world/library/not-prefixed.glb",
        sha256: "expected",
        sizeBudgetBytes: 4,
        source: "generated"
      }
    ],
    files: [
      { path: "apps/web/public/world/library/not-prefixed.glb", sha256: "actual", sizeBytes: 8 },
      { path: "apps/web/public/world/library/copy.glb", sha256: "actual", sizeBytes: 8 }
    ],
    registerText: ""
  });
  assert.ok(failures.some((failure) => failure.includes("asset register")));
  assert.ok(failures.some((failure) => failure.includes("naming pattern")));
  assert.ok(failures.some((failure) => failure.includes("sha256")));
  assert.ok(failures.some((failure) => failure.includes("exceeds")));
  assert.ok(failures.some((failure) => failure.includes("unregistered")));
  assert.ok(failures.some((failure) => failure.includes("duplicates")));
});

test("reports deterministic runtime bundle totals", () => {
  assert.deepEqual(
    createWorldAssetReport(
      [{ id: "one", path: "apps/web/public/world/world-one.glb" }, { id: "two" }],
      [
        { path: "apps/web/public/world/world-one.glb", sha256: "a", sizeBytes: 12 },
        { path: "apps/web/public/world/world-two.ktx2", sha256: "b", sizeBytes: 8 }
      ]
    ),
    {
      bytesByExtension: { ".glb": 12, ".ktx2": 8 },
      fileBackedEntries: 1,
      manifestEntries: 2,
      runtimeFileCount: 2,
      totalRuntimeBytes: 20
    }
  );
});
