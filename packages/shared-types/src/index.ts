export interface DocxComment {
  id: string;
  author: string;
  date: string;
  text: string;
  quoted_text?: string;
  replies: DocxComment[];
  resolved: boolean;
}

export interface TrackedChange {
  id: string;
  kind: "ins" | "del" | "fmt" | "move";
  author: string;
  date: string;
  text: string;
}

export interface CompareResult {
  redlineDocxUrl: string;
  htmlDiffUrl: string;
  changes: TrackedChange[];
}

export interface WorkerMeta {
  name: string;
  artifactTtlSeconds: number;
  maxUploadMb: number;
}

export interface SampleDocument {
  id: string;
  title: string;
  description: string;
  recommended_mode: "extract" | "compare";
}

export interface ConversionMessage {
  type: string;
  message: string;
}

export interface ExtractedImage {
  name: string;
  content_type: string;
  size_bytes: number;
  data_base64: string;
}

export interface HtmlConversionResult {
  html: string;
  images: ExtractedImage[];
  messages: ConversionMessage[];
}

export interface MarkdownConversionResult {
  markdown: string;
  images: ExtractedImage[];
  messages: ConversionMessage[];
}

export interface CommentsResult {
  comments: DocxComment[];
  markdown: string;
}

export interface ContentControlRecord {
  id: string;
  title: string;
  tag: string;
  control_type: string;
  text: string;
}

export interface ContentControlsResult {
  controls: ContentControlRecord[];
}

export interface NamedContent {
  name: string;
  text: string;
}

export interface EmbeddedObjectRecord {
  name: string;
  content_type: string;
  size_bytes: number;
}

export interface DocumentElementsResult {
  headers: NamedContent[];
  footers: NamedContent[];
  footnotes: NamedContent[];
  endnotes: NamedContent[];
  embedded_objects: EmbeddedObjectRecord[];
}

export interface TrackedChangesResult {
  changes: TrackedChange[];
}

export interface RedlineMutationResult {
  changes: TrackedChange[];
  docx_base64: string;
}

export interface HtmlDiffPane {
  title: string;
  html: string;
}

export interface CompareResponse {
  redline_docx_base64: string;
  html_diff: string;
  panes: HtmlDiffPane[];
  changes: TrackedChange[];
}
