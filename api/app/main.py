import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import session, users, tokens, media, rooms, server

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app = FastAPI(title="Matrix Admin API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://admin.halflings.chat"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router, prefix="/api/v1", tags=["session"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(tokens.router, prefix="/api/v1", tags=["tokens"])
app.include_router(media.router, prefix="/api/v1", tags=["media"])
app.include_router(rooms.router, prefix="/api/v1", tags=["rooms"])
app.include_router(server.router, prefix="/api/v1", tags=["server"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
