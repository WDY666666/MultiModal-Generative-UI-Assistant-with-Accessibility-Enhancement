from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class ChatMessage(ApiModel):
    id: str
    role: str
    content: str
    timestamp: int


class GenerateRequest(ApiModel):
    prompt: str
    image_base64: Optional[str] = Field(default=None, alias="imageBase64")
    current_code: Optional[str] = Field(default=None, alias="currentCode")
    chat_history: Optional[list[ChatMessage]] = Field(default=None, alias="chatHistory")


class AnalyzeImageRequest(ApiModel):
    image_base64: str = Field(alias="imageBase64")


class ChatRequest(ApiModel):
    message: str
    current_code: str = Field(alias="currentCode")
    chat_history: list[ChatMessage] = Field(default_factory=list, alias="chatHistory")


class A11yIssue(ApiModel):
    id: str
    impact: str
    description: str
    help: str
    help_url: str = Field(alias="helpUrl")
    nodes: int


class FixRequest(ApiModel):
    issue: A11yIssue
    current_code: str = Field(alias="currentCode")
