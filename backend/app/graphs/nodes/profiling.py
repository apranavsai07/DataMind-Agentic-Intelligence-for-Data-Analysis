from app.graphs.state import WorkspaceState


def profiling_node(state: WorkspaceState):

    df = state.get("dataframe")

    if df is None:
        raise ValueError(
            "Profiling can only be performed on tabular datasets."
        )

    profile = {
    "rows": int(len(df)),
    "columns": int(len(df.columns)),
    "column_names": list(df.columns),
    "missing_values": {
        str(k): int(v)
        for k, v in df.isnull().sum().items()
    },
    "duplicates": int(df.duplicated().sum()),
    "dtypes": {
        str(k): str(v)
        for k, v in df.dtypes.items()
    }
    }

    state["metadata"]["profile"] = profile

    return state