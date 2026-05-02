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
ALLOWED_IMPORT_MODULES = {"react"}
COMMON_REACT_HOOKS = (
    "useState",
    "useEffect",
    "useMemo",
    "useCallback",
    "useRef",
    "useReducer",
    "useId",
    "useTransition",
    "useDeferredValue",
    "useLayoutEffect",
    "useImperativeHandle",
)


def _strip_code_fence(text: str) -> str:
    match = re.search(r"```(?:tsx?|jsx?|react)?\s*\n([\s\S]*?)```", text)
    return (match.group(1) if match else text).strip()


def _is_previewable_code(code: str) -> bool:
    normalized = code.strip()
    if len(normalized) < 120:
        return False

    if "export default" not in normalized:
        return False

    has_jsx = bool(re.search(r"<[A-Za-z][\w.-]*(?:\s|>|/)", normalized) or "<>" in normalized)
    has_component = bool(
        re.search(r"(?:function|const)\s+[A-Z][A-Za-z0-9_]*", normalized)
        or re.search(r"export\s+default\s+(?:function|\(\s*\)|[A-Z][A-Za-z0-9_]*)", normalized)
    )
    return has_jsx and has_component


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


def _imported_modules(code: str) -> set[str]:
    modules = {
        match.group(1)
        for match in re.finditer(r"import\s+[\s\S]*?\s+from\s+['\"]([^'\"]+)['\"]", code)
    }
    modules.update(
        match.group(1)
        for match in re.finditer(r"import\s+['\"]([^'\"]+)['\"]", code)
    )
    return modules


def _named_react_imports(code: str) -> set[str]:
    imported: set[str] = set()
    for match in re.finditer(r"import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['\"]react['\"]", code):
        for raw_item in match.group(1).split(","):
            token = raw_item.strip()
            if not token:
                continue
            if " as " in token:
                token = token.split(" as ", 1)[0].strip()
            imported.add(token)
    return imported


def _has_unsupported_imports(code: str) -> bool:
    modules = _imported_modules(code)
    return any(module not in ALLOWED_IMPORT_MODULES for module in modules)


def _has_missing_react_hook_imports(code: str) -> bool:
    imported_names = _named_react_imports(code)
    has_react_namespace = bool(
        re.search(r"import\s+\*\s+as\s+React\s+from\s+['\"]react['\"]", code)
    )

    for hook in COMMON_REACT_HOOKS:
        if not re.search(rf"\b{hook}\s*\(", code):
            continue
        if re.search(rf"\bReact\.{hook}\s*\(", code):
            continue
        if hook in imported_names:
            continue
        if has_react_namespace:
            continue
        return True

    return False


def _has_runtime_risk(code: str) -> bool:
    return _has_unsupported_imports(code) or _has_missing_react_hook_imports(code)


def _is_safe_previewable_code(code: str) -> bool:
    return _is_previewable_code(code) and not _needs_syntax_repair(code) and not _has_runtime_risk(code)


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
        if fallback_code and _is_safe_previewable_code(fallback_code):
            return fallback_code
        return code

    repaired_code = _strip_code_fence(repaired)
    if _needs_syntax_repair(repaired_code):
        if fallback_code and _is_safe_previewable_code(fallback_code):
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
                "Your previous output is not usable: it looks like a placeholder, does not satisfy the requirement, "
                "or breaks the preview canvas layout.\n\n"
                f"User requirement:\n{prompt}\n\n"
                "Regenerate and strictly follow these constraints:\n"
                "1) Output only complete React + TypeScript + Tailwind component code.\n"
                "2) Use a preview-safe root layout like `relative min-h-screen w-full overflow-hidden`.\n"
                "3) Keep the core UI fully visible in the first screen inside a centered container.\n"
                "4) Decorative shapes must be absolute background-only elements (pointer-events-none, blur/opacity).\n"
                "5) Avoid oversized classes such as text-8xl/text-9xl, w-[600px], h-[500px], w-96 h-96, py-32/my-40.\n"
                "6) Do not output placeholder demos like Todo/Hello World.\n"
                "7) Ensure polished product-level styling, responsive layout, and accessible focus/contrast states."
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
        fallback_code = build_fallback_code(req.prompt)
        llm_error: str | None = None

        try:
            code = _strip_code_fence(await chat_completion(messages, temperature=0.35))
        except Exception as exc:
            llm_error = str(exc) or "model request failed"
            code = ""

        # Keep latency predictable for slower hosted models:
        # retry only when the first output is not previewable at all.
        if code and not _is_previewable_code(code):
            retry_messages = _with_strict_retry_instruction(messages, req.prompt)
            try:
                code = _strip_code_fence(await chat_completion(retry_messages, temperature=0.2))
            except Exception as exc:
                llm_error = llm_error or str(exc) or "model request failed"

        code = await _repair_syntax_if_needed(code, fallback_code=fallback_code)

        if (
            not _is_previewable_code(code)
            or _needs_syntax_repair(code)
            or _has_runtime_risk(code)
            or _looks_unusable(code, req.prompt)
        ):
            if _is_safe_previewable_code(fallback_code):
                code = fallback_code
            else:
                detail = llm_error or "Model and fallback template both failed to return previewable code."
                raise HTTPException(status_code=502, detail=detail)

        if llm_error and code == fallback_code:
            explanation = f"Model was unstable, fallback template was used: {llm_error}"
        else:
            explanation = "Code generated" + (" with image understanding" if image_description else "")

        return GenerateResponse(
            code=code,
            css=compile_tailwind_css(code),
            explanation=explanation,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
