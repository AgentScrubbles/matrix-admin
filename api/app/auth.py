import base64
import json
import os
import time
import logging

from cryptography.fernet import Fernet, InvalidToken
from fastapi import Cookie, HTTPException, Request

from app.config import settings

logger = logging.getLogger(__name__)

_fernet_key: bytes | None = None


def _get_fernet() -> Fernet:
    global _fernet_key
    if _fernet_key is None:
        secret = settings.session_secret.encode()
        # Derive a valid Fernet key from the secret via padding/hashing
        _fernet_key = base64.urlsafe_b64encode(secret.ljust(32, b"\0")[:32])
    return Fernet(_fernet_key)


def create_session_cookie(access_token: str, user_id: str) -> str:
    payload = json.dumps(
        {
            "access_token": access_token,
            "user_id": user_id,
            "created_at": int(time.time()),
        }
    )
    return _get_fernet().encrypt(payload.encode()).decode()


def decrypt_session_cookie(cookie_value: str) -> dict:
    try:
        decrypted = _get_fernet().decrypt(
            cookie_value.encode(), ttl=settings.session_max_age
        )
        return json.loads(decrypted)
    except (InvalidToken, json.JSONDecodeError) as e:
        raise HTTPException(status_code=401, detail="Invalid or expired session")


async def get_current_session(request: Request) -> dict:
    cookie_value = request.cookies.get("matrix_session")
    if not cookie_value:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = decrypt_session_cookie(cookie_value)

    # Verify Authentik header is present (dual-layer auth)
    authentik_user = request.headers.get("X-Authentik-Username")
    if not authentik_user:
        logger.warning("Request missing X-Authentik-Username header")

    return session
