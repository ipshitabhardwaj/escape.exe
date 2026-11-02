"use client";

import { minSec, mmss } from "@/lib/escape/format";
import type { EscapeState } from "@/lib/escape/types";

/** Sticky strip: big countdown, puzzle count, hint penalty, running total. */
export default function RunHud({ state, serverNow }: { state: EscapeState; serverNow: number }) {
  const run = state.run!;
  const endsAt = run.ends_at ? Date.parse(run.ends_at) : null;
  const startedAt = run.started_at ? Date.parse(run.started_at) : null;
  const running = run.status === "running";
  const remaining = running && endsAt ? Math.max(0, Math.ceil((endsAt - serverNow) / 1000)) : 0;
  const elapsed = running && startedAt ? Math.max(0, Math.floor((serverNow - startedAt) / 1000)) : run.elapsed_seconds;
  const total = elapsed + run.penalty_seconds;
  const danger = running && remaining <= 300;
  const warn = running && remaining <= 600 && !danger;
  const pct = Math.min(100, (remaining / (state.config.duration_minutes * 60 + run.extra_minutes * 60)) * 100);

  return (
    <div className={`sticky top-0 z-30 border-b backdrop-blur-xl ${danger ? "border-danger/60 bg-[#240a10]/90" : "border-white/10 bg-[#0a0f18]/90"}`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-muted">Time left</span>
          <span
            suppressHydrationWarning
            className={`font-mono text-4xl font-black tabular-nums leading-none sm:text-5xl ${
              danger ? "text-danger anim-flicker" : warn ? "text-amber-300" : "text-white"
            }`}
            aria-live="off"
          >
            {mmss(remaining)}
          </span>
        </div>

        <dl className="ml-auto grid grid-cols-3 gap-x-6 gap-y-1 font-mono text-xs sm:flex sm:items-center sm:gap-8">
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-muted">Cleared</dt>
            <dd className="text-lg font-black text-emerald-300">
              {run.stages_cleared}
              <span className="text-sm text-muted">/{state.total_stages}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-muted">Hints</dt>
            <dd className="text-lg font-black text-amber-300">
              {run.hints_used}
              {run.penalty_seconds > 0 && <span className="ml-1.5 text-sm text-danger">+{minSec(run.penalty_seconds)}</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-muted">Score time</dt>
            <dd suppressHydrationWarning className="text-lg font-black text-cyan-200">
              {mmss(total)}
            </dd>
          </div>
        </dl>
      </div>
      <div className="h-1 w-full bg-white/5">
        <div className={`h-full transition-[width] duration-500 ${danger ? "bg-danger" : warn ? "bg-amber-400" : "bg-gradient-to-r from-accent to-cyan-400"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
