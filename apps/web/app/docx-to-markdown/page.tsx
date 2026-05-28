import type { Metadata } from "next";

import { PlaygroundShell } from "../../components/playground-shell";

export const metadata: Metadata = {
  title: "DOCX to Markdown | DocxRedline",
  description:
    "Convert DOCX to clean Markdown with style-map controls and list normalization options.",
};

export default function DocxToMarkdownPage() {
  return (
    <PlaygroundShell
      initialMode="extract"
      initialExtractTab="Markdown"
      heroEyebrow="DOCX to Markdown"
      heroTitle="Convert DOCX into readable Markdown without losing document structure."
      heroDescription="Start in the Markdown pane, keep the style map close by, and use list normalization when you want a cleaner export for docs or repositories."
      sidebarTitle="This route is tuned for Markdown-first export work."
      sidebarItems={[
        "Markdown opens first so the content export is immediately visible.",
        "The HTML pane is still available if you need to compare how the structure rendered.",
        "Use the generic sample to validate headings, lists, and embedded images together.",
      ]}
    />
  );
}
