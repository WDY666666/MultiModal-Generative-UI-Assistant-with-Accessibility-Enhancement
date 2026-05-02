import json
import re
import time
from typing import Any, AsyncIterator
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse

from app.api.routes.generate import _is_previewable_code, _strip_code_fence
from app.services.llm_service import chat_completion
from app.services.prompt_builder import build_chat_prompt

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


def _latest_user_message(messages: list[dict[str, str]]) -> str:
    for message in reversed(messages):
        if message.get("role") == "user":
            return message.get("content", "").strip()
    return ""


def _find_code_block(text: str) -> str:
    block = re.search(r"```(?:tsx?|jsx?)?\s*([\s\S]*?)```", text)
    if block:
        return block.group(1).strip()
    return ""


def _extract_code_candidate(text: str) -> str:
    if not text:
        return ""

    block = _find_code_block(text)
    if block and "export default" in block:
        return block

    if "export default" in text and "className" in text:
        return text.strip()

    return ""


def _extract_workspace_code(payload: dict[str, Any], messages: list[dict[str, str]]) -> str:
    key_hints = {"generatedcodepreview", "generatedcode", "currentcode", "code", "tsx", "jsx"}
    found: list[str] = []

    def walk(node: Any, depth: int = 0):
        if depth > 6:
            return
        if isinstance(node, dict):
            for key, value in node.items():
                key_lower = str(key).lower()
                if isinstance(value, str):
                    candidate = _extract_code_candidate(value)
                    if candidate and (key_lower in key_hints or "export default" in candidate):
                        found.append(candidate)
                else:
                    walk(value, depth + 1)
            return

        if isinstance(node, list):
            for item in node[:80]:
                walk(item, depth + 1)

    walk(payload)
    for message in messages:
        candidate = _extract_code_candidate(message.get("content", ""))
        if candidate:
            found.append(candidate)

    for candidate in reversed(found):
        if "export default" in candidate and ("className" in candidate or "return (" in candidate):
            return candidate
    return ""


async def _build_agent_reply(payload: dict[str, Any]) -> str:
    messages = _extract_messages(payload)
    if not messages:
        return (
            "CopilotKit runtime is connected. "
            "Describe what you want to generate or how you want to iterate the current UI."
        )

    latest_user = _latest_user_message(messages)
    workspace_code = _extract_workspace_code(payload, messages)

    if latest_user and workspace_code:
        try:
            iter_messages = build_chat_prompt(
                latest_user,
                workspace_code,
                None,
                [m for m in messages if m.get("role") in {"user", "assistant"}],
            )
            candidate = _strip_code_fence(
                await chat_completion(iter_messages, temperature=0.25, max_tokens=2400)
            )
            if _is_previewable_code(candidate):
                return (
                    "I used the current workspace code as context and generated an updated previewable component. "
                    "To apply it automatically to the live preview, use the right-side iteration panel "
                    "or run the `iterateGeneratedUI` action.\n\n"
                    f"```tsx\n{candidate}\n```"
                )
        except Exception:
            # Fall back to conversational assistance below.
            pass

    system_message = {
        "role": "system",
        "content": (
            "You are the CopilotKit workspace assistant for this project. "
            "Always ground your answer in the current workspace context when available. "
            "Prioritize actionable guidance for React + TypeScript + Tailwind generation, "
            "preview stability, and accessibility fixes. Keep answers concise and practical."
        ),
    }
    try:
        return await chat_completion([system_message, *messages], temperature=0.4, max_tokens=1024)
    except Exception:
        return (
            "CopilotKit runtime is connected, but the upstream model call failed. "
            "Please verify the model endpoint, key, and network availability."
        )


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
