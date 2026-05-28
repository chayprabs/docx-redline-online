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
      preferredSampleId="generic-images"
      heroEyebrow="DOCX to HTML"
      heroTitle="Convert DOCX into clean HTML with images and structure intact."
      heroDescription="Upload one DOCX, run extract, and land directly in the HTML output while keeping comments, assets, controls, and document parts one tab away."
      sidebarTitle="This route is focused on conversion output first."
      sidebarItems={[
        "The HTML tab opens first so you can inspect the rendered output immediately.",
        "List normalization and style maps stay available when you need a cleaner export.",
        "Use the sample with images if you want to verify embedded asset extraction quickly.",
      ]}
    />
  );
}
