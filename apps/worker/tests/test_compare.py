import base64
import io
import zipfile
from pathlib import Path

from fastapi.testclient import TestClient

from docx_redline_worker.main import app
from docx_redline_worker.services.compare import compare_docx
from docx_redline_worker.services.sample_documents import get_sample_bytes

from .helpers import create_compare_fixtures


def test_compare_endpoint_returns_redline_and_side_by_side_html(tmp_path: Path) -> None:
    original_path, revised_path = create_compare_fixtures(
        tmp_path / "original.docx",
        tmp_path / "revised.docx",
    )
    client = TestClient(app)

    with original_path.open("rb") as original_file, revised_path.open("rb") as revised_file:
        response = client.post(
            "/v1/compare",
            files={
                "original": (
                    original_path.name,
                    original_file,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ),
                "revised": (
                    revised_path.name,
                    revised_file,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ),
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["changes"]
    assert len(payload["panes"]) == 2
    assert "docxredline-diff" in payload["html_diff"]

    redline_bytes = base64.b64decode(payload["redline_docx_base64"])
    archive = zipfile.ZipFile(io.BytesIO(redline_bytes))
    document_xml = archive.read("word/document.xml").decode("utf-8")
    assert "<w:ins" in document_xml
    assert "<w:del" in document_xml
    assert "Alpha" in document_xml


def test_compare_normalizes_insert_boundary_for_inserted_followup_paragraph() -> None:
    original_bytes, _ = get_sample_bytes("contract-redline", "original")
    revised_bytes, _ = get_sample_bytes("contract-redline", "revised")

    response = compare_docx(original_bytes, revised_bytes)
    change_texts = [change.text for change in response.changes]

    assert ". Confidentiality obligations survive termination" in change_texts
