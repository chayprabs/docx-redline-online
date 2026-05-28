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
      showModeToggle={false}
      compareOriginalTitle="Original DOCX"
      compareOriginalHelper="Use the earlier version as the baseline for the tracked-change review."
      compareRevisedTitle="Revised DOCX"
      compareRevisedHelper="Add the newer version to build the redline and review queue."
      compareRunLabel="Build review queue"
      compareLoadingLabel="Building review queue..."
      compareOutputTitle="Review results"
      compareOutputDescription="Start in the change queue, then switch to the redline export when you are ready to download the reviewed document."
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
