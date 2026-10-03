import tempfile
from pathlib import Path
from typing import Any

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

from app.operations.cleaning import (
    remove_duplicates,
    fill_missing_values,
    drop_columns,
    convert_column_type,
)

from app.operations.analysis import (
    column_statistics,
    calculate_correlation,
    group_by_aggregate,
    value_counts,
    filter_rows,
    top_bottom_records,
    time_series_aggregate,
)

from app.operations.visualization import (
    create_histogram,
    create_bar_chart,
    create_line_chart,
    create_scatter_plot,
    create_box_plot,
    create_correlation_heatmap,
)

from app.operations.export import (
    export_csv,
    export_excel,
    export_json,
)


# ============================================================
# OPERATION REGISTRIES
# ============================================================

PROFILE_OPERATIONS = {
    "BASIC_PROFILE": get_basic_profile,
    "MISSING_VALUES": get_missing_values,
    "DUPLICATES": get_duplicate_count,
    "NUMERIC_SUMMARY": get_numeric_summary,
    "CATEGORICAL_SUMMARY": get_categorical_summary,
    "UNIQUE_VALUE_COUNTS": get_unique_value_counts,
    "CORRELATION_MATRIX": get_correlation_matrix,
    "OUTLIERS": detect_outliers,
}


CLEANING_OPERATIONS = {
    "REMOVE_DUPLICATES": remove_duplicates,
    "FILL_MISSING_VALUES": fill_missing_values,
    "DROP_COLUMNS": drop_columns,
    "CONVERT_COLUMN_TYPE": convert_column_type,
}


ANALYSIS_OPERATIONS = {
    "COLUMN_STATISTICS": column_statistics,
    "CORRELATION": calculate_correlation,
    "GROUP_BY_AGGREGATE": group_by_aggregate,
    "VALUE_COUNTS": value_counts,
    "FILTER_ROWS": filter_rows,
    "TOP_BOTTOM": top_bottom_records,
    "TIME_SERIES_AGGREGATE": time_series_aggregate,
}


VISUALIZATION_OPERATIONS = {
    "HISTOGRAM": create_histogram,
    "BAR_CHART": create_bar_chart,
    "LINE_CHART": create_line_chart,
    "SCATTER_PLOT": create_scatter_plot,
    "BOX_PLOT": create_box_plot,
    "CORRELATION_HEATMAP": create_correlation_heatmap,
}


EXPORT_OPERATIONS = {
    "CSV": export_csv,
    "EXCEL": export_excel,
    "JSON": export_json,
}


TASK_OPERATIONS = {
    "PROFILE": PROFILE_OPERATIONS,
    "CLEAN": CLEANING_OPERATIONS,
    "ANALYSIS": ANALYSIS_OPERATIONS,
    "VISUALIZATION": VISUALIZATION_OPERATIONS,
    "EXPORT": EXPORT_OPERATIONS,
}


# ============================================================
# DETERMINISTIC EXECUTOR
# ============================================================

