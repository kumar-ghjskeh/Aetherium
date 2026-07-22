from fastapi import Depends

from app.dependencies.ai import get_ai_gateway_service
from app.services.ai_gateway import AIGatewayService
from app.services.code_runner import CodeRunner, UnavailableCodeRunner
from app.services.coding import CodingService


def get_coding_service(
    ai_gateway: AIGatewayService = Depends(get_ai_gateway_service),
) -> CodingService:
    return CodingService(db=ai_gateway.db, ai_gateway=ai_gateway)


def get_code_runner() -> CodeRunner:
    return UnavailableCodeRunner()
