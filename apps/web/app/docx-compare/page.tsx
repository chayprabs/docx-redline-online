import type { Metadata } from "next";

import { PlaygroundShell } from "../../components/playground-shell";

export const metadata: Metadata = {
  title: "DOCX Compare Online | DocxRedline",
  description:
    "Compare DOCX versions online and generate a Word-style redline with side-by-side HTML diff output.",
};

export default function DocxComparePage() {
  return <PlaygroundShell initialMode="compare" initialCompareTab="Redline" />;
}
