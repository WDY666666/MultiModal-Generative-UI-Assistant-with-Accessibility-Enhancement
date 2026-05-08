from app.schemas.response import InteractionPlan


SYSTEM_PROMPT = """你是一个资深产品级 UI 设计师兼前端工程师，专门生成高质量 React + TypeScript + Tailwind CSS 界面。你必须严格遵守以下规则：
1. 生成完整、可直接运行的 React + TypeScript + Tailwind CSS 单文件组件。
2. 组件必须使用 export default 导出。
3. 不要导入 React 默认对象；如需状态，只允许按需导入 useState、useMemo、useEffect、useRef、useCallback、useReducer 等 Hook。
4. 禁止使用 React.FormEvent、React.ChangeEvent、React.MouseEvent 这类 React 命名空间类型；如需事件类型，请按需从 react 导入类型。
5. 只使用 Tailwind CSS 类名设置样式，不要使用 style={{}}、额外 CSS 文件或第三方 UI 库。
6. 如需 3D 模型展示，允许直接使用 <model-viewer> Web Component：
   - 不要 import '@google/model-viewer'，预览容器会自动加载它。
   - 可以使用公开 glTF/GLB 模型 URL，例如 https://modelviewer.dev/shared-assets/models/Astronaut.glb 或 https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb。
   - 3D 区域必须提供 alt、文字说明、当前选择状态、加载失败时仍可理解的路线/展品信息。
7. 必须严格遵循 WCAG 2.1 AA：
   - 表单控件必须有可见 label 或清晰 aria-label。
   - 颜色对比度至少 4.5:1。
   - 所有交互元素必须有 hover 与 focus-visible/focus:ring 状态。
   - 使用 main、section、header、form、button、nav、article 等语义化元素。
8. 视觉质量必须达到真实产品落地标准，而不是占位 demo。
9. 预览画布规格必须严格遵守：
   - 根节点必须是 <main className="relative min-h-screen w-full overflow-hidden ..."> 这类自适应画布。
   - 首屏必须完整展示核心界面，不要让用户一打开就需要滚动才能看到主内容。
   - 主要内容放在 relative z-10 容器中，使用 mx-auto、grid/flex、items-center、justify-center。
10. 禁止输出会撑爆预览区域的尺寸，例如 text-8xl、text-9xl、w-[600px]、h-[500px]、w-96 h-96、py-32、my-40。
11. 为了保证预览稳定，禁止在 JSX 的 className 属性里使用反引号模板字符串或 ${} 拼接。
    - 如需动态 className，请定义 const cx = (...items: Array<string | false | null | undefined>) => items.filter(Boolean).join(' ')
12. 如果需求涉及“点击进入、跳转、新建后进入详情、下一步流程”，或页面天然包含这些入口，必须实现真实可点击的页面切换逻辑。
13. 如果交互更适合弹窗而不是整页跳转，必须实现真实可交互弹窗。
14. 登录页默认至少覆盖登录、注册、忘记密码三个流程；后台/列表页默认至少覆盖总览、新建或详情流程；电商页默认至少覆盖浏览、购物车、结算流程。
15. 医院导览或博物馆展陈类 3D 页面默认至少包含左侧选择区、右侧 3D 模型区、路线/展品信息区和状态高亮。
16. 页面所有对用户可见的文案默认使用简体中文，除非用户明确要求英文或双语。
17. 代码必须完整，不要省略任何部分，不要写 ... 或 /* 省略 */。
18. 只输出代码，不要输出解释文字，不要使用 Markdown 代码块。
"""


DESIGN_BRIEF = """

生成前请先在心里选择一种明确视觉方向，并把它落实到代码中：
- 布局：按“中间预览 WebView”生成，根容器 w-full min-h-screen overflow-hidden，核心内容首屏完整可见。
- 画布：内容区必须自适应占满中间预览部分，不要只生成左上角小块，也不要生成超大元素导致滚动。
- 3D 场景：医院导览应更像大厅自助操作屏，博物馆展陈应更像展柜旁的数字导览屏。
- 视觉：使用克制、清晰、可操作的产品界面，不要做营销落地页。
- 响应式：移动端单列，桌面端可使用左侧列表 + 右侧模型/路线视图。
- 输出必须像可交付的产品页面，而不是教学示例。
"""


