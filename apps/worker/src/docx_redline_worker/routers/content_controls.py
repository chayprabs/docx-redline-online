from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..schemas import ContentControlsResponse, ReplaceResponse
from ..services.content_controls import (
    list_content_controls,
    parse_replacements,
    replace_content_controls,
)
from .convert import _read_docx

router = APIRouter(prefix="/v1", tags=["content-controls"])


@router.post("/controls", response_model=ContentControlsResponse)
async def controls(file: UploadFile = File(...)) -> ContentControlsResponse:
    return list_content_controls(await _read_docx(file))


@router.post("/replace", response_model=ReplaceResponse)
async def replace(
    file: UploadFile = File(...),
    replacements: str = Form(...),
) -> ReplaceResponse:
    try:
        parsed_replacements = parse_replacements(replacements)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return replace_content_controls(await _read_docx(file), parsed_replacements)
