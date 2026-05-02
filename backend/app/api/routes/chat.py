from fastapi import APIRouter
from app.schemas.request import ChatRequest
from app.schemas.response import ChatResponse
from app.services.llm_service import chat_completion
from app.services.prompt_builder import build_chat_prompt
from app.api.routes.generate import (
    _is_previewable_code,
    _is_safe_previewable_code,
    _repair_syntax_if_needed,
    _strip_code_fence,
)
from app.services.fallback_templates import build_fallback_code
from app.services.tailwind_service import compile_tailwind_css

router = APIRouter()


def _fallback_chat_code(message: str, current_code: str) -> tuple[str, str]:
    if _is_safe_previewable_code(current_code):
        return current_code, "The model did not return previewable code, so the current preview was kept."

    fallback = build_fallback_code(f"{message}\n\n{current_code[:2000]}")
    if _is_safe_previewable_code(fallback):
        return fallback, (
            "The model did not return previewable code and the current code is not safe to preview. "
            "Switched to a fallback previewable template."
        )

    return fallback, "The model did not return previewable code. Returned a baseline fallback UI."


@router.post("/chat", response_model=ChatResponse)
async def chat_iteration(req: ChatRequest):
    try:
        messages = build_chat_prompt(
            req.message,
            req.current_code,
            req.image_description,
            req.chat_history,
        )
        code = _strip_code_fence(await chat_completion(messages))
        reply = "Code was updated from your instruction. Check the preview panel."

        if not _is_previewable_code(code):
            retry_messages = [
                *messages,
                {
                    "role": "user",
                    "content": (
                        "Your previous output was not a complete previewable React component. "
                        "Regenerate a complete App.tsx from the current code and user instruction. "
                        "Do not rewrite into an unrelated page unless explicitly requested. "
                        "Must include export default and valid JSX. Output code only."
                    ),
                },
            ]
            code = _strip_code_fence(await chat_completion(retry_messages, temperature=0.2))

        if not _is_previewable_code(code):
            code, reply = _fallback_chat_code(req.message, req.current_code)
            return ChatResponse(
                code=code,
                css=compile_tailwind_css(code),
                reply=reply,
            )

        code = await _repair_syntax_if_needed(code, fallback_code=build_fallback_code(req.message))
        if not _is_safe_previewable_code(code):
            code, reply = _fallback_chat_code(req.message, req.current_code)
        elif code.strip() == req.current_code.strip():
            reply = (
                "No previewable change was produced in this iteration, so the current code was kept. "
                "Please provide a more specific edit request."
            )

        return ChatResponse(
            code=code,
            css=compile_tailwind_css(code),
            reply=reply,
        )
    except Exception as e:
        code, reply = _fallback_chat_code(req.message, req.current_code)
        return ChatResponse(
            code=code,
            css=compile_tailwind_css(code),
            reply=f"{reply} Original error: {e}",
        )
