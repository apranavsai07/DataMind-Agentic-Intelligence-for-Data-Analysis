
from fastapi.encoders import jsonable_encoder

import mimetypes
from pathlib import Path
from uuid import uuid4

from app.database.db import supabase


class AnalysisPersistenceService:

    @staticmethod
    def save_analysis(
        dataset_id: str | None,
        filename: str,
        user_request: str,
        plan: list,
        results: dict,
        artifacts: list,
        message: str,
        user_id: str,
    ) -> dict:
        # If a dataset is supplied, ensure it belongs to this user.
        if dataset_id is not None:
            dataset_response = (
                supabase.table("datasets")
                .select("id")
                .eq("id", dataset_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )

            if not dataset_response.data:
                raise PermissionError(
                    "Dataset not found or access denied."
                )

        payload = {
            "dataset_id": dataset_id,
            "filename": filename,
            "user_request": user_request,
            "status": "completed",
            "plan": jsonable_encoder(plan),
            "results": jsonable_encoder(results),
            "artifacts": jsonable_encoder(artifacts),
            "message": message,
            "user_id": user_id,
        }

        response = (
            supabase
            .table("analyses")
            .insert(payload)
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                "Analysis completed, but saving its history failed."
            )

        return response.data[0]

    @staticmethod
    def verify_analysis_owner(
        analysis_id: str,
        user_id: str,
    ) -> dict:
        response = (
            supabase.table("analyses")
            .select("id, dataset_id, user_id")
            .eq("id", analysis_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            raise PermissionError(
                "Analysis not found or access denied."
            )

        return response.data[0]

    @staticmethod
    def verify_output_relationship(
        analysis_id: str,
        dataset_id: str | None,
        user_id: str,
    ) -> dict:
        analysis = (
            AnalysisPersistenceService.verify_analysis_owner(
                analysis_id=analysis_id,
                user_id=user_id,
            )
        )

        # Ensure the output is associated with the same dataset
        # as the analysis. Both may legitimately be None.
        if dataset_id != analysis["dataset_id"]:
            raise PermissionError(
                "Dataset does not belong to this analysis."
            )

        return analysis

    @staticmethod
    def save_inline_output(
        analysis_id: str,
        dataset_id: str | None,
        name: str,
        output_type: str,
        content,
        user_id: str,
        content_type: str = "application/json",
        metadata: dict | None = None,
    ) -> dict:
        AnalysisPersistenceService.verify_output_relationship(
            analysis_id=analysis_id,
            dataset_id=dataset_id,
            user_id=user_id,
        )

        payload = {
            "analysis_id": analysis_id,
            "dataset_id": dataset_id,
            "name": name,
            "output_type": output_type,
            "content_type": content_type,
            "content": jsonable_encoder(content),
            "metadata": jsonable_encoder(metadata or {}),
            "user_id": user_id,
        }

        response = (
            supabase
            .table("analysis_outputs")
            .insert(payload)
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                f"Failed to save output: {name}"
            )

        return response.data[0]

    @staticmethod
    def save_file_output(
        *,
        analysis_id: str,
        dataset_id: str | None,
        name: str,
        output_type: str,
        file_path: str,
        user_id: str,
        metadata: dict | None = None,
    ) -> dict:
        """
        Upload a generated file to private Supabase Storage
        and persist its metadata in public.analysis_outputs.

        The analysis and dataset relationship is verified
        before uploading the file.
        """

        AnalysisPersistenceService.verify_output_relationship(
            analysis_id=analysis_id,
            dataset_id=dataset_id,
            user_id=user_id,
        )

        source = Path(file_path)

        if not source.is_file():
            raise FileNotFoundError(
                f"Generated output not found: {source}"
            )

        content_type, _ = mimetypes.guess_type(source.name)
        content_type = (
            content_type or "application/octet-stream"
        )

        # Unique path prevents collisions between analyses.
        storage_path = (
            f"{analysis_id}/{uuid4().hex}_{source.name}"
        )

        with source.open("rb") as file:
            file_bytes = file.read()

        # For text / CSV / markdown files, also store content inline in PostgreSQL
        # so downloads are guaranteed even if Storage signed URLs fail.
        inline_content = None
        if source.suffix.lower() in [".csv", ".txt", ".md", ".json"]:
            try:
                inline_content = file_bytes.decode("utf-8", errors="replace")
            except Exception:
                pass

        # 1. Upload the actual file to Supabase Storage.
        storage_upload_succeeded = False
        try:
            supabase.storage.from_(
                "analysis-outputs"
            ).upload(
                path=storage_path,
                file=file_bytes,
                file_options={
                    "content-type": content_type,
                    "upsert": "false",
                },
            )
            storage_upload_succeeded = True
        except Exception:
            pass

        # 2. Store file metadata in PostgreSQL.
        row = {
            "analysis_id": analysis_id,
            "dataset_id": dataset_id,
            "name": name,
            "output_type": output_type,
            "content_type": content_type,
            "storage_path": storage_path if storage_upload_succeeded else None,
            "content": inline_content,
            "metadata": jsonable_encoder(metadata or {}),
            "user_id": user_id,
        }

        try:
            response = (
                supabase
                .table("analysis_outputs")
                .insert(row)
                .execute()
            )

            if not response.data:
                raise RuntimeError(
                    "Output metadata insert returned no data."
                )

            return response.data[0]

        except Exception:
            # Avoid leaving an orphaned Storage object
            # if the database insert fails.
            try:
                supabase.storage.from_(
                    "analysis-outputs"
                ).remove([storage_path])
            except Exception:
                pass

            raise