import io
import mimetypes
import zipfile

from lxml import etree

from ..schemas import DocumentElementsResponse, EmbeddedObjectRecord, NamedContent

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}


def _parse_text(xml_bytes: bytes) -> str:
    root = etree.fromstring(xml_bytes)
    return "\n".join(
        part.strip()
        for part in ["".join(node.xpath(".//w:t/text()", namespaces=NS)) for node in root.xpath(".//w:p", namespaces=NS)]
        if part.strip()
    )


def inspect_document_elements(docx_bytes: bytes) -> DocumentElementsResponse:
    headers: list[NamedContent] = []
    footers: list[NamedContent] = []
    footnotes: list[NamedContent] = []
    endnotes: list[NamedContent] = []
    embedded_objects: list[EmbeddedObjectRecord] = []

    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as archive:
        for name in archive.namelist():
            if name.startswith("word/header") and name.endswith(".xml"):
                headers.append(NamedContent(name=name, text=_parse_text(archive.read(name))))
            elif name.startswith("word/footer") and name.endswith(".xml"):
                footers.append(NamedContent(name=name, text=_parse_text(archive.read(name))))
            elif name == "word/footnotes.xml":
                xml = etree.fromstring(archive.read(name))
                for note in xml.xpath("./w:footnote", namespaces=NS):
                    note_id = note.get(f"{{{NS['w']}}}id", "")
                    footnotes.append(
                        NamedContent(
                            name=f"footnote-{note_id}",
                            text="\n".join(
                                "".join(node.xpath(".//w:t/text()", namespaces=NS)).strip()
                                for node in note.xpath("./w:p", namespaces=NS)
                                if "".join(node.xpath(".//w:t/text()", namespaces=NS)).strip()
                            ),
                        )
                    )
            elif name == "word/endnotes.xml":
                xml = etree.fromstring(archive.read(name))
                for note in xml.xpath("./w:endnote", namespaces=NS):
                    note_id = note.get(f"{{{NS['w']}}}id", "")
                    endnotes.append(
                        NamedContent(
                            name=f"endnote-{note_id}",
                            text="\n".join(
                                "".join(node.xpath(".//w:t/text()", namespaces=NS)).strip()
                                for node in note.xpath("./w:p", namespaces=NS)
                                if "".join(node.xpath(".//w:t/text()", namespaces=NS)).strip()
                            ),
                        )
                    )
            elif name.startswith("word/embeddings/"):
                data = archive.read(name)
                embedded_objects.append(
                    EmbeddedObjectRecord(
                        name=name.split("/")[-1],
                        content_type=mimetypes.guess_type(name)[0] or "application/octet-stream",
                        size_bytes=len(data),
                    )
                )

    return DocumentElementsResponse(
        headers=headers,
        footers=footers,
        footnotes=footnotes,
        endnotes=endnotes,
        embedded_objects=embedded_objects,
    )
