import os
import re
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.config import settings


def sanitize_filename(filename: str) -> str:
    """Remove unsafe characters from filename."""
    name = Path(filename).stem
    ext = Path(filename).suffix.lower()
    safe = re.sub(r"[^\w\-]", "_", name)
    return f"{safe}{ext}"


def validate_file(file: UploadFile) -> None:
    """Validate file type and size."""
    # Check extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{ext}' is not supported. Please upload a PDF, DOCX, or TXT file.",
        )
    # Check MIME type
    if file.content_type and file.content_type not in settings.ALLOWED_MIME_TYPES:
        # Allow text/plain variants
        if not file.content_type.startswith("text/"):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported file type. Please upload a PDF, DOCX, or TXT file.",
            )


async def save_upload(file: UploadFile, upload_dir: str) -> tuple[str, int]:
    """
    Save uploaded file to disk.
    Returns (file_path, file_size).
    """
    # Create unique subdirectory
    file_id = str(uuid.uuid4())
    dest_dir = Path(upload_dir) / file_id
    dest_dir.mkdir(parents=True, exist_ok=True)

    safe_name = sanitize_filename(file.filename or "document")
    file_path = dest_dir / safe_name

    # Read and write in chunks, track size
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    total_size = 0

    with open(file_path, "wb") as f:
        while chunk := await file.read(8 * 1024 * 1024):  # 8MB chunks reduce disk-loop overhead
            total_size += len(chunk)
            if total_size > max_bytes:
                f.close()
                shutil.rmtree(dest_dir, ignore_errors=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds the {settings.MAX_FILE_SIZE_MB}MB size limit.",
                )
            f.write(chunk)

    return str(file_path), total_size


def delete_file(file_path: str) -> None:
    """Delete file and its parent directory."""
    try:
        path = Path(file_path)
        if path.exists():
            path.unlink()
        # Remove parent dir if empty
        parent = path.parent
        if parent.exists() and not any(parent.iterdir()):
            parent.rmdir()
    except Exception:
        pass  # Log but don't crash on delete failure


def get_file_extension(filename: str) -> str:
    """Get lowercase file extension without dot."""
    return Path(filename).suffix.lower().lstrip(".")
