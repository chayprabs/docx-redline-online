"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useState, type ReactNode } from "react";
import { SampleCard } from "@docx-redline/shared-ui";
import type {
  CommentsResult,
  CompareResponse,
  ContentControlsResult,
  DocumentElementsResult,
  HtmlConversionResult,
  MarkdownConversionResult,
  ReplaceResponse,
  SampleDocument,
  TrackedChange,
  TrackedChangesResult,
  WorkerMeta,
} from "@docx-redline/shared-types";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

const fallbackSamples: SampleDocument[] = [
  {
    id: "contract-redline",
    title: "Contract Draft",
    description:
      "Two legal drafts with insertions, deletions, and formatting changes for redline compare.",
    recommended_mode: "compare",
  },
  {
    id: "manuscript-comments",
    title: "Manuscript Review",
    description:
      "A manuscript fixture with threaded comments, reply chains, and resolved discussions.",
    recommended_mode: "extract",
  },
  {
    id: "generic-images",
    title: "Illustrated Brief",
    description:
      "A generic DOCX with headings, lists, and embedded images for conversion output.",
    recommended_mode: "extract",
  },
];

const extractTabs = [
  "HTML",
  "Markdown",
  "Comments",
  "Tracked",
  "Controls",
  "Assets",
  "Elements",
] as const;

const compareTabs = ["Redline", "Diff", "Changes"] as const;

const workflowLinks = [
  { href: "/docx-compare", label: "Compare" },
  { href: "/docx-redline", label: "Redline" },
  { href: "/docx-to-html", label: "To HTML" },
  { href: "/docx-to-markdown", label: "To Markdown" },
  { href: "/docx-comments-extract", label: "Comments" },
] as const;

type ExtractTab = (typeof extractTabs)[number];
type CompareTab = (typeof compareTabs)[number];

type ExtractState = {
  html: HtmlConversionResult | null;
  markdown: MarkdownConversionResult | null;
  comments: CommentsResult | null;
  tracked: TrackedChangesResult | null;
  controls: ContentControlsResult | null;
  elements: DocumentElementsResult | null;
};

type CompareState = {
  compare: CompareResponse | null;
  tracked: TrackedChangesResult | null;
  redlineFile: File | null;
};

function createInitialExtractState(): ExtractState {
  return {
    html: null,
    markdown: null,
    comments: null,
    tracked: null,
    controls: null,
    elements: null,
  };
}

function createInitialCompareState(): CompareState {
  return {
    compare: null,
    tracked: null,
    redlineFile: null,
  };
}

function controlDraftMap(controls: ContentControlsResult["controls"]) {
  return Object.fromEntries(controls.map((control) => [control.id, control.text]));
}

function decodeBase64Docx(base64Value: string, name: string) {
  const binary = atob(base64Value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new File([bytes], name, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

async function readJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBase}${path}`, init);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

async function readSampleFile(sampleId: string, variant?: string) {
  const suffix = variant ? `?variant=${variant}` : "";
  const response = await fetch(`${apiBase}/v1/samples/${sampleId}${suffix}`);
  if (!response.ok) {
    throw new Error(`Unable to load sample ${sampleId}.`);
  }
  const blob = await response.blob();
  const inferredName =
    response.headers
      .get("Content-Disposition")
      ?.match(/filename="([^"]+)"/)?.[1] ?? `${sampleId}.docx`;

  return new File([blob], inferredName, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

function buildSingleFileForm(
  file: File,
  options?: Record<string, string | boolean>,
  fieldName = "file",
) {
  const formData = new FormData();
  formData.append(fieldName, file);
  Object.entries(options ?? {}).forEach(([key, value]) => {
    formData.append(key, typeof value === "boolean" ? String(value) : value);
  });
  return formData;
}

async function runTrackedInspection(file: File) {
  return readJson<TrackedChangesResult>("/v1/tracked", {
    method: "POST",
    body: buildSingleFileForm(file),
  });
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function downloadText(contents: string, fileName: string, contentType = "text/plain;charset=utf-8") {
  downloadBlob(new Blob([contents], { type: contentType }), fileName);
}

function FileSlot({
  title,
  helper,
  file,
  onChange,
  onClear,
}: {
  title: string;
  helper: string;
  file: File | null;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <label className="group flex min-h-52 cursor-pointer flex-col justify-between rounded-[30px] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] hover:-translate-y-0.5 hover:border-[color:var(--accent-soft)] hover:shadow-[0_24px_60px_rgba(143,90,54,0.15)]">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent-2)]">
          {title}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
          <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1">
            {file ? "Loaded" : "Awaiting file"}
          </span>
          <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1">
            DOCX only
          </span>
        </div>
        <h3 className="mt-4 text-3xl leading-tight text-[color:var(--ink)]">
          {file ? file.name : "Add a DOCX file"}
        </h3>
        <p className="mt-4 max-w-md text-base leading-7 text-[color:var(--ink-muted)]">
          {file ? `${formatBytes(file.size)} ready for processing.` : helper}
        </p>
      </div>
      <div className="mt-8 flex items-center justify-between gap-3 text-sm text-[color:var(--ink-muted)]">
        <span>{file ? "Click here to replace this DOCX." : "Click to browse, drag a DOCX here, or use a sample."}</span>
        <div className="flex items-center gap-2">
          {file ? (
            <button
              className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs uppercase tracking-[0.18em]"
              onClick={(event) => {
                event.preventDefault();
                onClear();
              }}
              type="button"
            >
              Clear
            </button>
          ) : null}
          <span className="rounded-full border border-[color:var(--line)] px-3 py-1 font-mono text-xs uppercase tracking-[0.18em]">
            DOCX
          </span>
        </div>
      </div>
      <input
        className="sr-only"
        type="file"
        accept=".docx"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function TabStrip<T extends string>({
  tabs,
  active,
  onSelect,
  availability,
}: {
  tabs: readonly T[];
  active: T;
  onSelect: (tab: T) => void;
  availability?: Partial<Record<T, boolean>>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
            active === tab
              ? "border-transparent bg-[color:var(--accent)] text-white shadow-[0_12px_30px_rgba(159,42,29,0.25)]"
              : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--ink-muted)]"
          }`}
          onClick={() => onSelect(tab)}
          type="button"
        >
          <span>{tab}</span>
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${
              availability?.[tab]
                ? active === tab
                  ? "bg-white/90"
                  : "bg-[color:var(--accent)]"
                : active === tab
                  ? "bg-white/40"
                  : "bg-[color:var(--line)]"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function Surface({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-4">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-xl leading-tight text-[color:var(--ink)]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MetricPills({ items }: { items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function WorkflowStatus({
  items,
}: {
  items: Array<{ label: string; value: string; tone: "ready" | "pending" }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-3xl border px-4 py-4 ${
            item.tone === "ready"
              ? "border-[color:var(--accent-soft)] bg-white/80"
              : "border-[color:var(--line)] bg-[color:var(--surface)]"
          }`}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
            {item.label}
          </p>
          <p className="mt-2 text-sm font-medium text-[color:var(--ink)]">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function RenderComments({
  comments,
  depth = 0,
}: {
  comments: CommentsResult["comments"];
  depth?: number;
}) {
  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <article
          key={`${comment.id}-${depth}`}
          className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
          style={{ marginLeft: depth * 18 }}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
            <span>{comment.author || "Unknown"}</span>
            <span>{comment.date || "unknown date"}</span>
            <span>{comment.resolved ? "resolved" : "open"}</span>
          </div>
          {comment.quoted_text ? (
            <blockquote className="mt-3 border-l-2 border-[color:var(--accent-soft)] pl-3 text-sm italic text-[color:var(--ink-muted)]">
              {comment.quoted_text}
            </blockquote>
          ) : null}
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--ink)]">
            {comment.text}
          </p>
          {comment.replies.length ? (
            <div className="mt-4">
              <RenderComments comments={comment.replies} depth={depth + 1} />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function ChangeList({
  changes,
  onAccept,
  onReject,
  disabled,
}: {
  changes: TrackedChange[];
  onAccept?: (changeId: string) => void;
  onReject?: (changeId: string) => void;
  disabled?: boolean;
}) {
  if (!changes.length) {
    return <p className="text-sm text-[color:var(--ink-muted)]">No tracked changes detected.</p>;
  }

  return (
    <div className="space-y-3">
      {changes.map((change) => (
        <article
          key={change.id}
          className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                <span>{change.kind}</span>
                <span>{change.author || "Unknown"}</span>
                <span>{change.date || "unknown date"}</span>
              </div>
              <p className="text-sm leading-6 text-[color:var(--ink)]">{change.text || "(format change)"}</p>
            </div>
            {onAccept && onReject ? (
              <div className="flex gap-2">
                <button
                  className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)] disabled:opacity-50"
                  disabled={disabled}
                  onClick={() => onReject(change.id)}
                  type="button"
                >
                  Reject
                </button>
                <button
                  className="rounded-full bg-[color:var(--accent)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-white disabled:opacity-50"
                  disabled={disabled}
                  onClick={() => onAccept(change.id)}
                  type="button"
                >
                  Accept
                </button>
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function PlaygroundShell({
  initialMode = "extract",
  initialExtractTab = "HTML",
  initialCompareTab = "Redline",
  visibleExtractTabs = extractTabs,
  visibleCompareTabs = compareTabs,
  visibleSampleIds,
  showModeToggle = true,
  showExtractConversionControls = true,
  extractOptionsTitle = "Conversion controls",
  extractOptionsDescription = "Leave the defaults in place for a straight conversion, or adjust the style map when you need more specific heading and paragraph output.",
  extractFileTitle = "Primary file",
  extractFileHelper = "One file unlocks conversions, comments, tracked changes, controls, assets, and document parts.",
  extractRunLabel = "Run extract",
  extractLoadingLabel = "Running extract...",
  extractStatusFileLabel = "DOCX",
  extractStatusRunLabel = "Run",
  extractStatusOutputLabel = "Output",
  extractStatusFileReadyValue = "File loaded",
  extractStatusFileIdleValue = "Awaiting file",
  extractStatusRunReadyValue = "Ready to run",
  extractStatusRunIdleValue = "Needs file",
  extractStatusOutputReadyValue = "Results ready",
  extractStatusOutputIdleValue = "No output yet",
  extractOutputTitle = "Extract output",
  extractOutputDescription = "Start with HTML or Markdown, then switch into comments, tracked changes, controls, assets, and document parts.",
  extractEmptyState = "Run the extract workflow to populate HTML, Markdown, comments, tracked changes, content controls, assets, and document-element viewers.",
  extractReadyMessage = "Ready to run on the selected DOCX.",
  extractIdleMessage = "Choose one DOCX or load a sample to enable extract.",
  compareOriginalTitle = "Original version",
  compareOriginalHelper = "Use the earlier draft or load the compare sample as the baseline.",
  compareRevisedTitle = "Revised version",
  compareRevisedHelper = "Add the newer draft to generate a redline and side-by-side HTML diff.",
  compareRunLabel = "Run compare",
  compareLoadingLabel = "Comparing...",
  compareStatusOriginalLabel = "Original",
  compareStatusRevisedLabel = "Revised",
  compareStatusOutputLabel = "Output",
  compareStatusOriginalReadyValue = "Loaded",
  compareStatusOriginalIdleValue = "Missing",
  compareStatusRevisedReadyValue = "Loaded",
  compareStatusRevisedIdleValue = "Missing",
  compareStatusOutputReadyValue = "Results ready",
  compareStatusOutputIdleValue = "No output yet",
  compareStatusOutputLoadingValue = "Building redline",
  compareReadyMessage = "Ready to generate the redline DOCX, side-by-side diff, and change list.",
  compareIdleMessage = "Choose both the original and revised DOCX files to enable compare.",
  compareOutputTitle = "Compare outputs",
  compareOutputDescription = "Download the redline DOCX, inspect the HTML diff, or work through the change list.",
  compareEmptyState = "Run compare to generate a redline DOCX, side-by-side HTML diff, and per-change actions.",
  preferredSampleId,
  heroEyebrow = "DocxRedline",
  heroTitle = "Word-style redlines without opening Word.",
  heroDescription = "Upload one DOCX to extract content, or upload two DOCX files to generate a redline, inspect tracked changes, and export the result straight away.",
  sidebarTitle = "The interface stays focused on the file, the worker run, and the output.",
  sidebarItems = [
    "Extract mode exposes conversions, comments, controls, assets, and document parts in one pass.",
    "Compare mode keeps the redline, diff, and change decisions in one place.",
    "Each sample card loads a real DOCX fixture from the worker so the path is testable end to end.",
  ],
  workflowTitle = "Choose the route, add the DOCX, run once, then review the output.",
  workflowSteps = [
    "1. Pick extract or compare",
    "2. Use your DOCX or a sample",
    "3. Download or inspect the result",
  ],
  suggestedSampleButtonLabel = "Load suggested sample",
}: {
  initialMode?: "extract" | "compare";
  initialExtractTab?: ExtractTab;
  initialCompareTab?: CompareTab;
  visibleExtractTabs?: readonly ExtractTab[];
  visibleCompareTabs?: readonly CompareTab[];
  visibleSampleIds?: readonly string[];
  showModeToggle?: boolean;
  showExtractConversionControls?: boolean;
  extractOptionsTitle?: string;
  extractOptionsDescription?: string;
  extractFileTitle?: string;
  extractFileHelper?: string;
  extractRunLabel?: string;
  extractLoadingLabel?: string;
  extractStatusFileLabel?: string;
  extractStatusRunLabel?: string;
  extractStatusOutputLabel?: string;
  extractStatusFileReadyValue?: string;
  extractStatusFileIdleValue?: string;
  extractStatusRunReadyValue?: string;
  extractStatusRunIdleValue?: string;
  extractStatusOutputReadyValue?: string;
  extractStatusOutputIdleValue?: string;
  extractOutputTitle?: string;
  extractOutputDescription?: string;
  extractEmptyState?: string;
  extractReadyMessage?: string;
  extractIdleMessage?: string;
  compareOriginalTitle?: string;
  compareOriginalHelper?: string;
  compareRevisedTitle?: string;
  compareRevisedHelper?: string;
  compareRunLabel?: string;
  compareLoadingLabel?: string;
  compareStatusOriginalLabel?: string;
  compareStatusRevisedLabel?: string;
  compareStatusOutputLabel?: string;
  compareStatusOriginalReadyValue?: string;
  compareStatusOriginalIdleValue?: string;
  compareStatusRevisedReadyValue?: string;
  compareStatusRevisedIdleValue?: string;
  compareStatusOutputReadyValue?: string;
  compareStatusOutputIdleValue?: string;
  compareStatusOutputLoadingValue?: string;
  compareReadyMessage?: string;
  compareIdleMessage?: string;
  compareOutputTitle?: string;
  compareOutputDescription?: string;
  compareEmptyState?: string;
  preferredSampleId?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  sidebarTitle?: string;
  sidebarItems?: string[];
  workflowTitle?: string;
  workflowSteps?: string[];
  suggestedSampleButtonLabel?: string;
}) {
  const [mode, setMode] = useState<"extract" | "compare">(initialMode);
  const [extractTab, setExtractTab] = useState<ExtractTab>(initialExtractTab);
  const [compareTab, setCompareTab] = useState<CompareTab>(initialCompareTab);
  const [samples, setSamples] = useState<SampleDocument[]>(fallbackSamples);
  const [workerMeta, setWorkerMeta] = useState<WorkerMeta | null>(null);
  const [extractFile, setExtractFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [revisedFile, setRevisedFile] = useState<File | null>(null);
  const [extractState, setExtractState] = useState<ExtractState>(createInitialExtractState);
  const [compareState, setCompareState] = useState<CompareState>(createInitialCompareState);
  const [styleMap, setStyleMap] = useState("p[style-name='Heading 1'] => h1:fresh");
  const [normalizeLists, setNormalizeLists] = useState(true);
  const [sampleLoadingId, setSampleLoadingId] = useState<string | null>(null);
  const [extractLoading, setExtractLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pathname = usePathname();
  const [controlDrafts, setControlDrafts] = useState<Record<string, string>>({});
  const extractReady = Boolean(extractFile);
  const compareReady = Boolean(originalFile && revisedFile);

  const hasExtractResults = Boolean(
    extractState.html ||
      extractState.markdown ||
      extractState.comments ||
      extractState.tracked ||
      extractState.controls ||
      extractState.elements,
  );
  const extractSummary = hasExtractResults
    ? [
        formatCount(extractState.html?.images.length ?? 0, "image"),
        formatCount(extractState.comments?.comments.length ?? 0, "thread"),
        formatCount(extractState.tracked?.changes.length ?? 0, "change"),
        formatCount(extractState.controls?.controls.length ?? 0, "control"),
      ]
    : [];

  const compareSummary = compareState.compare
    ? [
        formatCount(compareState.compare.changes.length, "change"),
        formatCount(compareState.compare.panes.length, "pane"),
        compareState.redlineFile ? "redline ready" : "redline pending",
      ]
    : [];
  const changedControlValues = extractState.controls?.controls
    ? Object.fromEntries(
        extractState.controls.controls
          .map((control) => [control.id, controlDrafts[control.id] ?? control.text, control.text] as const)
          .filter(([, nextValue, originalValue]) => nextValue !== originalValue)
          .map(([id, nextValue]) => [id, nextValue]),
      )
    : {};
  const controlChangesCount = Object.keys(changedControlValues).length;
  const extractTabStatus: Record<ExtractTab, boolean> = {
    HTML: Boolean(extractState.html),
    Markdown: Boolean(extractState.markdown),
    Comments: Boolean(extractState.comments),
    Tracked: Boolean(extractState.tracked),
    Controls: Boolean(extractState.controls),
    Assets: Boolean(extractState.html || extractState.elements),
    Elements: Boolean(extractState.elements),
  };
  const compareTabStatus: Record<CompareTab, boolean> = {
    Redline: Boolean(compareState.compare),
    Diff: Boolean(compareState.compare?.panes.length),
    Changes: Boolean(compareState.tracked?.changes.length || compareState.compare?.changes.length),
  };
  const scopedSamples = visibleSampleIds?.length
    ? samples.filter((sample) => visibleSampleIds.includes(sample.id))
    : samples;
  const orderedSamples = [...scopedSamples].sort((left, right) => {
    if (!preferredSampleId) {
      return 0;
    }
    if (left.id === preferredSampleId) {
      return -1;
    }
    if (right.id === preferredSampleId) {
      return 1;
    }
    return 0;
  });
  const preferredSample = preferredSampleId
    ? orderedSamples.find((sample) => sample.id === preferredSampleId) ?? null
    : null;
  const sidebarSamples = preferredSample
    ? orderedSamples.filter((sample) => sample.id !== preferredSample.id)
    : orderedSamples;

  useEffect(() => {
    const controller = new AbortController();
    readJson<{ samples: SampleDocument[] }>("/v1/samples", {
      signal: controller.signal,
    })
      .then((payload) => {
        if (payload.samples?.length) {
          setSamples(payload.samples);
        }
      })
      .catch(() => {
        // Fallback samples remain available offline.
      });

    readJson<WorkerMeta>("/v1/meta", {
      signal: controller.signal,
    })
      .then((payload) => {
        setWorkerMeta(payload);
      })
      .catch(() => {
        // Meta stays optional in the UI.
      });

    return () => controller.abort();
  }, []);

  function handleModeChange(nextMode: "extract" | "compare") {
    setErrorMessage(null);
    setMode(nextMode);
  }

  function handleExtractFileChange(file: File | null) {
    setErrorMessage(null);
    setExtractFile(file);
    setExtractState(createInitialExtractState());
    setControlDrafts({});
  }

  function handleOriginalFileChange(file: File | null) {
    setErrorMessage(null);
    setOriginalFile(file);
    setCompareState(createInitialCompareState());
  }

  function handleRevisedFileChange(file: File | null) {
    setErrorMessage(null);
    setRevisedFile(file);
    setCompareState(createInitialCompareState());
  }

  function resetExtractWorkspace() {
    setErrorMessage(null);
    setExtractFile(null);
    setExtractState(createInitialExtractState());
    setControlDrafts({});
  }

  function resetCompareWorkspace() {
    setErrorMessage(null);
    setOriginalFile(null);
    setRevisedFile(null);
    setCompareState(createInitialCompareState());
  }

  async function handleSampleLoad(sample: SampleDocument) {
    setErrorMessage(null);
    setSampleLoadingId(sample.id);

    try {
      if (sample.recommended_mode === "compare") {
        const [original, revised] = await Promise.all([
          readSampleFile(sample.id, "original"),
          readSampleFile(sample.id, "revised"),
        ]);
        startTransition(() => {
          setMode("compare");
          setOriginalFile(original);
          setRevisedFile(revised);
          setCompareState(createInitialCompareState());
        });
      } else {
        const file = await readSampleFile(sample.id);
        startTransition(() => {
          setMode("extract");
          setExtractFile(file);
          setExtractState(createInitialExtractState());
          setControlDrafts({});
        });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load sample.");
    } finally {
      setSampleLoadingId(null);
    }
  }

  async function handleExtractRun() {
    if (!extractFile) {
      setErrorMessage("Select a DOCX file or load an extract sample first.");
      return;
    }

    setErrorMessage(null);
    setExtractLoading(true);

    try {
      const [htmlResult, markdownResult, commentsResult, trackedResult, controlsResult, elementsResult] =
        await Promise.all([
          readJson<HtmlConversionResult>("/v1/to-html", {
            method: "POST",
            body: buildSingleFileForm(extractFile, {
              style_map: styleMap,
              normalize_lists: normalizeLists,
            }),
          }),
          readJson<MarkdownConversionResult>("/v1/to-markdown", {
            method: "POST",
            body: buildSingleFileForm(extractFile, {
              style_map: styleMap,
              normalize_lists: normalizeLists,
            }),
          }),
          readJson<CommentsResult>("/v1/comments", {
            method: "POST",
            body: buildSingleFileForm(extractFile),
          }),
          readJson<TrackedChangesResult>("/v1/tracked", {
            method: "POST",
            body: buildSingleFileForm(extractFile),
          }),
          readJson<ContentControlsResult>("/v1/controls", {
            method: "POST",
            body: buildSingleFileForm(extractFile),
          }),
          readJson<DocumentElementsResult>("/v1/elements", {
            method: "POST",
            body: buildSingleFileForm(extractFile),
          }),
        ]);

      startTransition(() => {
        setExtractState({
          html: htmlResult,
          markdown: markdownResult,
          comments: commentsResult,
          tracked: trackedResult,
          controls: controlsResult,
          elements: elementsResult,
        });
        setControlDrafts(controlDraftMap(controlsResult.controls));
        setExtractTab("HTML");
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Extract workflow failed.");
    } finally {
      setExtractLoading(false);
    }
  }

  async function handleCompareRun() {
    if (!originalFile || !revisedFile) {
      setErrorMessage("Load both the original and revised DOCX files before comparing.");
      return;
    }

    setErrorMessage(null);
    setCompareLoading(true);

    try {
      const compareForm = new FormData();
      compareForm.append("original", originalFile);
      compareForm.append("revised", revisedFile);
      const compareResult = await readJson<CompareResponse>("/v1/compare", {
        method: "POST",
        body: compareForm,
      });

      const redlineFile = decodeBase64Docx(compareResult.redline_docx_base64, "docx-redline.docx");
      const trackedResult = await runTrackedInspection(redlineFile);

      startTransition(() => {
        setCompareState({
          compare: compareResult,
          tracked: trackedResult,
          redlineFile,
        });
        setCompareTab("Redline");
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Compare workflow failed.");
    } finally {
      setCompareLoading(false);
    }
  }

  async function mutateRedline(action: "accept" | "reject", changeId?: string) {
    if (!compareState.redlineFile) {
      return;
    }

    setErrorMessage(null);
    setMutationLoading(true);

    try {
      const formData = buildSingleFileForm(compareState.redlineFile, {
        action,
      });
      if (changeId) {
        formData.append("change_ids", JSON.stringify([changeId]));
      }

      const mutation = await readJson<{ docx_base64: string }>("/v1/redline", {
        method: "POST",
        body: formData,
      });
      const nextRedlineFile = decodeBase64Docx(
        mutation.docx_base64,
        `docx-redline-${action}.docx`,
      );
      const trackedResult = await runTrackedInspection(nextRedlineFile);

      startTransition(() => {
        setCompareState((current) => ({
          compare: current.compare,
          tracked: trackedResult,
          redlineFile: nextRedlineFile,
        }));
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Redline mutation failed.");
    } finally {
      setMutationLoading(false);
    }
  }

  async function applyControlReplacements() {
    if (!extractFile || !extractState.controls?.controls.length || !controlChangesCount) {
      return;
    }

    setErrorMessage(null);
    setReplaceLoading(true);

    try {
      const formData = buildSingleFileForm(extractFile);
      formData.append("replacements", JSON.stringify(changedControlValues));
      const response = await readJson<ReplaceResponse>("/v1/replace", {
        method: "POST",
        body: formData,
      });
      const nextFileName = extractFile.name.replace(/\.docx$/i, "") || "docx-redline-controls";
      const nextFile = decodeBase64Docx(response.docx_base64, `${nextFileName}-updated.docx`);

      startTransition(() => {
        setExtractFile(nextFile);
        setExtractState({
          html: null,
          markdown: null,
          comments: null,
          tracked: null,
          controls: { controls: response.controls },
          elements: null,
        });
        setControlDrafts(controlDraftMap(response.controls));
        setExtractTab("Controls");
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Content-control replacement failed.");
    } finally {
      setReplaceLoading(false);
    }
  }

  function renderExtractContent() {
    if (!hasExtractResults) {
      return (
        <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
          {extractEmptyState}
        </p>
      );
    }

    if (!extractTabStatus[extractTab]) {
      return (
        <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
          This tab reflects the last full extract run. Re-run extract on the current DOCX to refresh
          {extractTab === "Assets" ? " assets and embedded objects." : ` ${extractTab.toLowerCase()} output.`}
        </p>
      );
    }

    switch (extractTab) {
      case "HTML":
        return (
          <div
            className="prose max-w-none text-sm leading-7 text-[color:var(--ink)]"
            dangerouslySetInnerHTML={{ __html: extractState.html?.html ?? "" }}
          />
        );
      case "Markdown":
        return (
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl bg-[#221b18] p-4 font-mono text-sm text-[#f9f3ea]">
            {extractState.markdown?.markdown}
          </pre>
        );
      case "Comments":
        return extractState.comments?.comments.length ? (
          <RenderComments comments={extractState.comments.comments} />
        ) : (
          <p className="text-sm text-[color:var(--ink-muted)]">No comments found in this document.</p>
        );
      case "Tracked":
        return <ChangeList changes={extractState.tracked?.changes ?? []} />;
      case "Controls":
        return extractState.controls?.controls.length ? (
          <div className="space-y-3">
            {!extractState.html ? (
              <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-3 text-sm text-[color:var(--ink-muted)]">
                Content controls reflect the latest replacement state. Re-run extract if you want
                refreshed HTML, Markdown, comments, and other tabs from the updated DOCX.
              </div>
            ) : null}
            {extractState.controls.controls.map((control) => (
              <article
                key={control.id}
                className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
              >
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                  <span>{control.control_type}</span>
                  <span>{control.id}</span>
                  {control.tag ? <span>{control.tag}</span> : null}
                </div>
                <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">
                  {control.title || "Untitled control"}
                </p>
                <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
                  Current value: {control.text || "(empty)"}
                </p>
                <label className="mt-3 block text-sm text-[color:var(--ink-muted)]">
                  <span className="font-medium text-[color:var(--ink)]">Replacement text</span>
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--ink)]"
                    onChange={(event) =>
                      setControlDrafts((current) => ({
                        ...current,
                        [control.id]: event.target.value,
                      }))
                    }
                    value={controlDrafts[control.id] ?? control.text}
                  />
                </label>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--ink-muted)]">No structured document tags found.</p>
        );
      case "Assets":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {(extractState.html?.images ?? []).map((image) => (
              <article
                key={image.name}
                className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
              >
                <Image
                  alt={image.name}
                  className="h-36 w-full rounded-xl border border-[color:var(--line)] object-contain bg-[#fffaf4]"
                  height={144}
                  src={`data:${image.content_type};base64,${image.data_base64}`}
                  unoptimized
                  width={320}
                />
                <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">{image.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                  {formatBytes(image.size_bytes)}
                </p>
              </article>
            ))}
            {extractState.elements?.embedded_objects.map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
              >
                <p className="text-sm font-semibold text-[color:var(--ink)]">{item.name}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                  {item.content_type}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                  {formatBytes(item.size_bytes)}
                </p>
              </article>
            ))}
          </div>
        );
      case "Elements":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: "Headers", items: extractState.elements?.headers ?? [] },
              { title: "Footers", items: extractState.elements?.footers ?? [] },
              { title: "Footnotes", items: extractState.elements?.footnotes ?? [] },
              { title: "Endnotes", items: extractState.elements?.endnotes ?? [] },
            ].map((group) => (
              <Surface key={group.title} eyebrow="Document part" title={group.title}>
                {group.items.length ? (
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <article
                        key={item.name}
                        className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-3"
                      >
                        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                          {item.name}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--ink)]">
                          {item.text}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[color:var(--ink-muted)]">No entries in this section.</p>
                )}
              </Surface>
            ))}
          </div>
        );
      default:
        return null;
    }
  }

  function renderExtractActions() {
    if (!hasExtractResults) {
      return null;
    }

    if (!extractTabStatus[extractTab]) {
      return null;
    }

    if (extractTab === "HTML" && extractState.html) {
      return (
        <button
          className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm text-[color:var(--ink-muted)]"
          onClick={() => downloadText(extractState.html!.html, "docx-redline-export.html", "text/html;charset=utf-8")}
          type="button"
        >
          Download HTML
        </button>
      );
    }

    if (extractTab === "Markdown" && extractState.markdown) {
      return (
        <button
          className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm text-[color:var(--ink-muted)]"
          onClick={() => downloadText(extractState.markdown!.markdown, "docx-redline-export.md", "text/markdown;charset=utf-8")}
          type="button"
        >
          Download Markdown
        </button>
      );
    }

    if (extractTab === "Comments" && extractState.comments) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm text-[color:var(--ink-muted)]"
            onClick={() =>
              downloadText(
                JSON.stringify(extractState.comments!.comments, null, 2),
                "docx-redline-comments.json",
                "application/json;charset=utf-8",
              )
            }
            type="button"
          >
            Download JSON
          </button>
          <button
            className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm text-[color:var(--ink-muted)]"
            onClick={() =>
              downloadText(
                extractState.comments!.markdown,
                "docx-redline-comments.md",
                "text/markdown;charset=utf-8",
              )
            }
            type="button"
          >
            Download Markdown
          </button>
        </div>
      );
    }

    if (extractTab === "Controls" && extractState.controls?.controls.length && extractFile) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm text-[color:var(--ink-muted)] disabled:opacity-50"
            disabled={!controlChangesCount || replaceLoading}
            onClick={() => void applyControlReplacements()}
            type="button"
          >
            {replaceLoading ? "Applying changes..." : "Apply replacements"}
          </button>
          <button
            className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm text-[color:var(--ink-muted)]"
            onClick={() => downloadBlob(extractFile, extractFile.name)}
            type="button"
          >
            Download current DOCX
          </button>
        </div>
      );
    }

    return null;
  }

  function renderCompareContent() {
    if (!compareState.compare) {
      return (
        <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
          {compareEmptyState}
        </p>
      );
    }

    if (compareTab === "Redline") {
      return (
        <div className="space-y-4">
          <div className="rounded-3xl border border-[color:var(--line)] bg-white/75 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--accent-2)]">
                  Redline actions
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-muted)]">
                  Export the current redline as DOCX, or apply a bulk decision before you download.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
                  disabled={!compareState.redlineFile}
                  onClick={() => {
                    if (compareState.redlineFile) {
                      downloadBlob(compareState.redlineFile, compareState.redlineFile.name);
                    }
                  }}
                  type="button"
                >
                  Download redline DOCX
                </button>
                <button
                  className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm text-[color:var(--ink-muted)] disabled:opacity-50"
                  disabled={mutationLoading}
                  onClick={() => mutateRedline("accept")}
                  type="button"
                >
                  Accept all
                </button>
                <button
                  className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm text-[color:var(--ink-muted)] disabled:opacity-50"
                  disabled={mutationLoading}
                  onClick={() => mutateRedline("reject")}
                  type="button"
                >
                  Reject all
                </button>
              </div>
            </div>
          </div>
          <div
            className="rounded-3xl border border-[color:var(--line)] bg-white/80 p-4"
            dangerouslySetInnerHTML={{ __html: compareState.compare.html_diff }}
          />
        </div>
      );
    }

    if (compareTab === "Diff") {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {compareState.compare.panes.map((pane) => (
            <Surface key={pane.title} eyebrow="HTML pane" title={pane.title}>
              <div
                className="prose max-w-none text-sm leading-7 text-[color:var(--ink)]"
                dangerouslySetInnerHTML={{ __html: pane.html }}
              />
            </Surface>
          ))}
        </div>
      );
    }

    return (
      <ChangeList
        changes={compareState.tracked?.changes ?? compareState.compare.changes}
        disabled={mutationLoading}
        onAccept={(changeId) => mutateRedline("accept", changeId)}
        onReject={(changeId) => mutateRedline("reject", changeId)}
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 pb-16 pt-6 sm:px-8 lg:px-10">
      <header className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--surface-elevated)] px-5 py-4 shadow-[0_28px_70px_rgba(50,35,19,0.08)] backdrop-blur md:px-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[color:var(--accent-2)]">
              {heroEyebrow}
            </p>
            <h1 className="mt-2 text-4xl leading-tight text-[color:var(--ink)] md:text-5xl">
              {heroTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--ink-muted)]">
              {heroDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a
              className="rounded-full border border-[color:var(--line)] px-4 py-2 text-[color:var(--ink-muted)] hover:border-[color:var(--accent-soft)] hover:text-[color:var(--ink)]"
              href="https://github.com/chayprabs/docx-redline-online"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <span className="rounded-full bg-[color:var(--surface)] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--accent-2)]">
              Worker-backed
            </span>
          </div>
        </div>
        <div className="mt-5 border-t border-[color:var(--line)] pt-4">
          <div className="flex flex-wrap gap-2">
            {workflowLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition-none ${
                    isActive
                      ? "bg-[color:var(--accent)] text-white shadow-[0_12px_30px_rgba(159,42,29,0.18)]"
                      : "border border-[color:var(--line)] bg-white/70 text-[color:var(--ink-muted)] hover:border-[color:var(--accent-soft)] hover:text-[color:var(--ink)]"
                  }`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <section className="grid gap-8 pt-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-[color:var(--line)] bg-[color:var(--surface-elevated)] p-6 shadow-[0_28px_90px_rgba(80,54,33,0.1)] md:p-8">
          <div className="flex flex-col gap-6 border-b border-[color:var(--line)] pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">
                Playground
              </p>
              <h2 className="mt-3 text-3xl leading-tight text-[color:var(--ink)]">
                {workflowTitle}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {workflowSteps.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[color:var(--line)] bg-white/75 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            {showModeToggle ? (
              <div className="grid grid-cols-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] p-1">
                <button
                  className={`rounded-full px-4 py-2 text-sm ${
                    mode === "extract"
                      ? "bg-[color:var(--accent)] text-white shadow-[0_14px_30px_rgba(159,42,29,0.22)]"
                      : "text-[color:var(--ink-muted)]"
                  }`}
                  onClick={() => handleModeChange("extract")}
                  type="button"
                >
                  Extract
                </button>
                <button
                  className={`rounded-full px-4 py-2 text-sm ${
                    mode === "compare"
                      ? "bg-[color:var(--accent-2)] text-white shadow-[0_14px_30px_rgba(22,74,104,0.18)]"
                      : "text-[color:var(--ink-muted)]"
                  }`}
                  onClick={() => handleModeChange("compare")}
                  type="button"
                >
                  Compare
                </button>
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-[#d68c76] bg-[#fff0eb] px-4 py-3 text-sm text-[#8a3325]">
              {errorMessage}
            </div>
          ) : null}

          {preferredSample ? (
            <div className="mt-6 rounded-[28px] border border-[color:var(--line)] bg-white/75 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent-2)]">
                    Suggested sample
                  </p>
                  <h3 className="mt-2 text-xl leading-tight text-[color:var(--ink)]">
                    {preferredSample.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-muted)]">
                    {preferredSample.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                    <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-1">
                      {preferredSample.recommended_mode === "compare" ? "Loads two DOCX files" : "Loads one DOCX file"}
                    </span>
                    <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-1">
                      Route-matched fixture
                    </span>
                  </div>
                </div>
                <button
                  className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
                  disabled={sampleLoadingId === preferredSample.id}
                  onClick={() => void handleSampleLoad(preferredSample)}
                  type="button"
                >
                  {sampleLoadingId === preferredSample.id ? "Loading sample..." : suggestedSampleButtonLabel}
                </button>
              </div>
            </div>
          ) : null}

          {mode === "extract" ? (
            <>
              <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <FileSlot
                  title={extractFileTitle}
                  helper={extractFileHelper}
                  file={extractFile}
                  onChange={handleExtractFileChange}
                  onClear={() => handleExtractFileChange(null)}
                />
                <Surface eyebrow="Options" title={extractOptionsTitle}>
                  <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
                    {extractOptionsDescription}
                  </p>
                  {showExtractConversionControls ? (
                    <>
                      <label className="block text-sm text-[color:var(--ink-muted)]">
                        <span className="font-medium text-[color:var(--ink)]">Style map</span>
                        <textarea
                          className="mt-2 min-h-28 w-full rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 font-mono text-sm text-[color:var(--ink)]"
                          onChange={(event) => setStyleMap(event.target.value)}
                          value={styleMap}
                        />
                      </label>
                      <label className="mt-4 flex items-start gap-3 text-sm text-[color:var(--ink-muted)]">
                        <input
                          checked={normalizeLists}
                          className="mt-1"
                          onChange={(event) => setNormalizeLists(event.target.checked)}
                          type="checkbox"
                        />
                        <span>
                          Normalize list output for cleaner HTML and Markdown exports.
                        </span>
                      </label>
                    </>
                  ) : null}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
                      disabled={extractLoading || !extractReady}
                      onClick={() => void handleExtractRun()}
                      type="button"
                    >
                      {extractLoading ? extractLoadingLabel : extractRunLabel}
                    </button>
                    <button
                      className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm text-[color:var(--ink-muted)] disabled:opacity-50"
                      disabled={!extractFile && !extractState.html}
                      onClick={resetExtractWorkspace}
                      type="button"
                    >
                      Clear workspace
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--ink-muted)]">
                    {extractReady
                      ? extractReadyMessage
                      : extractIdleMessage}
                  </p>
                </Surface>
              </div>

              <div className="mt-6">
                <WorkflowStatus
                  items={[
                    {
                      label: extractStatusFileLabel,
                      value: extractFile ? extractStatusFileReadyValue : extractStatusFileIdleValue,
                      tone: extractFile ? "ready" : "pending",
                    },
                    {
                      label: extractStatusRunLabel,
                      value: extractLoading
                        ? "Running extract"
                        : extractReady
                          ? extractStatusRunReadyValue
                          : extractStatusRunIdleValue,
                      tone: extractLoading || extractReady ? "ready" : "pending",
                    },
                    {
                      label: extractStatusOutputLabel,
                      value: hasExtractResults
                        ? extractStatusOutputReadyValue
                        : extractStatusOutputIdleValue,
                      tone: hasExtractResults ? "ready" : "pending",
                    },
                  ]}
                />
              </div>

              <div className="mt-6 rounded-[28px] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.5),rgba(255,248,240,0.9))] p-5">
                <div className="flex flex-col gap-3 border-b border-[color:var(--line)] pb-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent-2)]">
                      {extractOutputTitle}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
                      {extractOutputDescription}
                    </p>
                  </div>
                  <MetricPills items={extractSummary} />
                </div>
                <div className="mt-4">
                  <TabStrip
                    active={extractTab}
                    availability={extractTabStatus}
                    onSelect={setExtractTab}
                    tabs={visibleExtractTabs}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">{renderExtractActions()}</div>
                <div className="mt-5">{renderExtractContent()}</div>
              </div>
            </>
          ) : (
            <>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <FileSlot
                  title={compareOriginalTitle}
                  helper={compareOriginalHelper}
                  file={originalFile}
                  onChange={handleOriginalFileChange}
                  onClear={() => handleOriginalFileChange(null)}
                />
                <FileSlot
                  title={compareRevisedTitle}
                  helper={compareRevisedHelper}
                  file={revisedFile}
                  onChange={handleRevisedFileChange}
                  onClear={() => handleRevisedFileChange(null)}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  className="rounded-full bg-[color:var(--accent-2)] px-4 py-2 text-sm text-white disabled:opacity-50"
                  disabled={compareLoading || !compareReady}
                  onClick={() => void handleCompareRun()}
                  type="button"
                >
                  {compareLoading ? compareLoadingLabel : compareRunLabel}
                </button>
                <button
                  className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm text-[color:var(--ink-muted)] disabled:opacity-50"
                  disabled={(!originalFile && !revisedFile && !compareState.compare) || compareLoading}
                  onClick={resetCompareWorkspace}
                  type="button"
                >
                  Clear workspace
                </button>
                <span className="text-sm text-[color:var(--ink-muted)]">
                  {compareReady ? compareReadyMessage : compareIdleMessage}
                </span>
              </div>

              <div className="mt-6">
                <WorkflowStatus
                    items={[
                      {
                        label: compareStatusOriginalLabel,
                        value: originalFile
                          ? compareStatusOriginalReadyValue
                          : compareStatusOriginalIdleValue,
                      tone: originalFile ? "ready" : "pending",
                    },
                      {
                        label: compareStatusRevisedLabel,
                        value: revisedFile
                          ? compareStatusRevisedReadyValue
                          : compareStatusRevisedIdleValue,
                      tone: revisedFile ? "ready" : "pending",
                    },
                      {
                        label: compareStatusOutputLabel,
                        value: compareLoading
                          ? compareStatusOutputLoadingValue
                          : compareState.compare
                          ? compareStatusOutputReadyValue
                          : compareStatusOutputIdleValue,
                      tone: compareLoading || compareState.compare ? "ready" : "pending",
                    },
                  ]}
                />
              </div>

              <div className="mt-6 rounded-[28px] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.5),rgba(255,248,240,0.9))] p-5">
                <div className="flex flex-col gap-3 border-b border-[color:var(--line)] pb-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent-2)]">
                      {compareOutputTitle}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
                      {compareOutputDescription}
                    </p>
                  </div>
                  <MetricPills items={compareSummary} />
                </div>
                <div className="mt-4">
                  <TabStrip
                    active={compareTab}
                    availability={compareTabStatus}
                    onSelect={setCompareTab}
                    tabs={visibleCompareTabs}
                  />
                </div>
                <div className="mt-5">{renderCompareContent()}</div>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-5">
          {workerMeta ? (
            <section className="rounded-[32px] border border-[color:var(--line)] bg-[color:var(--surface-elevated)] p-6 shadow-[0_24px_70px_rgba(71,48,29,0.08)]">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--accent-2)]">
                Privacy and limits
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-[color:var(--line)] bg-white/70 p-4">
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    Upload size
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--ink-muted)]">
                    Up to {workerMeta.maxUploadMb} MB per file.
                  </p>
                </div>
                <div className="rounded-3xl border border-[color:var(--line)] bg-white/70 p-4">
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    Artifact retention
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--ink-muted)]">
                    Generated artifacts expire after {formatDuration(workerMeta.artifactTtlSeconds)}.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-[32px] border border-[color:var(--line)] bg-[linear-gradient(145deg,rgba(255,251,245,0.9),rgba(247,239,229,0.95))] p-6 shadow-[0_20px_60px_rgba(71,48,29,0.08)]">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">
              Route guide
            </p>
            <h2 className="mt-3 text-2xl leading-tight text-[color:var(--ink)]">
              {sidebarTitle}
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-[color:var(--ink-muted)]">
              {sidebarItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          {sidebarSamples.length ? (
            <section className="rounded-[32px] border border-[color:var(--line)] bg-[color:var(--surface-elevated)] p-6 shadow-[0_24px_70px_rgba(71,48,29,0.08)]">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--accent-2)]">
                Sample fixtures
              </p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--ink-muted)]">
                Use a fixture to validate the route quickly, then swap in your own DOCX.
              </p>
              <div className="mt-5 space-y-4">
                {sidebarSamples.map((sample) => (
                  <SampleCard
                    key={sample.id}
                    title={sample.title}
                    description={sample.description}
                    eyebrow="Built-in sample"
                    meta={
                      sample.recommended_mode === "compare"
                        ? "Two-file flow"
                        : "One-file flow"
                    }
                    accent={
                      sample.recommended_mode === "compare"
                        ? "linear-gradient(90deg, #9f2a1d, #cf6a43)"
                        : "linear-gradient(90deg, #164a68, #5d7f8a)"
                    }
                    footer={
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-[color:var(--ink-muted)]">
                          {sample.recommended_mode === "compare"
                            ? "Loads original and revised documents."
                            : "Loads one document into extract mode."}
                        </span>
                        <button
                          className="rounded-full bg-[color:var(--surface)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[color:var(--ink)] shadow-[0_8px_20px_rgba(71,48,29,0.08)] disabled:opacity-50"
                          disabled={sampleLoadingId === sample.id}
                          onClick={() => void handleSampleLoad(sample)}
                          type="button"
                        >
                          {sampleLoadingId === sample.id ? "Loading" : "Use sample"}
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

        </aside>
      </section>
    </main>
  );
}
