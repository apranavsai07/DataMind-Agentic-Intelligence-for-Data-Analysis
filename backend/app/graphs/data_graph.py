from langgraph.graph import StateGraph, END

from app.graphs.state import WorkspaceState

from app.agents.planner import Planner
from app.agents.report_agent import ReportAgent

from app.executors.deterministic_executor import (
    DeterministicExecutor,
)


planner = Planner()
executor = DeterministicExecutor()
report_agent = ReportAgent()


# ============================================================
# PLANNER NODE
# ============================================================

def planner_node(
    state: WorkspaceState,
):

    plan = planner.run(
        user_request=state["user_request"],
        metadata=state.get("metadata", {}),
        file_type=state.get("file_type", ""),
    )

    return {
        "plan": [
            task.model_dump()
            for task in plan.tasks
        ],
        "requires_report": plan.requires_report,
    }


# ============================================================
# EXECUTOR NODE
# ============================================================

def executor_node(
    state: WorkspaceState,
):

    execution_state = dict(state)

    result = executor.execute(
        execution_state
    )

    return {
        "dataframe": result.get("dataframe"),
        "results": result.get("results", {}),
        "output_file": result.get("output_file"),
        "preprocessing_steps": result.get(
            "preprocessing_steps",
            [],
        ),
        "artifacts": result.get(
            "artifacts",
            [],
        ),
    }


# ============================================================
# REPORT NODE
# ============================================================

# ============================================================
# REPORT NODE
# ============================================================

# ============================================================
# REPORT NODE
# ============================================================

def report_node(
    state: WorkspaceState,
):

    result = report_agent.run(state)

    return {
        "report": {
            "status": "completed",
            "text": result["report"],
        }
    }

# ============================================================
# ROUTER
# ============================================================

def route_after_executor(
    state: WorkspaceState,
):

    if state.get("requires_report", False):
        return "report"

    return END


# ============================================================
# GRAPH
# ============================================================

workflow = StateGraph(WorkspaceState)


workflow.add_node(
    "planner",
    planner_node,
)

workflow.add_node(
    "executor",
    executor_node,
)

workflow.add_node(
    "report",
    report_node,
)


# ============================================================
# EDGES
# ============================================================

workflow.set_entry_point(
    "planner",
)

workflow.add_edge(
    "planner",
    "executor",
)

workflow.add_conditional_edges(
    "executor",
    route_after_executor,
    {
        "report": "report",
        END: END,
    },
)

workflow.add_edge(
    "report",
    END,
)


data_graph = workflow.compile()