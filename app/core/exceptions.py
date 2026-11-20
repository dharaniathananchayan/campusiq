"""Custom exception classes and FastAPI exception handlers."""
from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


# ── Domain Exceptions ────────────────────────────────────────────────────────

class CampusIQException(Exception):
    """Base exception for CampusIQ domain errors."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(CampusIQException):
    def __init__(self, resource: str = "Resource", identifier: str = "") -> None:
        msg = f"{resource} not found"
        if identifier:
            msg = f"{resource} '{identifier}' not found"
        super().__init__(msg, status.HTTP_404_NOT_FOUND)


class UnauthorizedError(CampusIQException):
    def __init__(self, message: str = "Authentication required") -> None:
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(CampusIQException):
    def __init__(self, message: str = "You do not have permission to perform this action") -> None:
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class ConflictError(CampusIQException):
    def __init__(self, message: str = "Resource already exists") -> None:
        super().__init__(message, status.HTTP_409_CONFLICT)


class ValidationError(CampusIQException):
    def __init__(self, message: str) -> None:
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class CapacityFullError(CampusIQException):
    def __init__(self, event_title: str = "Event") -> None:
        super().__init__(
            f"'{event_title}' is fully booked. No seats available.",
            status.HTTP_409_CONFLICT,
        )


class RegistrationClosedError(CampusIQException):
    def __init__(self, reason: str = "Registration is closed for this event") -> None:
        super().__init__(reason, status.HTTP_400_BAD_REQUEST)


class EligibilityError(CampusIQException):
    def __init__(self, reason: str = "You are not eligible for this event") -> None:
        super().__init__(reason, status.HTTP_403_FORBIDDEN)


class AIServiceError(CampusIQException):
    def __init__(self, message: str = "AI service is temporarily unavailable") -> None:
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE)


# ── Handlers ─────────────────────────────────────────────────────────────────

def _error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "message": message, "error": True},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers on the FastAPI application."""

    @app.exception_handler(CampusIQException)
    async def campusiq_exception_handler(
        request: Request, exc: CampusIQException
    ) -> JSONResponse:
        return _error_response(exc.status_code, exc.message)

    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
        return _error_response(404, "The requested resource was not found.")

    @app.exception_handler(405)
    async def method_not_allowed_handler(request: Request, exc: Exception) -> JSONResponse:
        return _error_response(405, "Method not allowed.")

    @app.exception_handler(500)
    async def internal_error_handler(request: Request, exc: Exception) -> JSONResponse:
        return _error_response(500, "An unexpected internal error occurred.")
