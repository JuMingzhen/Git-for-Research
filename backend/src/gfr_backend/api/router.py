from fastapi import APIRouter

from gfr_backend.api.routes import branches, health, meetings, projects, qa, updates

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(projects.router)
api_router.include_router(branches.router)
api_router.include_router(updates.router)
api_router.include_router(meetings.router)
api_router.include_router(qa.router)
