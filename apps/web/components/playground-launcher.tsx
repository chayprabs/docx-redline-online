import Link from "next/link";

const routeCards = [
  {
    href: "/docx-redline",
    title: "Redline",
    detail: "Compare two DOCX files, inspect the redline, and export the result.",
    tone: "bg-[color:var(--accent)] text-white shadow-[0_18px_40px_rgba(159,42,29,0.22)]",
  },
  {
    href: "/docx-compare",
    title: "Compare view",
    detail: "Open the side-by-side diff route directly when review is the main task.",
    tone: "border border-[color:var(--line)] bg-white/80 text-[color:var(--ink)]",
  },
  {
    href: "/docx-comments-extract",
    title: "Comments",
    detail: "Extract threads, replies, timestamps, and resolved state from one DOCX.",
    tone: "border border-[color:var(--line)] bg-white/80 text-[color:var(--ink)]",
  },
  {
    href: "/docx-to-html",
    title: "To HTML",
    detail: "Generate clean HTML with images, style maps, and list normalization.",
    tone: "border border-[color:var(--line)] bg-white/80 text-[color:var(--ink)]",
  },
  {
    href: "/docx-to-markdown",
    title: "To Markdown",
    detail: "Generate Markdown for content workflows that need cleaner text output.",
    tone: "border border-[color:var(--line)] bg-white/80 text-[color:var(--ink)]",
  },
] as const;

export function PlaygroundLauncher() {
  return (
    <section className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--surface-elevated)] p-6 shadow-[0_24px_60px_rgba(71,48,29,0.08)] md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Start here
          </p>
          <h2 className="mt-3 text-3xl leading-tight text-[color:var(--ink)]">
            Pick the exact DOCX task and go straight there.
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-muted)]">
            Each route opens on its own focused workflow page, so you do not have to step through a
            generic launcher first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
          <span className="rounded-full border border-[color:var(--line)] bg-white/75 px-3 py-1">
            One-file extract
          </span>
          <span className="rounded-full border border-[color:var(--line)] bg-white/75 px-3 py-1">
            Two-file compare
          </span>
          <span className="rounded-full border border-[color:var(--line)] bg-white/75 px-3 py-1">
            Export-ready output
          </span>
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {routeCards.map((card) => (
          <Link
            key={card.href}
            className={`rounded-[26px] p-5 transition-transform hover:-translate-y-1 ${card.tone}`}
            href={card.href}
          >
            <p className="font-mono text-xs uppercase tracking-[0.22em] opacity-70">Route</p>
            <h3 className="mt-3 text-xl leading-tight">{card.title}</h3>
            <p className="mt-3 text-sm leading-7 opacity-80">{card.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
