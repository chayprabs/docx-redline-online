import io
import zipfile
from collections import defaultdict
from dataclasses import dataclass

from lxml import etree

from ..schemas import CommentsResponse, DocxCommentRecord

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "w14": "http://schemas.microsoft.com/office/word/2010/wordml",
    "w15": "http://schemas.microsoft.com/office/word/2012/wordml",
}


@dataclass
class CommentMetadata:
    para_id: str | None
    parent_para_id: str | None
    resolved: bool


def _parse_xml(archive: zipfile.ZipFile, name: str) -> etree._Element | None:
    try:
        return etree.fromstring(archive.read(name))
    except KeyError:
        return None


def _paragraph_text(paragraph: etree._Element) -> str:
    parts = [text for text in paragraph.xpath(".//w:t/text()", namespaces=NS)]
    return "".join(parts).strip()


def _comment_text(comment_element: etree._Element) -> str:
    paragraphs = [
        _paragraph_text(paragraph)
        for paragraph in comment_element.xpath("./w:p", namespaces=NS)
    ]
    return "\n".join(part for part in paragraphs if part).strip()


def _parse_extended_metadata(
    archive: zipfile.ZipFile,
) -> dict[str, CommentMetadata]:
    root = _parse_xml(archive, "word/commentsExtended.xml")
    if root is None:
        return {}

    metadata: dict[str, CommentMetadata] = {}
    for element in root.xpath("./w15:commentEx", namespaces=NS):
        para_id = element.get(f"{{{NS['w15']}}}paraId")
        if not para_id:
            continue

        metadata[para_id] = CommentMetadata(
            para_id=para_id,
            parent_para_id=element.get(f"{{{NS['w15']}}}paraIdParent"),
            resolved=element.get(f"{{{NS['w15']}}}done") in {"1", "true", "on"},
        )

    return metadata


def _extract_comment_anchors(document_root: etree._Element | None) -> dict[str, str]:
    if document_root is None:
        return {}

    anchors: dict[str, str] = {}
    for paragraph in document_root.xpath(".//w:p", namespaces=NS):
        active_comment_id: str | None = None
        captured: list[str] = []

        for child in paragraph:
            tag = etree.QName(child).localname
            if tag == "commentRangeStart":
                active_comment_id = child.get(f"{{{NS['w']}}}id")
                captured = []
                continue

            if tag == "commentRangeEnd":
                comment_id = child.get(f"{{{NS['w']}}}id")
                if active_comment_id and comment_id == active_comment_id:
                    anchors[comment_id] = "".join(captured).strip()
                active_comment_id = None
                captured = []
                continue

            if active_comment_id:
                captured.extend(child.xpath(".//w:t/text()", namespaces=NS))

    return anchors


def _build_markdown(comments: list[DocxCommentRecord], depth: int = 0) -> list[str]:
    lines: list[str] = []
    for comment in comments:
        prefix = "  " * depth + "- "
        state = "resolved" if comment.resolved else "open"
        quote = f' Quote: "{comment.quoted_text}".' if comment.quoted_text else ""
        lines.append(
            f"{prefix}**{comment.author or 'Unknown'}** ({comment.date or 'unknown date'}, {state}): {comment.text}{quote}"
        )
        lines.extend(_build_markdown(comment.replies, depth + 1))
    return lines


def extract_comments(docx_bytes: bytes) -> CommentsResponse:
    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as archive:
        comments_root = _parse_xml(archive, "word/comments.xml")
        if comments_root is None:
            return CommentsResponse(comments=[], markdown="")

        metadata_by_para_id = _parse_extended_metadata(archive)
        anchors = _extract_comment_anchors(_parse_xml(archive, "word/document.xml"))

        raw_comments: dict[str, DocxCommentRecord] = {}
        children_by_parent: dict[str, list[str]] = defaultdict(list)
        para_id_to_comment_id: dict[str, str] = {}
        comment_meta_by_id: dict[str, CommentMetadata] = {}

        for comment_element in comments_root.xpath("./w:comment", namespaces=NS):
            comment_id = comment_element.get(f"{{{NS['w']}}}id", "")
            last_paragraph = comment_element.xpath("./w:p[last()]", namespaces=NS)
            para_id = None
            if last_paragraph:
                para_id = last_paragraph[0].get(f"{{{NS['w14']}}}paraId")

            extended = metadata_by_para_id.get(
                para_id or "",
                CommentMetadata(para_id=para_id, parent_para_id=None, resolved=False),
            )

            record = DocxCommentRecord(
                id=comment_id,
                author=comment_element.get(f"{{{NS['w']}}}author", ""),
                date=comment_element.get(f"{{{NS['w']}}}date", ""),
                text=_comment_text(comment_element),
                quoted_text=anchors.get(comment_id, ""),
                resolved=extended.resolved,
            )
            raw_comments[comment_id] = record
            if para_id:
                para_id_to_comment_id[para_id] = comment_id
            comment_meta_by_id[comment_id] = extended

        parent_comment_ids: dict[str, str] = {}
        for child_id, metadata in comment_meta_by_id.items():
            if not metadata or not metadata.parent_para_id:
                continue
            parent_id = para_id_to_comment_id.get(metadata.parent_para_id)
            if parent_id:
                parent_comment_ids[child_id] = parent_id
                children_by_parent[parent_id].append(child_id)

        def build_thread(comment_id: str) -> DocxCommentRecord:
            base = raw_comments[comment_id].model_copy(deep=True)
            base.replies = [build_thread(child_id) for child_id in children_by_parent.get(comment_id, [])]
            return base

        root_ids = [comment_id for comment_id in raw_comments if comment_id not in parent_comment_ids]
        threads = [build_thread(comment_id) for comment_id in root_ids]
        markdown = "\n".join(_build_markdown(threads))
        return CommentsResponse(comments=threads, markdown=markdown)
