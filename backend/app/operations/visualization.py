from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt


CHART_DIR = Path("outputs/charts")
CHART_DIR.mkdir(
    parents=True,
    exist_ok=True
)


def create_histogram(
    df: pd.DataFrame,
    column: str,
    filename: str
) -> str:

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' not found."
        )

    path = CHART_DIR / filename

    plt.figure()
    df[column].dropna().hist()

    plt.xlabel(column)
    plt.ylabel("Frequency")
    plt.title(
        f"Distribution of {column}"
    )

    plt.tight_layout()
    plt.savefig(path)
    plt.close()

    return str(path)


def create_bar_chart(
    df: pd.DataFrame,
    column: str,
    filename: str,
    top_n: int = 10
) -> str:

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' not found."
        )

    path = CHART_DIR / filename

    plt.figure()

    (
        df[column]
        .value_counts()
        .head(top_n)
        .plot(kind="bar")
    )

    plt.xlabel(column)
    plt.ylabel("Count")
    plt.title(
        f"Top {top_n} values of {column}"
    )

    plt.tight_layout()
    plt.savefig(path)
    plt.close()

    return str(path)


def create_line_chart(
    df: pd.DataFrame,
    x_column: str,
    y_column: str,
    filename: str
) -> str:

    for column in [x_column, y_column]:
        if column not in df.columns:
            raise ValueError(
                f"Column '{column}' not found."
            )

    path = CHART_DIR / filename

    plot_df = df.sort_values(x_column)

    plt.figure()

    plt.plot(
        plot_df[x_column],
        plot_df[y_column]
    )

    plt.xlabel(x_column)
    plt.ylabel(y_column)
    plt.title(
        f"{y_column} over {x_column}"
    )

    plt.xticks(rotation=45)

    plt.tight_layout()
    plt.savefig(path)
    plt.close()

    return str(path)


def create_scatter_plot(
    df: pd.DataFrame,
    x_column: str,
    y_column: str,
    filename: str
) -> str:

    for column in [x_column, y_column]:
        if column not in df.columns:
            raise ValueError(
                f"Column '{column}' not found."
            )

    path = CHART_DIR / filename

    plt.figure()

    plt.scatter(
        df[x_column],
        df[y_column]
    )

    plt.xlabel(x_column)
    plt.ylabel(y_column)
    plt.title(
        f"{y_column} vs {x_column}"
    )

    plt.tight_layout()
    plt.savefig(path)
    plt.close()

    return str(path)


def create_box_plot(
    df: pd.DataFrame,
    column: str,
    filename: str
) -> str:

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' not found."
        )

    path = CHART_DIR / filename

    plt.figure()

    df.boxplot(
        column=column
    )

    plt.title(
        f"Box plot of {column}"
    )

    plt.tight_layout()
    plt.savefig(path)
    plt.close()

    return str(path)


def create_correlation_heatmap(
    df: pd.DataFrame,
    filename: str
) -> str:

    numeric_df = df.select_dtypes(
        include="number"
    )

    if numeric_df.shape[1] < 2:
        raise ValueError(
            "At least two numeric columns are required."
        )

    path = CHART_DIR / filename

    correlation = numeric_df.corr()

    plt.figure()

    plt.imshow(
        correlation,
        aspect="auto"
    )

    plt.xticks(
        range(len(correlation.columns)),
        correlation.columns,
        rotation=45,
        ha="right"
    )

    plt.yticks(
        range(len(correlation.columns)),
        correlation.columns
    )

    plt.colorbar()

    plt.title(
        "Correlation Heatmap"
    )

    plt.tight_layout()
    plt.savefig(path)
    plt.close()

    return str(path)