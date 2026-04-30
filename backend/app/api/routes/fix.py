from fastapi import APIRouter, HTTPException
from app.schemas.request import FixRequest
from app.schemas.response import FixResponse
from app.services.a11y_service import generate_fix

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
        return FixResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
