import re
import subprocess
from pathlib import Path

from fastapi import APIRouter, HTTPException
from app.schemas.request import GenerateRequest
from app.schemas.response import GenerateResponse
from app.services.llm_service import chat_completion
from app.services.prompt_builder import build_generate_prompt, build_syntax_repair_prompt
from app.services.image_service import analyze_image
from app.services.fallback_templates import build_fallback_code
from app.services.tailwind_service import compile_tailwind_css

router = APIRouter()
PROJECT_ROOT = Path(__file__).resolve().parents[4]
FRONTEND_DIR = PROJECT_ROOT / "frontend"


def _strip_code_fence(text: str) -> str:
    match = re.search(r"```(?:tsx?|jsx?|react)?\s*\n([\s\S]*?)```", text)
    return (match.group(1) if match else text).strip()


def _has_risky_classname_template(code: str) -> bool:
    if code.count("`") % 2 != 0:
        return True

    return bool(
        re.search(
            r"className\s*=\s*\{\s*`[\s\S]*?\$\{[\s\S]*?`[\s\S]*?\}",
            code,
        )
    )


def _has_basic_unbalanced_strings(code: str) -> bool:
    active_string: str | None = None
    escaped = False
    in_line_comment = False
    in_block_comment = False

    for index, char in enumerate(code):
        next_char = code[index + 1] if index + 1 < len(code) else ""

        if in_line_comment:
            if char == "\n":
                in_line_comment = False
            continue

        if in_block_comment:
            if char == "*" and next_char == "/":
                in_block_comment = False
            continue

        if char == "/" and next_char == "/":
            in_line_comment = True
            continue

        if char == "/" and next_char == "*":
            in_block_comment = True
            continue

        if escaped:
            escaped = False
            continue

        if active_string and char == "\\":
            escaped = True
            continue

        if active_string:
            if char == active_string:
                active_string = None
            continue

        if char in {"'", '"', "`"}:
            active_string = char

    return active_string is not None


def _has_tsx_syntax_error(code: str) -> bool:
    node_script = r"""
const path = require("path");
const ts = require(path.join(process.cwd(), "node_modules", "typescript"));
let source = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => source += chunk);
process.stdin.on("end", () => {
  const result = ts.transpileModule(source, {
    fileName: "App.tsx",
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      esModuleInterop: true,
    },
  });
  const errors = (result.diagnostics || []).filter(
    diagnostic => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (errors.length > 0) {
    console.error(errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"));
    process.exit(1);
  }
});
"""
    try:
        result = subprocess.run(
            ["node", "-e", node_script],
            input=code,
            text=True,
            cwd=FRONTEND_DIR,
            capture_output=True,
            timeout=8,
            check=False,
        )
        return result.returncode != 0
    except Exception:
        return _has_basic_unbalanced_strings(code)


def _needs_syntax_repair(code: str) -> bool:
    return (
        _has_risky_classname_template(code)
        or _has_tsx_syntax_error(code)
    )


async def _repair_syntax_if_needed(code: str, fallback_code: str | None = None) -> str:
    if not _needs_syntax_repair(code):
        return code

    try:
        repaired = await chat_completion(
            build_syntax_repair_prompt(code),
            temperature=0.1,
            max_tokens=4096,
        )
    except Exception:
        if fallback_code and not _needs_syntax_repair(fallback_code):
            return fallback_code
        return code

    repaired_code = _strip_code_fence(repaired)
    if _needs_syntax_repair(repaired_code):
        if fallback_code and not _needs_syntax_repair(fallback_code):
            return fallback_code
        return code
    return repaired_code


def _class_blocks(code: str) -> list[tuple[str, str]]:
    """Return static JSX className blocks as (tag, classes)."""
    return [
        (match.group("tag").lower(), match.group("classes"))
        for match in re.finditer(
            r"<(?P<tag>[A-Za-z][\w.]*)\b[^>]*?className\s*=\s*([\"'`])(?P<classes>[\s\S]*?)\2",
            code,
        )
    ]


def _has_canvas_quality(code: str) -> bool:
    canvas_hits = sum(
        token in code
        for token in (
            "min-h-screen",
            "w-full",
            "overflow-hidden",
            "overflow-y-auto",
            "overflow-auto",
            "max-w-",
            "mx-auto",
        )
    )
    return canvas_hits >= 4


def _has_oversized_layout(code: str) -> bool:
    if re.search(r"\btext-(?:8xl|9xl|\[[4-9]\dpx\]|\[[5-9](?:\.\d+)?rem\])\b", code):
        return True

    if re.search(r"\b(?:p[trblxy]?|m[trblxy]?|gap|space-[xy])-(?:32|36|40|44|48|52|56|60|64|72|80|96)\b", code):
        return True

    if re.search(r"\b(?:w|h|size)-\[(?:[5-9]\d{2,}|[1-9]\d{3,})px\]", code):
        return True

    large_size = re.compile(r"\b(?:w|h|size)-(?:80|88|96)\b")
    for tag, classes in _class_blocks(code):
        has_large_size = bool(large_size.search(classes))
        is_background_decoration = any(token in classes for token in ("absolute", "fixed", "pointer-events-none"))

        if tag == "svg" and has_large_size and not is_background_decoration:
            return True

        if re.search(r"\bw-(?:80|88|96)\b", classes) and re.search(r"\bh-(?:80|88|96)\b", classes):
            if not is_background_decoration:
                return True

    return False


