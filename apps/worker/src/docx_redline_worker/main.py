from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers.comments import router as comments_router
from .routers.compare import router as compare_router
from .routers.content_controls import router as content_controls_router
from .routers.convert import router as conversion_router
from .routers.document_elements import router as document_elements_router
from .routers.tracked import router as tracked_router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    summary="Server-side DOCX processing worker for redline workflows.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_origin_regex=settings.cors_allow_origin_regex,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(conversion_router)
app.include_router(comments_router)
app.include_router(tracked_router)
app.include_router(content_controls_router)
app.include_router(compare_router)
app.include_router(document_elements_router)


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
