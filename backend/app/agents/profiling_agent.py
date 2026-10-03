from app.llm.factory import get_llm

from app.tools.profiling_tools import (
    basic_profile_tool,
    missing_values_tool,
    duplicate_count_tool,
    numeric_summary_tool,
    categorical_summary_tool,
    unique_value_counts_tool,
    correlation_matrix_tool,
    outlier_detection_tool,
)


class ProfilingAgent:

    def __init__(self):

        self.llm = get_llm()

        self.tools = [
            basic_profile_tool,
            missing_values_tool,
            duplicate_count_tool,
            numeric_summary_tool,
            categorical_summary_tool,
            unique_value_counts_tool,
            correlation_matrix_tool,
            outlier_detection_tool,
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
You are a dataset profiling agent.

Determine which profiling information is
needed to satisfy the user's request.

Use the available profiling tools.

You may call multiple tools if necessary.

Do not modify the dataframe.

The dataframe is available through the tool runtime.
Do not put the dataframe into the prompt.
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