import base64
import copy
import io
import zipfile
from dataclasses import dataclass

from lxml import etree

from ..schemas import RedlineMutationResponse, TrackedChangeRecord, TrackedChangesResponse

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}

RUN_LEVEL_CHANGE_TAGS = {
    "ins": "ins",
    "del": "del",
    "moveFrom": "move",
    "moveTo": "move",
}


@dataclass
class ChangeMatch:
    record: TrackedChangeRecord
    element: etree._Element


def _parse_document_xml(docx_bytes: bytes) -> tuple[dict[str, bytes], etree._Element]:
    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as archive:
        files = {name: archive.read(name) for name in archive.namelist()}
    root = etree.fromstring(files["word/document.xml"])
    return files, root


def _collect_text(element: etree._Element) -> str:
    text_nodes = element.xpath(".//w:t/text() | .//w:delText/text()", namespaces=NS)
    return "".join(text_nodes).strip()


def _build_change_id(kind: str, element: etree._Element, index: int) -> str:
    raw_id = element.get(f"{{{NS['w']}}}id", str(index))
    return f"{kind}:{raw_id}:{index}"


def _collect_tracked_change_matches(root: etree._Element) -> list[ChangeMatch]:
    matches: list[ChangeMatch] = []
    index = 0

    for element in root.iter():
        local_name = etree.QName(element).localname
        if local_name in RUN_LEVEL_CHANGE_TAGS:
            kind = "move" if local_name in {"moveFrom", "moveTo"} else local_name
            matches.append(
                ChangeMatch(
                    record=TrackedChangeRecord(
                        id=_build_change_id(kind, element, index),
                        kind=kind,
                        author=element.get(f"{{{NS['w']}}}author", ""),
                        date=element.get(f"{{{NS['w']}}}date", ""),
                        text=_collect_text(element),
                    ),
                    element=element,
                )
            )
            index += 1
            continue

        if local_name == "pPrChange":
            paragraph = element.getparent().getparent() if element.getparent() is not None else None
            matches.append(
                ChangeMatch(
                    record=TrackedChangeRecord(
                        id=_build_change_id("fmt", element, index),
                        kind="fmt",
                        author=element.get(f"{{{NS['w']}}}author", ""),
                        date=element.get(f"{{{NS['w']}}}date", ""),
                        text=_collect_text(paragraph) if paragraph is not None else "",
                    ),
                    element=element,
                )
            )
            index += 1

    return matches


def inspect_tracked_changes(docx_bytes: bytes) -> TrackedChangesResponse:
    _, root = _parse_document_xml(docx_bytes)
    return TrackedChangesResponse(
        changes=[match.record for match in _collect_tracked_change_matches(root)]
    )


def _rename_deleted_text_nodes(element: etree._Element) -> None:
    for descendant in element.iter():
        if etree.QName(descendant).localname == "delText":
            descendant.tag = f"{{{NS['w']}}}t"


def _unwrap_element(element: etree._Element, mutate: callable | None = None) -> None:
    parent = element.getparent()
    if parent is None:
        return

    insert_at = parent.index(element)
    for child in list(element):
        if mutate is not None:
            mutate(child)
        parent.insert(insert_at, child)
        insert_at += 1
    parent.remove(element)


def _accept_change(element: etree._Element) -> None:
    local_name = etree.QName(element).localname

    if local_name in {"ins", "moveTo"}:
        _unwrap_element(element)
        return

    if local_name in {"del", "moveFrom"}:
        parent = element.getparent()
        if parent is not None:
            parent.remove(element)
        return

    if local_name == "pPrChange":
        parent = element.getparent()
        if parent is not None:
            parent.remove(element)


def _reject_change(element: etree._Element) -> None:
    local_name = etree.QName(element).localname

    if local_name == "ins":
        parent = element.getparent()
        if parent is not None:
            parent.remove(element)
        return

    if local_name == "del":
        _unwrap_element(element, mutate=_rename_deleted_text_nodes)
        return

    if local_name == "moveTo":
        parent = element.getparent()
        if parent is not None:
            parent.remove(element)
        return

    if local_name == "moveFrom":
        _unwrap_element(element)
        return

    if local_name == "pPrChange":
        parent = element.getparent()
        if parent is None:
            return
        previous = element.find("./w:pPr", namespaces=NS)
        if previous is None:
            parent.remove(element)
            return

        for child in list(parent):
            parent.remove(child)
        for child in list(previous):
            parent.append(copy.deepcopy(child))


def apply_redline_action(
    docx_bytes: bytes,
    action: str,
    change_ids: list[str] | None = None,
) -> RedlineMutationResponse:
    if action not in {"accept", "reject"}:
        raise ValueError("Action must be either 'accept' or 'reject'.")

    files, root = _parse_document_xml(docx_bytes)
    matches = _collect_tracked_change_matches(root)
    selected_ids = set(change_ids or [match.record.id for match in matches])

    for match in reversed(matches):
        if match.record.id not in selected_ids:
            continue
        if action == "accept":
            _accept_change(match.element)
        else:
            _reject_change(match.element)

    files["word/document.xml"] = etree.tostring(
        root,
        xml_declaration=True,
        encoding="UTF-8",
        standalone="yes",
    )

    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            archive.writestr(name, data)

    return RedlineMutationResponse(
        changes=[match.record for match in matches],
        docx_base64=base64.b64encode(output.getvalue()).decode("ascii"),
    )
