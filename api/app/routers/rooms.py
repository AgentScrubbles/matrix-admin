import logging

from fastapi import APIRouter, Query, Request

from app.auth import get_current_session
from app.synapse_client import SynapseClient

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/rooms")
async def list_rooms(
    request: Request,
    from_: int = Query(0, alias="from"),
    limit: int = Query(50, le=100),
    search_term: str | None = None,
    order_by: str = "name",
    direction: str = "f",
):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.list_rooms(
        from_=from_, limit=limit, search_term=search_term,
        order_by=order_by, direction=direction,
    )


@router.get("/rooms/{room_id:path}/details")
async def get_room(room_id: str, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.get_room(room_id)


@router.get("/rooms/{room_id:path}/members")
async def get_room_members(room_id: str, request: Request):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    return await synapse.get_room_members(room_id)


@router.delete("/rooms/{room_id:path}")
async def delete_room(room_id: str, request: Request, purge: bool = True):
    session = await get_current_session(request)
    synapse = SynapseClient(session["access_token"])
    result = await synapse.delete_room(room_id, purge=purge)

    authentik_user = request.headers.get("X-Authentik-Username", "unknown")
    logger.info("Room %s deleted by %s (authentik: %s)", room_id, session["user_id"], authentik_user)

    return result
