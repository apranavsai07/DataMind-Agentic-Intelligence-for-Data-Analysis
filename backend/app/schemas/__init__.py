from typing import Any, Optional
from pydantic import BaseModel, Field


# ============================================================
# COMMON
# ============================================================

class TaskStatus(BaseModel):
    task: str
    status: str
    message: Optional[str] = None


class Artifact(BaseModel):
    type: str
    name: str
    path: str
    description: Optional[str] = None


# ============================================================
# PROFILE
# ============================================================

class ProfileResult(BaseModel):
    status: str = "completed"

    rows: Optional[int] = None
    columns: Optional[int] = None

    column_names: list[str] = Field(default_factory=list)

    dtypes: dict[str, str] = Field(default_factory=dict)

    missing_values: dict[str, int] = Field(
        default_factory=dict
    )

    duplicates: Optional[int] = None

    numeric_summary: dict[str, Any] = Field(
        default_factory=dict
    )


# ============================================================
# CLEANING
# ============================================================

class CleaningOperation(BaseModel):
    operation: str

    columns: list[str] = Field(
        default_factory=list
    )

    strategy: Optional[str] = None

    affected_rows: Optional[int] = None

    removed_rows: Optional[int] = None

    details: Optional[str] = None


class CleaningResult(BaseModel):
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

    cleaned_output_id: Optional[str] = None
    cleaned_csv_name: Optional[str] = None
    csv_data: Optional[str] = None



# ============================================================
# ANALYSIS
# ============================================================

class AnalysisItem(BaseModel):
    type: str
    title: Optional[str] = None

    columns: list[str] = Field(
        default_factory=list
    )

    value: Any = None

    data: Any = None

    metadata: dict[str, Any] = Field(
        default_factory=dict
    )


class AnalysisResult(BaseModel):
    status: str = "completed"

    results: list[AnalysisItem] = Field(
        default_factory=list
    )


# ============================================================
# VISUALIZATION
# ============================================================

class VisualizationItem(BaseModel):
    type: str
    title: str

    file: Optional[str] = None

    x: Optional[str] = None
    y: Optional[str] = None

    metadata: dict[str, Any] = Field(
        default_factory=dict
    )


class VisualizationResult(BaseModel):
    status: str = "completed"

    visualizations: list[VisualizationItem] = Field(
        default_factory=list
    )


# ============================================================
# DOCUMENT
# ============================================================

class DocumentResult(BaseModel):
    pages: Optional[int] = None
    characters: Optional[int] = None
    words: Optional[int] = None

    metadata: dict[str, Any] = Field(
        default_factory=dict
    )


class SummaryResult(BaseModel):
    status: str = "completed"

    text: Optional[str] = None

    key_points: list[str] = Field(
        default_factory=list
    )


# ============================================================
# RESULTS
# ============================================================

class WorkspaceResults(BaseModel):

    profile: Optional[ProfileResult] = None

    cleaning: Optional[CleaningResult] = None

    analysis: Optional[AnalysisResult] = None

    visualizations: Optional[VisualizationResult] = None

    document: Optional[DocumentResult] = None

    summary: Optional[SummaryResult] = None


# ============================================================
# REQUEST
# ============================================================

class RequestInfo(BaseModel):

    text: str

    type: str

    filename: Optional[str] = None


# ============================================================
# FINAL API RESPONSE
# ============================================================

class WorkspaceResponse(BaseModel):

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