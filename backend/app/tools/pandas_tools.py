import pandas as pd


def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Remove duplicate rows from the dataset."""

    return df.drop_duplicates().reset_index(drop=True)


def fill_missing_values(
    df: pd.DataFrame,
    numeric_strategy: str = "median",
    categorical_strategy: str = "mode",
) -> pd.DataFrame:
    """Fill missing values in numeric and categorical columns."""

    result = df.copy()

    # ========================================================
    # NUMERIC COLUMNS
    # ========================================================

    numeric_columns = result.select_dtypes(
        include="number"
    ).columns

    if numeric_strategy == "median":

        result[numeric_columns] = result[
            numeric_columns
        ].fillna(
            result[numeric_columns].median()
        )

    elif numeric_strategy == "mean":

        result[numeric_columns] = result[
            numeric_columns
        ].fillna(
            result[numeric_columns].mean()
        )

    elif numeric_strategy == "zero":

        result[numeric_columns] = result[
            numeric_columns
        ].fillna(0)

    else:
        raise ValueError(
            f"Unsupported numeric strategy: "
            f"{numeric_strategy}"
        )

    # ========================================================
    # CATEGORICAL COLUMNS
    # ========================================================

    categorical_columns = result.select_dtypes(
        include=["object", "category"]
    ).columns

    if categorical_strategy == "mode":

        for column in categorical_columns:

            if result[column].isna().any():

                mode = result[column].mode()

                if not mode.empty:
                    result[column] = result[
                        column
                    ].fillna(
                        mode.iloc[0]
                    )

    elif categorical_strategy == "unknown":

        result[categorical_columns] = result[
            categorical_columns
        ].fillna("Unknown")

    else:
        raise ValueError(
            f"Unsupported categorical strategy: "
            f"{categorical_strategy}"
        )

    return result


def drop_columns(
    df: pd.DataFrame,
    columns: list[str],
) -> pd.DataFrame:
    """Drop specified columns from the dataset."""

    missing = [
        column
        for column in columns
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Columns not found: {missing}"
        )

    return df.drop(columns=columns)


def convert_column_type(
    df: pd.DataFrame,
    column: str,
    dtype: str,
) -> pd.DataFrame:
    """Convert a column to the specified data type."""

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' not found."
        )

    result = df.copy()

    result[column] = result[column].astype(dtype)

    return result