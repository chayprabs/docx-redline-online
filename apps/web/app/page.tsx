import Link from "next/link";

import { PlaygroundLauncher } from "../components/playground-launcher";

const workflowCards = [
  {
    href: "/docx-redline",
    title: "Redline two DOCX files",
    description: "Compare two documents, inspect tracked changes, and export the redline DOCX.",
  },
  {
    href: "/docx-comments-extract",
    title: "Extract comments",
    description: "Pull threads, replies, timestamps, and resolved state into JSON or Markdown.",
  },
  {
    href: "/docx-to-markdown",
    title: "Convert to Markdown",
    description: "Keep headings and lists cleaner with style maps and list-normalization controls.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 pb-16 pt-6 sm:px-8 lg:px-10">
      <section className="rounded-[34px] border border-[color:var(--line)] bg-[linear-gradient(145deg,rgba(255,251,245,0.95),rgba(246,235,220,0.78))] px-6 py-8 shadow-[0_28px_70px_rgba(50,35,19,0.08)] md:px-10 md:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[color:var(--accent-2)]">
              DocxRedline
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[color:var(--ink)] md:text-6xl">
              Compare DOCX versions online and work the redline without Word.
            </h1>
            <p className="mt-4 text-base leading-8 text-[color:var(--ink-muted)]">
              Use one DOCX for extract tasks or two DOCX files for redline compare. The product is
              built around a short path: upload, run, review, export.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "1. Pick extract or compare",
                "2. Use your DOCX or a sample",
                "3. Review and export",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[color:var(--line)] bg-white/75 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3 text-sm md:min-w-72">
            <Link
              className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-center text-white shadow-[0_14px_30px_rgba(159,42,29,0.2)]"
              href="/docx-redline"
            >
              Open redline workflow
            </Link>
            <a
              className="rounded-full border border-[color:var(--line)] px-5 py-3 text-center text-[color:var(--ink-muted)] hover:border-[color:var(--accent-soft)] hover:text-[color:var(--ink)]"
              href="https://github.com/chayprabs/docx-redline-online"
              rel="noreferrer"
              target="_blank"
            >
              View GitHub repo
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pt-8 md:grid-cols-3">
        {workflowCards.map((card) => (
          <Link
            key={card.href}
            className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface-elevated)] p-6 shadow-[0_20px_50px_rgba(71,48,29,0.08)] transition-transform hover:-translate-y-1"
            href={card.href}
          >
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-[color:var(--accent)]">
              Direct route
            </p>
            <h2 className="mt-3 text-2xl leading-tight text-[color:var(--ink)]">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--ink-muted)]">
              {card.description}
            </p>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 pt-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--surface-elevated)] p-6 shadow-[0_24px_60px_rgba(71,48,29,0.08)]">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent-2)]">
            What the tool covers
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "Compare two DOCX files and export a redline DOCX.",
              "Accept or reject tracked changes one by one or in bulk.",
              "Extract comments with replies, timestamps, and resolved state.",
              "Convert DOCX to clean HTML or Markdown with style maps.",
              "Inspect headers, footers, footnotes, endnotes, and assets.",
              "Replace content-control text safely in the browser.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-[color:var(--line)] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--ink-muted)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-[color:var(--line)] bg-[linear-gradient(160deg,rgba(22,74,104,0.92),rgba(9,34,52,0.96))] p-6 text-white shadow-[0_30px_80px_rgba(15,33,48,0.35)]">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/65">
            Best first clicks
          </p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-white/80">
            <p>Use the contract sample for redline compare and tracked-change actions.</p>
            <p>Use the manuscript sample for comments, replies, and resolved-state checks.</p>
            <p>Use the illustrated sample for HTML, Markdown, assets, and document parts.</p>
          </div>
        </div>
      </section>

      <section className="pt-8">
        <PlaygroundLauncher />
      </section>
    </main>
  );
}
