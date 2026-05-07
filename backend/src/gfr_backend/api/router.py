from fastapi import APIRouter

from gfr_backend.api.routes import health, lines, meetings, nodes, projects, qa

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(projects.router)
api_router.include_router(lines.router)
api_router.include_router(nodes.router)
api_router.include_router(meetings.router)
api_router.include_router(meetings.task_router)
api_router.include_router(qa.router)