class DeterministicExecutor:

    # ========================================================
    # EXECUTE ONE TASK
    # ========================================================

    def execute_task(
        self,
        task: dict[str, Any],
        state: dict[str, Any],
    ) -> dict[str, Any]:

        task_type = task["task"]
        operation = task["operation"]

        parameters = dict(
            task.get("parameters", {})
        )

        # ----------------------------------------------------
        # Validate task
        # ----------------------------------------------------

        if task_type not in TASK_OPERATIONS:
            raise ValueError(
                f"Unsupported task: {task_type}"
            )

        operations = TASK_OPERATIONS[task_type]

        # ----------------------------------------------------
        # Validate operation
        # ----------------------------------------------------

        if operation not in operations:
            raise ValueError(
                f"Unsupported operation '{operation}' "
                f"for task '{task_type}'"
            )

        function = operations[operation]

        # ----------------------------------------------------
        # DataFrame is required
        # ----------------------------------------------------

        dataframe = state.get("dataframe")

        if dataframe is None:
            raise ValueError(
                f"Task '{task_type}' requires a dataframe."
            )

        # ====================================================
        # CLEANING PARAMETER VALIDATION
        # ====================================================

        if task_type == "CLEAN":

            # ------------------------------------------------
            # FILL MISSING VALUES
            # ------------------------------------------------

            if operation == "FILL_MISSING_VALUES":

                allowed_parameters = {
                    "numeric_strategy",
                    "categorical_strategy",
                }

                unexpected = (
                    set(parameters)
                    - allowed_parameters
                )

                if unexpected:
                    raise ValueError(
                        "Unexpected parameters for "
                        f"FILL_MISSING_VALUES: "
                        f"{unexpected}"
                    )

                parameters.setdefault(
                    "numeric_strategy",
                    "median",
                )

                parameters.setdefault(
                    "categorical_strategy",
                    "mode",
                )

            # ------------------------------------------------
            # REMOVE DUPLICATES
            # ------------------------------------------------

            elif operation == "REMOVE_DUPLICATES":

                parameters = {}

            # ------------------------------------------------
            # DROP COLUMNS
            # ------------------------------------------------

            elif operation == "DROP_COLUMNS":

                if "columns" not in parameters:
                    raise ValueError(
                        "DROP_COLUMNS requires "
                        "a 'columns' parameter."
                    )

                if not isinstance(
                    parameters["columns"],
                    list,
                ):
                    raise ValueError(
                        "DROP_COLUMNS 'columns' "
                        "must be a list."
                    )

            # ------------------------------------------------
            # CONVERT COLUMN TYPE
            # ------------------------------------------------

            elif operation == "CONVERT_COLUMN_TYPE":

                if "column" not in parameters:
                    raise ValueError(
                        "CONVERT_COLUMN_TYPE requires "
                        "a 'column' parameter."
                    )

                if "dtype" not in parameters:
                    raise ValueError(
                        "CONVERT_COLUMN_TYPE requires "
                        "a 'dtype' parameter."
                    )

        # ====================================================
        # CAPTURE BEFORE STATE
        # ====================================================

        before = {
            "rows": int(len(dataframe)),
            "columns": int(len(dataframe.columns)),
        }

        before_missing = {
            column: int(count)
            for column, count
            in dataframe.isnull().sum().items()
            if count > 0
        }

        # ====================================================
        # NORMALIZE ANALYSIS PARAMETER ALIASES
        # ====================================================

        if task_type == "ANALYSIS":
            parameter_aliases = {
                "groupby_column": "group_column",
                "aggregate_column": "value_column",
            }

            for alias, canonical in parameter_aliases.items():
                if alias in parameters:
                    alias_value = parameters.pop(alias)

                    if canonical in parameters:
                        raise ValueError(
                            f"Conflicting parameters: "
                            f"'{alias}' and '{canonical}' "
                            f"were both provided."
                        )

                    parameters[canonical] = alias_value

        # ====================================================
        # ANALYSIS PARAMETER VALIDATION
        # ====================================================

        if task_type == "ANALYSIS":
            analysis_parameters = {
                "COLUMN_STATISTICS": {
                    "required": {"column"},
                    "optional": set(),
                    "defaults": {},
                },
                "CORRELATION": {
                    "required": {"column1", "column2"},
                    "optional": set(),
                    "defaults": {},
                },
                "GROUP_BY_AGGREGATE": {
                    "required": {"group_column", "value_column"},
                    "optional": {"aggregation"},
                    "defaults": {"aggregation": "mean"},
                },
                "VALUE_COUNTS": {
                    "required": {"column"},
                    "optional": {"top_n"},
                    "defaults": {"top_n": 10},
                },
                "FILTER_ROWS": {
                    "required": {"column", "operator", "value"},
                    "optional": set(),
                    "defaults": {},
                },
                "TOP_BOTTOM": {
                    "required": {"column"},
                    "optional": {"n", "ascending"},
                    "defaults": {"n": 10, "ascending": False},
                },
                "TIME_SERIES_AGGREGATE": {
                    "required": {"date_column", "value_column"},
                    "optional": {"frequency", "aggregation"},
                    "defaults": {"frequency": "ME", "aggregation": "sum"},
                },
            }

            schema = analysis_parameters[operation]
            allowed_parameters = schema["required"] | schema["optional"]

            unexpected = set(parameters) - allowed_parameters
            if unexpected:
                raise ValueError(
                    f"Unexpected parameters for {operation}: "
                    f"{sorted(unexpected)}"
                )

            missing = schema["required"] - set(parameters)
            if missing:
                raise ValueError(
                    f"{operation} requires parameters: "
                    f"{sorted(missing)}"
                )

            for key, default in schema["defaults"].items():
                parameters.setdefault(key, default)

        # ====================================================
        # EXECUTE OPERATION
        # ====================================================

        result = function(
            dataframe,
            **parameters,
        )

        # ====================================================
        # CLEANING
        # ====================================================

        if task_type == "CLEAN":

            cleaned_dataframe = result

            state["dataframe"] = cleaned_dataframe

            after_missing = {
                column: int(count)
                for column, count
                in cleaned_dataframe.isnull().sum().items()
                if count > 0
            }

            after = {
                "rows": int(
                    len(cleaned_dataframe)
                ),
                "columns": int(
                    len(cleaned_dataframe.columns)
                ),
            }

            # ----------------------------------------------
            # FILL MISSING VALUES
            # ----------------------------------------------

            if operation == "FILL_MISSING_VALUES":

                filled_values = {}

                all_columns = (
                    set(before_missing)
                    | set(after_missing)
                )

                for column in all_columns:

                    before_count = (
                        before_missing.get(
                            column,
                            0,
                        )
                    )

                    after_count = (
                        after_missing.get(
                            column,
                            0,
                        )
                    )

                    filled = (
                        before_count
                        - after_count
                    )

                    if filled > 0:
                        filled_values[column] = filled

                result_data = {
                    "parameters": parameters,
                    "before": before,
                    "after": after,
                    "missing_values_before": (
                        before_missing
                    ),
                    "missing_values_after": (
                        after_missing
                    ),
                    "filled_values": filled_values,
                }

            # ----------------------------------------------
            # REMOVE DUPLICATES
            # ----------------------------------------------

            elif operation == "REMOVE_DUPLICATES":

                removed_rows = (
                    before["rows"]
                    - after["rows"]
                )

                result_data = {
                    "before": before,
                    "after": after,
                    "removed_rows": removed_rows,
                }

            # ----------------------------------------------
            # DROP COLUMNS
            # ----------------------------------------------

            elif operation == "DROP_COLUMNS":

                result_data = {
                    "columns": parameters["columns"],
                    "before": before,
                    "after": after,
                    "removed_columns": (
                        before["columns"]
                        - after["columns"]
                    ),
                }

            # ----------------------------------------------
            # CONVERT COLUMN TYPE
            # ----------------------------------------------

            elif operation == "CONVERT_COLUMN_TYPE":

                column = parameters["column"]

                result_data = {
                    "column": column,
                    "dtype": parameters["dtype"],
                    "before_dtype": str(
                        dataframe[column].dtype
                    ),
                    "after_dtype": str(
                        cleaned_dataframe[column].dtype
                    ),
                }

            else:

                result_data = {}

            return {
                "task": task_type,
                "operation": operation,
                "parameters": parameters,
                "result": result_data,
            }

        # ====================================================
        # NON-CLEANING OPERATIONS
        # ====================================================

        return {
            "task": task_type,
            "operation": operation,
            "parameters": parameters,
            "result": result,
        }

    # ========================================================
    # EXECUTE COMPLETE PLAN
    # ========================================================

    def execute(
        self,
        state: dict[str, Any],
    ) -> dict[str, Any]:

        plan = state.get(
            "plan",
            [],
        )

        for task in plan:

            task_result = self.execute_task(
                task,
                state,
            )

            self.store_result(
                state,
                task_result,
            )

        # ========================================================
        # EXPORT CLEANED DATA FILE
        # ========================================================
        # If any CLEAN operations ran, export the final (cleaned)
        # DataFrame to a temporary CSV so upload.py can persist it
        # to Supabase Storage as a downloadable artifact.

        if state.get("_cleaning_performed") and state.get("dataframe") is not None:
            cleaned_df = state["dataframe"]
            original_name = state.get("_original_filename", "dataset")
            stem = Path(original_name).stem
            cleaned_name = f"{stem}_cleaned.csv"

            try:
                tmp = tempfile.NamedTemporaryFile(
                    mode="w",
                    suffix=".csv",
                    prefix="cleaned_",
                    delete=False,
                    encoding="utf-8",
                )
                cleaned_df.to_csv(tmp.name, index=False)
                tmp.close()

                state.setdefault("artifacts", []).append({
                    "type": "cleaned_data",
                    "name": cleaned_name,
                    "path": tmp.name,
                    "description": "Cleaned dataset (CSV)",
                    "original_filename": original_name,
                })

                # Also store path so upload.py can reference it
                state["_cleaned_csv_path"] = tmp.name
                state["_cleaned_csv_name"] = cleaned_name

                # Store formatted CSV data directly in cleaning result so frontend can download formatted data instantly
                csv_str = cleaned_df.to_csv(index=False)
                res_dict = state.setdefault("results", {})
                cleaning_res = res_dict.setdefault(
                    "cleaning",
                    {
                        "status": "completed",
                        "operations": [],
                    },
                )
                cleaning_res["csv_data"] = csv_str
                cleaning_res["cleaned_csv_name"] = cleaned_name

            except Exception as exc:
                # Non-fatal: cleaning summary still shows; file just won't be downloadable
                import logging
                logging.getLogger(__name__).warning(
                    "Could not export cleaned CSV: %s", exc
                )

        return state

    # ========================================================
    # STORE RESULTS
    # ========================================================

    def store_result(
        self,
        state: dict[str, Any],
        task_result: dict[str, Any],
    ):

        task_type = task_result["task"]
        operation = task_result["operation"]

        result = task_result["result"]

        parameters = task_result.get(
            "parameters",
            {},
        )

        results = state.setdefault(
            "results",
            {},
        )

        # ====================================================
        # PROFILE
        # ====================================================

        if task_type == "PROFILE":

            profile = results.setdefault(
                "profile",
                {
                    "status": "completed",
                    "results": [],
                },
            )

            profile["results"].append(
                {
                    "operation": operation,
                    "data": result,
                }
            )

        # ====================================================
        # CLEANING
        # ====================================================

        elif task_type == "CLEAN":

            cleaning = results.setdefault(
                "cleaning",
                {
                    "status": "completed",
                    "operations": [],
                },
            )

            cleaning["operations"].append(
                {
                    "operation": operation,
                    "parameters": parameters,
                    "details": result,
                }
            )

            state.setdefault(
                "preprocessing_steps",
                [],
            ).append(operation)

            # Mark that at least one cleaning operation ran,
            # so execute() can export the final cleaned DataFrame.
            state["_cleaning_performed"] = True
            # Preserve original filename for output naming.
            if "_original_filename" not in state:
                state["_original_filename"] = state.get("filename", "dataset")

        # ====================================================
        # ANALYSIS
        # ====================================================

        elif task_type == "ANALYSIS":

            analysis = results.setdefault(
                "analysis",
                {
                    "status": "completed",
                    "results": [],
                },
            )

            analysis["results"].append(
                {
                    "operation": operation,
                    "data": result,
                }
            )

        # ====================================================
        # VISUALIZATION
        # ====================================================

        elif task_type == "VISUALIZATION":

            visualizations = results.setdefault(
                "visualizations",
                {
                    "status": "completed",
                    "visualizations": [],
                },
            )

            artifact_path = str(result)

            visualization_item = {
                "type": operation,
                "title": operation.replace(
                    "_",
                    " "
                ).title(),
                "file": artifact_path,
                "metadata": {
                    "parameters": parameters,
                },
            }

            # Add visualization-specific columns
            if "column" in parameters:
                visualization_item["metadata"]["column"] = (
                    parameters["column"]
                )

            if "x_column" in parameters:
                visualization_item["metadata"]["x_column"] = (
                    parameters["x_column"]
                )

            if "y_column" in parameters:
                visualization_item["metadata"]["y_column"] = (
                    parameters["y_column"]
                )

            visualizations["visualizations"].append(
             visualization_item
            )

            # --------------------------------------------------------
            # ARTIFACT
            # --------------------------------------------------------

            state.setdefault(
                "artifacts",
                [],
            ).append(
                {
                    "type": "image",
                    "name": Path(
                        artifact_path
            ).name,
            "path": artifact_path,
            "description": (
                f"{operation.replace('_', ' ').title()} "
                "visualization"
            ),
        }
    )

        # ====================================================
        # EXPORT
        # ====================================================

                # ====================================================
        # EXPORT
        # ====================================================

        elif task_type == "EXPORT":

            export = results.setdefault(
                "export",
                {
                    "status": "completed",
                    "files": [],
                },
            )

            export_path = str(result)

            # ----------------------------------------------
            # Get file size if the file exists
            # ----------------------------------------------

            file_size = None

            try:

                file_size = Path(
                    export_path
                ).stat().st_size

            except (
                FileNotFoundError,
                OSError,
            ):

                file_size = None

            # ----------------------------------------------
            # Store export result using ExportFile schema
            # ----------------------------------------------

            export["files"].append(
                {
                    "type": operation,
                    "name": Path(
                        export_path
                    ).name,
                    "path": export_path,
                    "size": file_size,
                }
            )

            # ----------------------------------------------
            # Store downloadable artifact
            # ----------------------------------------------

            state.setdefault(
                "artifacts",
                [],
            ).append(
                {
                    "type": "file",
                    "name": Path(
                        export_path
                    ).name,
                    "path": export_path,
                    "description": (
                        f"{operation} export"
                    ),
                }
            )

            state["output_file"] = export_path