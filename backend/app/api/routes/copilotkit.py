import json
import time
from typing import Any, AsyncIterator
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse

from app.services.llm_service import chat_completion

router = APIRouter()

RUNTIME_INFO = {
    "version": "1.56.4",
    "mode": "sse",
    "agents": {
        "default": {
            "description": (
                "Multimodal Generative UI Assistant agent. It can discuss UI generation, "
                "accessibility checks, and React + Tailwind iteration workflows."
            ),
            "capabilities": {},
        }
    },
    "audioFileTranscriptionEnabled": False,
    "a2uiEnabled": False,
    "openGenerativeUIEnabled": False,
}


def _sse_event(event: dict[str, Any]) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


def _extract_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(str(item.get("text", "")))
        return "\n".join(part for part in parts if part)
    return ""


def _extract_messages(payload: dict[str, Any]) -> list[dict[str, str]]:
    messages = []
    for message in payload.get("messages", []):
        if not isinstance(message, dict):
            continue
        role = message.get("role")
        if role not in {"system", "user", "assistant"}:
            continue
        content = _extract_text(message.get("content"))
        if content:
            messages.append({"role": role, "content": content})
    return messages


async def _build_agent_reply(payload: dict[str, Any]) -> str:
    messages = _extract_messages(payload)
    if not messages:
        return "我已经连接到 CopilotKit Runtime。请在左侧输入需求生成 UI，或描述你想迭代的界面。"

    system_message = {
        "role": "system",
        "content": (
            "你是多模态生成式 UI 助手项目中的 CopilotKit AG-UI 代理。"
            "请用简洁中文回答，重点帮助用户完成 React + TypeScript + Tailwind UI 生成、"
            "Sandpack 预览、axe-core 无障碍检查和修复闭环。"
            "如果用户要真正生成或修改代码，提醒其也可以使用页面左侧生成区或右侧聊天迭代区。"
        ),
    }
    try:
        return await chat_completion([system_message, *messages], temperature=0.4, max_tokens=1024)
    except Exception:
        return "CopilotKit Runtime 已连接，但当前 LLM/Ollama 服务不可用。请先确认 Ollama 已启动并已拉取配置的模型。"


async def _stream_agent_run(payload: dict[str, Any]) -> AsyncIterator[str]:
    thread_id = str(payload.get("threadId") or uuid4())
    run_id = str(payload.get("runId") or uuid4())
    message_id = str(uuid4())
    timestamp = time.time()

    yield _sse_event(
        {
            "type": "RUN_STARTED",
            "threadId": thread_id,
            "runId": run_id,
            "input": payload,
            "timestamp": timestamp,
        }
    )

    reply = await _build_agent_reply(payload)

    yield _sse_event(
        {
            "type": "TEXT_MESSAGE_START",
            "messageId": message_id,
            "role": "assistant",
            "timestamp": time.time(),
        }
    )
    yield _sse_event(
        {
            "type": "TEXT_MESSAGE_CONTENT",
            "messageId": message_id,
            "delta": reply,
            "timestamp": time.time(),
        }
    )
    yield _sse_event(
        {
            "type": "TEXT_MESSAGE_END",
            "messageId": message_id,
            "timestamp": time.time(),
        }
    )
    yield _sse_event(
        {
            "type": "RUN_FINISHED",
            "threadId": thread_id,
            "runId": run_id,
            "timestamp": time.time(),
        }
    )


def _stream_response(payload: dict[str, Any]) -> StreamingResponse:
    return StreamingResponse(
        _stream_agent_run(payload),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/copilotkit/info")
async def copilotkit_info():
    return RUNTIME_INFO


@router.post("/copilotkit")
async def copilotkit_single_endpoint(request: Request):
    envelope = await request.json()
    method = envelope.get("method")

    if method == "info":
        return JSONResponse(RUNTIME_INFO)

    if method in {"agent/run", "agent/connect"}:
        payload = envelope.get("body") or {}
        return _stream_response(payload)

    if method == "agent/stop":
        return {"status": "ok"}

    raise HTTPException(status_code=400, detail=f"Unsupported CopilotKit method: {method}")


@router.post("/copilotkit/agent/{agent_id}/run")
async def copilotkit_agent_run(agent_id: str, request: Request):
    if agent_id != "default":
        raise HTTPException(status_code=404, detail=f"Unknown CopilotKit agent: {agent_id}")

    payload = await request.json()
    return _stream_response(payload)


@router.post("/copilotkit/agent/{agent_id}/connect")
async def copilotkit_agent_connect(agent_id: str, request: Request):
    if agent_id != "default":
        raise HTTPException(status_code=404, detail=f"Unknown CopilotKit agent: {agent_id}")

    payload = await request.json()
    return _stream_response(payload)


@router.post("/copilotkit/agent/{agent_id}/stop/{thread_id}")
async def copilotkit_agent_stop(agent_id: str, thread_id: str):
    if agent_id != "default":
        raise HTTPException(status_code=404, detail=f"Unknown CopilotKit agent: {agent_id}")

    return {"status": "ok", "threadId": thread_id}
