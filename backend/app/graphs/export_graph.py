from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from app.graphs.state import WorkspaceState
from app.agents.export_agent import ExportAgent

from app.tools.export_tools import (
    export_csv_tool,
    export_excel_tool,
    export_json_tool,
)


agent = ExportAgent()

tools = [
    export_csv_tool,
    export_excel_tool,
    export_json_tool,
]

tool_node = ToolNode(tools)


def export_agent_node(state):
    return agent.run(state)


def should_continue(state):

    last_message = state["messages"][-1]

    if getattr(last_message, "tool_calls", None):
        return "export_tools"

    return END


workflow = StateGraph(WorkspaceState)

workflow.add_node(
    "export_agent",
    export_agent_node,
)

workflow.add_node(
    "export_tools",
    tool_node,
)

workflow.set_entry_point(
    "export_agent"
)

workflow.add_conditional_edges(
    "export_agent",
    should_continue,
    {
        "export_tools": "export_tools",
        END: END,
    },
)

workflow.add_edge(
    "export_tools",
    "export_agent",
)

export_graph = workflow.compile()