import type { Metadata } from "next";

import { PlaygroundShell } from "../../components/playground-shell";

export const metadata: Metadata = {
  title: "DOCX to Markdown | DocxRedline",
  description:
    "Convert DOCX to clean Markdown with style-map controls and list normalization options.",
};

export default function DocxToMarkdownPage() {
  return <PlaygroundShell initialMode="extract" initialExtractTab="Markdown" />;
}
