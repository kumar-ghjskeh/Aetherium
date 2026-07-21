from __future__ import annotations

import asyncio
import importlib
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Protocol

from app.core.config import Settings


class ObjectStorageError(Exception):
    pass


@dataclass(frozen=True)
class PresignedObjectRequest:
    expires_at: datetime
    headers: dict[str, str]
    method: str
    url: str


@dataclass(frozen=True)
class ObjectStat:
    content_type: str | None
    size_bytes: int


@dataclass(frozen=True)
class ObjectContent:
    body: bytes
    content_type: str | None
    etag: str | None = None


class ObjectStorageService(Protocol):
    async def create_presigned_upload(
        self,
        *,
        bucket: str,
        key: str,
        content_type: str,
        expires_in_seconds: int,
    ) -> PresignedObjectRequest: ...

    async def create_presigned_download(
        self,
        *,
        bucket: str,
        key: str,
        download_name: str,
        expires_in_seconds: int,
    ) -> PresignedObjectRequest: ...

    async def head_object(self, *, bucket: str, key: str) -> ObjectStat: ...

    async def delete_object(self, *, bucket: str, key: str) -> None: ...

    async def read_object(self, *, bucket: str, key: str, max_bytes: int) -> ObjectContent: ...


class S3CompatibleObjectStorage:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._client: Any | None = None

    def _get_client(self) -> Any:
        if self._client is not None:
            return self._client

        try:
            boto3: Any = importlib.import_module("boto3")
        except ModuleNotFoundError as exc:
            raise ObjectStorageError(
                "The boto3 package is required for Aetherium object storage."
            ) from exc

        self._client = boto3.client(
            "s3",
            aws_access_key_id=self._settings.s3_access_key_id,
            aws_secret_access_key=self._settings.s3_secret_access_key,
            endpoint_url=self._settings.object_storage_endpoint,
            region_name=self._settings.s3_region,
        )
        return self._client

    async def create_presigned_upload(
        self,
        *,
        bucket: str,
        key: str,
        content_type: str,
        expires_in_seconds: int,
    ) -> PresignedObjectRequest:
        expires_at = datetime.now(UTC) + timedelta(seconds=expires_in_seconds)

        def generate() -> str:
            client = self._get_client()
            return str(
                client.generate_presigned_url(
                    "put_object",
                    Params={
                        "Bucket": bucket,
                        "ContentType": content_type,
                        "Key": key,
                    },
                    ExpiresIn=expires_in_seconds,
                )
            )

        try:
            url = await asyncio.to_thread(generate)
        except Exception as exc:  # pragma: no cover - adapter boundary
            raise ObjectStorageError("Could not create Aetherium upload URL.") from exc

        return PresignedObjectRequest(
            expires_at=expires_at,
            headers={"Content-Type": content_type},
            method="PUT",
            url=url,
        )

    async def create_presigned_download(
        self,
        *,
        bucket: str,
        key: str,
        download_name: str,
        expires_in_seconds: int,
    ) -> PresignedObjectRequest:
        expires_at = datetime.now(UTC) + timedelta(seconds=expires_in_seconds)

        def generate() -> str:
            client = self._get_client()
            return str(
                client.generate_presigned_url(
                    "get_object",
                    Params={
                        "Bucket": bucket,
                        "Key": key,
                        "ResponseContentDisposition": f'attachment; filename="{download_name}"',
                    },
                    ExpiresIn=expires_in_seconds,
                )
            )

        try:
            url = await asyncio.to_thread(generate)
        except Exception as exc:  # pragma: no cover - adapter boundary
            raise ObjectStorageError("Could not create Aetherium download URL.") from exc

        return PresignedObjectRequest(expires_at=expires_at, headers={}, method="GET", url=url)

    async def head_object(self, *, bucket: str, key: str) -> ObjectStat:
        def read_metadata() -> ObjectStat:
            client = self._get_client()
            response = client.head_object(Bucket=bucket, Key=key)
            return ObjectStat(
                content_type=response.get("ContentType"),
                size_bytes=int(response["ContentLength"]),
            )

        try:
            return await asyncio.to_thread(read_metadata)
        except Exception as exc:  # pragma: no cover - adapter boundary
            raise ObjectStorageError("Aetherium object was not found in storage.") from exc

    async def delete_object(self, *, bucket: str, key: str) -> None:
        def delete() -> None:
            client = self._get_client()
            client.delete_object(Bucket=bucket, Key=key)

        try:
            await asyncio.to_thread(delete)
        except Exception as exc:  # pragma: no cover - adapter boundary
            raise ObjectStorageError("Could not delete Aetherium object from storage.") from exc

    async def read_object(self, *, bucket: str, key: str, max_bytes: int) -> ObjectContent:
        def read() -> ObjectContent:
            client = self._get_client()
            response = client.get_object(Bucket=bucket, Key=key)
            body = response["Body"].read(max_bytes + 1)
            if len(body) > max_bytes:
                raise ObjectStorageError("Aetherium object exceeds the configured read limit.")
            return ObjectContent(
                body=body,
                content_type=response.get("ContentType"),
                etag=response.get("ETag"),
            )

        try:
            return await asyncio.to_thread(read)
        except ObjectStorageError:
            raise
        except Exception as exc:  # pragma: no cover - adapter boundary
            raise ObjectStorageError("Could not read Aetherium object from storage.") from exc


def create_object_storage_service(settings: Settings) -> ObjectStorageService:
    return S3CompatibleObjectStorage(settings)
