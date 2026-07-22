from enum import StrEnum


class AvatarKind(StrEnum):
    PRESET = "preset"
    VAULT_FILE = "vault_file"


class ProfileLinkType(StrEnum):
    RESUME = "resume"
    PORTFOLIO = "portfolio"
    WEBSITE = "website"
    GITHUB = "github"
    LINKEDIN = "linkedin"
    OTHER = "other"


class ProfileVisibility(StrEnum):
    PRIVATE = "private"
    UNLISTED = "unlisted"


class FavoriteResourceType(StrEnum):
    FILE = "file"
    LEARNING_RESOURCE = "learning_resource"
    EXTERNAL_LINK = "external_link"


class DataRequestStatus(StrEnum):
    REQUESTED = "requested"
    PROCESSING = "processing"
    READY = "ready"
    CANCELED = "canceled"
    FAILED = "failed"


class AccountDeletionRequestStatus(StrEnum):
    REQUESTED = "requested"
    CANCELED = "canceled"
    COMPLETED = "completed"


DEFAULT_AVATAR_PRESET = "lumen"
ALLOWED_AVATAR_PRESETS = ("aurora", "atlas", "ember", "lumen", "sol")
DATA_EXPORT_CATEGORIES = (
    "profile",
    "settings",
    "files",
    "habits",
    "learning",
    "projects",
    "ai",
    "achievements",
)
ACCOUNT_DELETION_CONFIRMATION = "DELETE MY AETHERIUM ACCOUNT"
