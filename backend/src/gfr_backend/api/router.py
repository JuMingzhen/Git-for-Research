from fastapi import APIRouter

from gfr_backend.api.routes import health

api_router = APIRouter()
api_router.include_router(health.router)
