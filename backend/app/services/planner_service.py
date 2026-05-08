import json
import re
from typing import Any

from app.schemas.response import InteractionPlan
from app.services.llm_service import chat_completion

PLANNER_SYSTEM_PROMPT = """你是一个 UI 产品规划 Agent。你的任务不是直接写代码，而是在生成前把用户需求拆成页面结构、交互流和实现策略。
只返回 JSON，不要返回 Markdown，不要解释。JSON 字段必须严格包含：
{
  "summary": "一句话总结",
  "pageType": "auth/dashboard/crud/ecommerce/wayfinding-3d/museum-3d/marketing/workspace/other",
  "navigationMode": "modal/state-routes/history-routes/scene-3d/single-view",
  "implementationStrategy": "说明为什么使用这种交互策略",
  "primaryViews": ["主视图"],
  "popupViews": ["弹窗1"],
  "routes": ["/", "/detail"],
  "userFlows": ["用户流程1"],
  "taskBreakdown": ["任务1", "任务2"]
}

规划规则：
1. 如果需求出现“3D、三维、模型、GLB、glTF、空间位置、路线、导览、科室、医院大厅、博物馆、文物、展品”等词，优先考虑 scene-3d。
2. 医院导览类需求默认 pageType 为 wayfinding-3d，需要覆盖“选择科室/房间 -> 查看空间位置 -> 查看路线 -> 查看楼层与无障碍路线提示”。
3. 博物馆/文物展陈类需求默认 pageType 为 museum-3d，需要覆盖“选择文物 -> 查看 3D 模型 -> 查看说明/年代/材质 -> 切换展品”。
4. 如果需求里出现“弹窗、对话框、modal、drawer”，优先选择 modal。
5. 如果需求里出现“跳转、路由、多页面、URL、详情页、创建页”，优先选择 history-routes。
6. 登录/注册/忘记密码必须覆盖完整认证流程；如果用户没有明确要求 URL，可以用 modal 或 state-routes。
7. 后台、列表、管理台、学习计划、商品管理等场景，默认补齐“列表/总览 -> 新建/详情”的流转。
8. taskBreakdown 要写成可执行实现任务，不要重复用户原话。
"""


def _clean_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    cleaned: list[str] = []
    for item in value:
        text = str(item).strip()
        if text and text not in cleaned:
            cleaned.append(text)
    return cleaned[:8]


def _contains_any(text: str, terms: tuple[str, ...]) -> bool:
    return any(term in text for term in terms)


