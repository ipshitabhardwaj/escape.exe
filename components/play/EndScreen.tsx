"use client";

import Link from "next/link";
import { minSec, mmss } from "@/lib/escape/format";
import type { EscapeState } from "@/lib/escape/types";
import KeyStack from "./KeyStack";

/** Shown after the run ends: escaped, out of time, or stopped by a Game Master. */
export default function EndScreen({ state, teamName }: { state: EscapeState; teamName: string }) {
  const run = state.run!;
  const escaped = run.status === "escaped";
  const solved = state.stages.filter((s) => s.solved);
  const results = state.phase === "results";
  const headline = escaped ? "ESCAPED" : run.status === "timeout" ? "TIME'S UP" : "RUN ENDED";

  // time spent on each stage = difference between consecutive solve times
  const splits = solved.map((s, i) => ({
    code: s.code,
    title: s.title,
    took: Math.max(0, (s.solve_seconds ?? 0) - (i > 0 ? (solved[i - 1].solve_seconds ?? 0) : 0)),
  }));

  return (
    <div className="space-y-6">
      <section className={`exhibit relative overflow-hidden p-8 text-center sm:p-12 ${escaped ? "!border-emerald-400/50" : "!border-danger/50"}`}>
        <div className={`pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full blur-[110px] ${escaped ? "bg-emerald-500/25" : "bg-danger/25"}`} />
        <p className="relative font-mono text-[11px] font-black uppercase tracking-[0.35em] text-muted">{teamName}</p>
        <h1 className={`relative mt-3 font-mono text-5xl font-black tracking-tight sm:text-7xl ${escaped ? "text-emerald-300" : "text-danger"}`}>{headline}</h1>
        <p className="relative mx-auto mt-4 max-w-xl text-slate-300">
          {escaped
            ? "The doors are open. You beat the system. Stay at your seat — the Game Masters will take it from here."
            : `You cleared ${run.stages_cleared} of ${state.total_stages} puzzles before the run ended. Teams that do not escape are ranked by puzzles cleared, then by fewer hints.`}
        </p>

        <dl className="relative mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Time taken", mmss(run.elapsed_seconds), "text-white"],
            ["Hints", `${run.hints_used}${run.penalty_seconds ? ` · +${minSec(run.penalty_seconds)}` : ""}`, "text-amber-300"],
            ["Puzzles", `${run.stages_cleared}/${state.total_stages}`, "text-emerald-300"],
            [escaped ? "Final time" : "Score time", mmss(run.total_seconds), "text-cyan-200"],
          ].map(([k, v, c]) => (
            <div key={k} className="rounded-xl border border-white/10 bg-black/40 p-3">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">{k}</dt>
              <dd className={`mt-1 font-mono text-xl font-black ${c}`}>{v}</dd>
            </div>
          ))}
        </dl>

        {results && (
          <Link href="/play/results" className="relative mt-8 inline-flex rounded-full bg-accent px-7 py-3 font-mono text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-accent/30 hover:bg-accent-hover">
            See the leaderboard →
          </Link>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-2xl p-5">
          <p className="mb-3 font-mono text-[11px] font-black uppercase tracking-[0.25em] text-amber-300">▦ Key stack</p>
          <KeyStack stages={state.stages} slots={Math.max(0, state.total_stages - 1)} />
        </section>
        <section className="glass-panel rounded-2xl p-5">
          <p className="mb-3 font-mono text-[11px] font-black uppercase tracking-[0.25em] text-accent">Your splits</p>
          {splits.length === 0 ? (
            <p className="text-sm text-muted">No puzzle was cleared.</p>
          ) : (
            <ul className="divide-y divide-white/5 font-mono text-sm">
              {splits.map((s) => (
                <li key={s.code} className="flex items-center justify-between py-2">
                  <span className="text-slate-300">
                    <span className="mr-2 text-emerald-300">✓</span>
                    {s.code} · {s.title}
                  </span>
                  <span className="text-white">{mmss(s.took)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
