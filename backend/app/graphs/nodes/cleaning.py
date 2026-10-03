from app.graphs.state import WorkspaceState

from app.tools.pandas_tools import (
    remove_duplicates,
    fill_missing_values,
    drop_columns,
    convert_column_type,
)


def cleaning_execution_node(state: WorkspaceState):

    df = state["dataframe"]

    messages = state["messages"]

    last_message = messages[-1]

    tool_calls = getattr(last_message, "tool_calls", [])

    for tool_call in tool_calls:

        tool_name = tool_call["name"]
        args = tool_call.get("args", {})

        if tool_name == "remove_duplicates_tool":

            df = remove_duplicates(df)

        elif tool_name == "fill_missing_values_tool":

            strategy = args.get("strategy", "median")

            df = fill_missing_values(
                df,
                strategy
            )

        elif tool_name == "drop_columns_tool":

            columns = args.get("columns", [])

            df = drop_columns(
                df,
                columns
            )

        elif tool_name == "convert_column_type_tool":

            column = args["column"]
            dtype = args["dtype"]

            df = convert_column_type(
                df,
                column,
                dtype
            )

    state["dataframe"] = df

    return state