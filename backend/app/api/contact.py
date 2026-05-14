"""Contact-form endpoint.

Public (unauthenticated) so the marketing Contact page can submit messages.
Routes the submission to the operator inbox via the email service.
"""

from __future__ import annotations

import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel as PydanticModel
from pydantic import EmailStr, Field

from app.config import settings
from app.services.email_service import send_contact_message

logger = structlog.stdlib.get_logger()

router = APIRouter(prefix="/contact", tags=["contact"])


class ContactSubmission(PydanticModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=4_000)


class ContactResponse(PydanticModel):
    message: str


@router.post("", response_model=ContactResponse, status_code=202)
async def submit_contact(body: ContactSubmission) -> ContactResponse:
    """Accept a contact-form submission and forward it to the operator inbox."""
    try:
        await send_contact_message(
            to=settings.contact_recipient,
            sender_name=body.name,
            sender_email=body.email,
            subject=body.subject,
            message=body.message,
        )
    except Exception as e:
        logger.error("contact_submit_failed", error=str(e))
        raise HTTPException(
            status_code=502,
            detail="Could not deliver your message. Please try again later.",
        ) from e

    return ContactResponse(message="Thanks — we'll get back to you shortly.")
