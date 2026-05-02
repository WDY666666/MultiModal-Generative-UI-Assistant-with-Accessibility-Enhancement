from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class GenerateResponse(ApiModel):
    code: str
    explanation: Optional[str] = None
    css: Optional[str] = None


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


class FixResponse(ApiModel):
    fix_code: str = Field(alias="fixCode")
    explanation: str
    css: Optional[str] = None


class ExplainIssueResponse(ApiModel):
    explanation: str
    fix_suggestion: Optional[str] = Field(default=None, alias="fixSuggestion")
