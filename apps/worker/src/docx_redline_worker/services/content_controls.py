import base64
import copy
import io
import json
import zipfile

from lxml import etree

from ..schemas import ContentControlRecord, ContentControlsResponse, ReplaceResponse

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}


def _parse_document_xml(docx_bytes: bytes) -> tuple[dict[str, bytes], etree._Element]:
    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as archive:
        files = {name: archive.read(name) for name in archive.namelist()}
    return files, etree.fromstring(files["word/document.xml"])


def _string_value(node: etree._Element | None) -> str:
    if node is None:
        return ""
    return node.get(f"{{{NS['w']}}}val", "")


def _control_type(properties: etree._Element | None) -> str:
    if properties is None:
        return "generic"
    for child in properties:
        local_name = etree.QName(child).localname
        if local_name in {"text", "richText", "comboBox", "dropDownList", "date"}:
            return local_name
    return "generic"


def _control_text(content: etree._Element | None) -> str:
    if content is None:
        return ""
    return "".join(content.xpath(".//w:t/text()", namespaces=NS)).strip()


def _control_record(index: int, sdt: etree._Element) -> ContentControlRecord:
    properties = sdt.find("./w:sdtPr", namespaces=NS)
    content = sdt.find("./w:sdtContent", namespaces=NS)
    title = _string_value(properties.find("./w:alias", namespaces=NS) if properties is not None else None)
    tag = _string_value(properties.find("./w:tag", namespaces=NS) if properties is not None else None)
    identifier = _string_value(properties.find("./w:id", namespaces=NS) if properties is not None else None)

    return ContentControlRecord(
        id=identifier or tag or title or f"control-{index}",
        title=title,
        tag=tag,
        control_type=_control_type(properties),
        text=_control_text(content),
    )


def list_content_controls(docx_bytes: bytes) -> ContentControlsResponse:
    _, root = _parse_document_xml(docx_bytes)
    controls = [
        _control_record(index, sdt)
        for index, sdt in enumerate(root.xpath(".//w:sdt", namespaces=NS))
    ]
    return ContentControlsResponse(controls=controls)


def _replace_text_in_content(content: etree._Element, replacement: str) -> None:
    text_nodes = content.xpath(".//w:t", namespaces=NS)
    if not text_nodes:
        paragraph = content.find(".//w:p", namespaces=NS)
        if paragraph is None:
            paragraph = etree.SubElement(content, f"{{{NS['w']}}}p")
        run = etree.SubElement(paragraph, f"{{{NS['w']}}}r")
        text_element = etree.SubElement(run, f"{{{NS['w']}}}t")
        text_element.text = replacement
        return

    first_text = text_nodes[0]
    first_text.text = replacement
    for extra in text_nodes[1:]:
        parent = extra.getparent()
        if parent is not None:
            parent.remove(extra)

    for run in content.xpath(".//w:r", namespaces=NS):
        if not run.xpath("./w:t", namespaces=NS):
            parent = run.getparent()
            if parent is not None:
                parent.remove(run)


def replace_content_controls(docx_bytes: bytes, replacements: dict[str, str]) -> ReplaceResponse:
    files, root = _parse_document_xml(docx_bytes)

    sdts = root.xpath(".//w:sdt", namespaces=NS)
    for index, sdt in enumerate(sdts):
        record = _control_record(index, sdt)
        replacement = (
            replacements.get(record.id)
            or replacements.get(record.tag)
            or replacements.get(record.title)
        )
        if replacement is None:
            continue

        content = sdt.find("./w:sdtContent", namespaces=NS)
        if content is None:
            continue
        _replace_text_in_content(content, replacement)

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

    return ReplaceResponse(
        controls=list_content_controls(output.getvalue()).controls,
        docx_base64=base64.b64encode(output.getvalue()).decode("ascii"),
    )


def parse_replacements(payload: str) -> dict[str, str]:
    parsed = json.loads(payload)
    if not isinstance(parsed, dict) or not all(
        isinstance(key, str) and isinstance(value, str) for key, value in parsed.items()
    ):
        raise ValueError("replacements must be a JSON object with string values.")
    return copy.deepcopy(parsed)
