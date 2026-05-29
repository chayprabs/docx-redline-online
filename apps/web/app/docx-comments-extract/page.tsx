import type { Metadata } from "next";

import { PlaygroundShell } from "../../components/playground-shell";

export const metadata: Metadata = {
  title: "DOCX Comments Extract | DocxRedline",
  description:
    "Extract DOCX comments, replies, timestamps, and resolved state with Markdown-ready output.",
};

export default function DocxCommentsExtractPage() {
  return (
    <PlaygroundShell
      initialMode="extract"
      initialExtractTab="Comments"
      visibleExtractTabs={["Comments", "Markdown"]}
      visibleSampleIds={["manuscript-comments"]}
      showModeToggle={false}
      showExtractConversionControls={false}
      extractFileTitle="Comment source DOCX"
      extractFileHelper="Use one DOCX to extract comment threads, replies, timestamps, and resolved state."
      extractRunLabel="Extract comments"
      extractLoadingLabel="Extracting comments..."
      extractStatusFileLabel="Source"
      extractStatusRunLabel="Run"
      extractStatusOutputLabel="Threads"
      extractOutputTitle="Comment results"
      extractOutputDescription="Start in comments, then use Markdown export when you need a portable review summary."
      extractEmptyState="Extract comments to load the thread view and the Markdown-ready review summary."
      extractOptionsTitle="Comment extraction"
      extractOptionsDescription="Run one DOCX to extract comment threads, replies, quoted text, authors, timestamps, and resolved state."
      extractReadyMessage="Ready to extract comments from the selected DOCX."
      extractIdleMessage="Choose one DOCX or load the manuscript sample to enable comment extraction."
      preferredSampleId="manuscript-comments"
      heroEyebrow="DOCX Comments Extract"
      heroTitle="Extract comment threads, replies, and resolved state from a DOCX."
      heroDescription="Use one file, run extract once, and land directly in the comments view with quoted text, authors, timestamps, and replies ready to inspect."
      workflowTitle="Load one DOCX, extract comments, then review the thread output."
      workflowSteps={[
        "1. Load one DOCX file",
        "2. Extract comments",
        "3. Review or export the threads",
      ]}
      sidebarTitle="This route is built for comment review and export."
      sidebarItems={[
        "The comments tab opens first so threaded review content is the first thing you see.",
        "Markdown export and JSON details remain part of the same worker pass.",
        "Use the manuscript sample to check replies and resolved state without uploading your own file first.",
      ]}
    />
  );
}
