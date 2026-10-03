from typing import Any, Literal

from pydantic import BaseModel, Field


TaskType = Literal[
    "PROFILE",
    "CLEAN",
    "ANALYSIS",
    "VISUALIZATION",
    "EXPORT",
    "REPORT",
]


class PlanTask(BaseModel):

    task: TaskType

    operation: str

    parameters: dict[str, Any] = Field(
        default_factory=dict
    )

    reason: str = ""


class ExecutionPlan(BaseModel):

    tasks: list[PlanTask] = Field(
        default_factory=list
    )

    requires_report: bool = False

    summary: str = ""