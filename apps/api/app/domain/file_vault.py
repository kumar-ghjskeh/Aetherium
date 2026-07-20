from enum import StrEnum


class FileKind(StrEnum):
    PDF = "pdf"
    TEXT = "text"
    MARKDOWN = "markdown"
    DOCX = "docx"
    CSV = "csv"
    JSON = "json"
    SOURCE_CODE = "source_code"
    IMAGE = "image"


class FileProcessingStatus(StrEnum):
    NOT_STARTED = "not_started"
    QUEUED = "queued"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class FileDeletionStatus(StrEnum):
    ACTIVE = "active"
    SOFT_DELETED = "soft_deleted"


class UploadStatus(StrEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    ABORTED = "aborted"
    EXPIRED = "expired"


class MalwareScanStatus(StrEnum):
    NOT_CONFIGURED = "not_configured"
    PENDING = "pending"
    CLEAN = "clean"
    SUSPICIOUS = "suspicious"
    FAILED = "failed"


SUPPORTED_FILE_EXTENSIONS_BY_KIND: dict[str, FileKind] = {
    ".c": FileKind.SOURCE_CODE,
    ".cc": FileKind.SOURCE_CODE,
    ".cpp": FileKind.SOURCE_CODE,
    ".csv": FileKind.CSV,
    ".docx": FileKind.DOCX,
    ".h": FileKind.SOURCE_CODE,
    ".hpp": FileKind.SOURCE_CODE,
    ".jpeg": FileKind.IMAGE,
    ".jpg": FileKind.IMAGE,
    ".js": FileKind.SOURCE_CODE,
    ".json": FileKind.JSON,
    ".md": FileKind.MARKDOWN,
    ".pdf": FileKind.PDF,
    ".png": FileKind.IMAGE,
    ".py": FileKind.SOURCE_CODE,
    ".sv": FileKind.SOURCE_CODE,
    ".ts": FileKind.SOURCE_CODE,
    ".tsx": FileKind.SOURCE_CODE,
    ".txt": FileKind.TEXT,
    ".v": FileKind.SOURCE_CODE,
}

SUPPORTED_CONTENT_TYPES_BY_EXTENSION: dict[str, tuple[str, ...]] = {
    ".c": ("text/plain", "text/x-c", "application/octet-stream"),
    ".cc": ("text/plain", "text/x-c++src", "application/octet-stream"),
    ".cpp": ("text/plain", "text/x-c++src", "application/octet-stream"),
    ".csv": ("text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"),
    ".docx": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document",),
    ".h": ("text/plain", "text/x-c", "application/octet-stream"),
    ".hpp": ("text/plain", "text/x-c++hdr", "application/octet-stream"),
    ".jpeg": ("image/jpeg",),
    ".jpg": ("image/jpeg",),
    ".js": ("text/javascript", "application/javascript", "text/plain"),
    ".json": ("application/json", "text/json", "text/plain"),
    ".md": ("text/markdown", "text/x-markdown", "text/plain"),
    ".pdf": ("application/pdf",),
    ".png": ("image/png",),
    ".py": ("text/x-python", "text/plain", "application/octet-stream"),
    ".sv": ("text/plain", "application/octet-stream"),
    ".ts": ("text/typescript", "application/typescript", "text/plain"),
    ".tsx": ("text/typescript", "application/typescript", "text/plain"),
    ".txt": ("text/plain",),
    ".v": ("text/plain", "application/octet-stream"),
}

MAX_ORIGINAL_FILE_NAME_LENGTH = 255
MAX_DISPLAY_NAME_LENGTH = 160
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
PRESIGNED_UPLOAD_EXPIRES_SECONDS = 15 * 60
PRESIGNED_DOWNLOAD_EXPIRES_SECONDS = 5 * 60
