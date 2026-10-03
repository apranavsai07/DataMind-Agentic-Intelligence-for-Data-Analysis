from langchain_core.tools import tool
from langchain_core.messages import ToolMessage
from langgraph.prebuilt import ToolRuntime
from langgraph.types import Command

from app.operations.visualization import (
    create_histogram,
    create_bar_chart,
    create_line_chart,
    create_scatter_plot,
    create_box_plot,
    create_correlation_heatmap,
)


@tool
def histogram_tool(
    column: str,
    filename: str,
    runtime: ToolRuntime,
) -> Command:
    """Create a histogram for a numeric column."""

    df = runtime.state["dataframe"]

    output_path = create_histogram(
        df,
        column,
        filename,
    )

    return Command(
        update={
            "results": {
                "visualizations": {
                    "status": "completed",
                    "visualizations": [
                        {
                            "type": "histogram",
                            "title": f"Distribution of {column}",
                            "file": output_path,
                            "metadata": {
                                "column": column,
                            },
                        }
                    ],
                }
            },
            "artifacts": [
                {
                    "type": "image",
                    "name": filename,
                    "path": output_path,
                    "description": (
                        f"Histogram of {column}"
                    ),
                }
            ],
            "messages": [
                ToolMessage(
                    content=(
                        f"Histogram created for '{column}'."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def bar_chart_tool(
    column: str,
    filename: str,
    top_n: int,
    runtime: ToolRuntime,
) -> Command:
    """Create a bar chart for categorical or discrete values."""

    df = runtime.state["dataframe"]

    output_path = create_bar_chart(
        df,
        column,
        filename,
        top_n,
    )

    return Command(
        update={
            "results": {
                "visualizations": {
                    "status": "completed",
                    "visualizations": [
                        {
                            "type": "bar",
                            "title": (
                                f"Top {top_n} values of {column}"
                            ),
                            "file": output_path,
                            "metadata": {
                                "column": column,
                                "top_n": top_n,
                            },
                        }
                    ],
                }
            },
            "artifacts": [
                {
                    "type": "image",
                    "name": filename,
                    "path": output_path,
                    "description": (
                        f"Bar chart of {column}"
                    ),
                }
            ],
            "messages": [
                ToolMessage(
                    content=(
                        f"Bar chart created for '{column}'."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def line_chart_tool(
    x_column: str,
    y_column: str,
    filename: str,
    runtime: ToolRuntime,
) -> Command:
    """Create a line chart showing how a numeric value changes across an ordered or time-based column."""

    df = runtime.state["dataframe"]

    output_path = create_line_chart(
        df,
        x_column,
        y_column,
        filename,
    )

    return Command(
        update={
            "results": {
                "visualizations": {
                    "status": "completed",
                    "visualizations": [
                        {
                            "type": "line",
                            "title": (
                                f"{y_column} over {x_column}"
                            ),
                            "file": output_path,
                            "x": x_column,
                            "y": y_column,
                        }
                    ],
                }
            },
            "artifacts": [
                {
                    "type": "image",
                    "name": filename,
                    "path": output_path,
                    "description": (
                        f"Line chart of {y_column} "
                        f"over {x_column}"
                    ),
                }
            ],
            "messages": [
                ToolMessage(
                    content="Line chart created successfully.",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def scatter_plot_tool(
    x_column: str,
    y_column: str,
    filename: str,
    runtime: ToolRuntime,
) -> Command:
    """Create a scatter plot showing the relationship between two numeric columns."""

    df = runtime.state["dataframe"]

    output_path = create_scatter_plot(
        df,
        x_column,
        y_column,
        filename,
    )

    return Command(
        update={
            "results": {
                "visualizations": {
                    "status": "completed",
                    "visualizations": [
                        {
                            "type": "scatter",
                            "title": (
                                f"{y_column} vs {x_column}"
                            ),
                            "file": output_path,
                            "x": x_column,
                            "y": y_column,
                        }
                    ],
                }
            },
            "artifacts": [
                {
                    "type": "image",
                    "name": filename,
                    "path": output_path,
                    "description": (
                        f"Scatter plot of {y_column} "
                        f"vs {x_column}"
                    ),
                }
            ],
            "messages": [
                ToolMessage(
                    content="Scatter plot created successfully.",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def box_plot_tool(
    column: str,
    filename: str,
    runtime: ToolRuntime,
) -> Command:
    """Create a box plot to show distribution and potential outliers of a numeric column."""

    df = runtime.state["dataframe"]

    output_path = create_box_plot(
        df,
        column,
        filename,
    )

    return Command(
        update={
            "results": {
                "visualizations": {
                    "status": "completed",
                    "visualizations": [
                        {
                            "type": "box",
                            "title": f"Box plot of {column}",
                            "file": output_path,
                            "metadata": {
                                "column": column,
                            },
                        }
                    ],
                }
            },
            "artifacts": [
                {
                    "type": "image",
                    "name": filename,
                    "path": output_path,
                    "description": (
                        f"Box plot of {column}"
                    ),
                }
            ],
            "messages": [
                ToolMessage(
                    content=(
                        f"Box plot created for '{column}'."
                    ),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def correlation_heatmap_tool(
    filename: str,
    runtime: ToolRuntime,
) -> Command:
    """Create a heatmap showing correlations between numeric columns."""

    df = runtime.state["dataframe"]

    output_path = create_correlation_heatmap(
        df,
        filename,
    )

    return Command(
        update={
            "results": {
                "visualizations": {
                    "status": "completed",
                    "visualizations": [
                        {
                            "type": "correlation_heatmap",
                            "title": "Correlation Heatmap",
                            "file": output_path,
                        }
                    ],
                }
            },
            "artifacts": [
                {
                    "type": "image",
                    "name": filename,
                    "path": output_path,
                    "description": (
                        "Correlation heatmap of numeric columns"
                    ),
                }
            ],
            "messages": [
                ToolMessage(
                    content="Correlation heatmap created.",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )