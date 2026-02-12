import logging

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.auth import get_current_session
from app.synapse_client import SynapseClient

logger = logging.getLogger(__name__)
router = APIRouter()


class CreateTokenRequest(BaseModel):
    uses_allowed: int | None = None
    expiry_time: int | None = None
    length: int = 16


@router.get("/registration-tokens")
async def list_tokens(request: Request, valid: bool | None = None):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.list_registration_tokens(valid=valid)


@router.post("/registration-tokens")
async def create_token(body: CreateTokenRequest, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    data: dict = {"length": body.length}
    if body.uses_allowed is not None:
        data["uses_allowed"] = body.uses_allowed
    if body.expiry_time is not None:
        data["expiry_time"] = body.expiry_time
    result = await synapse.create_registration_token(data)

    authentik_user = request.headers.get("X-Authentik-Username", "unknown")
    logger.info("Registration token created by %s (authentik: %s)", session["user_id"], authentik_user)

    return result


@router.get("/registration-tokens/{token}")
async def get_token(token: str, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.get_registration_token(token)


@router.delete("/registration-tokens/{token}")
async def delete_token(token: str, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    await synapse.delete_registration_token(token)

    authentik_user = request.headers.get("X-Authentik-Username", "unknown")
    logger.info("Registration token deleted by %s (authentik: %s)", session["user_id"], authentik_user)

    return {"status": "ok"}


@router.post("/registration-tokens/invalidate-all")
async def invalidate_all_tokens(request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    tokens_resp = await synapse.list_registration_tokens(valid=True)
    tokens = tokens_resp.get("registration_tokens", [])
    deleted = 0
    for t in tokens:
        await synapse.delete_registration_token(t["token"])
        deleted += 1

    authentik_user = request.headers.get("X-Authentik-Username", "unknown")
    logger.info("All %d valid registration tokens invalidated by %s (authentik: %s)", deleted, session["user_id"], authentik_user)

    return {"deleted": deleted}
