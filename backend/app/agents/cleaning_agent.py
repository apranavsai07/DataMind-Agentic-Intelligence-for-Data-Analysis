from app.llm.factory import get_llm

from app.tools.cleaning_tools import (
    remove_duplicates_tool,
    fill_missing_values_tool,
    drop_columns_tool,
    convert_column_type_tool,
)


class CleaningAgent:

    def __init__(self):

        self.llm = get_llm()

        self.tools = [
            remove_duplicates_tool,
            fill_missing_values_tool,
            drop_columns_tool,
            convert_column_type_tool,
        ]

        self.llm_with_tools = self.llm.bind_tools(
            self.tools
        )

    def run(self, state):

        response = self.llm_with_tools.invoke(
            [
                {
                    "role": "system",
                    "content": """
You are a dataset cleaning agent.

Determine what cleaning operations are required
to satisfy the user's request.

Use the available tools.

The dataframe is available through the tool runtime.

Do not place the dataframe into the prompt.

Only perform cleaning operations that are
required by the user's request.

For a generic request such as "clean this dataset",
inspect the available profiling information if it
exists and make sensible data-quality decisions.

Do not perform analysis or visualization.
""",
                },
                {
                    "role": "user",
                    "content": state["user_request"],
                },
            ]
        )

        return {
            "messages": [response]
        }