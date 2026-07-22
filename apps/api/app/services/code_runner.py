from app.schemas.coding import CodeRunnerStatusResponse


class CodeRunner:
    async def status(self) -> CodeRunnerStatusResponse:
        raise NotImplementedError


class UnavailableCodeRunner(CodeRunner):
    async def status(self) -> CodeRunnerStatusResponse:
        return CodeRunnerStatusResponse.unavailable()
