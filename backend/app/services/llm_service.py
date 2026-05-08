import httpx

from app.config import get_settings

LLM_TIMEOUT = httpx.Timeout(None, connect=30.0)


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
    max_tokens: int | None = None,
) -> str:
    settings = get_settings()
    payload = {
        "model": model or settings.openai_model,
        "messages": messages,
        "temperature": temperature,
    }
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens

    try:
        async with httpx.AsyncClient(timeout=LLM_TIMEOUT) as client:
            response = await client.post(_chat_completions_url(), headers=_headers(), json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException as exc:
        raise RuntimeError("LLM request timed out. Please retry or use a faster model.") from exc
    except httpx.HTTPStatusError as exc:
        detail = ""
        try:
            payload = exc.response.json()
            detail = payload.get("error", {}).get("message") or payload.get("detail") or ""
        except Exception:
            detail = exc.response.text[:300]
        detail = detail.strip() or "上游模型服务返回错误。"
        raise RuntimeError(f"LLM 服务错误（HTTP {exc.response.status_code}）：{detail}") from exc
    except httpx.RequestError as exc:
        raise RuntimeError(f"LLM 网络请求失败：{exc}") from exc

    return data["choices"][0]["message"].get("content") or ""


async def vision_completion(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int | None = None,
) -> str:
    return await chat_completion(
        messages=messages,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
    )
