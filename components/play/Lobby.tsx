"use client";

import { minSec } from "@/lib/escape/format";
import { SCENARIO, buildRules } from "@/lib/escape/story";
import type { EscapeState } from "@/lib/escape/types";

/** Before the clock starts: story, rules, and a standby panel that flips to the game the moment the Game Master presses START. */
export default function Lobby({ state, teamName, teamCode, members }: { state: EscapeState; teamName: string; teamCode: string; members: string[] }) {
  const live = state.phase === "investigation";
  const closed = state.phase === "closed" || state.phase === "results";
  const rules = buildRules(state.config.duration_minutes, state.config.hint_penalty_seconds);

  return (
    <div className="space-y-6">
      <section className="exhibit relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/25 blur-[90px]" />
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.3em] text-accent">&gt; Incoming transmission · {SCENARIO.time}</p>
        <h1 className="mt-2 font-mono text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
          {SCENARIO.title}
          <span className="anim-caret text-accent">_</span>
        </h1>
        <div className="mt-4 max-w-3xl space-y-3 text-[15px] leading-relaxed text-slate-300">
          {SCENARIO.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4">
          <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs font-bold text-accent">{teamCode}</span>
          <span className="font-mono text-sm font-bold text-white">{teamName}</span>
          {members.length > 0 && <span className="text-xs text-muted">{members.join(" · ")}</span>}
        </div>
      </section>

      <section className={`rounded-2xl border p-6 text-center sm:p-8 ${live ? "border-emerald-400/50 bg-emerald-500/[0.07]" : "border-white/10 bg-white/[0.03]"}`}>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
          <span className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl ${live ? "anim-pulse-ring border-emerald-400 text-emerald-300" : "border-white/20 text-white/50"}`}>
            {closed ? "■" : live ? "▶" : "⏻"}
          </span>
          <p className="font-mono text-lg font-black uppercase tracking-widest text-white">
            {closed ? "This event has ended" : live ? "Standing by — waiting for your Game Master" : "Doors sealed — the event has not opened"}
          </p>
          <p className="text-sm leading-relaxed text-slate-400">
            {closed
              ? "The event is over. Watch the big screen for the results."
              : live
                ? `Everyone starts together. Your ${state.config.duration_minutes}:00 clock begins the moment the Game Master presses START. Keep this page open — it switches to your first clue by itself.`
                : "Keep this page open. When the Game Master starts the event, every team begins at the same moment and this page switches to your first clue."}
          </p>
          {!closed && (
            <p className="font-mono text-xs text-muted">
              <span className="anim-caret text-emerald-300">▌</span> status: standby · hints cost {minSec(state.config.hint_penalty_seconds)} each
            </p>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-6 sm:p-8">
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-accent">Rulebook · read before the start</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map((r, i) => (
            <li key={r.title} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent font-mono text-xs font-black text-white">{i + 1}</span>
              <p className="mt-3 text-sm font-bold text-white">{r.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{r.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
