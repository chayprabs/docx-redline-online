from pathlib import Path

from fastapi.testclient import TestClient

from docx_redline_worker.main import app

from .helpers import create_conversion_fixture


def test_samples_endpoint_lists_expected_fixtures() -> None:
    client = TestClient(app)

    response = client.get("/v1/samples")

    assert response.status_code == 200
    payload = response.json()
    assert [sample["id"] for sample in payload["samples"]] == [
        "contract-redline",
        "manuscript-comments",
        "generic-images",
    ]


def test_html_conversion_embeds_document_structure(tmp_path: Path) -> None:
    docx_path = create_conversion_fixture(tmp_path / "fixture.docx")
    client = TestClient(app)

    with docx_path.open("rb") as document_file:
        response = client.post(
            "/v1/to-html",
            files={"file": (docx_path.name, document_file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )

    assert response.status_code == 200
    payload = response.json()
    assert "<h1>DocxRedline Fixture</h1>" in payload["html"]
    assert "<strong>bold</strong>" in payload["html"]
    assert "<em>italic</em>" in payload["html"]
    assert len(payload["images"]) == 1


def test_markdown_conversion_preserves_basic_formatting(tmp_path: Path) -> None:
    docx_path = create_conversion_fixture(tmp_path / "fixture.docx")
    client = TestClient(app)

    with docx_path.open("rb") as document_file:
        response = client.post(
            "/v1/to-markdown",
            files={"file": (docx_path.name, document_file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )

    assert response.status_code == 200
    payload = response.json()
    assert "DocxRedline Fixture" in payload["markdown"]
    assert "bold" in payload["markdown"]
    assert "italic" in payload["markdown"]
    assert "First bullet" in payload["markdown"]
    assert len(payload["images"]) == 1


def test_html_conversion_can_normalize_lists(tmp_path: Path) -> None:
    docx_path = create_conversion_fixture(tmp_path / "fixture.docx")
    client = TestClient(app)

    with docx_path.open("rb") as document_file:
        response = client.post(
            "/v1/to-html",
            files={"file": (docx_path.name, document_file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"normalize_lists": "true"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert 'data-docxredline-normalized="true"' in payload["html"]
