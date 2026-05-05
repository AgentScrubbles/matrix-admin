import httpx
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class SynapseClient:
    def __init__(self, access_token: str):
        self._token = access_token
        self._base = settings.synapse_url
        self._headers = {"Authorization": f"Bearer {access_token}"}

    async def _request(
        self, method: str, path: str, **kwargs
    ) -> httpx.Response:
        async with httpx.AsyncClient() as client:
            resp = await client.request(
                method,
                f"{self._base}{path}",
                headers=self._headers,
                timeout=30.0,
                **kwargs,
            )
        if resp.status_code == 401:
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="Matrix token expired")
        return resp

    async def get(self, path: str, **kwargs) -> httpx.Response:
        return await self._request("GET", path, **kwargs)

    async def post(self, path: str, **kwargs) -> httpx.Response:
        return await self._request("POST", path, **kwargs)

    async def put(self, path: str, **kwargs) -> httpx.Response:
        return await self._request("PUT", path, **kwargs)

    async def delete(self, path: str, **kwargs) -> httpx.Response:
        return await self._request("DELETE", path, **kwargs)

    # --- Auth helpers ---

    async def whoami(self) -> dict:
        resp = await self.get("/_matrix/client/v3/account/whoami")
        resp.raise_for_status()
        return resp.json()

    async def is_server_admin(self, user_id: str) -> bool:
        resp = await self.get(f"/_synapse/admin/v2/users/{user_id}")
        if resp.status_code != 200:
            return False
        return resp.json().get("admin", False)

    # --- User management ---

    async def list_users(
        self, from_: int = 0, limit: int = 50, name: str | None = None,
        guests: bool = False, deactivated: bool = False,
    ) -> dict:
        params = {"from": from_, "limit": limit, "guests": str(guests).lower(), "deactivated": str(deactivated).lower()}
        if name:
            params["name"] = name
        resp = await self.get("/_synapse/admin/v2/users", params=params)
        resp.raise_for_status()
        return resp.json()

    async def get_user(self, user_id: str) -> dict:
        resp = await self.get(f"/_synapse/admin/v2/users/{user_id}")
        resp.raise_for_status()
        return resp.json()

    async def create_or_update_user(self, user_id: str, data: dict) -> dict:
        resp = await self.put(f"/_synapse/admin/v2/users/{user_id}", json=data)
        resp.raise_for_status()
        return resp.json()

    async def deactivate_user(self, user_id: str) -> dict:
        resp = await self.post(
            f"/_synapse/admin/v1/deactivate/{user_id}",
            json={"erase": False},
        )
        resp.raise_for_status()
        return resp.json()

    async def reset_password(self, user_id: str, new_password: str) -> dict:
        resp = await self.post(
            f"/_synapse/admin/v1/reset_password/{user_id}",
            json={"new_password": new_password, "logout_devices": True},
        )
        resp.raise_for_status()
        return resp.json()

    async def get_user_devices(self, user_id: str) -> dict:
        resp = await self.get(f"/_synapse/admin/v2/users/{user_id}/devices")
        resp.raise_for_status()
        return resp.json()

    async def delete_user_device(self, user_id: str, device_id: str) -> None:
        resp = await self.delete(
            f"/_synapse/admin/v2/users/{user_id}/devices/{device_id}"
        )
        resp.raise_for_status()

    async def get_user_whois(self, user_id: str) -> dict:
        resp = await self.get(f"/_synapse/admin/v1/whois/{user_id}")
        resp.raise_for_status()
        return resp.json()

    async def get_user_media(
        self, user_id: str, from_: int = 0, limit: int = 50
    ) -> dict:
        resp = await self.get(
            f"/_synapse/admin/v1/users/{user_id}/media",
            params={"from": from_, "limit": limit},
        )
        resp.raise_for_status()
        return resp.json()

    # --- Registration tokens ---

    async def list_registration_tokens(self, valid: bool | None = None) -> dict:
        params = {}
        if valid is not None:
            params["valid"] = str(valid).lower()
        resp = await self.get(
            "/_synapse/admin/v1/registration_tokens", params=params
        )
        resp.raise_for_status()
        return resp.json()

    async def create_registration_token(self, data: dict) -> dict:
        resp = await self.post(
            "/_synapse/admin/v1/registration_tokens/new", json=data
        )
        resp.raise_for_status()
        return resp.json()

    async def get_registration_token(self, token: str) -> dict:
        resp = await self.get(f"/_synapse/admin/v1/registration_tokens/{token}")
        resp.raise_for_status()
        return resp.json()

    async def delete_registration_token(self, token: str) -> None:
        resp = await self.delete(
            f"/_synapse/admin/v1/registration_tokens/{token}"
        )
        resp.raise_for_status()

    # --- Media ---

    async def get_server_media_statistics(self) -> dict:
        resp = await self.get(
            f"/_synapse/admin/v1/statistics/users/media"
        )
        resp.raise_for_status()
        return resp.json()

    async def delete_media_by_date(self, before_ts: int) -> dict:
        resp = await self.post(
            f"/_synapse/admin/v1/media/{settings.server_name}/delete",
            params={"before_ts": before_ts},
        )
        resp.raise_for_status()
        return resp.json()

    async def purge_remote_media(self, before_ts: int) -> dict:
        resp = await self.post(
            "/_synapse/admin/v1/purge_media_cache",
            params={"before_ts": before_ts},
        )
        resp.raise_for_status()
        return resp.json()

    # --- Rooms ---

    async def list_rooms(
        self, from_: int = 0, limit: int = 50, search_term: str | None = None,
        order_by: str = "name", direction: str = "f",
    ) -> dict:
        params = {"from": from_, "limit": limit, "order_by": order_by, "dir": direction}
        if search_term:
            params["search_term"] = search_term
        resp = await self.get("/_synapse/admin/v1/rooms", params=params)
        resp.raise_for_status()
        return resp.json()

    async def get_room(self, room_id: str) -> dict:
        resp = await self.get(f"/_synapse/admin/v1/rooms/{room_id}")
        resp.raise_for_status()
        return resp.json()

    async def get_room_members(self, room_id: str) -> dict:
        resp = await self.get(f"/_synapse/admin/v1/rooms/{room_id}/members")
        resp.raise_for_status()
        return resp.json()

    async def delete_room(self, room_id: str, purge: bool = True) -> dict:
        resp = await self.delete(
            f"/_synapse/admin/v2/rooms/{room_id}",
            json={"purge": purge},
        )
        resp.raise_for_status()
        return resp.json()

    async def upload_media(self, file_bytes: bytes, content_type: str, filename: str | None = None) -> dict:
        params = {}
        if filename:
            params["filename"] = filename
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self._base}/_matrix/media/v3/upload",
                headers={**self._headers, "Content-Type": content_type},
                params=params,
                content=file_bytes,
                timeout=60.0,
            )
        if resp.status_code == 401:
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="Matrix token expired")
        resp.raise_for_status()
        return resp.json()

    # --- Server ---

    async def server_version(self) -> dict:
        resp = await self.get("/_synapse/admin/v1/server_version")
        resp.raise_for_status()
        return resp.json()
