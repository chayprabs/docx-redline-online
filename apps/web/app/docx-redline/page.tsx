import type { Metadata } from "next";

import { PlaygroundShell } from "../../components/playground-shell";

export const metadata: Metadata = {
  title: "DOCX Redline Online | DocxRedline",
  description:
    "Generate a DOCX redline, inspect tracked changes, and accept or reject revisions online.",
};

export default function DocxRedlinePage() {
  return <PlaygroundShell initialMode="compare" initialCompareTab="Changes" />;
}
