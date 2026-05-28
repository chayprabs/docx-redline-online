import base64
import copy
import html
import io
import zipfile
from dataclasses import dataclass
from difflib import SequenceMatcher

from lxml import etree

from ..schemas import CompareResponse, HtmlDiffPane, TrackedChangeRecord

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}


@dataclass
class ParagraphDiff:
    before: str
    after: str
    ops: list[tuple[str, str]]


def _read_archive(docx_bytes: bytes) -> tuple[dict[str, bytes], etree._Element]:
    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as archive:
        files = {name: archive.read(name) for name in archive.namelist()}
    return files, etree.fromstring(files["word/document.xml"])


def _paragraphs(root: etree._Element) -> list[etree._Element]:
    return root.xpath("//w:body/w:p", namespaces=NS)


def _paragraph_text(paragraph: etree._Element) -> str:
    chunks = [node.text or "" for node in paragraph.iterfind(f".//{{{NS['w']}}}t")]
    chunks.extend(node.text or "" for node in paragraph.iterfind(f".//{{{NS['w']}}}delText"))
    return "".join(chunks).strip()


def _tokenise(text: str) -> list[str]:
    if not text:
        return []
    return text.split()


def _diff_text(before: str, after: str) -> list[tuple[str, str]]:
    if before == after:
        return [("equal", before)] if before else []

    before_tokens = _tokenise(before)
    after_tokens = _tokenise(after)
    matcher = SequenceMatcher(a=before_tokens, b=after_tokens)
    ops: list[tuple[str, str]] = []

    for opcode, i1, i2, j1, j2 in matcher.get_opcodes():
        if opcode == "equal":
            value = " ".join(before_tokens[i1:i2])
        elif opcode == "delete":
            value = " ".join(before_tokens[i1:i2])
        elif opcode == "insert":
            value = " ".join(after_tokens[j1:j2])
        else:
            deleted = " ".join(before_tokens[i1:i2])
            inserted = " ".join(after_tokens[j1:j2])
            if deleted:
                ops.append(("delete", deleted))
            if inserted:
                ops.append(("insert", inserted))
            continue

        if value:
            ops.append((opcode, value))

    return ops


def _replace_paragraph_content(paragraph: etree._Element, ops: list[tuple[str, str]]) -> None:
    for child in list(paragraph):
        paragraph.remove(child)

    for index, (opcode, value) in enumerate(ops):
        if opcode == "equal":
            run = etree.SubElement(paragraph, f"{{{NS['w']}}}r")
            text = etree.SubElement(run, f"{{{NS['w']}}}t")
            if value.startswith(" ") or value.endswith(" "):
                text.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
            text.text = f"{value} "
            continue

        change_tag = "ins" if opcode == "insert" else "del"
        change = etree.SubElement(paragraph, f"{{{NS['w']}}}{change_tag}")
        change.set(f"{{{NS['w']}}}id", str(index + 1))
        change.set(f"{{{NS['w']}}}author", "DocxRedline")
        change.set(f"{{{NS['w']}}}date", "2026-05-29T00:00:00Z")
        run = etree.SubElement(change, f"{{{NS['w']}}}r")
        text_tag = "t" if opcode == "insert" else "delText"
        text = etree.SubElement(run, f"{{{NS['w']}}}{text_tag}")
        text.text = f"{value} "


def _clone_paragraph(paragraph: etree._Element) -> etree._Element:
    return copy.deepcopy(paragraph)


def _build_paragraph_diffs(before_root: etree._Element, after_root: etree._Element) -> list[ParagraphDiff]:
    before_paragraphs = [_paragraph_text(paragraph) for paragraph in _paragraphs(before_root)]
    after_paragraphs = [_paragraph_text(paragraph) for paragraph in _paragraphs(after_root)]
    max_len = max(len(before_paragraphs), len(after_paragraphs))

    diffs: list[ParagraphDiff] = []
    for index in range(max_len):
        before = before_paragraphs[index] if index < len(before_paragraphs) else ""
        after = after_paragraphs[index] if index < len(after_paragraphs) else ""
        diffs.append(ParagraphDiff(before=before, after=after, ops=_diff_text(before, after)))

    return diffs


