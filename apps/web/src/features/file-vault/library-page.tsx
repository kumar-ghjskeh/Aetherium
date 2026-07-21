"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  Collection,
  FileListQuery,
  FilePage,
  FileTag,
  UploadResponse,
  VaultFile
} from "@aetherium/shared-types";
import React from "react";

import { createBrowserApiClient } from "../auth/auth-provider";

const INITIAL_LIMIT = 25;

const contentTypesByExtension: Record<string, string> = {
  ".c": "text/plain",
  ".cpp": "text/plain",
  ".csv": "text/csv",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".h": "text/plain",
  ".hpp": "text/plain",
  ".html": "text/html",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".md": "text/markdown",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".py": "text/x-python",
  ".svg": "image/svg+xml",
  ".sv": "text/plain",
  ".ts": "text/typescript",
  ".tsx": "text/typescript",
  ".txt": "text/plain"
};

function createIdempotencyKey(prefix: string): string {
  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function contentTypeForFile(file: File): string {
  if (file.type) {
    return file.type;
  }
  const lowerName = file.name.toLowerCase();
  const extension = Object.keys(contentTypesByExtension)
    .sort((left, right) => right.length - left.length)
    .find((candidate) => lowerName.endsWith(candidate));
  return extension
    ? (contentTypesByExtension[extension] ?? "application/octet-stream")
    : "application/octet-stream";
}

function formatBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "The Personal Vault request failed.";
}

function updateFileInPage(page: FilePage | null, file: VaultFile): FilePage | null {
  if (!page) {
    return page;
  }
  return {
    ...page,
    items: page.items.map((item) => (item.id === file.id ? file : item))
  };
}

function processingStatusLabel(status: VaultFile["processingStatus"]): string {
  switch (status) {
    case "not_started":
      return "Not queued";
    case "queued":
      return "Queued for extraction";
    case "processing":
      return "Extracting text";
    case "ready":
      return "Ready for search";
    case "failed":
      return "Processing failed";
    default:
      return status;
  }
}

