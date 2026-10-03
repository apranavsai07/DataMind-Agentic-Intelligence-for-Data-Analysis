from app.llm.factory import get_llm

from app.tools.export_tools import (
    export_csv_tool,
    export_excel_tool,
    export_json_tool,
)


class ExportAgent:

    def __init__(self):

        self.llm = get_llm()

        self.tools = [
            export_csv_tool,
            export_excel_tool,
            export_json_tool,
        ]

        self.llm_with_tools = self.llm.bind_tools(
            self.tools
        )

    def run(self, state):

        response = self.llm_with_tools.invoke([
            {
                "role": "system",
                "content": """
You are a data export agent.

Determine which output format the user requested.

Use the appropriate export tool.

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