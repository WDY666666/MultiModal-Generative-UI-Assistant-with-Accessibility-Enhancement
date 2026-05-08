from fastapi import APIRouter
from app.schemas.request import ChatRequest
from app.schemas.response import ChatResponse, InteractionPlan
from app.services.llm_service import chat_completion
from app.services.prompt_builder import build_chat_prompt
from app.services.planner_service import plan_ui_generation
from app.api.routes.generate import (
    _is_previewable_code,
    _is_safe_previewable_code,
    _repair_syntax_if_needed,
    _strip_code_fence,
)
from app.services.fallback_templates import build_fallback_code
from app.services.tailwind_service import compile_tailwind_css

router = APIRouter()


def _fallback_chat_code(
    message: str,
    current_code: str,
    interaction_plan: InteractionPlan | None = None,
) -> tuple[str, str]:
    if _is_safe_previewable_code(current_code):
        return current_code, "模型未返回可预览代码，已保留当前预览。"

    fallback = build_fallback_code(f"{message}\n\n{current_code[:2000]}", interaction_plan)
    if _is_safe_previewable_code(fallback):
        return fallback, (
            "模型未返回可预览代码，且当前代码不适合预览。"
            "已切换到可预览的兜底模板。"
        )

    return fallback, "模型未返回可预览代码。已返回基础兜底界面。"


@router.post("/chat", response_model=ChatResponse)
async def chat_iteration(req: ChatRequest):
    try:
        interaction_plan = await plan_ui_generation(
            req.message,
            image_description=req.image_description,
            current_code=req.current_code,
        )
        messages = build_chat_prompt(
            req.message,
            req.current_code,
            req.image_description,
            req.chat_history,
            interaction_plan,
        )
        code = _strip_code_fence(await chat_completion(messages, temperature=0.25))
        reply = "已根据你的指令更新代码，请查看中间预览区。"

        if not _is_previewable_code(code):
            retry_messages = [
                *messages,
                {
                    "role": "user",
                    "content": (
                        "你上一次输出不是完整可预览的 React 组件。"
                        "请基于当前代码和用户指令重新生成完整 App.tsx。"
                        "除非用户明确要求，否则不要改成无关页面。"
                        "必须包含 export default 和合法 JSX。仅输出代码。"
                    ),
                },
            ]
            code = _strip_code_fence(await chat_completion(retry_messages, temperature=0.2))

        if not _is_previewable_code(code):
            code, reply = _fallback_chat_code(req.message, req.current_code, interaction_plan)
            return ChatResponse(
                code=code,
                css=compile_tailwind_css(code),
                reply=reply,
                plan=interaction_plan,
            )

        code = await _repair_syntax_if_needed(code, fallback_code=build_fallback_code(req.message, interaction_plan))
        if not _is_safe_previewable_code(code):
            code, reply = _fallback_chat_code(req.message, req.current_code, interaction_plan)
        elif code.strip() == req.current_code.strip():
            reply = (
                "本次迭代未产出可预览变更，已保留当前代码。"
                "请提供更具体的修改要求。"
            )

        return ChatResponse(
            code=code,
            css=compile_tailwind_css(code),
            reply=reply,
            plan=interaction_plan,
        )
    except Exception as e:
        code, reply = _fallback_chat_code(req.message, req.current_code)
        return ChatResponse(
            code=code,
            css=compile_tailwind_css(code),
            reply=f"{reply} 原始错误：{e}",
            plan=None,
        )
