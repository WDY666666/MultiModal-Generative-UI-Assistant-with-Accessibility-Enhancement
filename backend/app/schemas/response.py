from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class GenerateResponse(ApiModel):
    code: str
    explanation: Optional[str] = None


class AnalyzeImageResponse(ApiModel):
    description: str
    layout: str


class ChatResponse(ApiModel):
    code: str
    reply: str


class FixResponse(ApiModel):
    fix_code: str = Field(alias="fixCode")
    explanation: str
