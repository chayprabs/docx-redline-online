import type { Metadata } from "next";

import { PlaygroundShell } from "../../components/playground-shell";

export const metadata: Metadata = {
  title: "DOCX to HTML | DocxRedline",
  description:
    "Convert DOCX to clean HTML with images, style-map support, and document-part inspection.",
};

export default function DocxToHtmlPage() {
  return <PlaygroundShell initialMode="extract" initialExtractTab="HTML" />;
}
