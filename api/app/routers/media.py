import logging

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.auth import get_current_session
from app.synapse_client import SynapseClient

logger = logging.getLogger(__name__)
router = APIRouter()


class DeleteOldMediaRequest(BaseModel):
    before_ts: int  # Unix timestamp in milliseconds


class PurgeRemoteMediaRequest(BaseModel):
    before_ts: int


@router.get("/media/statistics")
async def media_statistics(request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.get_server_media_statistics()


@router.post("/media/delete-old")
async def delete_old_media(body: DeleteOldMediaRequest, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    result = await synapse.delete_media_by_date(body.before_ts)

    authentik_user = request.headers.get("X-Authentik-Username", "unknown")
    logger.info("Old media deleted (before_ts=%d) by %s (authentik: %s)", body.before_ts, session["user_id"], authentik_user)

    return result


@router.post("/media/purge-remote")
async def purge_remote_media(body: PurgeRemoteMediaRequest, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    result = await synapse.purge_remote_media(body.before_ts)

    authentik_user = request.headers.get("X-Authentik-Username", "unknown")
    logger.info("Remote media purged (before_ts=%d) by %s (authentik: %s)", body.before_ts, session["user_id"], authentik_user)

    return result
