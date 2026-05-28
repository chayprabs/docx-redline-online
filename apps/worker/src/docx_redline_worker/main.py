from fastapi import FastAPI

from .config import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    summary="Server-side DOCX processing worker for redline workflows.",
)


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
