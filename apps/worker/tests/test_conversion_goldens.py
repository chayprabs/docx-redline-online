from pathlib import Path

from docx_redline_worker.services.conversion import convert_docx_to_html, convert_docx_to_markdown
from docx_redline_worker.services.sample_documents import get_sample_bytes


STYLE_MAP = "p[style-name='Heading 1'] => h1:fresh"
GOLDEN_DIR = Path(__file__).resolve().parent / "golden"


def _read_golden(name: str) -> str:
    return (GOLDEN_DIR / name).read_text(encoding="utf-8")


def test_conversion_goldens_match_shipped_samples() -> None:
    for sample_id in ("contract-redline", "manuscript-comments", "generic-images"):
        sample_bytes, _ = get_sample_bytes(sample_id)

        html_result = convert_docx_to_html(
            sample_bytes,
            style_map=STYLE_MAP,
            normalize_lists=True,
        )
        markdown_result = convert_docx_to_markdown(
            sample_bytes,
            style_map=STYLE_MAP,
            normalize_lists=True,
        )

        assert html_result.html.strip() == _read_golden(f"{sample_id}.html").strip()
        assert markdown_result.markdown.strip() == _read_golden(f"{sample_id}.md").strip()
