import base64
import io
import zipfile
from pathlib import Path

from docx import Document
from docx.shared import Inches
from lxml import etree

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


def create_comments_fixture(target: Path) -> Path:
    document = Document()
    paragraph = document.add_paragraph()
    paragraph.add_run("Threaded ")
    target_run = paragraph.add_run("comment")
    document.add_comment(
        runs=[target_run],
        text="Top-level note",
        author="Ada",
        initials="AL",
    )
    document.save(target)

    with zipfile.ZipFile(target, "r") as archive:
        files = {name: archive.read(name) for name in archive.namelist()}

    comments_root = etree.fromstring(files["word/comments.xml"])
    comment_element = comments_root.xpath("./w:comment", namespaces={
        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    })[0]
    first_paragraph = comment_element.xpath("./w:p", namespaces={
        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    })[0]
    first_paragraph.set("{http://schemas.microsoft.com/office/word/2010/wordml}paraId", "00AAA111")

    reply = etree.Element(
        "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}comment",
        nsmap=comments_root.nsmap,
    )
    reply.set("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}id", "1")
    reply.set("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}author", "Ben")
    reply.set("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}initials", "BN")
    reply.set("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}date", "2026-05-29T00:10:00Z")

    reply_paragraph = etree.SubElement(
        reply,
        "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p",
    )
    reply_paragraph.set("{http://schemas.microsoft.com/office/word/2010/wordml}paraId", "00BBB222")
    reply_run = etree.SubElement(
        reply_paragraph,
        "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r",
    )
    reply_text = etree.SubElement(
        reply_run,
        "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t",
    )
    reply_text.text = "Reply note"
    comments_root.append(reply)
    files["word/comments.xml"] = etree.tostring(
        comments_root,
        xml_declaration=True,
        encoding="UTF-8",
        standalone="yes",
    )

    comments_extended = etree.fromstring(
        b"""<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<w15:commentsEx xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml">
  <w15:commentEx w15:paraId="00AAA111" w15:done="1"/>
  <w15:commentEx w15:paraId="00BBB222" w15:paraIdParent="00AAA111"/>
</w15:commentsEx>
"""
    )
    files["word/commentsExtended.xml"] = etree.tostring(
        comments_extended,
        xml_declaration=True,
        encoding="UTF-8",
        standalone="yes",
    )

    content_types = etree.fromstring(files["[Content_Types].xml"])
    override = etree.Element(
        "{http://schemas.openxmlformats.org/package/2006/content-types}Override"
    )
    override.set("PartName", "/word/commentsExtended.xml")
    override.set(
        "ContentType",
        "application/vnd.ms-word.commentsExtended+xml",
    )
    content_types.append(override)
    files["[Content_Types].xml"] = etree.tostring(
        content_types,
        xml_declaration=True,
        encoding="UTF-8",
        standalone="yes",
    )

    relationships = etree.fromstring(files["word/_rels/document.xml.rels"])
    relationship = etree.Element(
        "{http://schemas.openxmlformats.org/package/2006/relationships}Relationship"
    )
    relationship.set("Id", "rIdCommentsEx1")
    relationship.set(
        "Type",
        "http://schemas.microsoft.com/office/2011/relationships/commentsExtended",
    )
    relationship.set("Target", "commentsExtended.xml")
    relationships.append(relationship)
    files["word/_rels/document.xml.rels"] = etree.tostring(
        relationships,
        xml_declaration=True,
        encoding="UTF-8",
        standalone="yes",
    )

    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            archive.writestr(name, data)

    target.write_bytes(output.getvalue())
    return target
