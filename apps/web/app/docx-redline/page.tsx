import type { Metadata } from "next";

import { PlaygroundShell } from "../../components/playground-shell";

export const metadata: Metadata = {
  title: "DOCX Redline Online | DocxRedline",
  description:
    "Generate a DOCX redline, inspect tracked changes, and accept or reject revisions online.",
};

export default function DocxRedlinePage() {
  return (
    <PlaygroundShell
      initialMode="compare"
      initialCompareTab="Changes"
      visibleCompareTabs={["Changes", "Redline"]}
      preferredSampleId="contract-redline"
      heroEyebrow="DOCX Redline"
      heroTitle="Generate a redline and work through every tracked change."
      heroDescription="Use this view when you care about acceptance decisions first: compare two files, inspect the change list, then accept or reject revisions one by one or in bulk."
      sidebarTitle="This route starts in the tracked-change workflow."
      sidebarItems={[
        "The change list opens first so the review queue is immediately visible.",
        "Use Accept all or Reject all when you need a fast final-state document.",
        "Download the updated DOCX after review to keep the browser flow short.",
      ]}
    />
  );
}
