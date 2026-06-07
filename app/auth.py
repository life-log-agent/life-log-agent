import logging

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWK, PyJWKClient
from jwt.exceptions import PyJWKClientError, PyJWTError

from app.config import settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer()

# Supabase는 비대칭(ES256, P-256) JWT 서명 키를 쓴다. 공유 시크릿이 아니라
# 프로젝트의 JWKS 엔드포인트가 게시한 공개키로 검증한다. PyJWKClient는 키를
# 캐시하고, 토큰의 kid가 캐시에 없을 때만 다시 가져온다.
_jwks_client = PyJWKClient(settings.supabase_jwks_url)


def _signing_key(token: str) -> PyJWK:
    """토큰 헤더의 kid에 해당하는 Supabase 공개 서명 키를 반환."""
    return _jwks_client.get_signing_key_from_jwt(token)


def _verify_token(token: str) -> str:
    """Supabase JWT(ES256)를 검증하고 user_id(sub claim)를 반환한다.

    서명·만료(exp)·audience를 모두 검증한다. 토큰이나 claim을 절대 로깅하지
    않는다(PII/비밀 — CLAUDE.md §8).
    """
    try:
        payload = jwt.decode(
            token,
            _signing_key(token),
            algorithms=["ES256"],
            audience="authenticated",
        )
    except (PyJWTError, PyJWKClientError) as e:
        # 내부 오류 상세를 클라이언트에 노출하지 않는다.
        logger.warning("Rejected JWT: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from e

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    return user_id


def current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    return _verify_token(credentials.credentials)
