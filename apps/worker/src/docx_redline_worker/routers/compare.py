from fastapi import APIRouter, File, UploadFile

from ..schemas import CompareResponse
from ..services.compare import compare_docx
from .convert import _read_docx

router = APIRouter(prefix="/v1", tags=["compare"])


@router.post("/compare", response_model=CompareResponse)
async def compare(
    original: UploadFile = File(...),
    revised: UploadFile = File(...),
) -> CompareResponse:
    original_bytes = await _read_docx(original)
    revised_bytes = await _read_docx(revised)
    return compare_docx(original_bytes, revised_bytes)
