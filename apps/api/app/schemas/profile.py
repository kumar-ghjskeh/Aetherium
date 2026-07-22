from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.domain.profile import (
    ACCOUNT_DELETION_CONFIRMATION,
    ALLOWED_AVATAR_PRESETS,
    DATA_EXPORT_CATEGORIES,
    AccountDeletionRequestStatus,
    AvatarKind,
    DataRequestStatus,
    FavoriteResourceType,
    ProfileLinkType,
    ProfileVisibility,
)


class ProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


def _clean_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(value.strip().split())
    return cleaned or None


def _validate_http_url(value: str | None) -> str | None:
    cleaned = _clean_optional_text(value)
    if cleaned is None:
        return None
    if not cleaned.startswith(("http://", "https://")):
        raise ValueError("URL must start with http:// or https://")
    return cleaned


class UserProfileResponse(ProfileSchema):
    id: UUID
    user_id: UUID = Field(alias="userId")
    email: str
    display_name: str = Field(alias="displayName")
    is_email_verified: bool = Field(alias="isEmailVerified")
    headline: str | None
    bio: str | None
    location: str | None
    website_url: str | None = Field(alias="websiteUrl")
    avatar_kind: AvatarKind = Field(alias="avatarKind")
    avatar_preset: str | None = Field(alias="avatarPreset")
    avatar_file_id: UUID | None = Field(alias="avatarFileId")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class UserProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    display_name: str | None = Field(
        default=None, alias="displayName", min_length=1, max_length=120
    )
    headline: str | None = Field(default=None, max_length=160)
    bio: str | None = Field(default=None, max_length=4000)
    location: str | None = Field(default=None, max_length=120)
    website_url: str | None = Field(default=None, alias="websiteUrl", max_length=500)
    avatar_preset: str | None = Field(default=None, alias="avatarPreset", max_length=80)
    avatar_file_id: UUID | None = Field(default=None, alias="avatarFileId")

    @field_validator("display_name", "headline", "location")
    @classmethod
    def clean_short_text(cls, value: str | None) -> str | None:
        return _clean_optional_text(value)

    @field_validator("bio")
    @classmethod
    def clean_bio(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("website_url")
    @classmethod
    def validate_website_url(cls, value: str | None) -> str | None:
        return _validate_http_url(value)

    @field_validator("avatar_preset")
    @classmethod
    def validate_avatar_preset(cls, value: str | None) -> str | None:
        cleaned = _clean_optional_text(value)
        if cleaned is not None and cleaned not in ALLOWED_AVATAR_PRESETS:
            raise ValueError("Unknown avatar preset")
        return cleaned

    @model_validator(mode="after")
    def validate_update(self) -> "UserProfileUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one profile field is required")
        if "avatar_preset" in self.model_fields_set and "avatar_file_id" in self.model_fields_set:
            raise ValueError("Use either avatarPreset or avatarFileId in one update")
        return self


class ProfileLinkResponse(ProfileSchema):
    id: UUID
    link_type: ProfileLinkType = Field(alias="linkType")
    title: str
    url: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class ProfileLinkCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    link_type: ProfileLinkType = Field(alias="linkType")
    title: str = Field(min_length=1, max_length=120)
    url: str = Field(min_length=1, max_length=500)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        cleaned = _clean_optional_text(value)
        if cleaned is None:
            raise ValueError("Title is required")
        return cleaned

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        cleaned = _validate_http_url(value)
        if cleaned is None:
            raise ValueError("URL is required")
        return cleaned


class ProfileLinkPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[ProfileLinkResponse]
    total: int
    limit: int
    offset: int


class FavoriteProjectResponse(ProfileSchema):
    id: UUID
    project_id: UUID = Field(alias="projectId")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class FavoriteProjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    project_id: UUID = Field(alias="projectId")


class FavoriteProjectPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[FavoriteProjectResponse]
    total: int
    limit: int
    offset: int


class FavoriteResourceResponse(ProfileSchema):
    id: UUID
    resource_type: FavoriteResourceType = Field(alias="resourceType")
    file_id: UUID | None = Field(alias="fileId")
    learning_resource_id: UUID | None = Field(alias="learningResourceId")
    title: str
    url: str | None
    notes: str | None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class FavoriteResourceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    resource_type: FavoriteResourceType = Field(alias="resourceType")
    file_id: UUID | None = Field(default=None, alias="fileId")
    learning_resource_id: UUID | None = Field(default=None, alias="learningResourceId")
    title: str | None = Field(default=None, max_length=160)
    url: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("title", "notes")
    @classmethod
    def clean_text(cls, value: str | None) -> str | None:
        return _clean_optional_text(value)

    @field_validator("url")
    @classmethod
    def clean_url(cls, value: str | None) -> str | None:
        return _validate_http_url(value)

    @model_validator(mode="after")
    def validate_resource_reference(self) -> "FavoriteResourceCreate":
        if self.resource_type == FavoriteResourceType.FILE and self.file_id is None:
            raise ValueError("File favorites require fileId")
        if (
            self.resource_type == FavoriteResourceType.LEARNING_RESOURCE
            and self.learning_resource_id is None
        ):
            raise ValueError("Learning-resource favorites require learningResourceId")
        if self.resource_type == FavoriteResourceType.EXTERNAL_LINK and (
            self.title is None or self.url is None
        ):
            raise ValueError("External resource favorites require title and url")
        return self


