import base64
import io
import mimetypes
import re
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path

import mammoth

from ..schemas import ConversionMessage, ExtractedImage, HtmlConversionResponse, MarkdownConversionResponse


def _normalise_messages(messages: list[object]) -> list[ConversionMessage]:
    normalised: list[ConversionMessage] = []

    for message in messages:
        message_type = getattr(message, "type", "info")
        message_value = getattr(message, "message", str(message))
        normalised.append(ConversionMessage(type=message_type, message=message_value))

    return normalised


def extract_images(docx_bytes: bytes) -> list[ExtractedImage]:
    images: list[ExtractedImage] = []

    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as archive:
        for member in archive.namelist():
            if not member.startswith("word/media/"):
                continue

            data = archive.read(member)
            file_name = Path(member).name
            content_type = mimetypes.guess_type(file_name)[0] or "application/octet-stream"
            images.append(
                ExtractedImage(
                    name=file_name,
                    content_type=content_type,
                    size_bytes=len(data),
                    data_base64=base64.b64encode(data).decode("ascii"),
                )
            )

    return images


def _normalize_html_lists(value: str) -> str:
    value = re.sub(r"<(ul|ol)>", r'<\1 data-docxredline-normalized="true">', value)
    value = re.sub(r"<li>\s+", "<li>", value)
    value = re.sub(r"\s+</li>", "</li>", value)
    return value


def _normalize_markdown_lists(value: str) -> str:
    value = re.sub(r"(?m)^\s*[*+]\s+", "- ", value)
    return value


def convert_docx_to_html(
    docx_bytes: bytes,
    style_map: str | None = None,
    normalize_lists: bool = False,
) -> HtmlConversionResponse:
    with io.BytesIO(docx_bytes) as source:
        result = mammoth.convert_to_html(source, style_map=style_map)

    html = _normalize_html_lists(result.value) if normalize_lists else result.value

    return HtmlConversionResponse(
        html=html,
        images=extract_images(docx_bytes),
        messages=_normalise_messages(result.messages),
    )


def _run_pandoc(docx_bytes: bytes) -> str | None:
    if shutil.which("pandoc") is None:
        return None

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        input_path = tmp_path / "input.docx"
        input_path.write_bytes(docx_bytes)

        completed = subprocess.run(
            ["pandoc", str(input_path), "--to", "gfm"],
            check=False,
            capture_output=True,
            text=True,
        )
        if completed.returncode != 0:
            return None

        return completed.stdout


def convert_docx_to_markdown(
    docx_bytes: bytes,
    style_map: str | None = None,
    normalize_lists: bool = False,
) -> MarkdownConversionResponse:
    try:
        with io.BytesIO(docx_bytes) as source:
            result = mammoth.convert_to_markdown(source, style_map=style_map)
        messages = _normalise_messages(result.messages)
        markdown = result.value
    except Exception as error:
        fallback = _run_pandoc(docx_bytes)
        if fallback is None:
            raise RuntimeError("Markdown conversion failed and pandoc fallback was unavailable.") from error

        markdown = fallback
        messages = [
            ConversionMessage(
                type="warning",
                message="Mammoth markdown conversion failed; pandoc fallback used.",
            )
        ]

    if normalize_lists:
        markdown = _normalize_markdown_lists(markdown)

    return MarkdownConversionResponse(
        markdown=markdown,
        images=extract_images(docx_bytes),
        messages=messages,
    )
