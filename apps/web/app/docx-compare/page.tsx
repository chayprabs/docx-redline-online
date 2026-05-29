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
      visibleCompareTabs={["Redline", "Diff", "Changes"]}
      visibleSampleIds={["contract-redline"]}
      showModeToggle={false}
      compareOriginalTitle="Original DOCX"
      compareOriginalHelper="Use the earlier version as the baseline for the generated redline."
      compareRevisedTitle="Revised DOCX"
      compareRevisedHelper="Add the newer version to generate the redline and side-by-side diff."
      compareRunLabel="Generate redline"
      compareLoadingLabel="Generating redline..."
      compareStatusOriginalLabel="Original"
      compareStatusRevisedLabel="Revised"
      compareStatusOutputLabel="Redline"
      compareStatusOriginalIdleValue="Original needed"
      compareStatusRevisedIdleValue="Revised needed"
      compareStatusOutputReadyValue="Redline ready"
      compareStatusOutputIdleValue="Redline pending"
      compareStatusOutputLoadingValue="Generating redline"
      compareReadyMessage="Ready to generate the redline, inspect the side-by-side diff, and review individual changes."
      compareIdleMessage="Choose both the original and revised DOCX files to enable compare output."
      compareOutputTitle="Redline results"
      compareOutputDescription="Start with the exported redline, then move into the HTML diff or change list for review."
      compareEmptyState="Generate the redline to unlock the DOCX export, side-by-side diff, and change list."
      preferredSampleId="contract-redline"
      suggestedSampleButtonLabel="Load compare sample"
      heroEyebrow="DOCX Compare"
      heroTitle="Compare two DOCX files and export a clean redline."
      heroDescription="Drop the original and revised versions, run compare once, then move between the redline, side-by-side diff, and per-change review."
      workflowTitle="Load both DOCX files, generate the redline, then inspect the output."
      workflowSteps={[
        "1. Load original and revised DOCX",
        "2. Generate the redline",
        "3. Review or export the result",
      ]}
      sidebarTitle="This route is tuned for review work, not general conversion."
      sidebarItems={[
        "Start with the contract sample if you want a fast end-to-end compare check.",
        "The redline tab is the export path, while the diff and changes tabs are the review path.",
        "Per-change accept and reject actions always operate on the generated redline DOCX.",
      ]}
    />
  );
}