def _render_html_diff(diffs: list[ParagraphDiff]) -> str:
    rows: list[str] = []
    skipped = 0
    for diff in diffs:
        if diff.before == diff.after:
            skipped += 1
            continue

        if skipped:
            rows.append(
                "<div class='diff-row collapsed'>"
                f"<article class='diff-pane omitted' aria-label='omitted'>{skipped} unchanged paragraphs omitted</article>"
                f"<article class='diff-pane omitted' aria-label='omitted'>{skipped} unchanged paragraphs omitted</article>"
                "</div>"
            )
            skipped = 0

        left_parts: list[str] = []
        right_parts: list[str] = []
        for opcode, value in diff.ops:
            escaped = html.escape(value)
            if opcode == "equal":
                left_parts.append(f"<span>{escaped}</span>")
                right_parts.append(f"<span>{escaped}</span>")
            elif opcode == "delete":
                left_parts.append(f"<del>{escaped}</del>")
            elif opcode == "insert":
                right_parts.append(f"<ins>{escaped}</ins>")

        rows.append(
            "<div class='diff-row'>"
            f"<article class='diff-pane before'>{''.join(left_parts) or '&nbsp;'}</article>"
            f"<article class='diff-pane after'>{''.join(right_parts) or '&nbsp;'}</article>"
            "</div>"
        )

    if skipped:
        rows.append(
            "<div class='diff-row collapsed'>"
            f"<article class='diff-pane omitted' aria-label='omitted'>{skipped} unchanged paragraphs omitted</article>"
            f"<article class='diff-pane omitted' aria-label='omitted'>{skipped} unchanged paragraphs omitted</article>"
            "</div>"
        )

    return (
        "<section class='docxredline-diff'>"
        "<style>"
        ".docxredline-diff{display:grid;gap:12px}"
        ".diff-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}"
        ".diff-pane{border:1px solid #d7d2c8;border-radius:16px;padding:12px;background:#fffdf8}"
        ".diff-pane.omitted{background:#f4efe5;color:#6f6559;font-style:italic;text-align:center}"
        "del{background:#ffe1dc;text-decoration:line-through}"
        "ins{background:#dff5e4;text-decoration:none}"
        "</style>"
        + "".join(rows)
        + "</section>"
    )


def _pane_indices(diffs: list[ParagraphDiff], context_radius: int = 1) -> set[int]:
    indices: set[int] = set()
    for index, diff in enumerate(diffs):
        if diff.before == diff.after:
            continue
        for context_index in range(max(0, index - context_radius), min(len(diffs), index + context_radius + 1)):
            indices.add(context_index)
    return indices


def _render_document_pane(diffs: list[ParagraphDiff], *, side: str) -> str:
    paragraphs = []
    visible_indices = _pane_indices(diffs)
    skipped = 0
    for index, diff in enumerate(diffs):
        if index not in visible_indices:
            skipped += 1
            continue

        if skipped:
            paragraphs.append(
                "<p class='docxredline-pane-omitted'>"
                f"{skipped} unchanged paragraphs omitted"
                "</p>"
            )
            skipped = 0

        text = html.escape(diff.before if side == "before" else diff.after)
        paragraphs.append(
            "<p class='docxredline-pane-paragraph'>"
            f"{text or '&nbsp;'}"
            "</p>"
        )

    if skipped:
        paragraphs.append(
            "<p class='docxredline-pane-omitted'>"
            f"{skipped} unchanged paragraphs omitted"
            "</p>"
        )

    return (
        "<section class='docxredline-pane'>"
        "<style>"
        ".docxredline-pane{display:grid;gap:12px}"
        ".docxredline-pane-paragraph{margin:0;line-height:1.7}"
        ".docxredline-pane-omitted{margin:0;color:#6f6559;font-style:italic;text-align:center}"
        "</style>"
        + "".join(paragraphs)
        + "</section>"
    )


def compare_docx(before_bytes: bytes, after_bytes: bytes) -> CompareResponse:
    before_files, before_root = _read_archive(before_bytes)
    _, after_root = _read_archive(after_bytes)

    before_paragraph_elements = _paragraphs(before_root)
    diffs = _build_paragraph_diffs(before_root, after_root)

    for index, diff in enumerate(diffs):
        if index >= len(before_paragraph_elements):
            body = before_root.find(".//w:body", namespaces=NS)
            if body is None:
                continue
            paragraph = etree.SubElement(body, f"{{{NS['w']}}}p")
            _replace_paragraph_content(paragraph, diff.ops or [("insert", diff.after)])
            continue

        if diff.before == diff.after:
            continue
        _replace_paragraph_content(before_paragraph_elements[index], diff.ops)

    before_files["word/document.xml"] = etree.tostring(
        before_root,
        xml_declaration=True,
        encoding="UTF-8",
        standalone="yes",
    )

    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in before_files.items():
            archive.writestr(name, data)

    changes: list[TrackedChangeRecord] = []
    sequence = 0
    for diff in diffs:
        for opcode, value in diff.ops:
            if opcode == "equal":
                continue
            sequence += 1
            changes.append(
                TrackedChangeRecord(
                    id=f"compare:{opcode}:{sequence}",
                    kind="ins" if opcode == "insert" else "del",
                    author="DocxRedline",
                    date="2026-05-29T00:00:00Z",
                    text=value,
                )
            )

    return CompareResponse(
        redline_docx_base64=base64.b64encode(output.getvalue()).decode("ascii"),
        html_diff=_render_html_diff(diffs),
        panes=[
            HtmlDiffPane(title="Original", html=_render_document_pane(diffs, side="before")),
            HtmlDiffPane(title="Revised", html=_render_document_pane(diffs, side="after")),
        ],
        changes=changes,
    )
