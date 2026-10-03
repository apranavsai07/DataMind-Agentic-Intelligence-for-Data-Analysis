from langgraph.graph import StateGraph, END

from app.graphs.state import WorkspaceState
from app.agents.report_agent import ReportAgent


agent = ReportAgent()


def report_agent_node(state):

    result = agent.run(state)

    return {
        "report": {
            "status": "completed",
            "text": result["report"],
        }
    }


workflow = StateGraph(WorkspaceState)

workflow.add_node(
    "report_agent",
    report_agent_node,
)

workflow.set_entry_point(
    "report_agent"
)

workflow.add_edge(
    "report_agent",
    END,
)

report_graph = workflow.compile()