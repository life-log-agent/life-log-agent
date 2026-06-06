from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt.exceptions import PyJWTError

from app.config import settings

_bearer = HTTPBearer()


def _verify_token(token: str) -> str:
    """Verify Supabase JWT and return user_id (sub claim)."""
    import logging
    logger = logging.getLogger(__name__)
    try:
        header = jwt.get_unverified_header(token)
        logger.info("JWT header: %s", header)
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False, "verify_signature": False},
        )
    except PyJWTError as e:
        logger.error("JWT error: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing sub claim")
    return user_id


def current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    return _verify_token(credentials.credentials)
