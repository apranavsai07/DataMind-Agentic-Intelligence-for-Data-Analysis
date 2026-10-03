from uuid import uuid4
from pathlib import Path

from app.database.db import supabase


BUCKET_NAME = "datasets"


class DatasetStorage:

    @staticmethod
    def save(
        file_bytes: bytes,
        filename: str,
        file_type: str,
        content_type: str,
        metadata: dict,
        user_id: str,
    ) -> dict:

        safe_filename = Path(filename).name
        storage_path = f"{uuid4()}/{safe_filename}"

        # Upload original file to Supabase Storage.
        supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=file_bytes,
            file_options={
                "content-type": (
                    content_type or "application/octet-stream"
                ),
                "upsert": "false",
            },
        )

        try:
            response = (
                supabase.table("datasets")
                .insert({
                    "user_id": user_id,
                    "filename": safe_filename,
                    "file_type": file_type,
                    "content_type": content_type,
                    "storage_path": storage_path,
                    "metadata": metadata or {},
                })
                .execute()
            )

            if not response.data:
                raise RuntimeError(
                    "Dataset database record was not created."
                )

            return response.data[0]

        except Exception:
            # Clean up the uploaded file if the DB insert fails.
            try:
                supabase.storage.from_(BUCKET_NAME).remove(
                    [storage_path]
                )
            except Exception:
                pass

            raise