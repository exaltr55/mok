"""Chat endpoint — a thin wrapper around the shared ``llm-client`` library.

Demonstrates the AI integration pattern: configure provider keys once at
startup (see ``app.main``) and create a provider per request based on a model
string of the form ``"provider:model"``.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from llm_client import create_provider, parse_model_string
from llm_client.base import LLMMessage, MessageRole
from pydantic import BaseModel as PydanticModel
from pydantic import Field

from app.api.auth import get_current_user_claims
from app.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(PydanticModel):
    role: str = Field(..., pattern=r"^(system|user|assistant)$")
    content: str = Field(..., min_length=1)


class ChatRequest(PydanticModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    model: str | None = None
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)


class ChatResponse(PydanticModel):
    role: str
    content: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


_ROLE_MAP = {
    "system": MessageRole.SYSTEM,
    "user": MessageRole.USER,
    "assistant": MessageRole.ASSISTANT,
}


@router.post("/completions", response_model=ChatResponse)
async def chat_completion(
    body: ChatRequest,
    _claims: dict = Depends(get_current_user_claims),
) -> ChatResponse:
    """Send a multi-turn message list to the configured LLM and return its reply."""
    if len(body.messages) > settings.chat_max_history_messages:
        raise HTTPException(
            status_code=422,
            detail=f"Too many messages (max {settings.chat_max_history_messages})",
        )
    for m in body.messages:
        if len(m.content) > settings.chat_max_message_chars:
            raise HTTPException(
                status_code=422,
                detail=f"Message exceeds {settings.chat_max_message_chars} chars",
            )

    model_string = body.model or settings.default_model
    try:
        provider_name, model_id = parse_model_string(model_string)
        provider = create_provider(provider_name, model_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid model: {e}") from e

    llm_messages = [
        LLMMessage(role=_ROLE_MAP[m.role], content=m.content) for m in body.messages
    ]

    try:
        response = await provider.complete(
            llm_messages,
            temperature=body.temperature,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM call failed: {e}") from e

    return ChatResponse(
        role="assistant",
        content=response.message.content or "",
        model=model_string,
        input_tokens=getattr(response.usage, "input_tokens", None),
        output_tokens=getattr(response.usage, "output_tokens", None),
    )
