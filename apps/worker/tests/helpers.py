import base64
from pathlib import Path

from docx import Document
from docx.shared import Inches

PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9l9XwAAAAASUVORK5CYII="
)


def create_conversion_fixture(target: Path) -> Path:
    image_path = target.with_suffix(".png")
    image_path.write_bytes(PNG_BYTES)

    document = Document()
    document.add_heading("DocxRedline Fixture", level=1)

    paragraph = document.add_paragraph()
    paragraph.add_run("This paragraph keeps ")
    paragraph.add_run("bold").bold = True
    paragraph.add_run(" and ")
    paragraph.add_run("italic").italic = True
    paragraph.add_run(" formatting.")

    document.add_paragraph("First bullet", style="List Bullet")
    document.add_paragraph("Second bullet", style="List Bullet")
    document.add_picture(str(image_path), width=Inches(1.0))

    document.save(target)
    return target
