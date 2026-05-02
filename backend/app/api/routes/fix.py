from fastapi import APIRouter

from app.api.routes.generate import _is_safe_previewable_code, _repair_syntax_if_needed, _strip_code_fence
from app.schemas.request import ExplainIssueRequest, FixRequest
from app.schemas.response import ExplainIssueResponse, FixResponse
from app.services.a11y_service import explain_issue, generate_fix
from app.services.fallback_templates import build_fallback_code
from app.services.tailwind_service import compile_tailwind_css

router = APIRouter()


@router.post("/a11y/explain", response_model=ExplainIssueResponse)
async def explain_a11y_issue(req: ExplainIssueRequest):
    issue_description = (
        f"Issue ID: {req.issue.id}\n"
        f"Impact: {req.issue.impact}\n"
        f"Description: {req.issue.description}\n"
        f"Help: {req.issue.help}\n"
        f"Affected elements: {req.issue.nodes}"
    )
    try:
        result = await explain_issue(issue_description, req.current_code)
        return ExplainIssueResponse(**result)
    except Exception:
        return ExplainIssueResponse(
            explanation=(
                "This accessibility issue can reduce usability for keyboard users or assistive technologies."
            ),
            fixSuggestion=(
                "Follow the axe recommendation and add/adjust semantic labels, roles, contrast, and focus states."
            ),
        )


@router.post("/fix", response_model=FixResponse)
async def fix_issue(req: FixRequest):
    try:
        issue_description = (
            f"Issue ID: {req.issue.id}\n"
            f"Impact: {req.issue.impact}\n"
            f"Description: {req.issue.description}\n"
            f"Help: {req.issue.help}"
        )
        result = await generate_fix(issue_description, req.current_code)
        fixed_code = await _repair_syntax_if_needed(
            _strip_code_fence(result["fixCode"]),
            fallback_code=build_fallback_code(issue_description),
        )
        if not _is_safe_previewable_code(fixed_code):
            fixed_code = (
                req.current_code
                if _is_safe_previewable_code(req.current_code)
                else build_fallback_code(issue_description)
            )
            result["explanation"] = "模型未返回可预览的修复代码，已保留预览安全版本。"

        result["fixCode"] = fixed_code
        result["css"] = compile_tailwind_css(fixed_code)
        return FixResponse(**result)
    except Exception as error:
        fallback = req.current_code if _is_safe_previewable_code(req.current_code) else build_fallback_code(req.issue.id)
        return FixResponse(
            fixCode=fallback,
            explanation=f"自动无障碍修复失败，已保留预览安全版本。原始错误：{error}",
            css=compile_tailwind_css(fallback),
        )
