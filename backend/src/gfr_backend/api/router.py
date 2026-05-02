from fastapi import APIRouter

from gfr_backend.api.routes import branches, health, projects

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(projects.router)
api_router.include_router(branches.router)
