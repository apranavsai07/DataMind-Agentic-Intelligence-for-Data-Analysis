from langchain_core.tools import tool
from langchain_core.messages import ToolMessage
from langgraph.prebuilt import ToolRuntime
from langgraph.types import Command

from app.operations.profiling import (
    get_basic_profile,
    get_missing_values,
    get_duplicate_count,
    get_numeric_summary,
    get_categorical_summary,
    get_unique_value_counts,
    get_correlation_matrix,
    detect_outliers,
)


@tool
def basic_profile_tool(
    runtime: ToolRuntime,
) -> Command:
    """Get the basic structure and data types of the dataset."""

    df = runtime.state["dataframe"]

    result = get_basic_profile(df)

    return Command(
        update={
            "results": {
                "profile": {
                    "status": "completed",
                    **result,
                }
            },
            "messages": [
                ToolMessage(
                    content="Basic dataset profile generated.",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def missing_values_tool(
    runtime: ToolRuntime,
) -> Command:
    """Find missing values in the dataset."""

    df = runtime.state["dataframe"]

    result = get_missing_values(df)

    return Command(
        update={
            "results": {
                "profile": {
                    "status": "completed",
                    "missing_values": result,
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        "Missing-value analysis completed."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def duplicate_count_tool(
    runtime: ToolRuntime,
) -> Command:
    """Count duplicate rows in the dataset."""

    df = runtime.state["dataframe"]

    result = get_duplicate_count(df)

    return Command(
        update={
            "results": {
                "profile": {
                    "status": "completed",
                    "duplicates": result,
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        f"Duplicate row count: {result}."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def numeric_summary_tool(
    runtime: ToolRuntime,
) -> Command:
    """Generate descriptive statistics for numeric columns."""

    df = runtime.state["dataframe"]

    result = get_numeric_summary(df)

    return Command(
        update={
            "results": {
                "profile": {
                    "status": "completed",
                    "numeric_summary": result,
                }
            },
            "messages": [
                ToolMessage(
                    content="Numeric summary generated.",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def categorical_summary_tool(
    runtime: ToolRuntime,
) -> Command:
    """Generate summaries for categorical columns."""

    df = runtime.state["dataframe"]

    result = get_categorical_summary(df)

    return Command(
        update={
            "results": {
                "profile": {
                    "status": "completed",
                    "categorical_summary": result,
                }
            },
            "messages": [
                ToolMessage(
                    content="Categorical summary generated.",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def unique_value_counts_tool(
    column: str,
    runtime: ToolRuntime,
) -> Command:
    """Get the frequency of each unique value in a column."""

    df = runtime.state["dataframe"]

    result = get_unique_value_counts(
        df,
        column,
    )

    return Command(
        update={
            "results": {
                "profile": {
                    "status": "completed",
                    "unique_value_counts": {
                        column: result
                    },
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        f"Unique value counts generated "
                        f"for '{column}'."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def correlation_matrix_tool(
    runtime: ToolRuntime,
) -> Command:
    """Generate the correlation matrix for numeric columns."""

    df = runtime.state["dataframe"]

    result = get_correlation_matrix(df)

    return Command(
        update={
            "results": {
                "profile": {
                    "status": "completed",
                    "correlation_matrix": result,
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        "Correlation matrix generated."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def outlier_detection_tool(
    runtime: ToolRuntime,
) -> Command:
    """Detect potential outliers in numeric columns using IQR."""

    df = runtime.state["dataframe"]

    result = detect_outliers(df)

    return Command(
        update={
            "results": {
                "profile": {
                    "status": "completed",
                    "outliers": result,
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        "Outlier detection completed."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )