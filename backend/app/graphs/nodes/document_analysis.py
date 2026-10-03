from app.graphs.state import WorkspaceState


def document_analysis_node(state: WorkspaceState):

    document = state["document"]

    state["document_text"] = document.content

    return state