from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from app.graphs.state import WorkspaceState
from app.agents.cleaning_agent import CleaningAgent

from app.tools.cleaning_tools import (
    remove_duplicates_tool,
    fill_missing_values_tool,
    drop_columns_tool,
    convert_column_type_tool,
)


agent = CleaningAgent()

tools = [
    remove_duplicates_tool,
    fill_missing_values_tool,
    drop_columns_tool,
    convert_column_type_tool,
]

tool_node = ToolNode(tools)


def cleaning_agent_node(state):
    return agent.run(state)


def should_continue(state):

    last_message = state["messages"][-1]

    if getattr(last_message, "tool_calls", None):
        return "cleaning_tools"

    return END


workflow = StateGraph(WorkspaceState)

workflow.add_node(
    "cleaning_agent",
    cleaning_agent_node,
)

workflow.add_node(
    "cleaning_tools",
    tool_node,
)

workflow.set_entry_point(
    "cleaning_agent"
)

workflow.add_conditional_edges(
    "cleaning_agent",
    should_continue,
    {
        "cleaning_tools": "cleaning_tools",
        END: END,
    },
)

workflow.add_edge(
    "cleaning_tools",
    "cleaning_agent",
)

cleaning_graph = workflow.compile()