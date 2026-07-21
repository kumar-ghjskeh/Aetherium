from __future__ import annotations

import asyncio
import logging

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.db.session import AsyncSessionLocal
from app.services.file_ingestion import FileIngestionService
from app.services.object_storage import create_object_storage_service

LOGGER = logging.getLogger("aetherium.worker.file_ingestion")


def configure_logging() -> None:
    logging.basicConfig(
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        level=logging.INFO,
    )


async def process_once(settings: Settings) -> bool:
    async with AsyncSessionLocal() as db:
        service = FileIngestionService(
            db=db,
            settings=settings,
            storage=create_object_storage_service(settings),
        )
        try:
            job = await service.process_next_job()
            await db.commit()
            if job is not None:
                LOGGER.info(
                    "file_ingestion_job_processed",
                    extra={
                        "aetherium_file_id": str(job.file_id),
                        "aetherium_job_id": str(job.id),
                        "aetherium_job_status": job.status,
                        "aetherium_owner_user_id": str(job.owner_user_id),
                    },
                )
            return job is not None
        except AppError as exc:
            await db.commit()
            LOGGER.warning(
                "file_ingestion_job_recorded_failure",
                extra={
                    "aetherium_error_code": exc.code,
                    "aetherium_status_code": exc.status_code,
                },
            )
            return True
        except Exception:
            await db.rollback()
            LOGGER.exception("file_ingestion_worker_unhandled_error")
            return False


async def run_forever() -> None:
    configure_logging()
    settings = get_settings()
    LOGGER.info(
        "file_ingestion_worker_started",
        extra={
            "aetherium_queue_name": settings.file_ingestion_queue_name,
            "aetherium_redis_key_prefix": settings.redis_key_prefix,
            "aetherium_worker_poll_seconds": settings.worker_poll_seconds,
        },
    )
    while True:
        processed = await process_once(settings)
        if not processed:
            await asyncio.sleep(settings.worker_poll_seconds)


if __name__ == "__main__":
    asyncio.run(run_forever())