export function LibraryPage({
  client
}: Readonly<{
  client?: AetheriumApiClient;
}>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = React.useState<FilePage | null>(null);
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [tags, setTags] = React.useState<FileTag[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [includeDeleted, setIncludeDeleted] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadState, setUploadState] = React.useState<"idle" | "uploading">("idle");
  const [collectionName, setCollectionName] = React.useState("");
  const [collectionSelections, setCollectionSelections] = React.useState<Record<string, string>>(
    {}
  );
  const [tagDrafts, setTagDrafts] = React.useState<Record<string, string>>({});
  const [activeAction, setActiveAction] = React.useState<string | null>(null);

  const loadVault = React.useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const trimmedQuery = query.trim();
        const fileQuery: FileListQuery = {
          includeDeleted,
          limit: INITIAL_LIMIT,
          offset: 0
        };
        if (trimmedQuery) {
          fileQuery.query = trimmedQuery;
        }
        const [loadedFiles, loadedCollections, loadedTags] = await Promise.all([
          apiClient.files.list(fileQuery),
          apiClient.files.listCollections({ limit: 50, offset: 0 }),
          apiClient.files.listTags({ limit: 50, offset: 0 })
        ]);
        setFiles(loadedFiles);
        setCollections(loadedCollections.items);
        setTags(loadedTags.items);
      } catch (loadError) {
        setError(friendlyError(loadError));
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, includeDeleted, query]
  );

  React.useEffect(() => {
    void loadVault();
  }, [loadVault]);

  async function uploadToStorage(upload: UploadResponse, file: File): Promise<void> {
    const response = await fetch(upload.uploadUrl, {
      body: file,
      headers: upload.uploadHeaders,
      method: upload.uploadMethod
    });
    if (!response.ok) {
      throw new Error("Storage upload failed before Aetherium could create the file record.");
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedFile) {
      setError("Choose a supported file before uploading.");
      return;
    }

    setUploadState("uploading");
    setError(null);
    setNotice(null);

    try {
      const upload = await apiClient.files.createUpload({
        contentType: contentTypeForFile(selectedFile),
        fileName: selectedFile.name,
        idempotencyKey: createIdempotencyKey("upload"),
        sizeBytes: selectedFile.size
      });
      await uploadToStorage(upload, selectedFile);
      await apiClient.files.completeUpload(upload.id, {
        displayName: selectedFile.name,
        idempotencyKey: createIdempotencyKey("complete-upload")
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setNotice("File added to the Personal Vault.");
      await loadVault(false);
    } catch (uploadError) {
      setError(friendlyError(uploadError));
    } finally {
      setUploadState("idle");
    }
  }

  async function handleCreateCollection(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const name = collectionName.trim();
    if (!name) {
      setError("Collection name is required.");
      return;
    }
    setActiveAction("collection:create");
    setError(null);
    try {
      const collection = await apiClient.files.createCollection({ name });
      setCollections((current) => [...current, collection]);
      setCollectionName("");
      setNotice("Collection created.");
    } catch (collectionError) {
      setError(friendlyError(collectionError));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleRename(file: VaultFile): Promise<void> {
    const nextName = globalThis.prompt?.("Rename file", file.displayName);
    if (nextName === undefined || nextName === null) {
      return;
    }
    const trimmed = nextName.trim();
    if (!trimmed) {
      setError("Display name cannot be empty.");
      return;
    }
    await runFileAction(`rename:${file.id}`, async () => {
      const updated = await apiClient.files.update(file.id, { displayName: trimmed });
      setFiles((current) => updateFileInPage(current, updated));
      setNotice("File renamed.");
    });
  }

  async function handleDownload(file: VaultFile): Promise<void> {
    await runFileAction(`download:${file.id}`, async () => {
      const download = await apiClient.files.download(file.id);
      globalThis.open?.(download.downloadUrl, "_blank", "noopener,noreferrer");
      setNotice("Download URL opened.");
    });
  }

  async function handleFavorite(file: VaultFile): Promise<void> {
    await runFileAction(`favorite:${file.id}`, async () => {
      const updated = file.isFavorite
        ? await apiClient.files.unfavorite(file.id)
        : await apiClient.files.favorite(file.id);
      setFiles((current) => updateFileInPage(current, updated));
      setNotice(file.isFavorite ? "Favorite removed." : "Favorite added.");
    });
  }

  async function handleSoftDelete(file: VaultFile): Promise<void> {
    await runFileAction(`delete:${file.id}`, async () => {
      const updated = await apiClient.files.softDelete(file.id);
      if (includeDeleted) {
        setFiles((current) => updateFileInPage(current, updated));
      } else {
        setFiles((current) =>
          current
            ? {
                ...current,
                items: current.items.filter((item) => item.id !== file.id),
                total: Math.max(0, current.total - 1)
              }
            : current
        );
      }
      setNotice("File moved to deleted records.");
    });
  }

  async function handleRestore(file: VaultFile): Promise<void> {
    await runFileAction(`restore:${file.id}`, async () => {
      const updated = await apiClient.files.restore(file.id);
      setFiles((current) => updateFileInPage(current, updated));
      setNotice("File restored.");
    });
  }

  async function handlePermanentDelete(file: VaultFile): Promise<void> {
    const confirmed = globalThis.confirm?.(
      `Permanently delete "${file.displayName}" from Aetherium storage?`
    );
    if (!confirmed) {
      return;
    }
    await runFileAction(`permanent:${file.id}`, async () => {
      await apiClient.files.permanentDelete(file.id);
      setFiles((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.id !== file.id),
              total: Math.max(0, current.total - 1)
            }
          : current
      );
      setNotice("File permanently deleted.");
    });
  }

  async function handleAddToCollection(file: VaultFile): Promise<void> {
    const collectionId = collectionSelections[file.id];
    if (!collectionId) {
      setError("Choose a collection first.");
      return;
    }
    await runFileAction(`collection:${file.id}`, async () => {
      const updated = await apiClient.files.addFileToCollection(collectionId, { fileId: file.id });
      setFiles((current) => updateFileInPage(current, updated));
      setNotice("File added to collection.");
    });
  }

  async function handleAddTag(file: VaultFile): Promise<void> {
    const name = tagDrafts[file.id]?.trim();
    if (!name) {
      setError("Tag name is required.");
      return;
    }
    await runFileAction(`tag:${file.id}`, async () => {
      const updated = await apiClient.files.addTag(file.id, { name });
      setFiles((current) => updateFileInPage(current, updated));
      setTagDrafts((current) => ({ ...current, [file.id]: "" }));
      await loadVault(false);
      setNotice("Tag added.");
    });
  }

  async function handleRetryProcessing(file: VaultFile): Promise<void> {
    await runFileAction(`processing:${file.id}`, async () => {
      const jobs = await apiClient.files.listFileProcessingJobs(file.id, { limit: 5, offset: 0 });
      const retryableJob =
        jobs.items.find((job) => job.status === "failed") ??
        jobs.items.find((job) => job.fileId === file.id);
      if (!retryableJob) {
        await apiClient.files.queueProcessing(file.id);
      } else {
        await apiClient.files.retryProcessingJob(retryableJob.id);
      }
      const updated = await apiClient.files.get(file.id);
      setFiles((current) => updateFileInPage(current, updated));
      setNotice("File processing queued.");
    });
  }

  async function runFileAction(actionId: string, action: () => Promise<void>): Promise<void> {
    setActiveAction(actionId);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (actionError) {
      setError(friendlyError(actionError));
    } finally {
      setActiveAction(null);
    }
  }

  const visibleFiles = files?.items ?? [];
  const favoriteCount = visibleFiles.filter((file) => file.isFavorite).length;
  const deletedCount = visibleFiles.filter((file) => file.deletionStatus === "soft_deleted").length;

  return (
    <section className="content-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Personal Vault</p>
          <h1>Library</h1>
        </div>
        <span className="state-pill">{isLoading ? "Syncing" : `${files?.total ?? 0} files`}</span>
      </header>

      {error ? (
        <section className="inline-alert" role="alert">
          {error}
        </section>
      ) : null}
      {notice ? (
        <section className="inline-success" aria-live="polite">
          {notice}
        </section>
      ) : null}

      <div className="vault-grid">
        <section className="work-panel vault-upload-panel">
          <header>
            <div>
              <h2>Upload</h2>
              <p className="empty-note">Files are stored in Aetherium-owned object storage.</p>
            </div>
          </header>
          <form className="vault-upload-form" onSubmit={(event) => void handleUpload(event)}>
            <label className="field-label" htmlFor="vault-file">
              Choose file
              <input
                id="vault-file"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                ref={fileInputRef}
                type="file"
              />
            </label>
            <button className="primary-action" disabled={uploadState === "uploading"} type="submit">
              {uploadState === "uploading" ? "Uploading" : "Upload file"}
            </button>
          </form>
          {selectedFile ? (
            <dl className="detail-list compact-detail-list">
              <dt>Selected</dt>
              <dd>{selectedFile.name}</dd>
              <dt>Size</dt>
              <dd>{formatBytes(selectedFile.size)}</dd>
              <dt>Type</dt>
              <dd>{contentTypeForFile(selectedFile)}</dd>
            </dl>
          ) : null}
        </section>

        <section className="work-panel">
          <header className="vault-panel-header">
            <div>
              <h2>Organize</h2>
              <p className="empty-note">Collections and tags are scoped to your account.</p>
            </div>
          </header>
          <form className="inline-form" onSubmit={(event) => void handleCreateCollection(event)}>
            <label className="sr-only" htmlFor="collection-name">
              Collection name
            </label>
            <input
              id="collection-name"
              onChange={(event) => setCollectionName(event.target.value)}
              placeholder="New collection"
              value={collectionName}
            />
            <button
              className="secondary-action"
              disabled={activeAction === "collection:create"}
              type="submit"
            >
              Create
            </button>
          </form>
          <div className="vault-taxonomy">
            <div>
              <strong>Collections</strong>
              {collections.length ? (
                <ul className="chip-list">
                  {collections.map((collection) => (
                    <li key={collection.id}>{collection.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-note">No collections yet.</p>
              )}
            </div>
            <div>
              <strong>Tags</strong>
              {tags.length ? (
                <ul className="chip-list">
                  {tags.map((tag) => (
                    <li key={tag.id}>{tag.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-note">No tags yet.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="work-panel">
        <header className="vault-panel-header">
          <div>
            <h2>Files</h2>
            <p className="empty-note">
              Extraction, search indexing, and AI retrieval arrive later.
            </p>
          </div>
          <button className="secondary-action" onClick={() => void loadVault()} type="button">
            Refresh
          </button>
        </header>

        <div className="vault-filter-row">
          <label className="field-label" htmlFor="vault-search">
            Search metadata
            <input
              id="vault-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="File name"
              type="search"
              value={query}
            />
          </label>
          <label className="toggle-row vault-toggle">
            <input
              checked={includeDeleted}
              onChange={(event) => setIncludeDeleted(event.target.checked)}
              type="checkbox"
            />
            Show deleted records
          </label>
        </div>

        <div className="metric-grid vault-metrics">
          <section className="metric-panel">
            <span>Total</span>
            <strong>{files?.total ?? 0}</strong>
            <small>Current view</small>
          </section>
          <section className="metric-panel">
            <span>Favorites</span>
            <strong>{favoriteCount}</strong>
            <small>Visible files</small>
          </section>
          <section className="metric-panel">
            <span>Deleted</span>
            <strong>{deletedCount}</strong>
            <small>Visible records</small>
          </section>
          <section className="metric-panel">
            <span>Storage</span>
            <strong>
              {formatBytes(visibleFiles.reduce((total, file) => total + file.sizeBytes, 0))}
            </strong>
            <small>Visible size</small>
          </section>
        </div>

        {isLoading ? <p className="empty-note">Loading vault records...</p> : null}
        {!isLoading && visibleFiles.length === 0 ? (
          <p className="empty-note">
            {query || includeDeleted
              ? "No files match this view."
              : "No files in your Personal Vault yet."}
          </p>
        ) : null}
        {!isLoading && visibleFiles.length > 0 ? (
          <div className="vault-file-list">
            {visibleFiles.map((file) => (
              <article className="vault-file-row" key={file.id}>
                <div className="vault-file-main">
                  <div>
                    <h3>{file.displayName}</h3>
                    <p>
                      {file.fileKind} / {formatBytes(file.sizeBytes)}
                    </p>
                  </div>
                  <span
                    className={
                      file.deletionStatus === "soft_deleted"
                        ? "status-token status-token-danger"
                        : "status-token"
                    }
                  >
                    {file.deletionStatus === "soft_deleted" ? "Deleted" : "Active"}
                  </span>
                </div>

                <div className="vault-file-meta">
                  <span>{file.originalFileName}</span>
                  <span>{file.contentType}</span>
                  <span>{file.malwareScanStatus.replace("_", " ")}</span>
                </div>

                <div className="vault-processing-row">
                  <span>{processingStatusLabel(file.processingStatus)}</span>
                  {file.processingStatus === "failed" && file.deletionStatus === "active" ? (
                    <button
                      className="secondary-action"
                      disabled={activeAction === `processing:${file.id}`}
                      onClick={() => void handleRetryProcessing(file)}
                      type="button"
                    >
                      Retry processing
                    </button>
                  ) : null}
                </div>

                {file.tags.length ? (
                  <ul className="chip-list">
                    {file.tags.map((tag) => (
                      <li key={tag.id}>{tag.name}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="vault-action-grid">
                  <button
                    className="secondary-action"
                    disabled={activeAction === `download:${file.id}`}
                    onClick={() => void handleDownload(file)}
                    type="button"
                  >
                    Download
                  </button>
                  <button
                    aria-label={`Rename ${file.displayName}`}
                    className="secondary-action"
                    disabled={
                      file.deletionStatus === "soft_deleted" || activeAction === `rename:${file.id}`
                    }
                    onClick={() => void handleRename(file)}
                    type="button"
                  >
                    Rename
                  </button>
                  <button
                    aria-label={
                      file.isFavorite
                        ? `Remove ${file.displayName} from favorites`
                        : `Mark ${file.displayName} as favorite`
                    }
                    className="secondary-action"
                    disabled={
                      file.deletionStatus === "soft_deleted" ||
                      activeAction === `favorite:${file.id}`
                    }
                    onClick={() => void handleFavorite(file)}
                    type="button"
                  >
                    {file.isFavorite ? "Unfavorite" : "Favorite"}
                  </button>
                  {file.deletionStatus === "soft_deleted" ? (
                    <>
                      <button
                        className="secondary-action"
                        disabled={activeAction === `restore:${file.id}`}
                        onClick={() => void handleRestore(file)}
                        type="button"
                      >
                        Restore
                      </button>
                      <button
                        className="danger-action"
                        disabled={activeAction === `permanent:${file.id}`}
                        onClick={() => void handlePermanentDelete(file)}
                        type="button"
                      >
                        Delete forever
                      </button>
                    </>
                  ) : (
                    <button
                      className="danger-action"
                      disabled={activeAction === `delete:${file.id}`}
                      onClick={() => void handleSoftDelete(file)}
                      type="button"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {file.deletionStatus === "active" ? (
                  <div className="vault-organize-row">
                    <label>
                      <span className="sr-only">Collection for {file.displayName}</span>
                      <select
                        aria-label={`Collection for ${file.displayName}`}
                        disabled={collections.length === 0}
                        onChange={(event) =>
                          setCollectionSelections((current) => ({
                            ...current,
                            [file.id]: event.target.value
                          }))
                        }
                        value={collectionSelections[file.id] ?? ""}
                      >
                        <option value="">Collection</option>
                        {collections.map((collection) => (
                          <option key={collection.id} value={collection.id}>
                            {collection.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="secondary-action"
                      disabled={
                        collections.length === 0 || activeAction === `collection:${file.id}`
                      }
                      onClick={() => void handleAddToCollection(file)}
                      type="button"
                    >
                      Add
                    </button>
                    <label>
                      <span className="sr-only">Tag for {file.displayName}</span>
                      <input
                        aria-label={`Tag for ${file.displayName}`}
                        onChange={(event) =>
                          setTagDrafts((current) => ({
                            ...current,
                            [file.id]: event.target.value
                          }))
                        }
                        placeholder="Tag"
                        value={tagDrafts[file.id] ?? ""}
                      />
                    </label>
                    <button
                      className="secondary-action"
                      disabled={activeAction === `tag:${file.id}`}
                      onClick={() => void handleAddTag(file)}
                      type="button"
                    >
                      Add tag
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
