from fastapi import APIRouter, HTTPException
from app.schemas.request import AnalyzeImageRequest
from app.schemas.response import AnalyzeImageResponse
from app.services.image_service import analyze_image

router = APIRouter()


@router.post("/analyze-image", response_model=AnalyzeImageResponse)
async def analyze_image_route(req: AnalyzeImageRequest):
    try:
        result = await analyze_image(req.image_base64)
        return AnalyzeImageResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
