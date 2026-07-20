from uuid import UUID

from app.core.errors import AppError
from app.models.auth import User


def require_owner(
    *,
    current_user: User,
    owner_user_id: UUID,
    resource_name: str = "Resource",
) -> None:
    if owner_user_id != current_user.id:
        raise AppError(404, "not_found", f"{resource_name} was not found.")
