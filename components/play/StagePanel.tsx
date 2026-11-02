"use client";

import { useEffect, useState } from "react";
import { requestHint, submitAnswer } from "@/app/actions/escape";
import { minSec } from "@/lib/escape/format";
import { normalizeAnswer } from "@/lib/escape/normalize";
import type { EscapeState, StageView } from "@/lib/escape/types";
import CodeBoxes from "./CodeBoxes";
import KeyStack from "./KeyStack";
import QrScanner from "./QrScanner";
import StagePath from "./StagePath";

const KIND = {
  digital: { label: "ON SCREEN", cls: "border-cyan-400/50 bg-cyan-400/10 text-cyan-200", icon: "▣" },
  physical: { label: "IN THE ROOM", cls: "border-amber-400/50 bg-amber-400/10 text-amber-200", icon: "✋" },
  hybrid: { label: "ROOM + SCREEN", cls: "border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-200", icon: "◈" },
} as const;

type Feedback = { kind: "wrong" | "cooldown" | "info" | "error"; text: string; until?: number } | null;

/** Types the story out once per stage (remounted by key), so a new puzzle feels like an incoming transmission. */
function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN(n + 3), 16);
    return () => clearTimeout(t);
  }, [n, text]);
  return <>{text.slice(0, n)}</>;
}

export default function StagePanel({
  state,
  stage,
  serverNow,
  refresh,
}: {
  state: EscapeState;
  stage: StageView;
  serverNow: number;
  refresh: () => Promise<void>;
}) {
  const run = state.run!;
  const penalty = state.config.hint_penalty_seconds;
  const [draft, setDraft] = useState<{ code: string; value: string }>({ code: stage.code, value: "" });
  const value = draft.code === stage.code ? draft.value : "";
  const setValue = (v: string) => setDraft({ code: stage.code, value: v });
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [shake, setShake] = useState(0);
  const [confirmLevel, setConfirmLevel] = useState<number | null>(null);
  const [hintBusy, setHintBusy] = useState(false);

  // a stage change clears the previous stage's feedback and any half-made hint request
  const [lastCode, setLastCode] = useState(stage.code);
  if (lastCode !== stage.code) {
    setLastCode(stage.code);
    setFeedback(null);
    setConfirmLevel(null);
  }

  useEffect(() => {
    if (confirmLevel === null) return;
    const t = setTimeout(() => setConfirmLevel(null), 6000);
    return () => clearTimeout(t);
  }, [confirmLevel]);

  const cooldownLeft = feedback?.kind === "cooldown" && feedback.until ? Math.max(0, Math.ceil((feedback.until - serverNow) / 1000)) : 0;
  const locked = cooldownLeft > 0;
  const ready = normalizeAnswer(value).length > 0 && (stage.input.mode !== "code" || normalizeAnswer(value).length === (stage.input.length ?? 0));

  async function submit() {
    if (pending || locked || !ready) return;
    setPending(true);
    setFeedback(null);
    try {
      const r = await submitAnswer(stage.code, value);
      if (!r.ok) {
        setFeedback({ kind: "error", text: r.error });
      } else if (r.result === "correct") {
        await refresh();
      } else if (r.result === "wrong") {
        setShake((s) => s + 1);
        setFeedback({ kind: "wrong", text: "ACCESS DENIED — that is not the answer." });
      } else if (r.result === "cooldown") {
        setShake((s) => s + 1);
        setFeedback({ kind: "cooldown", text: "Too many wrong tries. The terminal is cooling down.", until: Date.now() + r.retryIn * 1000 });
      } else if (r.result === "stale") {
        setFeedback({ kind: "info", text: "Your teammate already solved this stage on another device. Updating…" });
        await refresh();
      } else if (r.result === "closed") {
        setFeedback({ kind: "info", text: "Your run has ended." });
        await refresh();
      }
    } catch {
      setFeedback({ kind: "error", text: "Could not reach the server. Check the connection and try again — your clock is unaffected." });
    } finally {
      setPending(false);
    }
  }

  async function takeHint(level: number) {
    if (hintBusy) return;
    setHintBusy(true);
    try {
      const r = await requestHint(stage.code, level);
      if (!r.ok) setFeedback({ kind: "error", text: r.error });
      await refresh();
    } catch {
      setFeedback({ kind: "error", text: "Could not reach the server. No hint was charged." });
    } finally {
      setConfirmLevel(null);
      setHintBusy(false);
    }
  }

  const kind = KIND[stage.kind];
  const used = stage.hints_used.length;
  const nextLevel = used + 1;
  const slots = Math.max(0, state.total_stages - 1);
  const solvedList = state.stages.filter((s) => s.solved);

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-2xl p-3 sm:p-4">
        <StagePath stages={state.stages} total={state.total_stages} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* ------------------------------------------------ the puzzle */}
        <section className="space-y-4 lg:col-span-7">
          <article className="exhibit overflow-hidden">
            <header className="flex flex-wrap items-center gap-2.5 border-b border-white/10 px-5 py-3">
              <span className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-accent">{stage.code}</span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted">{stage.zone}</span>
              <span className={`ml-auto rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-black tracking-widest ${kind.cls}`}>
                {kind.icon} {kind.label}
              </span>
            </header>
            <div className="space-y-4 p-5 sm:p-6">
              <h1 className="font-mono text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">{stage.title}</h1>
              <p className="min-h-[4.5rem] text-[15px] leading-relaxed text-slate-300">
                <Typewriter key={stage.code} text={stage.story} />
              </p>

              <div className="crt rounded-xl border border-cyan-400/25 bg-[#03080c] p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2 font-mono text-[11px] uppercase tracking-widest text-cyan-300/80">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  {stage.clue.label}
                </div>
                <pre
                  className={`overflow-x-auto whitespace-pre-wrap break-words text-[13px] leading-6 text-emerald-100/95 sm:text-sm ${stage.clue.mono ? "font-mono" : "font-sans text-base leading-7 text-slate-100"}`}
                >
                  {stage.clue.text}
                </pre>
                {stage.clue.stack && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-amber-300">stack memory</p>
                    <KeyStack stages={state.stages} slots={slots} big />
                  </div>
                )}
              </div>

              {stage.clue.notes.length > 0 && (
                <ul className="space-y-1.5 text-sm text-slate-400">
                  {stage.clue.notes.map((n) => (
                    <li key={n} className="flex gap-2">
                      <span className="text-accent">▸</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              )}

              {stage.clue.scanner && <QrScanner stage={stage.code} />}
            </div>
          </article>

          {solvedList.length > 0 && (
            <details className="glass-panel rounded-2xl">
              <summary className="cursor-pointer px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-muted">Cleared puzzles ({solvedList.length}) — notes for later</summary>
              <ul className="divide-y divide-white/5 border-t border-white/10">
                {solvedList.map((s) => (
                  <li key={s.code} className="px-5 py-3 text-sm">
                    <p className="font-mono text-xs font-bold text-emerald-300">
                      {s.code} · {s.title}
                      {s.fragment && <span className="ml-2 text-amber-300">fragment {s.fragment}</span>}
                    </p>
                    <p className="mt-1 text-slate-400">{s.solved_message}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {/* ------------------------------------------------ terminal + hints */}
        <aside className="space-y-4 lg:col-span-5">
          <section className="glass-panel rounded-2xl p-5 sm:p-6">
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-accent">&gt; Answer terminal</p>
            <p className="mt-2 text-[15px] font-semibold leading-snug text-white">{stage.prompt}</p>

            <div className="mt-5">
              {stage.input.mode === "code" && stage.input.length ? (
                <CodeBoxes
                  value={value}
                  onChange={setValue}
                  onEnter={submit}
                  length={stage.input.length}
                  disabled={pending || locked}
                  shakeKey={shake}
                />
              ) : (
                <div key={shake} className={shake ? "anim-shake" : ""}>
                  <div className="flex items-center gap-2 rounded-xl border-2 border-white/15 bg-black/50 px-4 py-3 focus-within:border-accent">
                    <span className="font-mono text-lg font-black text-accent">&gt;</span>
                    <input
                      autoFocus
                      value={value}
                      onChange={(e) => setValue(e.target.value.slice(0, 40))}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      disabled={pending || locked}
                      placeholder={stage.input.placeholder ?? "TYPE YOUR ANSWER"}
                      autoCapitalize="characters"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-label="Your answer"
                      className="bare-input w-full bg-transparent font-mono text-xl font-bold uppercase tracking-widest text-cyan-100 placeholder:text-white/20"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!ready || pending || locked}
              className="btn-shimmer mt-5 w-full rounded-xl bg-accent py-3.5 font-mono text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-accent/30 transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              {pending ? "Checking…" : locked ? `Locked ${cooldownLeft}s` : "Submit answer ⏎"}
            </button>

            {feedback && (
              <p
                role="status"
                className={`mt-4 rounded-lg border px-3 py-2.5 font-mono text-xs font-bold ${
                  feedback.kind === "wrong" || feedback.kind === "cooldown"
                    ? "border-danger/50 bg-danger/10 text-red-200"
                    : feedback.kind === "error"
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                      : "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                }`}
              >
                {feedback.kind === "cooldown" ? `${feedback.text} (${cooldownLeft}s)` : feedback.text}
              </p>
            )}
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-amber-300">◐ Hints</p>
              <span className="font-mono text-[11px] text-muted">
                {used}/{stage.hints_total} used here · {run.hints_used} total
              </span>
            </div>

            <ol className="mt-3 space-y-2">
              {stage.hints_used.map((h, i) => (
                <li key={i} className="rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-3 text-sm leading-relaxed text-amber-50">
                  <span className="mr-2 font-mono text-[10px] font-black uppercase tracking-widest text-amber-300">Hint {i + 1}</span>
                  {h}
                </li>
              ))}
            </ol>

            {used < stage.hints_total ? (
              confirmLevel === nextLevel ? (
                <div className="mt-3 rounded-xl border border-danger/50 bg-danger/10 p-3">
                  <p className="text-sm text-red-100">
                    This adds <b>{minSec(penalty)}</b> to your final time. Reveal hint {nextLevel}?
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <button type="button" disabled={hintBusy} onClick={() => takeHint(nextLevel)} className="flex-1 rounded-lg bg-danger py-2 font-mono text-xs font-black uppercase tracking-wider text-white hover:brightness-110 disabled:opacity-60 cursor-pointer">
                      {hintBusy ? "…" : `Yes, +${minSec(penalty)}`}
                    </button>
                    <button type="button" onClick={() => setConfirmLevel(null)} className="rounded-lg border border-white/15 px-4 py-2 font-mono text-xs font-bold text-muted hover:text-white cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmLevel(nextLevel)}
                  className="mt-3 w-full rounded-xl border border-amber-400/40 bg-amber-400/10 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-amber-200 transition-colors hover:bg-amber-400/20 cursor-pointer"
                >
                  Request hint {nextLevel} · +{minSec(penalty)}
                </button>
              )
            ) : (
              <p className="mt-3 text-xs text-muted">No more hints for this puzzle.</p>
            )}
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <p className="mb-3 font-mono text-[11px] font-black uppercase tracking-[0.25em] text-amber-300">▦ Key stack</p>
            <KeyStack stages={state.stages} slots={slots} />
          </section>
        </aside>
      </div>
    </div>
  );
}
