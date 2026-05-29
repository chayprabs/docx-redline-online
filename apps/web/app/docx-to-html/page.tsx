import type { Metadata } from "next";

import { PlaygroundShell } from "../../components/playground-shell";

export const metadata: Metadata = {
  title: "DOCX to HTML | DocxRedline",
  description:
    "Convert DOCX to clean HTML with images, style-map support, and document-part inspection.",
};

export default function DocxToHtmlPage() {
  return (
    <PlaygroundShell
      initialMode="extract"
      initialExtractTab="HTML"
      visibleExtractTabs={["HTML", "Assets", "Elements"]}
      visibleSampleIds={["generic-images"]}
      showModeToggle={false}
      extractFileTitle="HTML source DOCX"
      extractFileHelper="Use one DOCX to generate HTML, inspect assets, and review document parts."
      extractRunLabel="Generate HTML"
      extractLoadingLabel="Generating HTML..."
      extractStatusFileLabel="Source"
      extractStatusRunLabel="Run"
      extractStatusOutputLabel="HTML"
      extractStatusRunReadyValue="Ready to generate"
      extractStatusOutputReadyValue="HTML ready"
      extractOutputTitle="HTML results"
      extractOutputDescription="Start in HTML, then switch into assets and document parts when you need to inspect the source structure."
      extractEmptyState="Generate HTML to load the rendered output, extracted assets, and document parts."
      extractReadyMessage="Ready to generate HTML from the selected DOCX."
      extractIdleMessage="Choose one DOCX or load the illustrated sample to enable HTML generation."
      preferredSampleId="generic-images"
      heroEyebrow="DOCX to HTML"
      heroTitle="Convert DOCX into clean HTML with images and structure intact."
      heroDescription="Upload one DOCX, run extract, and land directly in the HTML output while keeping comments, assets, controls, and document parts one tab away."
      workflowTitle="Load one DOCX, generate HTML, then inspect the output and assets."
      workflowSteps={[
        "1. Load one DOCX file",
        "2. Generate HTML",
        "3. Review HTML, assets, and parts",
      ]}
      sidebarTitle="This route is focused on conversion output first."
      sidebarItems={[
        "The HTML tab opens first so you can inspect the rendered output immediately.",
        "List normalization and style maps stay available when you need a cleaner export.",
        "Use the sample with images if you want to verify embedded asset extraction quickly.",
      ]}
    />
  );
}
