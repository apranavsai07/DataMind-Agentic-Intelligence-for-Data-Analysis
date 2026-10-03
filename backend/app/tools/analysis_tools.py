from langchain_core.tools import tool
from langchain_core.messages import ToolMessage
from langgraph.prebuilt import ToolRuntime
from langgraph.types import Command

from app.operations.analysis import (
    column_statistics,
    calculate_correlation,
    group_by_aggregate,
    value_counts,
    filter_rows,
    top_bottom_records,
    time_series_aggregate,
)


@tool
def column_statistics_tool(
    column: str,
    runtime: ToolRuntime,
) -> Command:
    """Analyze one dataset column and return its statistics."""

    df = runtime.state["dataframe"]

    result = column_statistics(
        df,
        column,
    )

    return Command(
        update={
            "results": {
                "analysis": {
                    "status": "completed",
                    "results": [
                        {
                            "type": "column_statistics",
                            "title": f"Statistics for {column}",
                            "columns": [column],
                            "data": result,
                        }
                    ],
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        f"Statistics calculated for column '{column}'."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def correlation_tool(
    column1: str,
    column2: str,
    runtime: ToolRuntime,
) -> Command:
    """Calculate correlation between two numeric columns."""

    df = runtime.state["dataframe"]

    result = calculate_correlation(
        df,
        column1,
        column2,
    )

    return Command(
        update={
            "results": {
                "analysis": {
                    "status": "completed",
                    "results": [
                        {
                            "type": "correlation",
                            "title": (
                                f"Correlation between "
                                f"{column1} and {column2}"
                            ),
                            "columns": [
                                column1,
                                column2,
                            ],
                            "value": result,
                        }
                    ],
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        f"Correlation between "
                        f"{column1} and {column2}: {result}"
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def group_by_aggregate_tool(
    group_column: str,
    value_column: str,
    aggregation: str,
    runtime: ToolRuntime,
) -> Command:
    """Group records by one column and aggregate another column."""

    df = runtime.state["dataframe"]

    result = group_by_aggregate(
        df,
        group_column,
        value_column,
        aggregation,
    )

    return Command(
        update={
            "results": {
                "analysis": {
                    "status": "completed",
                    "results": [
                        {
                            "type": "grouped_aggregation",
                            "title": (
                                f"{aggregation} of "
                                f"{value_column} by "
                                f"{group_column}"
                            ),
                            "columns": [
                                group_column,
                                value_column,
                            ],
                            "data": result,
                            "metadata": {
                                "group_column": group_column,
                                "value_column": value_column,
                                "aggregation": aggregation,
                            },
                        }
                    ],
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        f"Grouped aggregation completed: "
                        f"{aggregation} of {value_column} "
                        f"by {group_column}."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def value_counts_tool(
    column: str,
    top_n: int,
    runtime: ToolRuntime,
) -> Command:
    """Find the most frequent values in a column."""

    df = runtime.state["dataframe"]

    result = value_counts(
        df,
        column,
        top_n,
    )

    return Command(
        update={
            "results": {
                "analysis": {
                    "status": "completed",
                    "results": [
                        {
                            "type": "value_counts",
                            "title": (
                                f"Top {top_n} values in {column}"
                            ),
                            "columns": [column],
                            "data": result,
                            "metadata": {
                                "top_n": top_n,
                            },
                        }
                    ],
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        f"Value counts calculated for "
                        f"'{column}'."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def filter_rows_tool(
    column: str,
    operator: str,
    value,
    runtime: ToolRuntime,
) -> Command:
    """Filter dataset rows using a column comparison."""

    df = runtime.state["dataframe"]

    result = filter_rows(
        df,
        column,
        operator,
        value,
    )

    return Command(
        update={
            "results": {
                "analysis": {
                    "status": "completed",
                    "results": [
                        {
                            "type": "filter",
                            "title": (
                                f"Filtered rows where "
                                f"{column} {operator} {value}"
                            ),
                            "columns": [column],
                            "data": result,
                            "metadata": {
                                "operator": operator,
                                "value": value,
                            },
                        }
                    ],
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        f"Filtering completed for "
                        f"{column} {operator} {value}."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def top_bottom_records_tool(
    column: str,
    n: int,
    ascending: bool,
    runtime: ToolRuntime,
) -> Command:
    """Return the highest or lowest records based on a numeric column."""

    df = runtime.state["dataframe"]

    result = top_bottom_records(
        df,
        column,
        n,
        ascending,
    )

    direction = "lowest" if ascending else "highest"

    return Command(
        update={
            "results": {
                "analysis": {
                    "status": "completed",
                    "results": [
                        {
                            "type": "top_bottom_records",
                            "title": (
                                f"{n} {direction} records "
                                f"by {column}"
                            ),
                            "columns": [column],
                            "data": result,
                            "metadata": {
                                "n": n,
                                "ascending": ascending,
                            },
                        }
                    ],
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        f"Retrieved {n} {direction} records "
                        f"based on '{column}'."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def time_series_aggregate_tool(
    date_column: str,
    value_column: str,
    frequency: str,
    aggregation: str,
    runtime: ToolRuntime,
) -> Command:
    """Aggregate a numeric value over time using a date column."""

    df = runtime.state["dataframe"]

    result = time_series_aggregate(
        df,
        date_column,
        value_column,
        frequency,
        aggregation,
    )

    return Command(
        update={
            "results": {
                "analysis": {
                    "status": "completed",
                    "results": [
                        {
                            "type": "time_series_aggregation",
                            "title": (
                                f"{aggregation} of {value_column} "
                                f"over {frequency}"
                            ),
                            "columns": [
                                date_column,
                                value_column,
                            ],
                            "data": result,
                            "metadata": {
                                "date_column": date_column,
                                "value_column": value_column,
                                "frequency": frequency,
                                "aggregation": aggregation,
                            },
                        }
                    ],
                }
            },
            "messages": [
                ToolMessage(
                    content=(
                        f"Time-series aggregation completed "
                        f"for {value_column}."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )