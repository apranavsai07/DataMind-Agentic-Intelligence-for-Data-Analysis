from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from app.graphs.state import WorkspaceState
from app.agents.visualization_agent import VisualizationAgent

from app.tools.visualization_tools import (
    histogram_tool,
    bar_chart_tool,
    line_chart_tool,
    scatter_plot_tool,
    box_plot_tool,
    correlation_heatmap_tool,
)


agent = VisualizationAgent()

tools = [
    histogram_tool,
    bar_chart_tool,
    line_chart_tool,
    scatter_plot_tool,
    box_plot_tool,
    correlation_heatmap_tool,
]

tool_node = ToolNode(tools)


def visualization_agent_node(state):
    return agent.run(state)


def should_continue(state):

    last_message = state["messages"][-1]

    if getattr(last_message, "tool_calls", None):
        return "visualization_tools"

    return END


workflow = StateGraph(WorkspaceState)

workflow.add_node(
    "visualization_agent",
    visualization_agent_node,
)

workflow.add_node(
    "visualization_tools",
    tool_node,
)

workflow.set_entry_point(
    "visualization_agent"
)

workflow.add_conditional_edges(
    "visualization_agent",
    should_continue,
    {
        "visualization_tools": "visualization_tools",
        END: END,
    },
)

workflow.add_edge(
    "visualization_tools",
    "visualization_agent",
)

visualization_graph = workflow.compile()