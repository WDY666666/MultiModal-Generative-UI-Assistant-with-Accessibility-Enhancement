from app.services.llm_service import vision_completion
from app.services.prompt_builder import build_image_analysis_prompt


async def analyze_image(image_base64: str) -> dict:
    messages = build_image_analysis_prompt()
    messages[1]["content"] = [
        {
            "type": "text",
            "text": (
                "请分析这张图片中的 UI 布局，描述以下内容：\n"
                "1. 整体布局结构，如左右分栏、上下布局等。\n"
                "2. 主要 UI 元素，如导航栏、表单、卡片、按钮等。\n"
                "3. 颜色方案和视觉风格。\n"
                "4. 响应式设计特点。\n\n"
                "请用简洁的中文描述，不要过度解读。"
            ),
        },
        {
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{image_base64}",
            },
        },
    ]

    result = await vision_completion(messages)

    return {
        "description": result,
        "layout": result,
    }