def _has_login_quality(code: str) -> bool:
    layout_hits = sum(
        token in code
        for token in (
            "max-w-md",
            "max-w-lg",
            "max-w-xl",
            "max-w-5xl",
            "max-w-6xl",
            "items-center",
            "justify-center",
            "mx-auto",
            "grid",
        )
    )
    form_hits = sum(
        token in code
        for token in (
            'type="email"',
            "type='email'",
            'type="password"',
            "type='password'",
            "rounded-",
            "border",
            "focus:",
            "focus-visible:",
            "hover:",
            "transition",
            "h-11",
            "py-3",
            "忘记",
            "forgot",
        )
    )
    return layout_hits >= 3 and form_hits >= 7


def _looks_unusable(code: str, prompt: str) -> bool:
    normalized_code = code.lower()
    normalized_prompt = prompt.lower()

    if len(code.strip()) < 160:
        return True

    placeholder_patterns = (
        "hello world",
        "return <h1>",
        "todoapp",
        "todo app",
        "待办事项",
    )
    if any(pattern in normalized_code for pattern in placeholder_patterns):
        prompt_mentions_todo = any(term in normalized_prompt for term in ("todo", "待办", "任务"))
        if not prompt_mentions_todo:
            return True

    login_terms = ("登录", "login", "邮箱", "email", "密码", "password")
    if any(term in normalized_prompt for term in login_terms):
        required_hits = sum(
            term in normalized_code
            for term in ("login", "email", "password", "登录", "邮箱", "密码", "forgot", "忘记")
        )
        if required_hits < 2:
            return True
        if any(term in normalized_prompt for term in ("邮箱", "email")):
            if not any(term in normalized_code for term in ('type="email"', "type='email'", "email", "邮箱")):
                return True
        if any(term in normalized_prompt for term in ("忘记", "forgot")):
            if not any(term in normalized_code for term in ("forgot", "忘记")):
                return True

    page_terms = ("页面", "page", "登录", "dashboard", "仪表盘", "卡片", "表单")
    if any(term in normalized_prompt for term in page_terms):
        class_count = len(re.findall(r"className=", code))
        quality_tokens = (
            "min-h-screen",
            "rounded-",
            "shadow",
            "bg-gradient",
            "focus:",
            "focus-visible:",
            "transition",
            "hover:",
        )
        quality_hits = sum(token in code for token in quality_tokens)
        if class_count < 12 or quality_hits < 4:
            return True
        if not _has_canvas_quality(code):
            return True
        if _has_oversized_layout(code):
            return True

    if any(term in normalized_prompt for term in login_terms):
        if not _has_login_quality(code):
            return True

    return False


def _with_strict_retry_instruction(messages: list[dict], prompt: str) -> list[dict]:
    return [
        *messages,
        {
            "role": "user",
            "content": (
                "上一次输出不可用：它像占位示例、没有满足用户需求，或元素尺寸失控撑爆了中间预览画布。"
                "请重新生成，并且必须严格匹配下面的需求，不要生成 Todo、Hello world 或无关示例。\n\n"
                f"用户需求：{prompt}\n\n"
                "必须按类似 VSCode WebView 的中间画布生成：根节点使用 relative min-h-screen w-full overflow-hidden，"
                "核心界面首屏完整可见，主内容放进 relative z-10、mx-auto、max-w-* 的容器。"
                "装饰只能是 absolute 背景并带 pointer-events-none/opacity/blur，不能在普通文档流里放巨大锁、巨大 SVG 或巨大插画。"
                "禁止 text-8xl/text-9xl、w-[600px]/h-[500px]、w-96 h-96、py-32/my-40 等撑爆预览的尺寸。"
                "必须生成有真实产品质感的页面：完整布局、响应式、Tailwind 样式密集且精致，"
                "包含渐变/纹理/卡片/阴影/圆角/hover/focus 状态，不能输出浏览器默认样式。"
                "只输出完整的 React + TypeScript + Tailwind 组件代码。"
            ),
        },
    ]


@router.post("/generate", response_model=GenerateResponse)
async def generate_code(req: GenerateRequest):
    try:
        image_description = None
        if req.image_base64:
            result = await analyze_image(req.image_base64)
            image_description = result["description"]

        messages = build_generate_prompt(req.prompt, image_description)
        code = _strip_code_fence(await chat_completion(messages, temperature=0.35))

        if _looks_unusable(code, req.prompt):
            retry_messages = _with_strict_retry_instruction(messages, req.prompt)
            code = _strip_code_fence(await chat_completion(retry_messages, temperature=0.2))

        code = await _repair_syntax_if_needed(code, fallback_code=build_fallback_code(req.prompt))

        if _looks_unusable(code, req.prompt):
            fallback_code = build_fallback_code(req.prompt)
            if not _needs_syntax_repair(fallback_code):
                code = fallback_code
            else:
                raise HTTPException(
                    status_code=502,
                    detail="模型返回了占位或偏题代码，请检查当前模型/接口配置后重试。",
                )

        return GenerateResponse(
            code=code,
            css=compile_tailwind_css(code),
            explanation="代码已生成" + ("，已结合图片分析结果" if image_description else ""),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
