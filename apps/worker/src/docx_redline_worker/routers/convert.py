from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile

from ..config import settings
from ..schemas import HtmlConversionResponse, MarkdownConversionResponse, SampleCatalogResponse, SampleDocument
from ..services.conversion import convert_docx_to_html, convert_docx_to_markdown
from ..services.sample_documents import get_sample_bytes

router = APIRouter(prefix="/v1", tags=["conversion"])

SAMPLES = [
    SampleDocument(
        id="contract-redline",
        title="Contract Draft",
        description="Two legal drafts with tracked edits and formatting changes for compare mode.",
        recommended_mode="compare",
    ),
    SampleDocument(
        id="manuscript-comments",
        title="Manuscript Review",
        description="A manuscript fixture with comments, replies, and resolved discussion states.",
        recommended_mode="extract",
    ),
    SampleDocument(
        id="generic-images",
        title="Illustrated Brief",
        description="A DOCX fixture with headings, lists, and embedded images for conversion output.",
        recommended_mode="extract",
    ),
]


@router.get("/samples", response_model=SampleCatalogResponse)
async def list_samples() -> SampleCatalogResponse:
    return SampleCatalogResponse(samples=SAMPLES)


@router.get("/samples/{sample_id}")
async def download_sample(sample_id: str, variant: str | None = None) -> Response:
    try:
        sample_bytes, filename = get_sample_bytes(sample_id, variant=variant)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return Response(
        content=sample_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _read_docx(file: UploadFile) -> bytes:
    if not file.filename or not file.filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx uploads are supported.")

    contents = await file.read()
    await file.close()

    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file was empty.")

    max_upload_bytes = settings.max_upload_mb * 1024 * 1024
    if len(contents) > max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Upload exceeded the {settings.max_upload_mb} MB limit.",
        )

    return contents


@router.post("/to-html", response_model=HtmlConversionResponse)
async def to_html(
    file: UploadFile = File(...),
    style_map: str | None = Form(default=None),
    normalize_lists: bool = Form(default=False),
) -> HtmlConversionResponse:
    return convert_docx_to_html(
        await _read_docx(file),
        style_map=style_map,
        normalize_lists=normalize_lists,
    )


@router.post("/to-markdown", response_model=MarkdownConversionResponse)
async def to_markdown(
    file: UploadFile = File(...),
    style_map: str | None = Form(default=None),
    normalize_lists: bool = Form(default=False),
) -> MarkdownConversionResponse:
    return convert_docx_to_markdown(
        await _read_docx(file),
        style_map=style_map,
        normalize_lists=normalize_lists,
    )
