import pandas as pd


def get_basic_profile(df: pd.DataFrame) -> dict:
    """Return basic dataset structure."""

    return {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "column_names": list(df.columns),
        "dtypes": {
            column: str(dtype)
            for column, dtype in df.dtypes.items()
        },
    }


def get_missing_values(df: pd.DataFrame) -> dict:
    """Return missing-value counts for each column."""

    return {
        column: int(count)
        for column, count in df.isnull().sum().items()
        if count > 0
    }


def get_duplicate_count(df: pd.DataFrame) -> int:
    """Return number of duplicate rows."""

    return int(df.duplicated().sum())


def get_numeric_summary(df: pd.DataFrame) -> dict:
    """Return descriptive statistics for numeric columns."""

    numeric_df = df.select_dtypes(include="number")

    if numeric_df.empty:
        return {}

    return {
        column: {
            key: (
                float(value)
                if pd.notna(value)
                else None
            )
            for key, value in stats.items()
        }
        for column, stats in numeric_df.describe().to_dict().items()
    }


def get_categorical_summary(df):
    result = {}

    categorical_columns = df.select_dtypes(
        include=["object", "category"]
    ).columns

    for column in categorical_columns:

        series = df[column]

        result[column] = {
            "unique_values": int(
                series.nunique(dropna=True)
            ),

            "missing_values": int(
                series.isna().sum()
            ),

            "top_values": (
                series
                .dropna()
                .value_counts()
                .head(10)
                .to_dict()
            ),
        }

    return result

def get_unique_value_counts(
    df: pd.DataFrame,
    column: str
) -> dict:
    """Return value frequencies for a column."""

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' not found."
        )

    return {
        str(key): int(value)
        for key, value in (
            df[column]
            .value_counts(dropna=False)
            .items()
        )
    }


def get_correlation_matrix(
    df: pd.DataFrame
) -> dict:
    """Return correlation matrix for numeric columns."""

    numeric_df = df.select_dtypes(include="number")

    if numeric_df.shape[1] < 2:
        return {}

    return {
        column: {
            other_column: (
                float(value)
                if pd.notna(value)
                else None
            )
            for other_column, value in values.items()
        }
        for column, values in (
            numeric_df.corr().to_dict().items()
        )
    }


def detect_outliers(
    df: pd.DataFrame
) -> dict:
    """Detect outliers in numeric columns using the IQR method."""

    numeric_df = df.select_dtypes(include="number")

    result = {}

    for column in numeric_df.columns:

        series = numeric_df[column].dropna()

        if series.empty:
            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)

        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        outlier_mask = (
            (series < lower_bound)
            | (series > upper_bound)
        )

        result[column] = {
            "count": int(outlier_mask.sum()),
            "percentage": float(
                outlier_mask.mean() * 100
            ),
            "lower_bound": float(lower_bound),
            "upper_bound": float(upper_bound),
        }

    return result