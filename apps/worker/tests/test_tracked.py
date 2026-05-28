import base64
import io
import zipfile
from pathlib import Path

from fastapi.testclient import TestClient
from lxml import etree

from docx_redline_worker.main import app

from .helpers import create_tracked_changes_fixture


def _document_xml_from_response(payload: dict) -> etree._Element:
    docx_bytes = base64.b64decode(payload["docx_base64"])
    archive = zipfile.ZipFile(io.BytesIO(docx_bytes))
    return etree.fromstring(archive.read("word/document.xml"))


def test_tracked_endpoint_lists_insert_delete_format_and_move(tmp_path: Path) -> None:
    docx_path = create_tracked_changes_fixture(tmp_path / "tracked.docx")
    client = TestClient(app)

    with docx_path.open("rb") as document_file:
        response = client.post(
            "/v1/tracked",
            files={
                "file": (
                    docx_path.name,
                    document_file,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert [change["kind"] for change in payload["changes"]] == ["del", "ins", "move", "move", "fmt"]


def test_redline_accept_all_applies_bulk_resolution(tmp_path: Path) -> None:
    docx_path = create_tracked_changes_fixture(tmp_path / "tracked.docx")
    client = TestClient(app)

    with docx_path.open("rb") as document_file:
        response = client.post(
            "/v1/redline",
            files={
                "file": (
                    docx_path.name,
                    document_file,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
            data={"action": "accept"},
        )

    assert response.status_code == 200
    root = _document_xml_from_response(response.json())
    xml = etree.tostring(root, encoding="unicode")
    assert "Keep newhere tail" in "".join(root.xpath("//w:body//w:t/text()", namespaces={"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}))
    assert "<w:del" not in xml
    assert "<w:ins" not in xml
    assert "<w:moveFrom" not in xml
    assert "<w:moveTo" not in xml
    assert "<w:pPrChange" not in xml


def test_redline_reject_single_change_restores_deleted_text(tmp_path: Path) -> None:
    docx_path = create_tracked_changes_fixture(tmp_path / "tracked.docx")
    client = TestClient(app)

    with docx_path.open("rb") as document_file:
        tracked = client.post(
            "/v1/tracked",
            files={
                "file": (
                    docx_path.name,
                    document_file,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
        ).json()

    deletion_id = next(change["id"] for change in tracked["changes"] if change["kind"] == "del")
    with docx_path.open("rb") as document_file:
        response = client.post(
            "/v1/redline",
            files={
                "file": (
                    docx_path.name,
                    document_file,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
            data={"action": "reject", "change_ids": f"[\"{deletion_id}\"]"},
        )

    assert response.status_code == 200
    root = _document_xml_from_response(response.json())
    text = "".join(root.xpath("//w:body//w:t/text()", namespaces={"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}))
    assert "old" in text
