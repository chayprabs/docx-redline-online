from fastapi import FastAPI

from .config import settings
from .routers.comments import router as comments_router
from .routers.content_controls import router as content_controls_router
from .routers.convert import router as conversion_router
from .routers.tracked import router as tracked_router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    summary="Server-side DOCX processing worker for redline workflows.",
)
app.include_router(conversion_router)
app.include_router(comments_router)
app.include_router(tracked_router)
app.include_router(content_controls_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/meta")
async def meta() -> dict[str, int | str]:
    return {
        "name": settings.app_name,
        "artifactTtlSeconds": settings.artifact_ttl_seconds,
        "maxUploadMb": settings.max_upload_mb,
    }
