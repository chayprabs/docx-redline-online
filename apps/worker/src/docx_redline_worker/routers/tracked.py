import json

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..schemas import RedlineMutationResponse, TrackedChangesResponse
from ..services.tracked_changes import apply_redline_action, inspect_tracked_changes
from .convert import _read_docx

router = APIRouter(prefix="/v1", tags=["tracked"])


@router.post("/tracked", response_model=TrackedChangesResponse)
async def tracked(file: UploadFile = File(...)) -> TrackedChangesResponse:
    return inspect_tracked_changes(await _read_docx(file))


@router.post("/redline", response_model=RedlineMutationResponse)
async def redline(
    file: UploadFile = File(...),
    action: str = Form(...),
    change_ids: str | None = Form(default=None),
) -> RedlineMutationResponse:
    parsed_ids: list[str] | None = None
    if change_ids:
        try:
            payload = json.loads(change_ids)
        except json.JSONDecodeError as error:
            raise HTTPException(status_code=400, detail="change_ids must be a JSON array.") from error
        if not isinstance(payload, list) or not all(isinstance(item, str) for item in payload):
            raise HTTPException(status_code=400, detail="change_ids must be a JSON array of strings.")
        parsed_ids = payload

    try:
        return apply_redline_action(await _read_docx(file), action=action, change_ids=parsed_ids)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
