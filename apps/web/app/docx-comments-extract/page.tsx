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
      showExtractConversionControls={false}
      extractOptionsTitle="Comment extraction"
      extractOptionsDescription="Run one DOCX to extract comment threads, replies, quoted text, authors, timestamps, and resolved state."
      extractReadyMessage="Ready to extract comments from the selected DOCX."
      extractIdleMessage="Choose one DOCX or load the manuscript sample to enable comment extraction."
      preferredSampleId="manuscript-comments"
      heroEyebrow="DOCX Comments Extract"
      heroTitle="Extract comment threads, replies, and resolved state from a DOCX."
      heroDescription="Use one file, run extract once, and land directly in the comments view with quoted text, authors, timestamps, and replies ready to inspect."
      sidebarTitle="This route is built for comment review and export."
      sidebarItems={[
        "The comments tab opens first so threaded review content is the first thing you see.",
        "Markdown export and JSON details remain part of the same worker pass.",
        "Use the manuscript sample to check replies and resolved state without uploading your own file first.",
      ]}
    />
  );
}
