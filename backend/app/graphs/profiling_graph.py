from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from app.graphs.state import WorkspaceState
from app.agents.profiling_agent import ProfilingAgent

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


agent = ProfilingAgent()

tools = [
    basic_profile_tool,
    missing_values_tool,
    duplicate_count_tool,
    numeric_summary_tool,
    categorical_summary_tool,
    unique_value_counts_tool,
    correlation_matrix_tool,
    outlier_detection_tool,
]

tool_node = ToolNode(tools)


def profiling_agent_node(state):
    return agent.run(state)


def should_continue(state):

    last_message = state["messages"][-1]

    if getattr(last_message, "tool_calls", None):
        return "profiling_tools"

    return END


workflow = StateGraph(WorkspaceState)

workflow.add_node(
    "profiling_agent",
    profiling_agent_node,
)

workflow.add_node(
    "profiling_tools",
    tool_node,
)

workflow.set_entry_point(
    "profiling_agent"
)

workflow.add_conditional_edges(
    "profiling_agent",
    should_continue,
    {
        "profiling_tools": "profiling_tools",
        END: END,
    },
)

workflow.add_edge(
    "profiling_tools",
    "profiling_agent",
)

profiling_graph = workflow.compile()