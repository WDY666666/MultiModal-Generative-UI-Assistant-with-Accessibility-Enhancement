import json
import re

from app.services.llm_service import chat_completion
from app.services.prompt_builder import build_fix_prompt, build_issue_explanation_prompt


async def explain_issues(violations: list[dict]) -> list[dict]:
    explanations = []
    for violation in violations:
        nodes = violation.get("nodes", [])
        node_count = len(nodes) if isinstance(nodes, list) else int(nodes or 0)
        issue_description = (
            f"Issue ID: {violation.get('id', '')}\n"
            f"Impact: {violation.get('impact', '')}\n"
            f"Description: {violation.get('description', '')}\n"
            f"Help: {violation.get('help', '')}\n"
            f"Affected nodes: {node_count}"
        )

        detail = await explain_issue(issue_description)
        explanations.append(
            {
                "id": violation.get("id", ""),
                "explanation": detail["explanation"],
                "fixSuggestion": detail["fixSuggestion"],
            }
        )

    return explanations


def _extract_json_payload(text: str) -> dict[str, str]:
    source = text.strip()
    if not source:
        return {}

    try:
        parsed = json.loads(source)
        if isinstance(parsed, dict):
            return {str(k): str(v) for k, v in parsed.items()}
    except Exception:
        pass

    match = re.search(r"\{[\s\S]*\}", source)
    if not match:
        return {}

    try:
        parsed = json.loads(match.group(0))
        if isinstance(parsed, dict):
            return {str(k): str(v) for k, v in parsed.items()}
    except Exception:
        return {}

    return {}


async def explain_issue(issue_description: str, current_code: str | None = None) -> dict[str, str]:
    result = await chat_completion(
        build_issue_explanation_prompt(issue_description, current_code),
        temperature=0.2,
        max_tokens=500,
    )
    payload = _extract_json_payload(result)

    explanation = payload.get("explanation", "").strip()
    fix_suggestion = payload.get("fixSuggestion", "").strip()

    if not explanation:
        explanation = (
            "This issue may prevent keyboard users or screen-reader users from using part of the UI effectively."
        )
    if not fix_suggestion:
        fix_suggestion = (
            "Use the axe hint to add semantic labels/roles and strengthen focus or contrast where needed."
        )

    return {
        "explanation": explanation,
        "fixSuggestion": fix_suggestion,
    }


async def generate_fix(issue_description: str, current_code: str) -> dict:
    messages = build_fix_prompt(issue_description, current_code)
    fix_code = await chat_completion(messages, temperature=0.3)

    return {
        "fixCode": fix_code,
        "explanation": "Applied an accessibility-oriented code fix for the selected issue.",
    }
