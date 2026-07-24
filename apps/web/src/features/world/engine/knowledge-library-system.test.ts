import type { CollectionPage, FilePage, TagPage, VaultFile } from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildKnowledgeLibraryViewModel } from "./knowledge-library-system";

function vaultFile(overrides: Partial<VaultFile>): VaultFile {
  return {
    collectionIds: [],
    contentType: "text/markdown",
    createdAt: "2026-07-22T00:00:00Z",
    deletedAt: null,
    deletionStatus: "active",
    displayName: "Lecture Notes",
    fileExtension: ".md",
    fileKind: "markdown",
    id: "file-1",
    isFavorite: false,
    malwareScanStatus: "not_configured",
    originalFileName: "lecture-notes.md",
    processingStatus: "ready",
    sanitizedFileName: "lecture-notes.md",
    sizeBytes: 2048,
    tags: [],
    updatedAt: "2026-07-22T00:00:00Z",
    ...overrides
  };
}

const files: FilePage = {
  items: [
    vaultFile({
      collectionIds: ["collection-1"],
      displayName: "Operating Systems",
      id: "file-1",
      isFavorite: true,
      updatedAt: "2026-07-24T00:00:00Z"
    }),
    vaultFile({
      collectionIds: ["collection-1"],
      displayName: "Circuits Lab",
      fileKind: "pdf",
      id: "file-2",
      processingStatus: "processing",
      updatedAt: "2026-07-23T00:00:00Z"
    }),
    vaultFile({
      displayName: "Compiler Errors",
      id: "file-3",
      processingStatus: "failed",
      updatedAt: "2026-07-21T00:00:00Z"
    })
  ],
  limit: 18,
  offset: 0,
  total: 3
};

const collections: CollectionPage = {
  items: [
    {
      createdAt: "2026-07-22T00:00:00Z",
      description: "Course source material",
      id: "collection-1",
      name: "Courses",
      updatedAt: "2026-07-22T00:00:00Z"
    }
  ],
  limit: 12,
  offset: 0,
  total: 1
};

const tags: TagPage = {
  items: [
    { color: "#82e6f0", createdAt: "2026-07-22T00:00:00Z", id: "tag-1", name: "systems" },
    { color: "#f0c766", createdAt: "2026-07-22T00:00:00Z", id: "tag-2", name: "circuits" }
  ],
  limit: 20,
  offset: 0,
  total: 2
};

describe("knowledge library system", () => {
  it("maps vault files, collections, and tags into bounded district displays", () => {
    const viewModel = buildKnowledgeLibraryViewModel({ collections, files, tags });

    expect(viewModel.totalFilesLabel).toBe("3 files");
    expect(viewModel.readyCountLabel).toBe("1 ready file");
    expect(viewModel.favoriteCountLabel).toBe("1 favorite");
    expect(viewModel.collectionCountLabel).toBe("1 collection");
    expect(viewModel.recentFileTitle).toBe("Operating Systems");
    expect(viewModel.displaySlotCount).toBe(24);
    expect(viewModel.collections[0]).toMatchObject({
      fileCount: 2,
      label: "Courses"
    });
    expect(viewModel.featuredFiles.map((file) => file.label)).toContain("Operating Systems");
    expect(viewModel.featuredFiles.find((file) => file.label === "Compiler Errors")).toMatchObject({
      tone: "failed"
    });
    expect(viewModel.tagLabels).toEqual(["systems", "circuits"]);
  });

  it("uses honest empty states without fabricating vault records", () => {
    const viewModel = buildKnowledgeLibraryViewModel({
      collections: { items: [], limit: 12, offset: 0, total: 0 },
      files: { items: [], limit: 18, offset: 0, total: 0 },
      tags: { items: [], limit: 20, offset: 0, total: 0 }
    });

    expect(viewModel.totalFilesLabel).toBe("0 files");
    expect(viewModel.readyCountLabel).toBe("0 ready files");
    expect(viewModel.favoriteCountLabel).toBe("0 favorites");
    expect(viewModel.recentFileTitle).toBe("No recent file");
    expect(viewModel.featuredFiles).toEqual([]);
    expect(viewModel.tagLabels).toEqual(["No tags yet"]);
  });
});
