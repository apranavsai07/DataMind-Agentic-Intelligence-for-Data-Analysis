from app.llm.factory import get_llm

from app.tools.visualization_tools import (
    histogram_tool,
    bar_chart_tool,
    line_chart_tool,
    scatter_plot_tool,
    box_plot_tool,
    correlation_heatmap_tool,
)


class VisualizationAgent:

    def __init__(self):

        self.llm = get_llm()

        self.tools = [
            histogram_tool,
            bar_chart_tool,
            line_chart_tool,
            scatter_plot_tool,
            box_plot_tool,
            correlation_heatmap_tool,
        ]

        self.llm_with_tools = self.llm.bind_tools(
            self.tools
        )

    def run(self, state):

        response = self.llm_with_tools.invoke([
            {
                "role": "system",
                "content": """
You are a data visualization agent.

Determine which visualizations are appropriate
for the user's request and dataset.

Use the available visualization tools.

Do not modify the dataframe.
"""
            },
            {
                "role": "user",
                "content": state["user_request"]
            }
        ])

        return {
            "messages": [response]
        }