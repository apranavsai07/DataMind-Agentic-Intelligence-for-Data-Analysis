from pathlib import Path
import pandas as pd

from app.graphs.state import WorkspaceState


OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)


def output_node(state: WorkspaceState):

    dataframe = state.get("dataframe")

    if isinstance(dataframe, pd.DataFrame):

        filename = state["document"].filename
        output_path = OUTPUT_DIR / f"processed_{filename}"

        dataframe.to_csv(
            output_path,
            index=False
        )

        return {
            "output_file": str(output_path)
        }

    return {
        "output_file": None
    }