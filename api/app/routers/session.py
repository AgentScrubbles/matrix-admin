import logging

import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from app.auth import create_session_cookie, get_current_session
from app.config import settings
from app.synapse_client import SynapseClient

logger = logging.getLogger(__name__)
router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(body: LoginRequest, response: Response):
    user_id = f"@{body.username}:{settings.server_name}"

    # Authenticate against Synapse
    async with httpx.AsyncClient() as client:
        login_resp = await client.post(
            f"{settings.synapse_url}/_matrix/client/r0/login",
            json={
                "type": "m.login.password",
                "identifier": {"type": "m.id.user", "user": body.username},
                "password": body.password,
            },
            timeout=15.0,
        )

    if login_resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    login_data = login_resp.json()
    access_token = login_data["access_token"]

    # Verify user is a server admin
    synapse = SynapseClient(access_token)
    if not await synapse.is_server_admin(user_id):
        raise HTTPException(status_code=403, detail="User is not a server admin")

    cookie_value = create_session_cookie(access_token, user_id)
    response.set_cookie(
        key="matrix_session",
        value=cookie_value,
        httponly=True,
        secure=True,
        samesite="strict",
        domain=settings.cookie_domain,
        max_age=settings.session_max_age,
        path="/",
    )

    logger.info("User %s logged in successfully", user_id)
    return {"user_id": user_id, "display_name": login_data.get("display_name", "")}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="matrix_session",
        domain=settings.cookie_domain,
        path="/",
    )
    return {"status": "ok"}


@router.get("/whoami")
async def whoami(request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    data = await synapse.whoami()
    return {
        "user_id": session["user_id"],
        "matrix_user_id": data.get("user_id"),
    }
