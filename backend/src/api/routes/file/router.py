import os
import shutil

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from common.utils import create_uuid

router = APIRouter(tags=["file"])

# Define upload directory relative to project root (or backend root)
# Assuming running from backend/src or backend/
# It's safer to use absolute path based on this file's location
# backend/src/api/routes/file/router.py -> ../../../../static/uploads
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")

@router.post("/files/upload", summary="上传文件")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """上传文件到服务器本地存储."""
    # Create directory if not exists
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    filename = f"{create_uuid()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
        
    # Return URL (absolute URL)
    # request.base_url returns something like "http://localhost:8000/"
    return {"url": f"{request.base_url}static/uploads/{filename}", "filename": filename}
