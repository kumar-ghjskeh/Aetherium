import type {
  Collection,
  CollectionPage,
  FilePage,
  FileProcessingStatus,
  FileTag,
  TagPage,
  VaultFile
} from "@aetherium/shared-types";

import type { Vector3Tuple } from "./camera-system";

export interface KnowledgeLibraryOverviewData {
  collections: CollectionPage;
  files: FilePage;
  tags: TagPage;
}

export interface KnowledgeLibraryFileDisplay {
  detail: string;
  id: string;
  kind: VaultFile["fileKind"];
  label: string;
  position: Vector3Tuple;
  status: FileProcessingStatus;
  tone: "favorite" | "ready" | "processing" | "failed" | "standard";
}

export interface KnowledgeLibraryCollectionDisplay {
  detail: string;
  fileCount: number;
  id: string;
  label: string;
  position: Vector3Tuple;
}

export interface KnowledgeLibraryViewModel {
  collectionCountLabel: string;
  collections: KnowledgeLibraryCollectionDisplay[];
  displaySlotCount: number;
  favoriteCountLabel: string;
  featuredFiles: KnowledgeLibraryFileDisplay[];
  readyCountLabel: string;
  recentFileTitle: string;
  tagLabels: string[];
  totalFilesLabel: string;
}

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function fileTone(file: VaultFile): KnowledgeLibraryFileDisplay["tone"] {
  if (file.processingStatus === "failed") {
    return "failed";
  }
  if (file.processingStatus === "processing" || file.processingStatus === "queued") {
    return "processing";
  }
  if (file.isFavorite) {
    return "favorite";
  }
  if (file.processingStatus === "ready") {
    return "ready";
  }
  return "standard";
}

function processingDetail(file: VaultFile): string {
  switch (file.processingStatus) {
    case "ready":
      return "Ready for search and document Q&A";
    case "failed":
      return "Processing needs attention";
    case "processing":
      return "Extraction is running";
    case "queued":
      return "Waiting for extraction";
    case "not_started":
      return "Stored, not queued";
    default:
      return file.processingStatus;
  }
}

function featuredFileScore(file: VaultFile): number {
  const favoriteBoost = file.isFavorite ? 100 : 0;
  const readyBoost = file.processingStatus === "ready" ? 20 : 0;
  return favoriteBoost + readyBoost + Date.parse(file.updatedAt) / 1_000_000_000_000;
}

function fileDisplayPosition(index: number): Vector3Tuple {
  const angle = -0.95 + index * 0.27;
  const radius = 18;
  return [Math.sin(angle) * radius, 2.1 + (index % 3) * 0.16, -12 - Math.cos(angle) * 4];
}

function collectionDisplayPosition(index: number): Vector3Tuple {
  return [-17 + index * 6.8, 1.7, 12.5];
}

export function buildKnowledgeLibraryViewModel(
  data: KnowledgeLibraryOverviewData
): KnowledgeLibraryViewModel {
  const readyFiles = data.files.items.filter((file) => file.processingStatus === "ready");
  const favoriteFiles = data.files.items.filter((file) => file.isFavorite);
  const sortedFeaturedFiles = [...data.files.items]
    .sort((left, right) => featuredFileScore(right) - featuredFileScore(left))
    .slice(0, 12);
  const displaySlotCount = Math.min(
    96,
    Math.max(24, data.files.total * 2 + data.collections.total * 6)
  );

  return {
    collectionCountLabel: formatCount(data.collections.total, "collection"),
    collections: data.collections.items.slice(0, 6).map((collection, index) => ({
      detail: collection.description ?? "Vault collection",
      fileCount: countCollectionFiles(collection, data.files.items),
      id: collection.id,
      label: collection.name,
      position: collectionDisplayPosition(index)
    })),
    displaySlotCount,
    favoriteCountLabel: formatCount(favoriteFiles.length, "favorite"),
    featuredFiles: sortedFeaturedFiles.map((file, index) => ({
      detail: processingDetail(file),
      id: file.id,
      kind: file.fileKind,
      label: file.displayName,
      position: fileDisplayPosition(index),
      status: file.processingStatus,
      tone: fileTone(file)
    })),
    readyCountLabel: formatCount(readyFiles.length, "ready file"),
    recentFileTitle: data.files.items[0]?.displayName ?? "No recent file",
    tagLabels: selectTagLabels(data.tags.items),
    totalFilesLabel: formatCount(data.files.total, "file")
  };
}

function countCollectionFiles(collection: Collection, files: readonly VaultFile[]): number {
  return files.filter((file) => file.collectionIds.includes(collection.id)).length;
}

function selectTagLabels(tags: readonly FileTag[]): string[] {
  return tags.length === 0 ? ["No tags yet"] : tags.slice(0, 8).map((tag) => tag.name);
}
