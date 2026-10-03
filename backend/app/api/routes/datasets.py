from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse

from app.core.auth import get_current_user
from app.database.db import supabase


router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)


@router.get("/")
def get_datasets(
    limit: int = Query(default=50, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    response = (
        supabase.table("datasets")
        .select("*")
        .eq("user_id", str(current_user.id))
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    return {"datasets": response.data or []}


@router.get("/{dataset_id}")
def get_dataset(
    dataset_id: str,
    current_user=Depends(get_current_user),
):
    response = (
        supabase.table("datasets")
        .select("*")
        .eq("id", dataset_id)
        .eq("user_id", str(current_user.id))
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    return {"dataset": response.data[0]}


@router.get("/{dataset_id}/analyses")
def get_dataset_analyses(
    dataset_id: str,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user.id)

    # Confirm ownership before returning related analyses.
    dataset = (
        supabase.table("datasets")
        .select("id")
        .eq("id", dataset_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    if not dataset.data:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    response = (
        supabase.table("analyses")
        .select("*")
        .eq("dataset_id", dataset_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return {"analyses": response.data or []}


@router.get("/{dataset_id}/download")
def download_dataset(
    dataset_id: str,
    current_user=Depends(get_current_user),
):
    """
    Generate a short-lived signed URL for the dataset file stored in
    Supabase Storage and redirect the browser to it so the file downloads.
    """
    user_id = str(current_user.id)

    # Verify ownership.
    result = (
        supabase.table("datasets")
        .select("id, filename, storage_path")
        .eq("id", dataset_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    row = result.data[0]
    storage_path = row.get("storage_path")

    if not storage_path:
        raise HTTPException(status_code=404, detail="No file is stored for this dataset.")

    try:
        signed = supabase.storage.from_("datasets").create_signed_url(
            storage_path,
            expires_in=300,  # 5-minute window
            options={"download": row.get("filename", "dataset")},
        )
        url = signed.get("signedURL") or signed.get("signed_url") or (
            signed if isinstance(signed, str) else None
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not generate download URL: {exc}")

    if not url:
        raise HTTPException(status_code=502, detail="Storage returned no signed URL.")

    return RedirectResponse(url=url)