def _fallback_plan(prompt: str, image_description: str | None = None, current_code: str | None = None) -> InteractionPlan:
    context = "\n".join(part for part in (prompt, image_description or "", current_code or "") if part).lower()

    auth_terms = ("登录", "注册", "忘记密码", "login", "sign in", "register", "password")
    modal_terms = ("弹窗", "对话框", "modal", "dialog", "drawer", "浮层")
    route_terms = ("跳转", "路由", "url", "多页面", "详情页", "创建页", "新建", "编辑", "next step")
    dashboard_terms = ("仪表盘", "后台", "dashboard", "workspace", "工作台", "管理", "列表")
    commerce_terms = ("商品", "购物车", "结算", "checkout", "cart", "order", "电商")
    hospital_3d_terms = ("医院", "科室", "房间", "路线", "导览", "大厅", "空间位置", "wayfinding")
    museum_3d_terms = ("博物馆", "文物", "展品", "藏品", "展陈", "artifact", "museum")
    generic_3d_terms = ("3d", "三维", "模型", "model", "glb", "gltf", "空间")

    page_type = "other"
    navigation_mode = "single-view"
    strategy = "保持单屏可预览结构，在一个 React 文件中完成必要交互。"
    primary_views = ["主界面"]
    popup_views: list[str] = []
    routes = ["/"]
    user_flows = ["进入页面 -> 完成核心操作"]
    tasks = ["生成主界面布局", "补齐交互与状态", "确保无障碍与预览稳定"]

    if _contains_any(context, hospital_3d_terms) and (_contains_any(context, generic_3d_terms) or "路线" in context):
        page_type = "wayfinding-3d"
        navigation_mode = "scene-3d"
        primary_views = ["医院导览总览", "科室/房间选择", "3D 空间模型", "路线高亮", "无障碍路线说明"]
        user_flows = ["选择科室或房间", "查看空间位置", "查看路线与楼层提示", "切换目标地点"]
        tasks = ["生成左侧科室选择区", "生成右侧 3D 模型区", "绘制路线高亮与楼层信息", "补齐无障碍路线提示"]
        strategy = "使用 model-viewer 显示 3D 场景模型，同时用 React 状态切换科室、房间和路线信息。"
    elif _contains_any(context, museum_3d_terms) and (_contains_any(context, generic_3d_terms) or "展品" in context):
        page_type = "museum-3d"
        navigation_mode = "scene-3d"
        primary_views = ["展品列表", "3D 文物模型", "展品说明", "可访问导览信息"]
        user_flows = ["选择文物", "查看 3D 模型", "阅读年代/材质/展区说明", "切换展品"]
        tasks = ["生成展品选择区", "生成 model-viewer 展示区", "补齐文物元数据面板", "补齐视角和可访问说明"]
        strategy = "使用 model-viewer 展示 glTF/GLB 文物模型，并用 React 状态切换不同展品信息。"
    elif _contains_any(context, auth_terms):
        page_type = "auth"
        primary_views = ["登录页", "注册流程", "找回密码流程"]
        user_flows = ["用户登录", "没有账号时注册", "忘记密码后找回"]
        tasks = ["生成登录主界面", "补齐注册流程", "补齐找回密码流程", "为入口添加真实点击行为"]
        if _contains_any(context, route_terms):
            navigation_mode = "history-routes"
            routes = ["/login", "/register", "/forgot-password"]
            strategy = "使用 History API 模拟真实地址跳转，让登录、注册、找回密码像多页面产品一样切换。"
        else:
            navigation_mode = "modal"
            popup_views = ["注册弹窗", "找回密码弹窗"]
            strategy = "默认采用登录主界面加次级弹窗的认证流，避免所有流程堆在一个表单里。"
    elif _contains_any(context, dashboard_terms) or _contains_any(context, route_terms):
        page_type = "dashboard"
        primary_views = ["仪表盘", "新建页", "详情页"]
        user_flows = ["查看总览", "点击新建进入创建页", "点击记录进入详情页"]
        tasks = ["生成总览布局", "补齐新建页", "补齐详情页", "实现返回与跳转逻辑"]
        if _contains_any(context, modal_terms):
            navigation_mode = "modal"
            popup_views = ["新建弹窗", "详情弹窗"]
            strategy = "在总览页之上叠加弹窗完成新建或详情操作，保留主页上下文。"
        else:
            navigation_mode = "history-routes"
            routes = ["/", "/new", "/detail"]
            strategy = "使用 History API 提供更像真实产品的多页面跳转。"
    elif _contains_any(context, commerce_terms):
        page_type = "ecommerce"
        primary_views = ["商品列表", "购物车", "结算页"]
        user_flows = ["浏览商品", "加入购物车", "进入结算"]
        tasks = ["生成商品列表", "补齐购物车视图", "补齐结算流程", "实现购物流转"]
        navigation_mode = "history-routes" if _contains_any(context, route_terms) else "state-routes"
        routes = ["/", "/cart", "/checkout"] if navigation_mode == "history-routes" else ["/"]
        strategy = "为浏览、购物车、结算建立连续流程，避免只停留在静态商品卡片。"

    summary = f"已识别为 {page_type} 场景，建议采用 {navigation_mode} 实现页面流。"
    return InteractionPlan(
        summary=summary,
        pageType=page_type,
        navigationMode=navigation_mode,
        implementationStrategy=strategy,
        primaryViews=primary_views,
        popupViews=popup_views,
        routes=routes,
        userFlows=user_flows,
        taskBreakdown=tasks,
    )


def _extract_json_block(text: str) -> str:
    fenced = re.search(r"```json\s*([\s\S]*?)```", text, re.IGNORECASE)
    if fenced:
        return fenced.group(1).strip()

    object_match = re.search(r"\{[\s\S]*\}", text)
    return object_match.group(0).strip() if object_match else text.strip()


def _normalize_plan(payload: dict[str, Any], fallback: InteractionPlan) -> InteractionPlan:
    summary = str(payload.get("summary") or fallback.summary).strip()
    page_type = str(payload.get("pageType") or fallback.page_type).strip() or fallback.page_type
    navigation_mode = str(payload.get("navigationMode") or fallback.navigation_mode).strip() or fallback.navigation_mode
    implementation_strategy = (
        str(payload.get("implementationStrategy") or fallback.implementation_strategy).strip()
        or fallback.implementation_strategy
    )

    return InteractionPlan(
        summary=summary,
        pageType=page_type,
        navigationMode=navigation_mode,
        implementationStrategy=implementation_strategy,
        primaryViews=_clean_list(payload.get("primaryViews")) or fallback.primary_views,
        popupViews=_clean_list(payload.get("popupViews")) or fallback.popup_views,
        routes=_clean_list(payload.get("routes")) or fallback.routes,
        userFlows=_clean_list(payload.get("userFlows")) or fallback.user_flows,
        taskBreakdown=_clean_list(payload.get("taskBreakdown")) or fallback.task_breakdown,
    )


async def plan_ui_generation(
    prompt: str,
    image_description: str | None = None,
    current_code: str | None = None,
) -> InteractionPlan:
    fallback = _fallback_plan(prompt, image_description=image_description, current_code=current_code)
    user_content = [f"用户需求：\n{prompt.strip()}"]

    if image_description:
        user_content.append(f"参考图片分析：\n{image_description.strip()}")

    if current_code:
        user_content.append(f"当前已有代码摘要：\n{current_code[:2500]}")

    try:
        result = await chat_completion(
            [
                {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
                {"role": "user", "content": "\n\n".join(user_content)},
            ],
            temperature=0.2,
        )
        payload = json.loads(_extract_json_block(result))
        if not isinstance(payload, dict):
            return fallback
        return _normalize_plan(payload, fallback)
    except Exception:
        return fallback
