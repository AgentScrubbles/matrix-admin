from fastapi import APIRouter, Request

from app.auth import get_current_session
from app.synapse_client import SynapseClient

router = APIRouter()


@router.get("/server/version")
async def server_version(request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.server_version()
