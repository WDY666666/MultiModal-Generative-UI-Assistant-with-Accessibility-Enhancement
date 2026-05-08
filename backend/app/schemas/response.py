from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class InteractionPlan(ApiModel):
    summary: str
    page_type: str = Field(alias="pageType")
    navigation_mode: str = Field(alias="navigationMode")
    implementation_strategy: str = Field(alias="implementationStrategy")
    primary_views: list[str] = Field(default_factory=list, alias="primaryViews")
    popup_views: list[str] = Field(default_factory=list, alias="popupViews")
    routes: list[str] = Field(default_factory=list)
    user_flows: list[str] = Field(default_factory=list, alias="userFlows")
    task_breakdown: list[str] = Field(default_factory=list, alias="taskBreakdown")


class GenerateResponse(ApiModel):
    code: str
    explanation: Optional[str] = None
    css: Optional[str] = None
    plan: Optional[InteractionPlan] = None


class AnalyzeImageResponse(ApiModel):
    description: str
    layout: str
    components: list[str] = Field(default_factory=list)
    style: list[str] = Field(default_factory=list)
    accessibility_hints: list[str] = Field(default_factory=list, alias="accessibilityHints")
    prompt_suggestion: Optional[str] = Field(default=None, alias="promptSuggestion")


class ChatResponse(ApiModel):
    code: str
    reply: str
    css: Optional[str] = None
    plan: Optional[InteractionPlan] = None


class FixResponse(ApiModel):
    fix_code: str = Field(alias="fixCode")
    explanation: str
    css: Optional[str] = None


class ExplainIssueResponse(ApiModel):
    explanation: str
    fix_suggestion: Optional[str] = Field(default=None, alias="fixSuggestion")
