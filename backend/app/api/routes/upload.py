from fastapi import APIRouter, UploadFile, File, Form

from app.services.document_service import DocumentService
from app.agents.supervisor import Supervisor
from app.services.analysis_persistence_service import (
    AnalysisPersistenceService,
)
from pathlib import Path
import tempfile

from app.schemas.responses import (
    WorkspaceResponse,
    RequestInfo,
    WorkspaceResults,
)
from fastapi import Depends
from app.core.auth import get_current_user


router = APIRouter()

def normalize_profile_result(profile_data: dict) -> dict:
    """
    Convert deterministic executor profile results
    into the frontend ProfileResult structure.
    """

    normalized = {
        "status": profile_data.get(
            "status",
            "completed",
        ),
        "rows": None,
        "columns": None,
        "column_names": [],
        "dtypes": {},
        "missing_values": {},
        "duplicates": None,
        "numeric_summary": {},
        "categorical_summary": {},
    }

    for item in profile_data.get(
        "results",
        [],
    ):

        operation = item.get(
            "operation"
        )

        data = item.get(
            "data"
        )

        if operation == "BASIC_PROFILE":

            normalized["rows"] = data.get(
                "rows"
            )

            normalized["columns"] = data.get(
                "columns"
            )

            normalized["column_names"] = data.get(
                "column_names",
                [],
            )

            normalized["dtypes"] = data.get(
                "dtypes",
                {},
            )

        elif operation == "MISSING_VALUES":

            normalized["missing_values"] = (
                data or {}
            )

        elif operation == "DUPLICATES":

            normalized["duplicates"] = data

        elif operation == "NUMERIC_SUMMARY":

            normalized["numeric_summary"] = (
                data or {}
            )

        elif operation == "CATEGORICAL_SUMMARY":

            normalized["categorical_summary"] = (
                data or {}
            )

    return normalized


@router.post(
    "/",
    response_model=WorkspaceResponse,
)
async def upload(
    file: UploadFile = File(...),
    user_request: str = Form(...),
    current_user=Depends(get_current_user),
):

    # ========================================================
    # 1. PROCESS UPLOADED FILE
    # ========================================================

    document = DocumentService.process(
    file,
    user_id=str(current_user.id),
)

    # ========================================================
    # 2. INITIAL WORKSPACE STATE
    # ========================================================

    state = {
        "filename": document.filename,

        "file_type": document.file_type,

        "user_request": user_request,

        "document": document,

        "dataframe": (
            document.content
            if document.content_type == "dataframe"
            else None
        ),

        "document_text": (
            document.content
            if document.content_type == "text"
            else ""
        ),

        "metadata": document.metadata or {},

        "messages": [],

        "plan": [],

        "results": {},

        "artifacts": [],

        "preprocessing_steps": [],

        "output_file": None,

        "report": None,

        "requires_report": False,
    }

    # ========================================================
    # 3. ROUTE TO DATA / DOCUMENT WORKFLOW
    # ========================================================

    workflow = Supervisor.route(
        document
    )

    # ========================================================
    # 4. EXECUTE WORKFLOW
    # ========================================================

    result = workflow.invoke(
        state
    )

    # ========================================================
    # 5. PREPARE STRUCTURED RESULTS
    # ========================================================

    results_data = dict(
        result.get(
            "results",
            {}
        )
    )

# ========================================================
# NORMALIZE PROFILE RESULTS
# ========================================================

    if results_data.get("profile") is not None:

        results_data["profile"] = (
            normalize_profile_result(
                results_data["profile"]
            )
        )


