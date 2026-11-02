import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Small layout building blocks shared across the platform:
 * Page header → "what to do now" → card sections.
 */

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && (
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            {kicker}
          </p>
        )}
        <h1 className="mt-1.5 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className = "",
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`rounded-2xl border border-white/10 bg-[#111823]/80 backdrop-blur-md shadow-xl ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-6 py-4">
          <div>
            {title && <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

export type Tone = "neutral" | "accent" | "ok" | "danger" | "info";
const TONE: Record<Tone, string> = {
  neutral: "border-white/10 bg-[#0e141d] text-muted",
  accent: "border-accent/40 bg-accent/10 text-accent font-semibold",
  ok: "border-ok/40 bg-ok/10 text-ok font-semibold",
  danger: "border-danger/40 bg-danger/10 text-danger font-semibold",
  info: "border-info/40 bg-info/10 text-info font-semibold",
};

export function Pill({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Progress({ value, max, tone = "accent", label }: { value: number; max: number; tone?: "accent" | "ok"; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full bg-[#182332] border border-white/5"
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          tone === "ok" ? "bg-ok shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-accent shadow-[0_0_10px_rgba(255,107,53,0.5)]"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Stat({ label, value, note, tone, href }: { label: string; value: ReactNode; note?: ReactNode; tone?: Tone; href?: string }) {
  const body = (
    <>
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-black tabular-nums ${tone === "danger" ? "text-danger" : tone === "ok" ? "text-ok" : tone === "accent" ? "text-accent" : "text-white"}`}>
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-muted/80">{note}</p>}
    </>
  );
  const cls = "block rounded-2xl border border-white/10 bg-[#111823]/80 p-5 shadow-lg backdrop-blur-md transition-all duration-200";
  return href ? (
    <Link href={href} className={`${cls} hover:border-accent/60 hover:bg-[#141d2a]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export type StepState = "done" | "current" | "todo";
export type Step = { label: string; state: StepState; hint?: string };

/** Horizontal numbered stepper (wraps to a vertical list on phones). */
export function Stepper({ steps, label = "Progress" }: { steps: Step[]; label?: string }) {
  const cur = Math.max(0, steps.findIndex((s) => s.state === "current"));
  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111823] px-4 py-2.5 sm:hidden" aria-hidden>
        <div className="flex gap-1.5">
          {steps.map((s) => (
            <span
              key={s.label}
              className={`h-2 w-6 rounded-full transition-all ${
                s.state === "done" ? "bg-ok" : s.state === "current" ? "bg-accent shadow-[0_0_8px_rgba(255,107,53,0.5)]" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted">
          Step {cur + 1} of {steps.length} · <b className="text-white">{steps[cur]?.label}</b>
        </span>
      </div>
      <StepperFull steps={steps} label={label} />
    </>
  );
}

function StepperFull({ steps, label }: { steps: Step[]; label: string }) {
  return (
    <ol aria-label={label} className="hidden gap-2 sm:grid sm:grid-flow-col sm:auto-cols-fr">
      {steps.map((s, i) => (
        <li
          key={s.label}
          aria-current={s.state === "current" ? "step" : undefined}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 sm:flex-col sm:items-start sm:gap-2 transition-all duration-200 ${
            s.state === "current"
              ? "border-accent/70 bg-accent/10 shadow-lg shadow-accent/10"
              : s.state === "done"
              ? "border-white/10 bg-[#121b27]"
              : "border-white/5 bg-[#0e141d] opacity-60"
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-black ${
              s.state === "done"
                ? "bg-ok text-ink shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                : s.state === "current"
                ? "bg-accent text-white shadow-[0_0_10px_rgba(255,107,53,0.5)]"
                : "border border-white/15 text-muted"
            }`}
          >
            {s.state === "done" ? "✓" : i + 1}
          </span>
          <span className="min-w-0">
            <span className={`block text-sm font-bold ${s.state === "current" ? "text-white" : s.state === "todo" ? "text-muted" : "text-white/90"}`}>
              {s.label}
            </span>
            {s.hint && <span className="block text-xs text-muted mt-0.5">{s.hint}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The single most important strategic action to take now. */
export function NextAction({
  title,
  body,
  href,
  cta,
  tone = "accent",
  children,
}: {
  title: ReactNode;
  body?: ReactNode;
  href?: string;
  cta?: string;
  tone?: "accent" | "ok" | "neutral" | "danger";
  children?: ReactNode;
}) {
  const border =
    tone === "ok"
      ? "border-ok/40 bg-ok/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
      : tone === "danger"
      ? "border-danger/50 bg-danger/10 shadow-[0_0_20px_rgba(249,115,22,0.15)] animate-pulse"
      : tone === "neutral"
      ? "border-white/10 bg-[#111823]"
      : "border-accent/50 bg-gradient-to-r from-accent/15 via-[#141d2a] to-transparent shadow-[0_0_25px_rgba(255,107,53,0.15)]";

  return (
    <section aria-label="Strategic next move" className={`relative overflow-hidden flex flex-col gap-4 rounded-3xl border p-6 sm:flex-row sm:items-center ${border} backdrop-blur-md`}>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          STRATEGIC DIRECTIVE
        </p>
        <p className="mt-1 text-xl font-black text-white tracking-tight">{title}</p>
        {body && <p className="mt-1 text-sm text-muted/90 leading-relaxed">{body}</p>}
      </div>
      {href && cta && (
        <Link
          prefetch={false}
          href={href}
          className="btn-shimmer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-8 py-3.5 font-bold text-white shadow-lg shadow-accent/30 transition-all duration-200 hover:bg-accent-hover hover:scale-105 hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] cursor-pointer"
        >
          <span>{cta}</span>
          <span className="text-base">→</span>
        </Link>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-[#111823]/50 p-12 text-center backdrop-blur-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-2xl text-accent">
        🔒
      </div>
      <p className="font-mono text-sm font-bold uppercase tracking-widest text-accent">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-lg text-sm text-muted leading-relaxed">{children}</div>}
    </div>
  );
}

/** Label/value list used in report and judge views. */
export function Field({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`mt-1 whitespace-pre-wrap break-words text-sm text-white/90 ${mono ? "font-mono" : ""}`}>
        {children || <span className="text-muted/60">—</span>}
      </dd>
    </div>
  );
}
