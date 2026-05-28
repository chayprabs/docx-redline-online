from fastapi import APIRouter, File, UploadFile

from ..schemas import DocumentElementsResponse
from ..services.document_elements import inspect_document_elements
from .convert import _read_docx

router = APIRouter(prefix="/v1", tags=["document-elements"])


@router.post("/elements", response_model=DocumentElementsResponse)
async def elements(file: UploadFile = File(...)) -> DocumentElementsResponse:
    return inspect_document_elements(await _read_docx(file))
