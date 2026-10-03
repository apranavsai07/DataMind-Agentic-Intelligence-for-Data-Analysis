from langgraph.graph import StateGraph, END

from app.graphs.state import WorkspaceState

from app.graphs.nodes.ingestion import ingestion_node
from app.graphs.nodes.document_analysis import document_analysis_node
from app.graphs.nodes.summarization import summarization_node


workflow = StateGraph(WorkspaceState)

workflow.add_node("ingestion", ingestion_node)
workflow.add_node("analysis", document_analysis_node)
workflow.add_node("summary", summarization_node)

workflow.set_entry_point("ingestion")

workflow.add_edge("ingestion", "analysis")
workflow.add_edge("analysis", "summary")
workflow.add_edge("summary", END)

document_graph = workflow.compile()