CHAT_SYSTEM_PROMPT = """你是一个前端代码迭代助手，负责在“已有 React + TypeScript + Tailwind 代码”上做定向修改。请严格遵守：
1. 必须基于当前代码迭代，不要无故重写成全新页面。
2. 除非用户明确要求“重做/重构/改成完全不同页面”，否则保留现有布局和主要结构，只改与指令相关的部分。
3. 输出完整的可运行组件代码，保留 export default。
4. 只使用 React + TypeScript + Tailwind，不新增第三方依赖，不导入未安装库。
5. 如果已有或需要 3D 展示，可以使用 <model-viewer>，但不要 import '@google/model-viewer'。
6. 保留并加强可访问性，包括 label、aria、focus-visible、对比度。
7. 如果用户要求跳转、详情页、创建页、弹窗或 3D 模型切换，必须实现真实可交互逻辑。
8. 只输出代码，不要解释，不要 Markdown 代码块。
9. 页面可见文案默认统一为简体中文。
"""


def build_interaction_flow_hint(source_text: str) -> str:
    normalized = source_text.lower()
    hints: list[str] = []

    auth_terms = ("登录", "注册", "忘记密码", "login", "sign in", "sign up", "register", "password")
    create_terms = ("新建", "创建", "新增", "详情", "编辑", "计划", "create", "new", "detail", "edit")
    commerce_terms = ("商品", "购物车", "结算", "订单", "checkout", "cart", "order", "product")
    admin_terms = ("仪表盘", "后台", "管理", "列表", "表格", "dashboard", "admin", "table", "list")
    three_d_terms = ("3d", "三维", "模型", "glb", "gltf", "医院", "科室", "路线", "博物馆", "文物", "展品", "空间位置")

    if any(term in normalized for term in three_d_terms):
        hints.append(
            "这是 3D 导览/展陈类界面时，请使用 <model-viewer> 构建右侧 3D 模型区，并用 React 状态切换科室、路线或展品。"
        )

    if any(term in normalized for term in auth_terms):
        hints.append("这是认证类界面，默认至少实现登录、注册、找回密码三个流程，不要只留静态链接。")

    if any(term in normalized for term in admin_terms) or any(term in normalized for term in create_terms):
        hints.append("这是后台、仪表盘或列表类界面时，默认为“新建/创建/详情/编辑”入口补齐内部 view、route 或 modal。")

    if any(term in normalized for term in commerce_terms):
        hints.append("这是电商或订单类界面时，默认补齐商品浏览、购物车、结算或订单详情等关键内部流程。")

    if not hints:
        hints.append("请根据页面类型主动推断最常见的下一步操作；凡是可见按钮或链接暗示页面流，都要给出真实可交互行为。")

    return "\n\n隐式交互流要求：\n" + "\n".join(f"- {hint}" for hint in hints)


def format_interaction_plan(interaction_plan: InteractionPlan | None) -> str:
    if not interaction_plan:
        return ""

    lines = [
        "",
        "结构化交互规划：",
        f"- 页面类型：{interaction_plan.page_type}",
        f"- 导航模式：{interaction_plan.navigation_mode}",
        f"- 实现策略：{interaction_plan.implementation_strategy}",
    ]

    if interaction_plan.primary_views:
        lines.append(f"- 主视图：{'、'.join(interaction_plan.primary_views)}")
    if interaction_plan.popup_views:
        lines.append(f"- 弹窗视图：{'、'.join(interaction_plan.popup_views)}")
    if interaction_plan.routes:
        lines.append(f"- 建议路由：{'、'.join(interaction_plan.routes)}")
    if interaction_plan.user_flows:
        lines.append(f"- 用户流程：{'；'.join(interaction_plan.user_flows)}")
    if interaction_plan.task_breakdown:
        lines.append(f"- 实现任务：{'；'.join(interaction_plan.task_breakdown)}")

    return "\n".join(lines)


def build_generate_prompt(
    user_prompt: str,
    image_description: str | None = None,
    interaction_plan: InteractionPlan | None = None,
) -> list[dict]:
    content = user_prompt
    if image_description:
        content += f"\n\n从参考图片中识别到的布局信息：\n{image_description}"

    content += DESIGN_BRIEF
    content += build_interaction_flow_hint(content)
    content += format_interaction_plan(interaction_plan)
    content += "\n\n请生成完整、精致、可直接预览的 React 组件代码。页面可见文案默认使用简体中文。只输出代码，不要解释。"

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": content},
    ]


