from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import HTTPException

from app.parsers.parser_factory import ParserFactory
from app.storage.dataset_storage import DatasetStorage


UPLOAD_DIR = Path("datasets")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class DocumentService:

    @staticmethod
    def process(file, user_id: str):

        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file selected.",
            )

        # Avoid unsafe paths and filename collisions locally.
        original_filename = Path(file.filename).name
        suffix = Path(original_filename).suffix.lower()

        if not suffix:
            raise HTTPException(
                status_code=400,
                detail="File must have an extension.",
            )

        parser = ParserFactory.get_parser(suffix)

        if parser is None:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {suffix}",
            )

        # Read the upload once.
        file_bytes = file.file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        # Save a temporary/local copy for the existing parser.
        local_path = UPLOAD_DIR / f"{uuid4()}{suffix}"

        try:
            with open(local_path, "wb") as buffer:
                buffer.write(file_bytes)

            # Preserve the existing parsing behavior.
            document = parser.parse(local_path)

            # Persist the original file and its metadata.
            record = DatasetStorage.save(
                    file_bytes=file_bytes,
                    filename=original_filename,
                    file_type=suffix.lstrip("."),
                    content_type=(
                        file.content_type or "application/octet-stream"
                    ),
                    metadata=document.metadata or {},
                    user_id=user_id,
            )

            # Attach persistence details for later modules.
            document.dataset_id = record["id"]
            document.storage_path = record["storage_path"]

            return document

        except HTTPException:
            raise

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Dataset processing or storage failed: {str(e)}",
            )