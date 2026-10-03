import json
import pandas as pd

from app.models.document import Document
from app.parsers.base_parser import BaseParser


class JSONParser(BaseParser):

    @staticmethod
    def parse(file_path):

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        metadata = {}

        content = data

        # If JSON is a list of objects, convert to DataFrame
        if isinstance(data, list):

            df = pd.DataFrame(data)

            content = df

            metadata = {
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": list(df.columns),
                "dtypes": {
                    col: str(dtype)
                    for col, dtype in df.dtypes.items()
                }
            }

        return Document(
            filename=file_path.name,
            file_type="json",
            content_type="dataframe",
            content=content,
            metadata=metadata
        )