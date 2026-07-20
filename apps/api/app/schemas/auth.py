from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.security.passwords import PASSWORD_MAX_LENGTH, validate_password_strength


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    email: EmailStr
    password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH)
    display_name: str = Field(alias="displayName", min_length=1, max_length=120)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        validate_password_strength(value)
        return value

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str) -> str:
        normalized = " ".join(value.strip().split())
        if not normalized:
            raise ValueError("Display name is required")
        return normalized


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH)


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    email: EmailStr
    display_name: str = Field(alias="displayName")
    is_email_verified: bool = Field(alias="isEmailVerified")
    created_at: datetime = Field(alias="createdAt")
    last_login_at: datetime | None = Field(alias="lastLoginAt")


class AuthResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user: UserPublic
