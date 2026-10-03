from langchain_core.tools import tool
from langchain_core.messages import ToolMessage
from langgraph.prebuilt import ToolRuntime
from langgraph.types import Command

from app.tools.pandas_tools import (
    remove_duplicates,
    fill_missing_values,
    drop_columns,
    convert_column_type,
)


@tool
def remove_duplicates_tool(
    runtime: ToolRuntime,
) -> Command:
    """Remove duplicate rows from the current dataset."""

    df = runtime.state["dataframe"]

    before = len(df)

    cleaned_df = remove_duplicates(df)

    removed = before - len(cleaned_df)

    return Command(
        update={
            "dataframe": cleaned_df,

            "results": {
                "cleaning": {
                    "status": "completed",
                    "operations": [
                        {
                            "operation": "remove_duplicates",
                            "removed_rows": removed,
                        }
                    ],
                }
            },

            "preprocessing_steps": [
                f"Removed {removed} duplicate rows"
            ],

            "messages": [
                ToolMessage(
                    content=(
                        f"Removed {removed} duplicate rows."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def fill_missing_values_tool(
    numeric_strategy: str,
    categorical_strategy: str,
    runtime: ToolRuntime,
) -> Command:
    """
    Fill missing values in numeric and categorical columns.
    """

    df = runtime.state["dataframe"]

    before_missing = int(
        df.isna().sum().sum()
    )

    cleaned_df = fill_missing_values(
        df,
        numeric_strategy,
        categorical_strategy,
    )

    after_missing = int(
        cleaned_df.isna().sum().sum()
    )

    affected = before_missing - after_missing

    return Command(
        update={
            "dataframe": cleaned_df,

            "results": {
                "cleaning": {
                    "status": "completed",
                    "operations": [
                        {
                            "operation": "fill_missing_values",
                            "strategy": (
                                f"numeric={numeric_strategy}, "
                                f"categorical={categorical_strategy}"
                            ),
                            "affected_rows": affected,
                        }
                    ],
                }
            },

            "preprocessing_steps": [
                (
                    "Filled missing values using "
                    f"numeric={numeric_strategy}, "
                    f"categorical={categorical_strategy}"
                )
            ],

            "messages": [
                ToolMessage(
                    content="Missing values handled successfully.",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def drop_columns_tool(
    columns: list[str],
    runtime: ToolRuntime,
) -> Command:
    """Drop specified columns from the current dataset."""

    df = runtime.state["dataframe"]

    cleaned_df = drop_columns(
        df,
        columns,
    )

    return Command(
        update={
            "dataframe": cleaned_df,

            "results": {
                "cleaning": {
                    "status": "completed",
                    "operations": [
                        {
                            "operation": "drop_columns",
                            "columns": columns,
                        }
                    ],
                }
            },

            "preprocessing_steps": [
                f"Dropped columns: {columns}"
            ],

            "messages": [
                ToolMessage(
                    content=f"Dropped columns: {columns}.",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def convert_column_type_tool(
    column: str,
    dtype: str,
    runtime: ToolRuntime,
) -> Command:
    """Convert a dataset column to a specified data type."""

    df = runtime.state["dataframe"]

    cleaned_df = convert_column_type(
        df,
        column,
        dtype,
    )

    return Command(
        update={
            "dataframe": cleaned_df,

            "results": {
                "cleaning": {
                    "status": "completed",
                    "operations": [
                        {
                            "operation": "convert_column_type",
                            "columns": [column],
                            "details": f"Converted to {dtype}",
                        }
                    ],
                }
            },

            "preprocessing_steps": [
                f"Converted {column} to {dtype}"
            ],

            "messages": [
                ToolMessage(
                    content=f"Converted {column} to {dtype}.",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )