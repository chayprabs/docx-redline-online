import base64
import io
import zipfile

from fastapi.testclient import TestClient

from docx_redline_worker.main import app
from docx_redline_worker.services.sample_documents import get_sample_bytes

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def test_acceptance_a1_contract_redline_matches_structural_baseline() -> None:
    client = TestClient(app)
    original_bytes, original_name = get_sample_bytes("contract-redline", "original")
    revised_bytes, revised_name = get_sample_bytes("contract-redline", "revised")

    response = client.post(
        "/v1/compare",
        files={
            "original": (original_name, io.BytesIO(original_bytes), DOCX_MIME),
            "revised": (revised_name, io.BytesIO(revised_bytes), DOCX_MIME),
        },
    )

    assert response.status_code == 200
    payload = response.json()
    texts = [change["text"] for change in payload["changes"]]
    assert "thirty" in texts
    assert "fifteen" in texts
    assert "ten business days of" in texts
    assert "Confidentiality obligations survive termination." in texts
    assert "unchanged paragraphs omitted" in payload["html_diff"]

    redline_bytes = base64.b64decode(payload["redline_docx_base64"])
    document_xml = zipfile.ZipFile(io.BytesIO(redline_bytes)).read("word/document.xml").decode("utf-8")
    assert "<w:ins" in document_xml
    assert "<w:del" in document_xml
    assert "Confidentiality obligations survive termination." in document_xml


def test_acceptance_a2_conversion_preserves_formatting() -> None:
    client = TestClient(app)
    document_bytes, document_name = get_sample_bytes("generic-images")

    html_response = client.post(
        "/v1/to-html",
        files={"file": (document_name, io.BytesIO(document_bytes), DOCX_MIME)},
    )
    markdown_response = client.post(
        "/v1/to-markdown",
        files={"file": (document_name, io.BytesIO(document_bytes), DOCX_MIME)},
    )

    assert html_response.status_code == 200
    assert markdown_response.status_code == 200

    html_payload = html_response.json()
    markdown_payload = markdown_response.json()

    assert "<h1>Illustrated Brief</h1>" in html_payload["html"]
    assert "<strong>bold</strong>" in html_payload["html"]
    assert "<em>italic</em>" in html_payload["html"]
    assert "First bullet" in markdown_payload["markdown"]
    assert "Second bullet" in markdown_payload["markdown"]
    assert len(html_payload["images"]) == 1
    assert len(markdown_payload["images"]) == 1


def test_acceptance_a3_comments_extract_correctly() -> None:
    client = TestClient(app)
    document_bytes, document_name = get_sample_bytes("manuscript-comments")

    response = client.post(
        "/v1/comments",
        files={"file": (document_name, io.BytesIO(document_bytes), DOCX_MIME)},
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["comments"]) == 1
    comment = payload["comments"][0]
    assert comment["author"] == "Ada"
    assert comment["text"] == "Top-level note"
    assert comment["quoted_text"] == "comment"
    assert comment["resolved"] is True
    assert len(comment["replies"]) == 1
    assert comment["replies"][0]["author"] == "Ben"
    assert comment["replies"][0]["text"] == "Reply note"
    assert "Top-level note" in payload["markdown"]
    assert "Reply note" in payload["markdown"]
