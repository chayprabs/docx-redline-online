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
