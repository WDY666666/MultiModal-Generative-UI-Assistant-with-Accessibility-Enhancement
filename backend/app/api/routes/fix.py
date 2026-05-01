from fastapi import APIRouter
from app.schemas.request import FixRequest
from app.schemas.response import FixResponse
from app.services.a11y_service import generate_fix
from app.api.routes.generate import _is_safe_previewable_code, _repair_syntax_if_needed, _strip_code_fence
from app.services.fallback_templates import build_fallback_code
from app.services.tailwind_service import compile_tailwind_css

router = APIRouter()


@router.post("/fix", response_model=FixResponse)
async def fix_issue(req: FixRequest):
    try:
        issue_description = (
            f"问题 ID: {req.issue.id}\n"
            f"影响程度: {req.issue.impact}\n"
            f"描述: {req.issue.description}\n"
            f"帮助: {req.issue.help}"
        )
        result = await generate_fix(issue_description, req.current_code)
        fixed_code = await _repair_syntax_if_needed(
            _strip_code_fence(result["fixCode"]),
            fallback_code=build_fallback_code(issue_description),
        )
        if not _is_safe_previewable_code(fixed_code):
            fixed_code = req.current_code if _is_safe_previewable_code(req.current_code) else build_fallback_code(issue_description)
            result["explanation"] = "模型这次没有返回完整可预览修复代码，已保留可预览版本。"

        result["fixCode"] = fixed_code
        result["css"] = compile_tailwind_css(fixed_code)
        return FixResponse(**result)
    except Exception as e:
        fallback = req.current_code if _is_safe_previewable_code(req.current_code) else build_fallback_code(req.issue.id)
        return FixResponse(
            fixCode=fallback,
            explanation=f"模型修复失败，已保留可预览版本。原始错误：{e}",
            css=compile_tailwind_css(fallback),
        )
