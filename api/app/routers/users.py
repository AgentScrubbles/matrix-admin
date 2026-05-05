import logging
import secrets
import string
import re

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel

from app.auth import get_current_session
from app.config import settings
from app.synapse_client import SynapseClient

logger = logging.getLogger(__name__)
router = APIRouter()

LOCALPART_RE = re.compile(r"^[a-z0-9._=\-/]+$")


def _make_user_id(localpart: str) -> str:
    if localpart.startswith("@"):
        return localpart
    return f"@{localpart}:{settings.server_name}"


def _generate_password(length: int = 24) -> str:
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return "".join(secrets.choice(alphabet) for _ in range(length))


class CreateUserRequest(BaseModel):
    username: str
    password: str | None = None
    displayname: str | None = None
    admin: bool = False
    user_type: str | None = None
    avatar_url: str | None = None


class ResetPasswordRequest(BaseModel):
    new_password: str | None = None


@router.post("/avatar-upload")
async def upload_avatar(request: Request, file: UploadFile = File(...)):
    session = await get_current_session(request)

    allowed_types = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid image format. Use JPEG, PNG, GIF, or WebP.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    synapse = SynapseClient(session["access_token"])
    result = await synapse.upload_media(contents, file.content_type, file.filename)
    return {"mxc_uri": result["content_uri"]}


@router.get("/users")
async def list_users(
    request: Request,
    from_: int = Query(0, alias="from"),
    limit: int = Query(50, le=100),
    name: str | None = None,
    guests: bool = False,
    deactivated: bool = False,
):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.list_users(from_=from_, limit=limit, name=name, guests=guests, deactivated=deactivated)


@router.get("/users/{user_id:path}")
async def get_user(user_id: str, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.get_user(user_id)


@router.post("/users")
async def create_user(body: CreateUserRequest, request: Request):
    session = await get_current_session(request)

    if not LOCALPART_RE.match(body.username):
        raise HTTPException(status_code=400, detail="Invalid username format")

    user_id = _make_user_id(body.username)
    password = body.password or _generate_password()

    data = {
        "password": password,
        "displayname": body.displayname or body.username,
        "admin": body.admin,
    }
    if body.user_type is not None:
        data["user_type"] = body.user_type
    if body.avatar_url is not None:
        data["avatar_url"] = body.avatar_url

    synapse = SynapseClient(session["access_token"])
    result = await synapse.create_or_update_user(user_id, data)

    authentik_user = request.headers.get("X-Authentik-Username", "unknown")
    logger.info("User %s created by %s (authentik: %s)", user_id, session["user_id"], authentik_user)

    return {**result, "generated_password": password if not body.password else None}


@router.post("/users/{user_id:path}/reset-password")
async def reset_password(user_id: str, body: ResetPasswordRequest, request: Request):
    session = await get_current_session(request)
    new_password = body.new_password or _generate_password()

    synapse = SynapseClient(session["access_token"])
    await synapse.reset_password(user_id, new_password)

    authentik_user = request.headers.get("X-Authentik-Username", "unknown")
    logger.info("Password reset for %s by %s (authentik: %s)", user_id, session["user_id"], authentik_user)

    return {"user_id": user_id, "new_password": new_password}


@router.post("/users/{user_id:path}/deactivate")
async def deactivate_user(user_id: str, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    result = await synapse.deactivate_user(user_id)

    authentik_user = request.headers.get("X-Authentik-Username", "unknown")
    logger.info("User %s deactivated by %s (authentik: %s)", user_id, session["user_id"], authentik_user)

    return result


@router.get("/users/{user_id:path}/devices")
async def get_user_devices(user_id: str, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.get_user_devices(user_id)


@router.delete("/users/{user_id:path}/devices/{device_id}")
async def delete_user_device(user_id: str, device_id: str, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    await synapse.delete_user_device(user_id, device_id)

    authentik_user = request.headers.get("X-Authentik-Username", "unknown")
    logger.info("Device %s deleted for %s by %s (authentik: %s)", device_id, user_id, session["user_id"], authentik_user)

    return {"status": "ok"}


@router.get("/users/{user_id:path}/whois")
async def get_user_whois(user_id: str, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.get_user_whois(user_id)


@router.get("/users/{user_id:path}/media")
async def get_user_media(
    user_id: str,
    request: Request,
    from_: int = Query(0, alias="from"),
    limit: int = Query(50, le=100),
):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.get_user_media(user_id, from_=from_, limit=limit)
