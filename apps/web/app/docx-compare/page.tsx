import type { Metadata } from "next";

import { PlaygroundShell } from "../../components/playground-shell";

export const metadata: Metadata = {
  title: "DOCX Compare Online | DocxRedline",
  description:
    "Compare DOCX versions online and generate a Word-style redline with side-by-side HTML diff output.",
};

export default function DocxComparePage() {
  return (
    <PlaygroundShell
      initialMode="compare"
      initialCompareTab="Redline"
      preferredSampleId="contract-redline"
      heroEyebrow="DOCX Compare"
      heroTitle="Compare two DOCX files and export a clean redline."
      heroDescription="Drop the original and revised versions, run compare once, then move between the redline, side-by-side diff, and per-change review."
      sidebarTitle="This route is tuned for review work, not general conversion."
      sidebarItems={[
        "Start with the contract sample if you want a fast end-to-end compare check.",
        "The redline tab is the export path, while the diff and changes tabs are the review path.",
        "Per-change accept and reject actions always operate on the generated redline DOCX.",
      ]}
    />
  );
}
