from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from app.graphs.state import WorkspaceState
from app.agents.analysis_agents import AnalysisAgent

from app.tools.analysis_tools import (
    column_statistics_tool,
    correlation_tool,
    group_by_aggregate_tool,
    value_counts_tool,
    filter_rows_tool,
    top_bottom_records_tool,
    time_series_aggregate_tool,
)


agent = AnalysisAgent()

tools = [
    column_statistics_tool,
    correlation_tool,
    group_by_aggregate_tool,
    value_counts_tool,
    filter_rows_tool,
    top_bottom_records_tool,
    time_series_aggregate_tool,
]

tool_node = ToolNode(tools)


def analysis_agent_node(state):

    return agent.run(state)


def should_continue(state):

    last_message = state["messages"][-1]

    if getattr(last_message, "tool_calls", None):
        return "analysis_tools"

    return END


workflow = StateGraph(WorkspaceState)

workflow.add_node(
    "analysis_agent",
    analysis_agent_node,
)

workflow.add_node(
    "analysis_tools",
    tool_node,
)

workflow.set_entry_point(
    "analysis_agent"
)

workflow.add_conditional_edges(
    "analysis_agent",
    should_continue,
    {
        "analysis_tools": "analysis_tools",
        END: END,
    },
)

workflow.add_edge(
    "analysis_tools",
    "analysis_agent",
)

analysis_graph = workflow.compile()