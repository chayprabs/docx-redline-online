import base64
import io
import zipfile
from pathlib import Path

from fastapi.testclient import TestClient
from lxml import etree

from docx_redline_worker.main import app

from .helpers import create_content_controls_fixture


def _xml_from_replace_response(payload: dict) -> etree._Element:
    docx_bytes = base64.b64decode(payload["docx_base64"])
    archive = zipfile.ZipFile(io.BytesIO(docx_bytes))
    return etree.fromstring(archive.read("word/document.xml"))


def test_controls_endpoint_lists_structured_document_tags(tmp_path: Path) -> None:
    docx_path = create_content_controls_fixture(tmp_path / "controls.docx")
    client = TestClient(app)

    with docx_path.open("rb") as document_file:
        response = client.post(
            "/v1/controls",
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
    assert payload["controls"][0]["title"] == "Client Name"
    assert payload["controls"][0]["tag"] == "client_name"
    assert payload["controls"][0]["text"] == "Acme Corp"


def test_replace_endpoint_updates_content_control_text(tmp_path: Path) -> None:
    docx_path = create_content_controls_fixture(tmp_path / "controls.docx")
    client = TestClient(app)

    with docx_path.open("rb") as document_file:
        response = client.post(
            "/v1/replace",
            files={
                "file": (
                    docx_path.name,
                    document_file,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
            data={"replacements": "{\"client_name\":\"Globex\"}"},
        )

    assert response.status_code == 200
    root = _xml_from_replace_response(response.json())
    texts = root.xpath("//w:sdtContent//w:t/text()", namespaces={"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"})
    assert texts == ["Globex"]
