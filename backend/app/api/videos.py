from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from app.services.video_processor import video_processor
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

import logging

# Setup file logging
logging.basicConfig(
    filename='fvision_backend.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    try:
        logger.info(f"START UPLOAD: {file.filename}, type: {file.content_type}")
        print(f"Receiving upload request: {file.filename}, {file.content_type}")
        
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        file_name = f"{file_id}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as buffer:
            # Using chunked reading for better handling of large files
            chunk_size = 1024 * 1024 # 1MB chunks
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                buffer.write(chunk)
            
        print(f"Upload complete: {file_name}, size: {os.path.getsize(file_path)} bytes")
            
        return {
            "id": file_id,
            "filename": file_name,
            "url": f"/static/{file_name}",
            "content_type": file.content_type
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload Error: {str(e)}")

@router.post("/{video_filename}/analyze")
async def analyze_full_video(video_filename: str, background_tasks: BackgroundTasks):
    video_path = os.path.join(UPLOAD_DIR, video_filename)
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found")
    
    json_filename = f"{video_filename}.json"
    json_path = os.path.join(UPLOAD_DIR, json_filename)
    
    # Run in background to avoid timeout
    # Note: For production, use Celery/Redis. For MVP, BackgroundTasks is fine.
    background_tasks.add_task(video_processor.process_video, video_path, json_path)
    
    return {
        "message": "Analysis started", 
        "status_url": f"/api/v1/videos/{video_filename}/status"
    }

@router.get("/{video_filename}/status")
async def get_analysis_status(video_filename: str):
    json_filename = f"{video_filename}.json"
    json_path = os.path.join(UPLOAD_DIR, json_filename)
    
    if os.path.exists(json_path):
        return {"status": "completed", "result_url": f"/static/{json_filename}"}
    else:
        return {"status": "processing"}

@router.post("/{video_filename}/summary")
async def generate_summary(video_filename: str):
    json_filename = f"{video_filename}.json"
    json_path = os.path.join(UPLOAD_DIR, json_filename)
    
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Analysis data not found. Please run full analysis first.")
        
    summary = await video_processor.generate_tactical_summary(json_path)
    return {"summary": summary}

@router.get("/{video_filename}/heatmap")
async def get_heatmap(video_filename: str):
    json_filename = f"{video_filename}.json"
    json_path = os.path.join(UPLOAD_DIR, json_filename)
    
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Analysis data not found. Please run full analysis first.")
        
    heatmap_data = video_processor.generate_heatmap_data(json_path)
    if heatmap_data is None:
        raise HTTPException(status_code=500, detail="Failed to generate heatmap")
    
    return heatmap_data

@router.get("/{video_filename}/events")
async def get_events(video_filename: str):
    json_filename = f"{video_filename}.json"
    json_path = os.path.join(UPLOAD_DIR, json_filename)
    
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Analysis data not found. Please run full analysis first.")
        
    events = video_processor.extract_events(json_path)
    return {"events": events}






@router.get("/")
async def list_videos():
    files = []
    if os.path.exists(UPLOAD_DIR):
        for f in os.listdir(UPLOAD_DIR):
             files.append({"filename": f, "url": f"/static/{f}"})
    return files
