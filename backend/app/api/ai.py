from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.services.ai_service import ai_service

router = APIRouter()

@router.post("/analyze")
async def analyze_video_frame(
    file: UploadFile = File(...), 
    prompt: str = Form("分析这个足球比赛画面，识别关键战术要素。")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read image bytes
    image_bytes = await file.read()
    
    # Call AI Service
    analysis_result = await ai_service.analyze_frame(image_bytes, prompt)
    
    return {
        "analysis": analysis_result
    }
