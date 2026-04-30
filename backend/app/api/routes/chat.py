from fastapi import APIRouter, HTTPException
from app.schemas.request import ChatRequest
from app.schemas.response import ChatResponse
from app.services.llm_service import chat_completion
from app.services.prompt_builder import build_chat_prompt, build_syntax_repair_prompt
from app.api.routes.generate import _has_risky_classname_template, _strip_code_fence

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_iteration(req: ChatRequest):
    try:
        messages = build_chat_prompt(
            req.message,
            req.current_code,
        )
        code = _strip_code_fence(await chat_completion(messages))

        if _has_risky_classname_template(code):
            code = _strip_code_fence(
                await chat_completion(
                    build_syntax_repair_prompt(code),
                    temperature=0.1,
                    max_tokens=4096,
                )
            )

        return ChatResponse(
            code=code,
            reply="已根据你的指令修改代码，请在预览区查看效果。",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
