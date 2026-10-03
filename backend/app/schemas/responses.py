from typing import Any, Optional

from pydantic import BaseModel, Field


# ============================================================
# REQUEST
# ============================================================

class RequestInfo(BaseModel):
    """
    Information about the user's request.
    """

    text: str

    # dataset / document
    type: str

    filename: Optional[str] = None


# ============================================================
# PLAN
# ============================================================

class TaskStatus(BaseModel):
    """
    One planned operation returned to the frontend.
    """

    task: str

    operation: str

    parameters: dict[str, Any] = Field(
        default_factory=dict
    )

    reason: Optional[str] = None

# ============================================================
# ARTIFACTS
# ============================================================

class Artifact(BaseModel):
    """
    A file or other generated output that the frontend
    can display or provide as a download.
    """

    type: str

    name: str

    path: str

    description: Optional[str] = None


# ============================================================
# PROFILE
# ============================================================

class ProfileResult(BaseModel):
    """
    Dataset profiling results.
    """

    status: str = "completed"

    rows: Optional[int] = None

    columns: Optional[int] = None

    column_names: list[str] = Field(
        default_factory=list
    )

    dtypes: dict[str, str] = Field(
        default_factory=dict
    )

    missing_values: dict[str, int] = Field(
        default_factory=dict
    )

    duplicates: Optional[int] = None

    numeric_summary: dict[str, Any] = Field(
        default_factory=dict
    )

    categorical_summary: dict[str, Any] = Field(
        default_factory=dict
    )


# ============================================================
# CLEANING
# ============================================================

class CleaningOperation(BaseModel):
    operation: str

    parameters: dict[str, Any] = Field(
        default_factory=dict
    )

    details: dict[str, Any] = Field(
        default_factory=dict
    )


class CleaningResult(BaseModel):
    """
    Complete result of dataset cleaning.
    """

    status: str = "completed"

    operations: list[CleaningOperation] = Field(
        default_factory=list
    )

    before: dict[str, Any] = Field(
        default_factory=dict
    )

    after: dict[str, Any] = Field(
        default_factory=dict
    )

    output_file: Optional[str] = None

    # Set after the cleaned CSV is persisted to Supabase Storage.
    # The frontend uses this ID to trigger a direct download.
    cleaned_output_id: Optional[str] = None
    cleaned_csv_name: Optional[str] = None
    csv_data: Optional[str] = None


# ============================================================
# ANALYSIS
# ============================================================

class AnalysisItem(BaseModel):
    """
    Generic structure for one analysis result.
    """

    operation: str

    data: Any = None

    title: Optional[str] = None

    columns: list[str] = Field(
        default_factory=list
    )

    value: Any = None

    metadata: dict[str, Any] = Field(
        default_factory=dict
    )


class AnalysisResult(BaseModel):
    """
    Complete analysis output.
    """

    status: str = "completed"

    results: list[AnalysisItem] = Field(
        default_factory=list
    )

# ============================================================
# VISUALIZATION
# ============================================================

class VisualizationItem(BaseModel):
    """
    Information about one generated visualization.
    """

    type: str

    title: str

    file: Optional[str] = None

    x: Optional[str] = None

    y: Optional[str] = None

    metadata: dict[str, Any] = Field(
        default_factory=dict
    )


class VisualizationResult(BaseModel):
    """
    Complete visualization output.
    """

    status: str = "completed"

    visualizations: list[VisualizationItem] = Field(
        default_factory=list
    )


# ============================================================
# EXPORT
# ============================================================

class ExportFile(BaseModel):
    """
    One generated downloadable file.
    """

    type: str

    name: str

    path: str

    size: Optional[int] = None


class ExportResult(BaseModel):
    """
    Complete export result.
    """

    status: str = "completed"

    files: list[ExportFile] = Field(
        default_factory=list
    )


# ============================================================
# REPORT
# ============================================================

class ReportResult(BaseModel):
    """
    Human-readable report generated from completed results.
    """

    status: str = "completed"

    text: str = ""


# ============================================================
# DOCUMENT
# ============================================================

class DocumentResult(BaseModel):
    """
    Basic information extracted from a document.
    """

    status: str = "completed"

    pages: Optional[int] = None

    characters: Optional[int] = None

    words: Optional[int] = None

    metadata: dict[str, Any] = Field(
        default_factory=dict
    )


# ============================================================
# DOCUMENT SUMMARY
# ============================================================

class SummaryResult(BaseModel):
    """
    Summary generated from a document.
    """

    status: str = "completed"

    text: str = ""

    key_points: list[str] = Field(
        default_factory=list
    )


# ============================================================
# DOCUMENT ANALYSIS
# ============================================================

class DocumentAnalysisItem(BaseModel):
    """
    One finding from detailed document analysis.
    """

    type: str

    title: Optional[str] = None

    content: str = ""

    metadata: dict[str, Any] = Field(
        default_factory=dict
    )


class DocumentAnalysisResult(BaseModel):
    """
    Detailed document analysis.
    """

    status: str = "completed"

    findings: list[DocumentAnalysisItem] = Field(
        default_factory=list
    )


# ============================================================
# CHAT
# ============================================================

class ChatResult(BaseModel):
    """
    Response to a question asked about a document.
    """

    status: str = "completed"

    answer: str = ""

    sources: list[str] = Field(
        default_factory=list
    )


# ============================================================
# ALL RESULTS
# ============================================================

class WorkspaceResults(BaseModel):
    """
    Central result container.

    Only the sections relevant to the user's request
    need to be populated.
    """

    profile: Optional[ProfileResult] = None

    cleaning: Optional[CleaningResult] = None

    analysis: Optional[AnalysisResult] = None

    visualizations: Optional[VisualizationResult] = None

    export: Optional[ExportResult] = None

    report: Optional[ReportResult] = None

    document: Optional[DocumentResult] = None

    summary: Optional[SummaryResult] = None

    document_analysis: Optional[DocumentAnalysisResult] = None

    chat: Optional[ChatResult] = None


# ============================================================
# FINAL API RESPONSE
# ============================================================

class WorkspaceResponse(BaseModel):
    """
    Single response contract used by the frontend
    for every request.
    """

    request: RequestInfo

    plan: list[TaskStatus] = Field(
        default_factory=list
    )

    results: WorkspaceResults = Field(
        default_factory=WorkspaceResults
    )

    artifacts: list[Artifact] = Field(
        default_factory=list
    )

    message: str = ""

    # ID of the persisted analysis row — used by the frontend
    # to construct download URLs for generated outputs.
    analysis_id: Optional[str] = None