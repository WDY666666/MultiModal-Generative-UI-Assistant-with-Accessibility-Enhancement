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
        return current_code, "模型这次没有返回完整可预览代码，已保留当前预览代码。"

    fallback = build_fallback_code(f"{message}\n\n{current_code[:2000]}")
    if _is_safe_previewable_code(fallback):
        return fallback, "模型这次没有返回完整可预览代码，当前代码也不可用，已切换到可预览兜底版本。"

    return fallback, "模型这次没有返回完整可预览代码，已返回基础兜底界面。"


@router.post("/chat", response_model=ChatResponse)
async def chat_iteration(req: ChatRequest):
    try:
        messages = build_chat_prompt(
            req.message,
            req.current_code,
            req.chat_history,
        )
        code = _strip_code_fence(await chat_completion(messages))
        reply = "已根据你的指令修改代码，请在预览区查看效果。"

        if not _is_previewable_code(code):
            retry_messages = [
                *messages,
                {
                    "role": "user",
                    "content": (
                        "你的上一次输出不是完整可预览的 React 组件代码。"
                        "请基于当前代码和用户修改指令，重新输出完整 App.tsx。"
                        "不要重写成全新页面，除非用户明确要求。"
                        "必须包含 export default，必须返回 JSX 页面，不要解释，不要 Markdown。"
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
            reply = "本次迭代没有产生可预览变更，已保留当前代码。请给出更具体的修改指令。"

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
            reply=f"{reply} 原始错误：{e}",
        )
