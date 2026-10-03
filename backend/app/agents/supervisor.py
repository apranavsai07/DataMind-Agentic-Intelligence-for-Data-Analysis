from app.graphs.data_graph import data_graph
from app.graphs.document_graph import document_graph


class Supervisor:

    @staticmethod
    def route(document):

        if document.content_type == "dataframe":
            return data_graph

        elif document.content_type == "text":
            return document_graph

        raise ValueError("Unsupported document type.")