from fastapi import APIRouter, HTTPException
from app.schemas.request import ChatRequest
from app.schemas.response import ChatResponse
from app.services.llm_service import chat_completion
from app.services.prompt_builder import build_chat_prompt
from app.api.routes.generate import _repair_syntax_if_needed, _strip_code_fence

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_iteration(req: ChatRequest):
    try:
        messages = build_chat_prompt(
            req.message,
            req.current_code,
        )
        code = _strip_code_fence(await chat_completion(messages))
        code = await _repair_syntax_if_needed(code)

        return ChatResponse(
            code=code,
            reply="已根据你的指令修改代码，请在预览区查看效果。",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
