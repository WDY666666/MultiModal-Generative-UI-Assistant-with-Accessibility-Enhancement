import json
import re
from typing import Any

from app.services.llm_service import vision_completion
from app.services.prompt_builder import build_image_analysis_prompt


def _extract_json_payload(text: str) -> dict[str, Any]:
    source = text.strip()
    if not source:
        return {}

    try:
        parsed = json.loads(source)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    match = re.search(r"\{[\s\S]*\}", source)
    if not match:
        return {}

    try:
        parsed = json.loads(match.group(0))
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        return {}

    return {}


def _normalize_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    if isinstance(value, str):
        parts = re.split(r"[、,，/\\n]+", value)
        return [part.strip() for part in parts if part.strip()]

    return []


async def analyze_image(image_base64: str) -> dict:
    messages = build_image_analysis_prompt()
    messages.append(
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "请分析这张图片中的 UI 布局，并严格按照 JSON 输出。"
                        "如果图片是手绘草图，也请尽量识别结构、组件和风格。"
                    ),
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
                },
            ],
        }
    )

    result = await vision_completion(messages, temperature=0.2)
    payload = _extract_json_payload(result)

    description = str(payload.get("description") or result).strip()
    layout = str(payload.get("layout") or description).strip()
    components = _normalize_list(payload.get("components"))
    style = _normalize_list(payload.get("style"))
    accessibility_hints = _normalize_list(
        payload.get("accessibilityHints") or payload.get("accessibility_hints")
    )
    prompt_suggestion = str(
        payload.get("promptSuggestion") or payload.get("suggestedPrompt") or ""
    ).strip()

    if not description:
        description = layout or "图片布局识别结果"

    return {
        "description": description,
        "layout": layout,
        "components": components,
        "style": style,
        "accessibilityHints": accessibility_hints,
        "promptSuggestion": prompt_suggestion or None,
    }
