import pandas as pd


def column_statistics(
    df: pd.DataFrame,
    column: str
) -> dict:
    """Calculate statistics for one column."""

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' not found."
        )

    series = df[column]

    result = {
        "column": column,
        "dtype": str(series.dtype),
        "count": int(series.count()),
        "missing": int(series.isna().sum()),
        "unique": int(series.nunique()),
    }

    if pd.api.types.is_numeric_dtype(series):

        result.update({
            "mean": float(series.mean()),
            "median": float(series.median()),
            "std": float(series.std()),
            "min": float(series.min()),
            "max": float(series.max()),
        })

    return result


def calculate_correlation(
    df: pd.DataFrame,
    column1: str,
    column2: str
) -> float:

    for column in [column1, column2]:
        if column not in df.columns:
            raise ValueError(
                f"Column '{column}' not found."
            )

    if not pd.api.types.is_numeric_dtype(
        df[column1]
    ):
        raise ValueError(
            f"{column1} must be numeric."
        )

    if not pd.api.types.is_numeric_dtype(
        df[column2]
    ):
        raise ValueError(
            f"{column2} must be numeric."
        )

    return float(
        df[column1].corr(df[column2])
    )


def group_by_aggregate(
    df: pd.DataFrame,
    group_column: str,
    value_column: str,
    aggregation: str = "mean",
) -> dict:

    if group_column not in df.columns:
        raise ValueError(
            f"Column '{group_column}' not found."
        )

    if value_column not in df.columns:
        raise ValueError(
            f"Column '{value_column}' not found."
        )

    allowed = {
        "mean",
        "sum",
        "count",
        "median",
        "min",
        "max",
        "std",
    }

    if aggregation not in allowed:
        raise ValueError(
            f"Unsupported aggregation: {aggregation}"
        )

    result = (
        df.groupby(group_column)[value_column]
        .agg(aggregation)
        .reset_index()
    )

    return result.to_dict(
        orient="records"
    )


def value_counts(
    df: pd.DataFrame,
    column: str,
    top_n: int = 10
) -> list:

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' not found."
        )

    result = (
        df[column]
        .value_counts(dropna=False)
        .head(top_n)
        .reset_index()
    )

    result.columns = [
        column,
        "count"
    ]

    return result.to_dict(
        orient="records"
    )


def filter_rows(
    df: pd.DataFrame,
    column: str,
    operator: str,
    value
) -> list:

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' not found."
        )

    series = df[column]

    if operator == "==":
        mask = series == value
    elif operator == "!=":
        mask = series != value
    elif operator == ">":
        mask = series > value
    elif operator == ">=":
        mask = series >= value
    elif operator == "<":
        mask = series < value
    elif operator == "<=":
        mask = series <= value
    else:
        raise ValueError(
            f"Unsupported operator: {operator}"
        )

    return df.loc[mask].to_dict(
        orient="records"
    )


def top_bottom_records(
    df: pd.DataFrame,
    column: str,
    n: int = 10,
    ascending: bool = False
) -> list:

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' not found."
        )

    result = df.sort_values(
        by=column,
        ascending=ascending
    ).head(n)

    return result.to_dict(
        orient="records"
    )


def time_series_aggregate(
    df: pd.DataFrame,
    date_column: str,
    value_column: str,
    frequency: str = "ME",
    aggregation: str = "sum"
) -> list:

    if date_column not in df.columns:
        raise ValueError(
            f"Column '{date_column}' not found."
        )

    if value_column not in df.columns:
        raise ValueError(
            f"Column '{value_column}' not found."
        )

    result = df.copy()

    result[date_column] = pd.to_datetime(
        result[date_column]
    )

    result = (
        result
        .set_index(date_column)[value_column]
        .resample(frequency)
        .agg(aggregation)
        .reset_index()
    )

    return result.to_dict(
        orient="records"
    )