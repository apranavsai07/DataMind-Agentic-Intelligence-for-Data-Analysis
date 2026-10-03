# ============================================================
# PLANNER TAXONOMY
# ============================================================

PROFILE_OPERATIONS = {
    "BASIC_PROFILE",
    "MISSING_VALUES",
    "DUPLICATES",
    "NUMERIC_SUMMARY",
    "CATEGORICAL_SUMMARY",
    "UNIQUE_VALUE_COUNTS",
    "CORRELATION_MATRIX",
    "OUTLIERS",
}


CLEANING_OPERATIONS = {
    "REMOVE_DUPLICATES",
    "FILL_MISSING_VALUES",
    "DROP_COLUMNS",
    "CONVERT_COLUMN_TYPE",
}


ANALYSIS_OPERATIONS = {
    "COLUMN_STATISTICS",
    "CORRELATION",
    "GROUP_BY_AGGREGATE",
    "VALUE_COUNTS",
    "FILTER_ROWS",
    "TOP_BOTTOM",
    "TIME_SERIES_AGGREGATE",
}


VISUALIZATION_OPERATIONS = {
    "HISTOGRAM",
    "BAR_CHART",
    "LINE_CHART",
    "SCATTER_PLOT",
    "BOX_PLOT",
    "CORRELATION_HEATMAP",
}


EXPORT_OPERATIONS = {
    "CSV",
    "EXCEL",
    "JSON",
}


REPORT_OPERATIONS = {
    "GENERATE",
}


TASK_OPERATIONS = {
    "PROFILE": PROFILE_OPERATIONS,
    "CLEAN": CLEANING_OPERATIONS,
    "ANALYSIS": ANALYSIS_OPERATIONS,
    "VISUALIZATION": VISUALIZATION_OPERATIONS,
    "EXPORT": EXPORT_OPERATIONS,
    "REPORT": REPORT_OPERATIONS,
}


def validate_plan_task(
    task: str,
    operation: str,
    parameters: dict | None = None,
):
    parameters = parameters or {}

    # your existing task/operation validation here

    required_parameters = {
        "HISTOGRAM": ["column", "filename"],
        "BAR_CHART": ["column", "filename"],
        "LINE_CHART": ["x_column", "y_column", "filename"],
        "SCATTER_PLOT": ["x_column", "y_column", "filename"],
        "BOX_PLOT": ["column", "filename"],
        "CORRELATION_HEATMAP": ["filename"],
    }

    if operation in required_parameters:

        missing = [
            parameter
            for parameter in required_parameters[operation]
            if parameter not in parameters
        ]

        if missing:
            raise ValueError(
                f"{operation} requires parameters: {missing}"
            )