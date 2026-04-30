import httpx

from app.config import get_settings


def _chat_completions_url() -> str:
    settings = get_settings()
    return f"{settings.openai_base_url.rstrip('/')}/chat/completions"


def _headers() -> dict[str, str]:
    settings = get_settings()
    return {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }


async def chat_completion(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> str:
    settings = get_settings()
    payload = {
        "model": model or settings.openai_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(_chat_completions_url(), headers=_headers(), json=payload)
        response.raise_for_status()
        data = response.json()
    return data["choices"][0]["message"].get("content") or ""


async def vision_completion(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> str:
    return await chat_completion(
        messages=messages,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
    )
