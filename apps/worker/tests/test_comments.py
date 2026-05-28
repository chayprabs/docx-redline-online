from pathlib import Path

from fastapi.testclient import TestClient

from docx_redline_worker.main import app

from .helpers import create_comments_fixture


def test_comments_endpoint_extracts_threads_and_markdown(tmp_path: Path) -> None:
    docx_path = create_comments_fixture(tmp_path / "comments.docx")
    client = TestClient(app)

    with docx_path.open("rb") as document_file:
        response = client.post(
            "/v1/comments",
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
    assert len(payload["comments"]) == 1
    top_level = payload["comments"][0]
    assert top_level["author"] == "Ada"
    assert top_level["resolved"] is True
    assert top_level["quoted_text"] == "comment"
    assert len(top_level["replies"]) == 1
    assert top_level["replies"][0]["author"] == "Ben"
    assert payload["markdown"]