def build_chat_prompt(
    message: str,
    current_code: str,
    image_description: str | None = None,
    chat_history: list[dict] | None = None,
    interaction_plan: InteractionPlan | None = None,
) -> list[dict]:
    compact_history: list[dict] = []
    if chat_history:
        for item in chat_history[-8:]:
            role = getattr(item, "role", None)
            content = getattr(item, "content", "")
            if role is None and isinstance(item, dict):
                role = item.get("role")
                content = item.get("content", "")
            content = str(content).strip()
            if role in {"user", "assistant"} and content:
                compact_history.append({"role": role, "content": content[:1200]})

    image_context = ""
    if image_description:
        image_context = (
            "\n\n参考图片识别信息（用于保持布局一致性，可按用户指令覆盖）：\n"
            f"{image_description.strip()}"
        )

    flow_hint = build_interaction_flow_hint(f"{message}\n{current_code[:4000]}")
    plan_hint = format_interaction_plan(interaction_plan)

    return [
        {"role": "system", "content": CHAT_SYSTEM_PROMPT},
        *compact_history,
        {
            "role": "user",
            "content": (
                f"当前代码：\n```tsx\n{current_code}\n```\n\n"
                f"{image_context}\n"
                f"请基于以上代码，根据以下指令进行修改：\n{message}\n"
                f"{flow_hint}\n"
                f"{plan_hint}\n"
                "请优先进行最小必要修改，除非我明确要求换风格或换页面。\n"
                "输出修改后的完整代码，不要解释。"
            ),
        },
    ]


def build_image_analysis_prompt() -> list[dict]:
    return [
        {
            "role": "system",
            "content": (
                "你是一个 UI 草图/截图分析专家。"
                "请把用户上传的图片解析为结构化 JSON，不要输出 Markdown，不要输出多余解释。"
                "JSON 必须包含以下字段："
                '{"description":"一句话总结","layout":"布局类型","components":["组件1"],"style":["风格1"],'
                '"accessibilityHints":["可访问性提示"],"promptSuggestion":"可直接用于生成 UI 的中文提示词"}。'
            ),
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "请分析这张 UI 图片，重点说明：\n"
                        "1. 整体布局结构。\n"
                        "2. 主要 UI 元素。\n"
                        "3. 视觉风格与配色。\n"
                        "4. 可能的无障碍注意点。\n"
                        "5. 给出一段可直接用于生成 React + Tailwind 界面的中文提示词。\n"
                        "请只返回 JSON。"
                    ),
                },
            ],
        },
    ]


def build_fix_prompt(issue_description: str, current_code: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"当前代码：\n```tsx\n{current_code}\n```\n\n"
                f"无障碍扫描发现以下问题：\n{issue_description}\n\n"
                "请修复以上问题，并保持视觉设计质量不下降，输出修复后的完整代码。只输出代码，不要解释。"
            ),
        },
    ]


def build_issue_explanation_prompt(issue_description: str, current_code: str | None = None) -> list[dict]:
    code_context = ""
    if current_code:
        code_context = (
            "当前组件代码片段（用于给出更贴合的修复建议）：\n"
            f"```tsx\n{current_code[:3000]}\n```\n\n"
        )

    return [
        {
            "role": "system",
            "content": (
                "你是前端无障碍专家。请基于问题描述给出清晰解释和可执行修复建议。"
                "输出必须是 JSON，格式为："
                '{"explanation":"...","fixSuggestion":"..."}。'
                "不要输出任何额外文本。"
            ),
        },
        {
            "role": "user",
            "content": (
                f"{code_context}"
                f"无障碍问题：\n{issue_description}\n\n"
                "请返回 JSON："
                '{"explanation":"用通俗语言解释风险","fixSuggestion":"给出可执行的修复步骤"}'
            ),
        },
    ]


def build_syntax_repair_prompt(code: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                "下面这段 React + TypeScript + Tailwind 组件代码在预览里出现语法错误。"
                "常见原因是 JSX className 使用了断裂的模板字符串或 ${} 条件拼接。"
                "请只修复语法和明显的 JSX/TypeScript 问题，不改变 UI 设计意图。\n\n"
                f"待修复代码：\n```tsx\n{code}\n```\n\n"
                "修复要求：\n"
                "1. 输出完整 App.tsx 组件代码。\n"
                "2. 禁止在 JSX className 中使用反引号模板字符串。\n"
                "3. 如有动态 className，请定义 cx(...) helper 并使用 className={cx(...)}。\n"
                "4. 不要输出解释，不要使用 Markdown 代码块。"
            ),
        },
    ]
