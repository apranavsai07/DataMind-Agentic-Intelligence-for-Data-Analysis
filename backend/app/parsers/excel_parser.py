import pandas as pd
from app.models.document import Document


class ExcelParser:

    @staticmethod
    def parse(file_path):
        df = pd.read_excel(file_path)

        return Document(
            filename=file_path.name,
            file_type="excel",
            content_type="dataframe",
            content=df,
            metadata={
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": list(df.columns),
                "dtypes": {
                    col: str(dtype)
                    for col, dtype in df.dtypes.items()
                }
            }
        )