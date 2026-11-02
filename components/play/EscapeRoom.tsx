"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EscapeState } from "@/lib/escape/types";
import EndScreen from "./EndScreen";
import Lobby from "./Lobby";
import TeamHelp from "./TeamHelp";
import RunHud from "./RunHud";
import StagePanel from "./StagePanel";
import { useEscape, useNow } from "./useEscape";

/**
 * The whole team experience in one place:
 *   not started  -> lobby (story + rules), flips by itself when the clock starts
 *   running      -> HUD + current puzzle + answer terminal + hints + key stack
 *   ended        -> escaped / time's up screen
 */
export default function EscapeRoom({
  initial,
  teamName,
  teamCode,
  members,
}: {
  initial: EscapeState | null;
  teamName: string;
  teamCode: string;
  members: string[];
}) {
  const { state, offsetMs, online, authLost, refresh } = useEscape(initial);
  const now = useNow(500);
  const serverNow = now + offsetMs;
  const [seenCleared, setSeenCleared] = useState<string | null>(null);

  const run = state?.run;
  const running = run?.status === "running";
  const endsAt = run?.ends_at ? Date.parse(run.ends_at) : null;
  const timeUp = running && endsAt !== null && serverNow >= endsAt;

  // The clock hit zero: ask the server straight away so the screen flips to "time's up".
  useEffect(() => {
    if (!timeUp) return;
    const t = setInterval(() => void refresh(), 1500);
    return () => clearInterval(t);
  }, [timeUp, refresh]);

  if (!state) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <p className="font-mono text-lg font-black text-white">Connecting to the terminal…</p>
        <p className="mt-2 text-sm text-muted">If this stays, reload the page or log in again.</p>
      </div>
    );
  }

  const stage = state.stages.find((s) => !s.solved) ?? null;
  const lastSolved = [...state.stages].reverse().find((s) => s.solved) ?? null;
  const justSolved = lastSolved?.solved_at ? serverNow - Date.parse(lastSolved.solved_at) < 25_000 : false;
  const banner = running && lastSolved && justSolved && seenCleared !== lastSolved.code ? lastSolved : null;

  return (
    <>
      {running && <RunHud state={state} serverNow={serverNow} />}

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex justify-end">
          <TeamHelp durationMinutes={state.config.duration_minutes} penaltySeconds={state.config.hint_penalty_seconds} />
        </div>
        {authLost && (
          <p className="rounded-xl border border-danger/50 bg-danger/10 p-3 text-sm text-red-100">
            You were logged out. <Link className="underline" href="/">Log in again</Link> with your team code and PIN — your progress is saved.
          </p>
        )}
        {!online && !authLost && (
          <p role="status" className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100">
            Connection lost — reconnecting. Your clock keeps running on the server; your progress is safe.
          </p>
        )}

        {banner && (
          <div className="anim-pop flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-300/60 bg-emerald-400/15 font-mono text-xl font-black text-emerald-200">✓</span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
                {banner.code} cleared{banner.fragment ? ` · fragment “${banner.fragment}” pushed to the stack` : ""}
              </p>
              <p className="mt-1 text-sm italic text-emerald-50/90">&ldquo;{banner.solved_message}&rdquo;</p>
            </div>
            <button type="button" onClick={() => setSeenCleared(banner.code)} className="rounded-full border border-white/15 px-3 py-1 font-mono text-xs font-bold text-muted hover:text-white cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {run?.status === "running" && stage ? (
          <StagePanel state={state} stage={stage} serverNow={serverNow} refresh={refresh} />
        ) : run && run.status !== "ready" ? (
          <EndScreen state={state} teamName={teamName} />
        ) : (
          <Lobby state={state} teamName={teamName} teamCode={teamCode} members={members} />
        )}
      </div>
    </>
  );
}
