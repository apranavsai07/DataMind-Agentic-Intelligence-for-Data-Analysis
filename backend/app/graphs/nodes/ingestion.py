from app.graphs.state import WorkspaceState


def ingestion_node(state: WorkspaceState):

    document = state["document"]

    if document.content_type == "dataframe":
        state["dataframe"] = document.content

    elif document.content_type == "text":
        state["document_text"] = document.content

    state["metadata"] = document.metadata

    return state