from enum import StrEnum

DEFAULT_CHUNK_OVERLAP_CHARS = 200
DEFAULT_CHUNK_SIZE_CHARS = 1800
DEFAULT_INGESTION_MAX_ATTEMPTS = 3
DEFAULT_WORKER_POLL_SECONDS = 5


class ProcessingJobStatus(StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"


class ProcessingStage(StrEnum):
    QUEUED = "queued"
    VALIDATING = "validating"
    EXTRACTING = "extracting"
    CHUNKING = "chunking"
    INDEXING = "indexing"
    EMBEDDING = "embedding"
    READY = "ready"
    FAILED = "failed"
    CANCELED = "canceled"


class ExtractionStatus(StrEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    EMPTY = "empty"
    FAILED = "failed"


class ChunkStatus(StrEnum):
    READY = "ready"
    DELETED = "deleted"


class EmbeddingJobStatus(StrEnum):
    QUEUED = "queued"
    SKIPPED = "skipped"
    COMPLETED = "completed"
    FAILED = "failed"


class ProcessingFailureKind(StrEnum):
    VALIDATION = "validation"
    STORAGE = "storage"
    EXTRACTION = "extraction"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    INTERNAL = "internal"
