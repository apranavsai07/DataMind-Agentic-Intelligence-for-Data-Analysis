from langchain_core.tools import tool
from langchain_core.messages import ToolMessage
from langgraph.prebuilt import ToolRuntime
from langgraph.types import Command

from app.operations.export import (
    export_csv,
    export_excel,
    export_json,
)


@tool
def export_csv_tool(
    filename: str,
    runtime: ToolRuntime,
) -> Command:
    """Export the current dataset as a CSV file."""

    df = runtime.state["dataframe"]

    output_path = export_csv(
        df,
        filename,
    )

    return Command(
        update={
            "results": {
                "export": {
                    "status": "completed",
                    "files": [
                        {
                            "type": "csv",
                            "name": filename,
                            "path": output_path,
                        }
                    ],
                }
            },

            "artifacts": [
                {
                    "type": "csv",
                    "name": filename,
                    "path": output_path,
                    "description": "Exported CSV dataset",
                }
            ],

            "output_file": output_path,

            "messages": [
                ToolMessage(
                    content=(
                        f"CSV exported successfully to "
                        f"{output_path}."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def export_excel_tool(
    filename: str,
    runtime: ToolRuntime,
) -> Command:
    """Export the current dataset as an Excel file."""

    df = runtime.state["dataframe"]

    output_path = export_excel(
        df,
        filename,
    )

    return Command(
        update={
            "results": {
                "export": {
                    "status": "completed",
                    "files": [
                        {
                            "type": "excel",
                            "name": filename,
                            "path": output_path,
                        }
                    ],
                }
            },

            "artifacts": [
                {
                    "type": "excel",
                    "name": filename,
                    "path": output_path,
                    "description": "Exported Excel dataset",
                }
            ],

            "output_file": output_path,

            "messages": [
                ToolMessage(
                    content=(
                        f"Excel file exported successfully "
                        f"to {output_path}."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def export_json_tool(
    filename: str,
    runtime: ToolRuntime,
) -> Command:
    """Export the current dataset as a JSON file."""

    df = runtime.state["dataframe"]

    output_path = export_json(
        df,
        filename,
    )

    return Command(
        update={
            "results": {
                "export": {
                    "status": "completed",
                    "files": [
                        {
                            "type": "json",
                            "name": filename,
                            "path": output_path,
                        }
                    ],
                }
            },

            "artifacts": [
                {
                    "type": "json",
                    "name": filename,
                    "path": output_path,
                    "description": "Exported JSON dataset",
                }
            ],

            "output_file": output_path,

            "messages": [
                ToolMessage(
                    content=(
                        f"JSON exported successfully "
                        f"to {output_path}."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )