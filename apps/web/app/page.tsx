import Link from "next/link";

import { PlaygroundLauncher } from "../components/playground-launcher";

const workflowCards = [
  {
    href: "/docx-redline",
    title: "Redline a DOCX",
    description: "Compare two Word documents, inspect tracked changes, and export a redline DOCX.",
  },
  {
    href: "/docx-comments-extract",
    title: "Extract comments",
    description: "Pull comment threads, replies, timestamps, and resolved state into JSON or Markdown.",
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
              DocxRedline is an open-source DOCX compare and extraction tool for redlines,
              tracked changes, comments, HTML conversion, Markdown conversion, and safe
              content-control replacement.
            </p>
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
              Workflow
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
            Included in v1
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-[color:var(--line)] bg-white/80 p-5">
              <h3 className="text-xl text-[color:var(--ink)]">DOCX compare</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-muted)]">
                Produce a redline DOCX, inspect inserts and deletions, and accept or reject all
                changes from the browser.
              </p>
            </div>
            <div className="rounded-3xl border border-[color:var(--line)] bg-white/80 p-5">
              <h3 className="text-xl text-[color:var(--ink)]">Comment extraction</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-muted)]">
                Export threaded comments with replies, authors, timestamps, quoted text, and
                resolved state.
              </p>
            </div>
            <div className="rounded-3xl border border-[color:var(--line)] bg-white/80 p-5">
              <h3 className="text-xl text-[color:var(--ink)]">HTML and Markdown</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-muted)]">
                Convert Word output into clean HTML or Markdown with list normalization and style
                maps.
              </p>
            </div>
            <div className="rounded-3xl border border-[color:var(--line)] bg-white/80 p-5">
              <h3 className="text-xl text-[color:var(--ink)]">Content controls</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-muted)]">
                Inspect structured document tags and safely replace tagged text while preserving
                surrounding formatting.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-[color:var(--line)] bg-[linear-gradient(160deg,rgba(22,74,104,0.92),rgba(9,34,52,0.96))] p-6 text-white shadow-[0_30px_80px_rgba(15,33,48,0.35)]">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/65">
            Sample fixtures
          </p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-white/80">
            <p>Contract draft with tracked changes and redline compare coverage.</p>
            <p>Manuscript review sample with comment threads, replies, and resolved notes.</p>
            <p>Illustrated generic DOCX with lists, headings, images, and document parts.</p>
          </div>
        </div>
      </section>

      <section className="pt-8">
        <PlaygroundLauncher />
      </section>
    </main>
  );
}
