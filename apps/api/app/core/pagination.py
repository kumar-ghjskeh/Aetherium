from dataclasses import dataclass


@dataclass(frozen=True)
class PaginationParams:
    limit: int
    offset: int
