from fastapi import APIRouter, File, UploadFile

from ..schemas import CommentsResponse
from ..services.comments import extract_comments
from .convert import _read_docx

router = APIRouter(prefix="/v1", tags=["comments"])


@router.post("/comments", response_model=CommentsResponse)
async def comments(file: UploadFile = File(...)) -> CommentsResponse:
    return extract_comments(await _read_docx(file))
