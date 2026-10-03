from app.llm.factory import get_llm

from app.tools.analysis_tools import (
    column_statistics_tool,
    correlation_tool,
    group_by_aggregate_tool,
    value_counts_tool,
    filter_rows_tool,
    top_bottom_records_tool,
    time_series_aggregate_tool,
)


class AnalysisAgent:

    def __init__(self):

        self.llm = get_llm()

        self.tools = [
            column_statistics_tool,
            correlation_tool,
            group_by_aggregate_tool,
            value_counts_tool,
            filter_rows_tool,
            top_bottom_records_tool,
            time_series_aggregate_tool,
        ]

        self.llm_with_tools = self.llm.bind_tools(
            self.tools
        )

    def run(self, state):

        results = state.get("results", {})

        response = self.llm_with_tools.invoke(
            [
                {
                    "role": "system",
                    "content": """
You are a dataset analysis agent.

Use the available analysis tools to satisfy
the user's request.

The dataframe is available through ToolRuntime.

Do NOT put the dataframe into the prompt.

Do not repeat an analysis that has already been
completed.

When the requested analysis is complete,
do not call another tool.
""",
                },
                {
                    "role": "user",
                    "content": (
                        f"User request:\n"
                        f"{state['user_request']}\n\n"
                        f"Existing analysis results:\n"
                        f"{results.get('analysis', {})}"
                    ),
                },
            ]
        )

        return {
            "messages": [response]
        }