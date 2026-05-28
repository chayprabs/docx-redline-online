"use client";

import { useState } from "react";
import { SampleCard } from "@docx-redline/shared-ui";

const samples = [
  {
    title: "Contract Draft",
    description:
      "Two legal drafts with insertions, deletions, and formatting changes for redline compare.",
    accent: "linear-gradient(90deg, #9f2a1d, #cf6a43)",
  },
  {
    title: "Manuscript Review",
    description:
      "A manuscript fixture with threaded comments, reply chains, and resolved discussions.",
    accent: "linear-gradient(90deg, #164a68, #5d7f8a)",
  },
  {
    title: "Illustrated Brief",
    description:
      "A generic DOCX with images and content controls to validate HTML and Markdown exports.",
    accent: "linear-gradient(90deg, #8b6b2a, #d1a659)",
  },
];

const extractTabs = [
  "HTML",
  "Markdown",
  "Comments",
  "Tracked",
  "Controls",
  "Assets",
];

const compareTabs = ["Redline DOCX", "Side-by-side HTML", "Changes", "Warnings"];

function FileSlot({
  title,
  helper,
}: {
  title: string;
  helper: string;
}) {
  return (
    <label className="group flex min-h-52 cursor-pointer flex-col justify-between rounded-[30px] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] hover:-translate-y-0.5 hover:border-[color:var(--accent-soft)] hover:shadow-[0_24px_60px_rgba(143,90,54,0.15)]">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent-2)]">
          {title}
        </p>
        <h3 className="mt-4 text-3xl leading-tight text-[color:var(--ink)]">
          Drop DOCX or click to browse.
        </h3>
        <p className="mt-4 max-w-md text-base leading-7 text-[color:var(--ink-muted)]">
          {helper}
        </p>
      </div>
      <div className="mt-8 flex items-center justify-between text-sm text-[color:var(--ink-muted)]">
        <span>Drag, browse, or paste a sample</span>
        <span className="rounded-full border border-[color:var(--line)] px-3 py-1 font-mono text-xs uppercase tracking-[0.18em]">
          DOCX
        </span>
      </div>
      <input className="sr-only" type="file" accept=".docx" />
    </label>
  );
}

function TabStrip({ tabs }: { tabs: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          className={`rounded-full border px-4 py-2 text-sm ${
            index === 0
              ? "border-transparent bg-[color:var(--accent)] text-white shadow-[0_12px_30px_rgba(159,42,29,0.25)]"
              : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--ink-muted)]"
          }`}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function PlaygroundShell() {
  const [mode, setMode] = useState<"extract" | "compare">("extract");

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
            <button
              className="rounded-full border border-[color:var(--line)] px-4 py-2 text-[color:var(--ink-muted)]"
              type="button"
            >
              Theme
            </button>
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

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <FileSlot
              title={mode === "extract" ? "Primary file" : "Original version"}
              helper={
                mode === "extract"
                  ? "One file unlocks HTML, Markdown, comments, tracked changes, controls, and assets."
                  : "Use the baseline contract or manuscript version as the source for compare."
              }
            />
            <FileSlot
              title={mode === "extract" ? "Optional sample" : "Revised version"}
              helper={
                mode === "extract"
                  ? "Load a fixture to test formatting preservation before bringing your own files."
                  : "Drop the revised DOCX to generate a redline and side-by-side HTML diff."
              }
            />
          </div>

          <div className="mt-6 rounded-[28px] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.5),rgba(255,248,240,0.9))] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent-2)]">
              Result panes
            </p>
            <div className="mt-4">
              <TabStrip tabs={mode === "extract" ? extractTabs : compareTabs} />
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">
                  Summary
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--ink-muted)]">
                  <li>Ephemeral uploads with signed artifact links and 15-minute TTL.</li>
                  <li>Per-change accept or reject controls are surfaced beside the redline list.</li>
                  <li>Comments include reply chains and resolved state for export to JSON or Markdown.</li>
                </ul>
              </div>
              <div className="rounded-[24px] border border-[color:var(--line)] bg-[#f8f1e8] p-4">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent-2)]">
                  Expected outputs
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    "Clean HTML with images",
                    "Markdown with style maps",
                    "Tracked-change inspector",
                    "Structured content controls",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[32px] border border-[color:var(--line)] bg-[color:var(--surface-elevated)] p-6 shadow-[0_24px_70px_rgba(71,48,29,0.08)]">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--accent-2)]">
              Sample fixtures
            </p>
            <div className="mt-5 space-y-4">
              {samples.map((sample) => (
                <SampleCard key={sample.title} {...sample} />
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-[color:var(--line)] bg-[linear-gradient(160deg,rgba(22,74,104,0.92),rgba(9,34,52,0.96))] p-6 text-white shadow-[0_30px_80px_rgba(15,33,48,0.35)]">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/65">
              Release gate
            </p>
            <h2 className="mt-3 text-3xl leading-tight">
              Qualification is tied to Section 23, not visual polish alone.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/75">
              Current scaffold covers the Pattern 1 repo shape, AGPL licensing, CI placeholders,
              and the user-facing Extract/Compare shell. Worker endpoints and fixture-backed
              features are next.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
