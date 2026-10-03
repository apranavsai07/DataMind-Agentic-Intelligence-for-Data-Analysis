import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.database.db import supabase
from app.core.auth import get_current_user
from app.llm.factory import get_llm

router = APIRouter(
    prefix="/history",
    tags=["History"],
)

llm = get_llm()

# ================================================================
# HELPERS
# ================================================================

def _verify_analysis_owner(analysis_id: str, user_id: str) -> dict:
    """Return the analysis row or raise 404."""
    row = (
        supabase.table("analyses")
        .select("*")
        .eq("id", analysis_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return row.data[0]


# ================================================================
# GET /history/analyses — list recent analyses
# ================================================================

@router.get("/analyses")
def get_recent_analyses(
    limit: int = Query(default=20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    response = (
        supabase.table("analyses")
        .select("*")
        .eq("user_id", str(current_user.id))
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"analyses": response.data or []}


# ================================================================
# GET /history/analyses/{analysis_id} — single analysis detail
# ================================================================

@router.get("/analyses/{analysis_id}")
def get_analysis(
    analysis_id: str,
    current_user=Depends(get_current_user),
):
    analysis = _verify_analysis_owner(analysis_id, str(current_user.id))
    return {"analysis": analysis}


# ================================================================
# GET /history/analyses/{analysis_id}/outputs
# ================================================================

@router.get("/analyses/{analysis_id}/outputs")
def get_analysis_outputs(
    analysis_id: str,
    current_user=Depends(get_current_user),
):
    _verify_analysis_owner(analysis_id, str(current_user.id))

    response = (
        supabase.table("analysis_outputs")
        .select("*")
        .eq("analysis_id", analysis_id)
        .eq("user_id", str(current_user.id))
        .order("created_at", desc=True)
        .execute()
    )
    return {"outputs": response.data or []}


from datetime import datetime, timezone
from uuid import uuid4

# ================================================================
# MESSAGE PERSISTENCE HELPERS (WITH TABLE-CACHE FALLBACK)
# ================================================================

def _normalize_content(content) -> str:
    """Ensure message content is always a plain string, never a raw dict or list."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict):
                parts.append(part.get("text") or part.get("content") or part.get("value") or json.dumps(part))
            else:
                parts.append(str(part))
        return "\n\n".join(parts)
    if isinstance(content, dict):
        return content.get("text") or content.get("answer") or content.get("content") or content.get("message") or json.dumps(content)
    return str(content)


def _fetch_messages(analysis_id: str, user_id: str, analysis: dict | None = None) -> list[dict]:
    """Fetch conversation messages from conversation_messages table, with fallback to analyses.results."""
    try:
        response = (
            supabase.table("conversation_messages")
            .select("id, role, content, created_at")
            .eq("analysis_id", analysis_id)
            .eq("user_id", user_id)
            .order("created_at", desc=False)
            .execute()
        )
        messages = response.data or []
        for msg in messages:
            msg["content"] = _normalize_content(msg.get("content"))
        return messages
    except Exception:
        # Fallback to analysis["results"]["conversation_history"]
        if analysis is None:
            analysis = _verify_analysis_owner(analysis_id, user_id)
        results = analysis.get("results") or {}
        if isinstance(results, str):
            try:
                results = json.loads(results)
            except Exception:
                results = {}
        messages = results.get("conversation_history") or []
        for msg in messages:
            if isinstance(msg, dict):
                msg["content"] = _normalize_content(msg.get("content"))
        return messages


def _persist_message(analysis_id: str, user_id: str, role: str, content: str, analysis: dict | None = None) -> dict:
    """Insert into conversation_messages table, or fallback to analyses.results['conversation_history']."""
    try:
        row = {
            "analysis_id": analysis_id,
            "user_id": user_id,
            "role": role,
            "content": content,
        }
        response = supabase.table("conversation_messages").insert(row).execute()
        if response.data:
            return response.data[0]
    except Exception:
        pass

    # Fallback to saving in analysis table
    if analysis is None:
        analysis = _verify_analysis_owner(analysis_id, user_id)
    results = analysis.get("results") or {}
    if isinstance(results, str):
        try:
            results = json.loads(results)
        except Exception:
            results = {}
    history = results.setdefault("conversation_history", [])
    msg_dict = {
        "id": str(uuid4()),
        "analysis_id": analysis_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    history.append(msg_dict)
    results["conversation_history"] = history
    try:
        supabase.table("analyses").update({"results": results}).eq("id", analysis_id).eq("user_id", user_id).execute()
    except Exception as exc:
        print(f"Warning: could not persist conversation history to analysis: {exc}")
    return msg_dict


# ================================================================
# GET /history/analyses/{analysis_id}/messages
# ================================================================

@router.get("/analyses/{analysis_id}/messages")
def get_messages(
    analysis_id: str,
    current_user=Depends(get_current_user),
):
    """Return all conversation messages for an analysis, oldest first."""
    analysis = _verify_analysis_owner(analysis_id, str(current_user.id))
    messages = _fetch_messages(analysis_id, str(current_user.id), analysis)
    return {"messages": messages}


# ================================================================
# POST /history/analyses/{analysis_id}/messages  — persist a msg
# ================================================================

class MessageCreate(BaseModel):
    role: str   # "user" | "assistant"
    content: str


@router.post("/analyses/{analysis_id}/messages", status_code=201)
def save_message(
    analysis_id: str,
    body: MessageCreate,
    current_user=Depends(get_current_user),
):
    """Persist a single message to the conversation history."""
    if body.role not in ("user", "assistant"):
        raise HTTPException(status_code=422, detail="role must be 'user' or 'assistant'.")
    if not body.content.strip():
        raise HTTPException(status_code=422, detail="content must not be empty.")

    analysis = _verify_analysis_owner(analysis_id, str(current_user.id))
    saved = _persist_message(analysis_id, str(current_user.id), body.role, body.content.strip(), analysis)
    return {"message": saved}


# ================================================================
# POST /history/analyses/{analysis_id}/followup — LLM follow-up
# ================================================================

class FollowUpRequest(BaseModel):
    question: str


def _build_followup_prompt(
    analysis: dict,
    prior_messages: list[dict],
    question: str,
) -> str:
    """
    Build a context-rich prompt for the follow-up LLM call.

    Context order:
      1. Original analysis metadata (filename, user request)
      2. Saved analysis results summary (report / summary text if present)
      3. Prior conversation turns (capped to avoid token overflow)
      4. The new user question
    """
    lines: list[str] = []

    lines.append("You are an expert AI data analyst. The user is continuing a conversation about a previous analysis.")
    lines.append("")

    # --- Original analysis context ---
    lines.append(f"## Original Analysis")
    lines.append(f"- File: {analysis.get('filename', 'unknown')}")
    lines.append(f"- Original request: {analysis.get('user_request', '')}")
    lines.append("")

    # --- Saved results summary ---
    results: dict = analysis.get("results") or {}
    if isinstance(results, str):
        try:
            results = json.loads(results)
        except Exception:
            results = {}

    report_text = ""
    if results.get("report") and results["report"].get("text"):
        report_text = results["report"]["text"][:3000]
    elif results.get("summary") and results["summary"].get("text"):
        report_text = results["summary"]["text"][:3000]

    if report_text:
        lines.append("## Previously Generated Report / Summary (excerpt)")
        lines.append(report_text)
        lines.append("")

    # --- Conversation history (last 10 turns to avoid overflow) ---
    recent = prior_messages[-20:] if len(prior_messages) > 20 else prior_messages
    if recent:
        lines.append("## Conversation History")
        for msg in recent:
            speaker = "User" if msg["role"] == "user" else "Assistant"
            lines.append(f"{speaker}: {msg['content']}")
        lines.append("")

    # --- New question ---
    lines.append("## New Question from User")
    lines.append(question.strip())
    lines.append("")
    lines.append("Please answer the user's question thoroughly and precisely, referencing the analysis results above where relevant. Use Markdown formatting.")

    return "\n".join(lines)


@router.post("/analyses/{analysis_id}/followup")
def followup(
    analysis_id: str,
    body: FollowUpRequest,
    current_user=Depends(get_current_user),
):
    """
    Send a follow-up question about a saved analysis.

    1. Verify ownership.
    2. Load prior messages for context.
    3. Build a context-rich prompt.
    4. Call the LLM.
    5. Persist both the user question and the assistant answer.
    6. Return the assistant answer.
    """
    if not body.question.strip():
        raise HTTPException(status_code=422, detail="question must not be empty.")

    user_id = str(current_user.id)
    analysis = _verify_analysis_owner(analysis_id, user_id)

    # --- Load prior conversation ---
    prior_messages = _fetch_messages(analysis_id, user_id, analysis)

    # --- Build prompt and call LLM ---
    prompt = _build_followup_prompt(analysis, prior_messages, body.question)

    try:
        response = llm.invoke(prompt)
        answer: str = _normalize_content(response.content)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"LLM call failed: {exc}",
        )

    # --- Persist user question ---
    _persist_message(analysis_id, user_id, "user", body.question.strip(), analysis)

    # --- Persist assistant answer ---
    _persist_message(analysis_id, user_id, "assistant", answer, analysis)

    return {
        "answer": answer,
        "analysis_id": analysis_id,
    }


# ================================================================
# GET /history/analyses/{analysis_id}/outputs/{output_id}/download
# ================================================================

@router.get("/analyses/{analysis_id}/outputs/{output_id}/download")
def download_output(
    analysis_id: str,
    output_id: str,
    current_user=Depends(get_current_user),
):
    """
    Generate a short-lived Supabase Storage signed URL for a specific
    analysis output (visualization, cleaned CSV, report, etc.) and
    redirect the browser to it so it downloads.
    """
    user_id = str(current_user.id)

    # Verify the analysis belongs to this user.
    owner_check = (
        supabase.table("analyses")
        .select("id")
        .eq("id", analysis_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not owner_check.data:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    # Fetch the specific output row.
    result = (
        supabase.table("analysis_outputs")
        .select("id, name, storage_path, content, content_type, output_type")
        .eq("id", output_id)
        .eq("analysis_id", analysis_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Output not found.")

    row = result.data[0]
    storage_path = row.get("storage_path")

    # If this is cleaned data or inline content, stream it directly with proper Content-Disposition
    inline = row.get("content")
    if (row.get("output_type") == "cleaned_data" and inline) or (not storage_path):
        if inline is None:
            raise HTTPException(status_code=404, detail="No downloadable file for this output.")

        from fastapi.responses import Response as FastAPIResponse
        content_str = inline if isinstance(inline, str) else json.dumps(inline, indent=2)
        filename = row.get("name", "output.txt")
        ctype = row.get("content_type", "text/csv" if row.get("output_type") == "cleaned_data" else "text/plain")
        return FastAPIResponse(
            content=content_str,
            media_type=ctype,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # Generate a signed URL from Supabase Storage.
    try:
        filename = row.get("name", "output")
        signed = supabase.storage.from_("analysis-outputs").create_signed_url(
            storage_path,
            expires_in=300,
            options={"download": filename},
        )
        url = signed.get("signedURL") or signed.get("signed_url") or (
            signed if isinstance(signed, str) else None
        )
    except Exception as exc:
        if inline:
            from fastapi.responses import Response as FastAPIResponse
            return FastAPIResponse(
                content=inline if isinstance(inline, str) else json.dumps(inline, indent=2),
                media_type=row.get("content_type", "text/plain"),
                headers={"Content-Disposition": f'attachment; filename="{filename}"'},
            )
        raise HTTPException(status_code=502, detail=f"Could not generate download URL: {exc}")

    if not url:
        if inline:
            from fastapi.responses import Response as FastAPIResponse
            return FastAPIResponse(
                content=inline if isinstance(inline, str) else json.dumps(inline, indent=2),
                media_type=row.get("content_type", "text/plain"),
                headers={"Content-Disposition": f'attachment; filename="{filename}"'},
            )
        raise HTTPException(status_code=502, detail="Storage returned no signed URL.")

    return RedirectResponse(url=url)