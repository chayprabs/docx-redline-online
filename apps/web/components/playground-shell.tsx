"use client";

import Image from "next/image";
import { startTransition, useEffect, useState, type ReactNode } from "react";
import { SampleCard } from "@docx-redline/shared-ui";
import type {
  CommentsResult,
  CompareResponse,
  ContentControlsResult,
  DocumentElementsResult,
  HtmlConversionResult,
  MarkdownConversionResult,
  SampleDocument,
  TrackedChange,
  TrackedChangesResult,
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

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
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
        <h3 className="mt-4 text-3xl leading-tight text-[color:var(--ink)]">
          {file ? file.name : "Drop DOCX or click to browse."}
        </h3>
        <p className="mt-4 max-w-md text-base leading-7 text-[color:var(--ink-muted)]">
          {file ? `${formatBytes(file.size)} ready for processing.` : helper}
        </p>
      </div>
      <div className="mt-8 flex items-center justify-between gap-3 text-sm text-[color:var(--ink-muted)]">
        <span>{file ? "Replace file or keep current selection" : "Drag, browse, or use a sample"}</span>
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
}: {
  tabs: readonly T[];
  active: T;
  onSelect: (tab: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`rounded-full border px-4 py-2 text-sm ${
            active === tab
              ? "border-transparent bg-[color:var(--accent)] text-white shadow-[0_12px_30px_rgba(159,42,29,0.25)]"
              : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--ink-muted)]"
          }`}
          onClick={() => onSelect(tab)}
          type="button"
        >
          {tab}
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

export function PlaygroundShell() {
  const [mode, setMode] = useState<"extract" | "compare">("extract");
  const [extractTab, setExtractTab] = useState<ExtractTab>("HTML");
  const [compareTab, setCompareTab] = useState<CompareTab>("Redline");
  const [samples, setSamples] = useState<SampleDocument[]>(fallbackSamples);
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    return () => controller.abort();
  }, []);

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

  function renderExtractContent() {
    if (!extractState.html) {
      return (
        <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
          Run the extract workflow to populate HTML, Markdown, comments, tracked changes,
          content controls, assets, and document-element viewers.
        </p>
      );
    }

    switch (extractTab) {
      case "HTML":
        return (
          <div
            className="prose max-w-none text-sm leading-7 text-[color:var(--ink)]"
            dangerouslySetInnerHTML={{ __html: extractState.html.html }}
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
                <p className="mt-2 text-sm text-[color:var(--ink-muted)]">{control.text || "(empty)"}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--ink-muted)]">No structured document tags found.</p>
        );
      case "Assets":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {extractState.html.images.map((image) => (
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

  function renderCompareContent() {
    if (!compareState.compare) {
      return (
        <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
          Run compare to generate a redline DOCX, side-by-side HTML diff, and per-change actions.
        </p>
      );
    }

    if (compareTab === "Redline") {
      return (
        <div className="space-y-4">
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
              DocxRedline
            </p>
            <h1 className="mt-2 text-4xl leading-tight text-[color:var(--ink)] md:text-5xl">
              Word-style redlines without opening Word.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--ink-muted)]">
              We can now run the real worker workflow from the page: convert DOCX to HTML or
              Markdown, inspect comments and controls, compare two versions, and accept or reject
              tracked changes on the generated redline.
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
            <div className="rounded-full border border-[color:var(--line)] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
              API {apiBase}
            </div>
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
                Extract clean HTML and Markdown, or compare two DOCX versions.
              </h2>
            </div>
            <div className="grid grid-cols-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] p-1">
              <button
                className={`rounded-full px-4 py-2 text-sm ${
                  mode === "extract"
                    ? "bg-[color:var(--accent)] text-white shadow-[0_14px_30px_rgba(159,42,29,0.22)]"
                    : "text-[color:var(--ink-muted)]"
                }`}
                onClick={() => setMode("extract")}
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
                onClick={() => setMode("compare")}
                type="button"
              >
                Compare
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-[#d68c76] bg-[#fff0eb] px-4 py-3 text-sm text-[#8a3325]">
              {errorMessage}
            </div>
          ) : null}

          {mode === "extract" ? (
            <>
              <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <FileSlot
                  title="Primary file"
                  helper="One file unlocks HTML, Markdown, comments, tracked changes, controls, assets, and document-part viewers."
                  file={extractFile}
                  onChange={(file) => setExtractFile(file)}
                  onClear={() => setExtractFile(null)}
                />
                <Surface eyebrow="Options" title="Conversion controls">
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
                  <button
                    className="mt-5 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
                    disabled={extractLoading}
                    onClick={() => void handleExtractRun()}
                    type="button"
                  >
                    {extractLoading ? "Running extract..." : "Run extract"}
                  </button>
                </Surface>
              </div>

              <div className="mt-6 rounded-[28px] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.5),rgba(255,248,240,0.9))] p-5">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent-2)]">
                  Result panes
                </p>
                <div className="mt-4">
                  <TabStrip active={extractTab} onSelect={setExtractTab} tabs={extractTabs} />
                </div>
                <div className="mt-5">{renderExtractContent()}</div>
              </div>
            </>
          ) : (
            <>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <FileSlot
                  title="Original version"
                  helper="Use the baseline contract or manuscript version as the source for compare."
                  file={originalFile}
                  onChange={(file) => setOriginalFile(file)}
                  onClear={() => setOriginalFile(null)}
                />
                <FileSlot
                  title="Revised version"
                  helper="Drop the revised DOCX to generate a redline and side-by-side HTML diff."
                  file={revisedFile}
                  onChange={(file) => setRevisedFile(file)}
                  onClear={() => setRevisedFile(null)}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  className="rounded-full bg-[color:var(--accent-2)] px-4 py-2 text-sm text-white disabled:opacity-50"
                  disabled={compareLoading}
                  onClick={() => void handleCompareRun()}
                  type="button"
                >
                  {compareLoading ? "Comparing..." : "Run compare"}
                </button>
                <span className="text-sm text-[color:var(--ink-muted)]">
                  After compare, we can inspect the generated redline and apply accept/reject changes in-place.
                </span>
              </div>

              <div className="mt-6 rounded-[28px] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.5),rgba(255,248,240,0.9))] p-5">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent-2)]">
                  Compare outputs
                </p>
                <div className="mt-4">
                  <TabStrip active={compareTab} onSelect={setCompareTab} tabs={compareTabs} />
                </div>
                <div className="mt-5">{renderCompareContent()}</div>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-[32px] border border-[color:var(--line)] bg-[color:var(--surface-elevated)] p-6 shadow-[0_24px_70px_rgba(71,48,29,0.08)]">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--accent-2)]">
              Sample fixtures
            </p>
            <div className="mt-5 space-y-4">
              {samples.map((sample) => (
                <SampleCard
                  key={sample.id}
                  title={sample.title}
                  description={sample.description}
                  accent={
                    sample.recommended_mode === "compare"
                      ? "linear-gradient(90deg, #9f2a1d, #cf6a43)"
                      : "linear-gradient(90deg, #164a68, #5d7f8a)"
                  }
                  footer={
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
                        {sample.recommended_mode}
                      </span>
                      <button
                        className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)] disabled:opacity-50"
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

          <section className="rounded-[32px] border border-[color:var(--line)] bg-[linear-gradient(160deg,rgba(22,74,104,0.92),rgba(9,34,52,0.96))] p-6 text-white shadow-[0_30px_80px_rgba(15,33,48,0.35)]">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/65">
              Release gate
            </p>
            <h2 className="mt-3 text-3xl leading-tight">
              We now have a real worker-backed playground, not just a landing shell.
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-white/75">
              <li>Extract mode calls the full worker stack and exposes every result pane.</li>
              <li>Compare mode generates a redline DOCX and lets us accept or reject tracked changes.</li>
              <li>Sample cards now load actual DOCX fixtures from the worker.</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
