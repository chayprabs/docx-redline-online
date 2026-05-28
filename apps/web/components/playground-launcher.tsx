"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const LazyPlaygroundShell = dynamic(
  () => import("./playground-shell").then((module) => module.PlaygroundShell),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--surface-elevated)] p-8 text-sm text-[color:var(--ink-muted)] shadow-[0_24px_60px_rgba(71,48,29,0.08)]">
        Loading the interactive playground...
      </div>
    ),
  },
);

export function PlaygroundLauncher() {
  const [mode, setMode] = useState<"extract" | "compare" | null>(null);

  if (mode) {
    return (
      <LazyPlaygroundShell
        key={mode}
        initialCompareTab="Redline"
        initialExtractTab="HTML"
        initialMode={mode}
      />
    );
  }

  return (
    <section className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--surface-elevated)] p-6 shadow-[0_24px_60px_rgba(71,48,29,0.08)] md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Playground
          </p>
          <h2 className="mt-3 text-3xl leading-tight text-[color:var(--ink)]">
            Open the workspace you need.
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-muted)]">
            Extract is the one-file path. Compare is the two-file path. Pick one and the shell
            opens directly into that workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm text-white shadow-[0_14px_30px_rgba(159,42,29,0.2)]"
            onClick={() => setMode("extract")}
            type="button"
          >
            Launch extract mode
          </button>
          <button
            className="rounded-full border border-[color:var(--line)] px-5 py-3 text-sm text-[color:var(--ink-muted)] hover:border-[color:var(--accent-soft)] hover:text-[color:var(--ink)]"
            onClick={() => setMode("compare")}
            type="button"
          >
            Launch compare mode
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 text-sm text-[color:var(--ink-muted)] md:grid-cols-2">
        {[
          {
            title: "Extract mode",
            detail: "One DOCX for HTML, Markdown, comments, controls, assets, and document parts.",
          },
          {
            title: "Compare mode",
            detail: "Two DOCX files for the redline DOCX, HTML diff, and accept or reject actions.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl border border-[color:var(--line)] bg-white/70 p-4">
            <p className="font-semibold text-[color:var(--ink)]">{item.title}</p>
            <p className="mt-2 leading-6">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
