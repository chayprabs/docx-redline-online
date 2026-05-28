import type { Metadata } from "next";

import { PlaygroundShell } from "../../components/playground-shell";

export const metadata: Metadata = {
  title: "DOCX Comments Extract | DocxRedline",
  description:
    "Extract DOCX comments, replies, timestamps, and resolved state with Markdown-ready output.",
};

export default function DocxCommentsExtractPage() {
  return <PlaygroundShell initialMode="extract" initialExtractTab="Comments" />;
}
