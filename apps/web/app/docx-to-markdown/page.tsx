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
      visibleExtractTabs={["Markdown", "HTML", "Assets"]}
      visibleSampleIds={["generic-images"]}
      showModeToggle={false}
      extractFileTitle="Markdown source DOCX"
      extractFileHelper="Use one DOCX to generate Markdown and cross-check the rendered structure."
      extractRunLabel="Generate Markdown"
      extractLoadingLabel="Generating Markdown..."
      extractOutputTitle="Markdown results"
      extractOutputDescription="Start in Markdown, then switch into HTML or assets when you need to verify the document structure."
      extractEmptyState="Generate Markdown to load the export, the HTML cross-check, and extracted assets."
      preferredSampleId="generic-images"
      heroEyebrow="DOCX to Markdown"
      heroTitle="Convert DOCX into readable Markdown without losing document structure."
      heroDescription="Start in the Markdown pane, keep the style map close by, and use list normalization when you want a cleaner export for docs or repositories."
      workflowTitle="Load one DOCX, generate Markdown, then verify the export."
      workflowSteps={[
        "1. Load one DOCX file",
        "2. Generate Markdown",
        "3. Review Markdown and structure",
      ]}
      sidebarTitle="This route is tuned for Markdown-first export work."
      sidebarItems={[
        "Markdown opens first so the content export is immediately visible.",
        "The HTML pane is still available if you need to compare how the structure rendered.",
        "Use the generic sample to validate headings, lists, and embedded images together.",
      ]}
    />
  );
}
