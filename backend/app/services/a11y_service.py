from app.services.llm_service import chat_completion
from app.services.prompt_builder import build_fix_prompt


async def explain_issues(violations: list[dict]) -> list[dict]:
    explanations = []
    for violation in violations:
        prompt = f"""请用简洁的中文解释以下无障碍问题，并给出修复建议：

问题：{violation.get('help', '')}
影响程度：{violation.get('impact', '')}
描述：{violation.get('description', '')}
影响元素数量：{len(violation.get('nodes', []))}

请用以下格式回答：
解释：[用通俗易懂的语言解释这个问题为什么重要]
建议：[给出具体的修复建议]
"""

        result = await chat_completion(
            [{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500,
        )

        explanations.append({
            "id": violation.get("id", ""),
            "explanation": result,
        })

    return explanations


async def generate_fix(issue_description: str, current_code: str) -> dict:
    messages = build_fix_prompt(issue_description, current_code)
    fix_code = await chat_completion(messages, temperature=0.3)

    return {
        "fixCode": fix_code,
        "explanation": "已根据无障碍扫描结果自动生成修复后的代码。",
    }
