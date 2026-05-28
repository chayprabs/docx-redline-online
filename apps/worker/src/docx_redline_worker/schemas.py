from pydantic import BaseModel, Field


class ConversionMessage(BaseModel):
    type: str
    message: str


class ExtractedImage(BaseModel):
    name: str
    content_type: str
    size_bytes: int
    data_base64: str


class HtmlConversionResponse(BaseModel):
    html: str
    images: list[ExtractedImage] = Field(default_factory=list)
    messages: list[ConversionMessage] = Field(default_factory=list)


class MarkdownConversionResponse(BaseModel):
    markdown: str
    images: list[ExtractedImage] = Field(default_factory=list)
    messages: list[ConversionMessage] = Field(default_factory=list)


class SampleDocument(BaseModel):
    id: str
    title: str
    description: str
    recommended_mode: str


class SampleCatalogResponse(BaseModel):
    samples: list[SampleDocument]


class DocxCommentRecord(BaseModel):
    id: str
    author: str
    date: str
    text: str
    quoted_text: str = ""
    replies: list["DocxCommentRecord"] = Field(default_factory=list)
    resolved: bool = False


class CommentsResponse(BaseModel):
    comments: list[DocxCommentRecord]
    markdown: str


class TrackedChangeRecord(BaseModel):
    id: str
    kind: str
    author: str
    date: str
    text: str


class TrackedChangesResponse(BaseModel):
    changes: list[TrackedChangeRecord]


class RedlineMutationResponse(BaseModel):
    changes: list[TrackedChangeRecord]
    docx_base64: str


class ContentControlRecord(BaseModel):
    id: str
    title: str
    tag: str
    control_type: str
    text: str


class ContentControlsResponse(BaseModel):
    controls: list[ContentControlRecord]


class ReplaceResponse(BaseModel):
    controls: list[ContentControlRecord]
    docx_base64: str


class HtmlDiffPane(BaseModel):
    title: str
    html: str


class CompareResponse(BaseModel):
    redline_docx_base64: str
    html_diff: str
    panes: list[HtmlDiffPane]
    changes: list[TrackedChangeRecord]


DocxCommentRecord.model_rebuild()
