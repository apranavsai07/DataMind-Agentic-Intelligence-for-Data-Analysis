from app.graphs.state import WorkspaceState
from app.llm.factory import get_llm

llm = get_llm()


def summarization_node(state: WorkspaceState):
    """
    Use the user's actual request to drive the LLM response.

    If the user asked a specific question (explain, review, generate report,
    etc.) we honour that request. Otherwise we fall back to a general summary.
    """

    text = state.get("document_text") or ""
    user_request = state.get("user_request") or ""
    filename = state.get("filename") or "document"

    if user_request.strip():
        # Honour the user's explicit request
        prompt = f"""\
You are an expert document analyst. The user has uploaded a file called \
"{filename}" and made the following request:

"{user_request}"

Here is the full document content:

{text}

Please fulfil the user's request above. Structure your response clearly with \
appropriate headings, sections, and bullet points where relevant. Be \
thorough and professional. Use Markdown formatting."""
    else:
        # Fallback: general summary
        prompt = f"""\
Summarize the following document in a clear, professional, and well-structured \
way. Use Markdown formatting with headings, sections, and bullet points where \
appropriate.

Document name: {filename}

Content:
{text}"""

    response = llm.invoke(prompt)

    state["summary"] = response.content

    return state