from pathlib import Path

import pandas as pd


OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


def export_csv(
    df: pd.DataFrame,
    filename: str
) -> str:

    path = OUTPUT_DIR / filename

    df.to_csv(
        path,
        index=False
    )

    return str(path)


def export_excel(
    df: pd.DataFrame,
    filename: str
) -> str:

    path = OUTPUT_DIR / filename

    df.to_excel(
        path,
        index=False
    )

    return str(path)


def export_json(
    df: pd.DataFrame,
    filename: str
) -> str:

    path = OUTPUT_DIR / filename

    df.to_json(
        path,
        orient="records",
        indent=2
    )

    return str(path)