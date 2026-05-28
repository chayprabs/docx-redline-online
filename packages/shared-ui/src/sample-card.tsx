import type { ReactNode } from "react";

type SampleCardProps = {
  title: string;
  description: string;
  accent: string;
  footer?: ReactNode;
};

export function SampleCard({
  title,
  description,
  accent,
  footer,
}: SampleCardProps) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-[color:var(--surface-elevated)] p-5 shadow-[0_20px_60px_rgba(12,18,30,0.18)]">
      <div
        aria-hidden="true"
        className="mb-4 h-2 w-24 rounded-full"
        style={{ background: accent }}
      />
      <h3 className="text-lg font-semibold text-[color:var(--ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[color:var(--ink-muted)]">
        {description}
      </p>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </article>
  );
}
