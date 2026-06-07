"""JWT 검증 회귀 테스트 — Supabase 비대칭(ES256) 토큰이 올바르게 검증되는지.

실제 JWKS 네트워크 호출 없이, P-256 키쌍을 만들어 _signing_key 를 패치한다.
"""
import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException

from app import auth

# 테스트용 서버 키쌍(P-256). 공개키로 검증, 개인키로 서명.
_PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())
_PUBLIC_KEY = _PRIVATE_KEY.public_key()
# 공격자 키쌍 — 다른 키로 서명한 위조 토큰 시뮬레이션.
_ATTACKER_KEY = ec.generate_private_key(ec.SECP256R1())


@pytest.fixture(autouse=True)
def _patch_signing_key(monkeypatch: pytest.MonkeyPatch) -> None:
    # JWKS 조회를 우회해 항상 서버 공개키를 돌려준다.
    monkeypatch.setattr(auth, "_signing_key", lambda _token: _PUBLIC_KEY)


def _encode(key: object, **claims: object) -> str:
    payload: dict[str, object] = {"aud": "authenticated", **claims}
    return jwt.encode(payload, key, algorithm="ES256")


def test_valid_token_returns_sub() -> None:
    uid = str(uuid.uuid4())
    assert auth._verify_token(_encode(_PRIVATE_KEY, sub=uid)) == uid


def test_forged_signature_rejected() -> None:
    # 공격자 키로 서명 → 서버 공개키 검증 실패해야 함.
    token = _encode(_ATTACKER_KEY, sub="victim")
    with pytest.raises(HTTPException) as exc:
        auth._verify_token(token)
    assert exc.value.status_code == 401


def test_missing_sub_rejected() -> None:
    with pytest.raises(HTTPException) as exc:
        auth._verify_token(_encode(_PRIVATE_KEY))
    assert exc.value.status_code == 401


def test_wrong_audience_rejected() -> None:
    token = jwt.encode(
        {"sub": "x", "aud": "not-authenticated"}, _PRIVATE_KEY, algorithm="ES256"
    )
    with pytest.raises(HTTPException) as exc:
        auth._verify_token(token)
    assert exc.value.status_code == 401


def test_expired_token_rejected() -> None:
    exp = datetime.now(timezone.utc) - timedelta(hours=1)
    token = _encode(_PRIVATE_KEY, sub="x", exp=exp)
    with pytest.raises(HTTPException) as exc:
        auth._verify_token(token)
    assert exc.value.status_code == 401


def test_hs256_confusion_rejected() -> None:
    # alg=HS256 으로 위조한 토큰은 ES256 만 허용하므로 거부돼야 함(알고리즘 혼동 방지).
    token = jwt.encode({"sub": "x", "aud": "authenticated"}, "secret", algorithm="HS256")
    with pytest.raises(HTTPException) as exc:
        auth._verify_token(token)
    assert exc.value.status_code == 401


def test_error_detail_does_not_leak_internals() -> None:
    token = _encode(_ATTACKER_KEY, sub="victim")
    with pytest.raises(HTTPException) as exc:
        auth._verify_token(token)
    assert exc.value.detail == "Invalid authentication token"