# ========================================================
# NORMALIZE DOCUMENT WORKFLOW RESULTS
#
# The document graph writes top-level state keys
# (summary, report) rather than results dict entries.
# Move them into results_data so the frontend can
# detect and render them via buildTabs().
# ========================================================

    # Plain string summary → SummaryResult dict
    raw_summary = result.get("summary")
    if raw_summary is not None and "summary" not in results_data:
        if isinstance(raw_summary, str) and raw_summary.strip():
            results_data["summary"] = {
                "status": "completed",
                "text": raw_summary.strip(),
                "key_points": [],
            }
        elif isinstance(raw_summary, dict):
            results_data["summary"] = raw_summary

    # Document metadata → DocumentResult dict
    doc = state.get("document")
    if doc is not None and "document" not in results_data:
        doc_meta = doc.metadata or {}
        results_data["document"] = {
            "status": "completed",
            "pages": doc_meta.get("pages"),
            "characters": doc_meta.get("characters"),
            "words": doc_meta.get("words"),
            "metadata": doc_meta,
        }

    if result.get("report") is not None:

        results_data["report"] = result[
            "report"
        ]

       # ========================================================
    # 6. RETURN STABLE FRONTEND RESPONSE
    # ========================================================

    completed_tasks = [
        task.get("task")
        for task in result.get("plan", [])
    ]

    completed_tasks = list(
        dict.fromkeys(completed_tasks)
    )

    task_messages = {
        "PROFILE": "Dataset profiling completed.",
        "CLEAN": "Data cleaning completed.",
        "ANALYSIS": "Data analysis completed.",
        "VISUALIZATION": "Visualization completed.",
        "EXPORT": "Data export completed.",
    }

    if not completed_tasks:

        message = (
            "Request completed successfully."
        )

    elif len(completed_tasks) == 1:

        message = task_messages.get(
            completed_tasks[0],
            "Request completed successfully.",
        )

    else:

        labels = [
            task_messages.get(
                task,
                f"{task.title()} completed.",
            )
            for task in completed_tasks
        ]

        message = " ".join(labels)

    # 1. Save the completed analysis
    saved_analysis = AnalysisPersistenceService.save_analysis(
        dataset_id=document.dataset_id,
        filename=document.filename,
        user_request=user_request,
        plan=result.get("plan", []),
        results=results_data,
        artifacts=result.get("artifacts", []),
        message=message,
        user_id=str(current_user.id),
    )

    analysis_id = saved_analysis["id"]

    # Persist generated files in Supabase Storage.
    persisted_paths = set()
    # Track the output_id for the cleaned CSV so we can link it in results.
    cleaned_csv_output_id = None

    for artifact in result.get("artifacts", []):
        artifact_path = artifact.get("path")

        if not artifact_path:
            continue

        source_path = Path(artifact_path)

        # Skip duplicate references to the same file.
        dedupe_key = str(source_path.resolve())

        if dedupe_key in persisted_paths:
            continue

        persisted_paths.add(dedupe_key)

        output_type = artifact.get("type", "file")

        saved_output = AnalysisPersistenceService.save_file_output(
            analysis_id=analysis_id,
            dataset_id=document.dataset_id,
            name=artifact.get(
                "name",
                source_path.name,
            ),
            output_type=output_type,
            file_path=str(source_path),
            metadata={
                "description": artifact.get(
                    "description"
                ),
                "source": "analysis_workflow",
                **({
                    "original_filename": artifact["original_filename"]
                } if artifact.get("original_filename") else {}),
            },
            user_id=str(current_user.id),
        )

        # For cleaned_data artifacts, remember the output ID so we
        # can embed it in the cleaning result for the frontend.
        if output_type == "cleaned_data" and saved_output:
            cleaned_csv_output_id = saved_output.get("id")

        # Remove temporary files created by the executor
        # (cleaned CSVs, report MDs) once safely stored.
        if str(source_path).startswith(tempfile.gettempdir()):
            try:
                source_path.unlink(missing_ok=True)
            except Exception:
                pass

    # If a cleaned CSV was saved, embed its output ID in the cleaning result
    # so the frontend can show a direct "Download Cleaned CSV" button.
    if cleaned_csv_output_id and isinstance(results_data.get("cleaning"), dict):
        results_data["cleaning"]["cleaned_output_id"] = cleaned_csv_output_id
        results_data["cleaning"]["cleaned_csv_name"] = result.get("_cleaned_csv_name", "")
        # Persist the updated results_data back to the analysis row.
        try:
            from app.database.db import supabase
            from fastapi.encoders import jsonable_encoder
            supabase.table("analyses").update({
                "results": jsonable_encoder(results_data)
            }).eq("id", analysis_id).execute()
        except Exception:
            pass  # Non-fatal — summary still displays correctly


# 2. Save the report as an output, if one was generated
    report = result.get("report")

    # Save the report content in the database and
# upload a downloadable Markdown file to Supabase Storage.
    if report is not None:
        # The report may be a dict or a plain string.
        if isinstance(report, dict):
            report_text = report.get("text", "")
        else:
            report_text = str(report)

        if report_text.strip():
            report_name = f"{document.filename.rsplit('.', 1)[0]}_report"

            # 1. Save report content for displaying in the workspace.
            AnalysisPersistenceService.save_inline_output(
                analysis_id=analysis_id,
                dataset_id=document.dataset_id,
                name=report_name,
                output_type="report",
                content=report,
                content_type="text/markdown",
                metadata={
                    "source": "analysis_workflow",
                    "format": "markdown",
                },
                user_id=str(current_user.id),
            )

            # 2. Create a temporary Markdown file.
            temp_path = None

            try:
                with tempfile.NamedTemporaryFile(
                    mode="w",
                    encoding="utf-8",
                    suffix=".md",
                    prefix="analysis_report_",
                    delete=False,
                ) as temp_file:
                    temp_file.write(report_text)
                    temp_path = Path(temp_file.name)

                # 3. Upload the actual file to Supabase Storage.
                AnalysisPersistenceService.save_file_output(
                    analysis_id=analysis_id,
                    dataset_id=document.dataset_id,
                    name=f"{report_name}.md",
                    output_type="report",
                    file_path=str(temp_path),
                    metadata={
                        "source": "analysis_workflow",
                        "format": "markdown",
                        "original_filename": document.filename,
                    },
                    user_id=str(current_user.id),
                )

            finally:
                # The file is safely stored in Supabase;
                # remove the temporary local copy.
                if temp_path and temp_path.exists():
                    temp_path.unlink()


# 3. Return the existing response to the frontend
    return WorkspaceResponse(
    request=RequestInfo(
        text=user_request,
        type=document.content_type,
        filename=document.filename,
    ),
    plan=result.get("plan", []),
    results=WorkspaceResults(**results_data),
    artifacts=result.get("artifacts", []),
    message=message,
    analysis_id=analysis_id,
    )