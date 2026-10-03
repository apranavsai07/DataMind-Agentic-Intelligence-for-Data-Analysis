from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer

from app.database.db import supabase


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    token = credentials.credentials

    try:
        # Verify the token with Supabase Auth.
        response = supabase.auth.get_user(token)
        user = response.user

        if user is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token.",
            )

        return user

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )