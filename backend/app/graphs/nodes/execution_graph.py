from langgraph.graph import StateGraph, END

from app.graphs.state import WorkspaceState
from app.executors.deterministic_executor import (
    DeterministicExecutor,
)


executor = DeterministicExecutor()


def execute_plan_node(
    state: WorkspaceState,
):

    return executor.execute(state)


workflow = StateGraph(WorkspaceState)

workflow.add_node(
    "execute_plan",
    execute_plan_node,
)

workflow.set_entry_point(
    "execute_plan",
)

workflow.add_edge(
    "execute_plan",
    END,
)

execution_graph = workflow.compile()