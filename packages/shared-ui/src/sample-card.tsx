import type { ReactNode } from "react";

type SampleCardProps = {
  title: string;
  description: string;
  accent: string;
  eyebrow?: string;
  meta?: string;
  footer?: ReactNode;
};

export function SampleCard({
  title,
  description,
  accent,
  eyebrow,
  meta,
  footer,
}: SampleCardProps) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-[color:var(--surface-elevated)] p-5 shadow-[0_20px_60px_rgba(12,18,30,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
              {eyebrow}
            </p>
          ) : null}
          <div
            aria-hidden="true"
            className="mt-3 h-2 w-24 rounded-full"
            style={{ background: accent }}
          />
        </div>
        {meta ? (
          <span className="rounded-full border border-[color:var(--line)] bg-white/75 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
            {meta}
          </span>
        ) : null}
      </div>
      <h3 className="text-lg font-semibold text-[color:var(--ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[color:var(--ink-muted)]">
        {description}
      </p>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </article>
  );
}