class FavoriteResourcePage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[FavoriteResourceResponse]
    total: int
    limit: int
    offset: int


class CertificateResponse(ProfileSchema):
    id: UUID
    title: str
    issuer: str | None
    issued_on: date | None = Field(alias="issuedOn")
    expires_on: date | None = Field(alias="expiresOn")
    credential_url: str | None = Field(alias="credentialUrl")
    file_id: UUID | None = Field(alias="fileId")
    notes: str | None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class CertificateCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=160)
    issuer: str | None = Field(default=None, max_length=160)
    issued_on: date | None = Field(default=None, alias="issuedOn")
    expires_on: date | None = Field(default=None, alias="expiresOn")
    credential_url: str | None = Field(default=None, alias="credentialUrl", max_length=500)
    file_id: UUID | None = Field(default=None, alias="fileId")
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("title", "issuer", "notes")
    @classmethod
    def clean_text(cls, value: str | None) -> str | None:
        return _clean_optional_text(value)

    @field_validator("credential_url")
    @classmethod
    def clean_credential_url(cls, value: str | None) -> str | None:
        return _validate_http_url(value)

    @model_validator(mode="after")
    def validate_dates(self) -> "CertificateCreate":
        if (
            self.issued_on is not None
            and self.expires_on is not None
            and self.expires_on < self.issued_on
        ):
            raise ValueError("Expiration date cannot be before issue date")
        return self


class CertificatePage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[CertificateResponse]
    total: int
    limit: int
    offset: int


class PrivacySettingsResponse(ProfileSchema):
    id: UUID
    profile_visibility: ProfileVisibility = Field(alias="profileVisibility")
    show_email_on_profile: bool = Field(alias="showEmailOnProfile")
    allow_profile_in_ai_context: bool = Field(alias="allowProfileInAiContext")
    allow_profile_search_indexing: bool = Field(alias="allowProfileSearchIndexing")
    include_profile_in_exports: bool = Field(alias="includeProfileInExports")
    ai_memory_enabled: bool = Field(alias="aiMemoryEnabled")
    product_analytics_enabled: bool = Field(alias="productAnalyticsEnabled")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class PrivacySettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    profile_visibility: ProfileVisibility | None = Field(default=None, alias="profileVisibility")
    show_email_on_profile: bool | None = Field(default=None, alias="showEmailOnProfile")
    allow_profile_in_ai_context: bool | None = Field(default=None, alias="allowProfileInAiContext")
    allow_profile_search_indexing: bool | None = Field(
        default=None, alias="allowProfileSearchIndexing"
    )
    include_profile_in_exports: bool | None = Field(default=None, alias="includeProfileInExports")
    ai_memory_enabled: bool | None = Field(default=None, alias="aiMemoryEnabled")
    product_analytics_enabled: bool | None = Field(default=None, alias="productAnalyticsEnabled")

    @model_validator(mode="after")
    def require_update(self) -> "PrivacySettingsUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one privacy field is required")
        return self


class DataExportRequestResponse(ProfileSchema):
    id: UUID
    status: DataRequestStatus
    requested_at: datetime = Field(alias="requestedAt")
    completed_at: datetime | None = Field(alias="completedAt")
    download_url: str | None = Field(alias="downloadUrl")
    expires_at: datetime | None = Field(alias="expiresAt")
    included_categories: list[str] = Field(alias="includedCategories")
    note: str | None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class DataExportRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    idempotency_key: str = Field(alias="idempotencyKey", min_length=8, max_length=160)
    included_categories: list[str] = Field(default_factory=list, alias="includedCategories")
    note: str | None = Field(default=None, max_length=2000)

    @field_validator("included_categories")
    @classmethod
    def validate_categories(cls, value: list[str]) -> list[str]:
        categories = value or list(DATA_EXPORT_CATEGORIES)
        unknown = sorted(set(categories).difference(DATA_EXPORT_CATEGORIES))
        if unknown:
            raise ValueError("Unknown export category")
        return sorted(set(categories), key=categories.index)

    @field_validator("note")
    @classmethod
    def clean_note(cls, value: str | None) -> str | None:
        return _clean_optional_text(value)


class DataExportRequestPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[DataExportRequestResponse]
    total: int
    limit: int
    offset: int


class AccountDeletionRequestResponse(ProfileSchema):
    id: UUID
    status: AccountDeletionRequestStatus
    requested_at: datetime = Field(alias="requestedAt")
    scheduled_deletion_at: datetime | None = Field(alias="scheduledDeletionAt")
    canceled_at: datetime | None = Field(alias="canceledAt")
    reason: str | None
    metadata_json: dict[str, object] = Field(
        validation_alias="metadata_json",
        serialization_alias="metadata",
    )
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class AccountDeletionRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    idempotency_key: str = Field(alias="idempotencyKey", min_length=8, max_length=160)
    confirmation: str = Field(min_length=1, max_length=80)
    reason: str | None = Field(default=None, max_length=2000)

    @field_validator("confirmation")
    @classmethod
    def validate_confirmation(cls, value: str) -> str:
        if value != ACCOUNT_DELETION_CONFIRMATION:
            raise ValueError("Account deletion requires the exact confirmation phrase")
        return value

    @field_validator("reason")
    @classmethod
    def clean_reason(cls, value: str | None) -> str | None:
        return _clean_optional_text(value)


class AccountDeletionRequestPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[AccountDeletionRequestResponse]
    total: int
    limit: int
    offset: int
