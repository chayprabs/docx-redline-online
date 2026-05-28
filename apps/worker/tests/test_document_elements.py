from pathlib import Path

from fastapi.testclient import TestClient

from docx_redline_worker.main import app

from .helpers import create_document_elements_fixture


def test_elements_endpoint_extracts_headers_footers_notes_and_embeddings(tmp_path: Path) -> None:
    docx_path = create_document_elements_fixture(tmp_path / "elements.docx")
    client = TestClient(app)

    with docx_path.open("rb") as document_file:
        response = client.post(
            "/v1/elements",
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
    assert payload["headers"][0]["text"] == "Header text"
    assert payload["footers"][0]["text"] == "Footer text"
    assert payload["footnotes"][0]["text"] == "Footnote text"
    assert payload["endnotes"][0]["text"] == "Endnote text"
    assert payload["embedded_objects"][0]["name"] == "sample.bin"
