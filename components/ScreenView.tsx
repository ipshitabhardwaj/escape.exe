"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LeaderboardTable, { type RankedRow } from "@/components/LeaderboardTable";
import { phaseInfo } from "@/lib/constants";
import { mmss } from "@/lib/escape/format";
import { SCENARIO } from "@/lib/escape/story";
import type { EventRow } from "@/lib/types";
import { useEvent } from "./useEvent";

export type ScreenData = {
  rows: RankedRow[];
  totalStages: number;
  durationMinutes: number;
  serverNow: number;
};

/** Big-screen display (no login): attract screen, live room status, then the revealed leaderboard. */
export default function ScreenView({ initial, data }: { initial: EventRow | null; data: ScreenData }) {
  const { event } = useEvent(initial, 4000);
  const phase = event?.phase ?? "waiting";
  const info = phaseInfo(phase);
  const router = useRouter();

  // The board comes from the server: refresh it every few seconds while the event is on.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), phase === "waiting" ? 15_000 : 4_000);
    return () => clearInterval(t);
  }, [router, phase]);

  const [offset] = useState(() => data.serverNow - Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const serverNow = now + offset;

  const running = data.rows.filter((r) => r.status === "running");
  const ranked = data.rows.filter((r) => r.rank !== null);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden text-[#f8fafc] selection:bg-accent/40 selection:text-white">
      <div className="crime-tape flex h-7 w-full items-center justify-center font-mono text-xs font-black uppercase tracking-[0.3em]">
        ⚡ ESCAPE.EXE · {SCENARIO.title} · {info.label} ⚡
      </div>
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-rose-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[140px]" />

      <div className="relative flex flex-1 flex-col gap-8 px-6 py-10 lg:px-14">
        {phase === "waiting" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <p className="font-mono text-sm font-black uppercase tracking-[0.5em] text-accent">The doors are sealed</p>
            <h1 className="font-mono text-6xl font-black uppercase tracking-tight sm:text-8xl">
              ESCAPE<span className="text-accent">.EXE</span>
            </h1>
            <p className="max-w-3xl text-xl leading-relaxed text-slate-300">
              Two players. {data.durationMinutes} minutes. A chain of puzzles on the screen and in the room. Break out before the clock does.
            </p>
          </div>
        )}

        {phase === "investigation" && (
          <>
            <section>
              <p className="font-mono text-sm font-black uppercase tracking-[0.4em] text-cyan-300">● In the room now</p>
              {running.length === 0 ? (
                <p className="mt-6 font-mono text-2xl text-muted">Next team, please take your seats.</p>
              ) : (
                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {running.map((r) => {
                    const left = r.ends_at ? Math.max(0, Math.ceil((Date.parse(r.ends_at) - serverNow) / 1000)) : 0;
                    return (
                      <div key={r.team_id} className={`rounded-3xl border-2 p-6 ${left <= 300 ? "border-danger/70 bg-danger/10" : "border-cyan-400/40 bg-black/50"}`}>
                        <p className="truncate text-2xl font-black">{r.name}</p>
                        <p suppressHydrationWarning className={`mt-2 font-mono text-7xl font-black tabular-nums ${left <= 300 ? "text-danger" : "text-white"}`}>
                          {mmss(left)}
                        </p>
                        <div className="mt-4 flex gap-1.5" aria-label={`${r.stages_cleared} of ${data.totalStages} puzzles cleared`}>
                          {Array.from({ length: data.totalStages }, (_, i) => (
                            <span key={i} className={`h-3 flex-1 rounded-full ${i < r.stages_cleared ? "bg-emerald-400" : i === r.stages_cleared ? "bg-accent anim-pulse-ring" : "bg-white/10"}`} />
                          ))}
                        </div>
                        <p className="mt-2 font-mono text-sm text-muted">
                          {r.stages_cleared}/{data.totalStages} puzzles · {r.hints_used} hint{r.hints_used === 1 ? "" : "s"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            {ranked.length > 0 && (
              <section>
                <p className="mb-4 font-mono text-sm font-black uppercase tracking-[0.4em] text-amber-300">Leaderboard so far</p>
                <LeaderboardTable rows={ranked.filter((r) => r.status !== "running").slice(0, 8)} totalStages={data.totalStages} big />
              </section>
            )}
          </>
        )}

        {phase === "closed" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <p className="font-mono text-sm font-black uppercase tracking-[0.5em] text-accent">All slots complete</p>
            <h1 className="font-mono text-5xl font-black uppercase sm:text-7xl">Results coming up…</h1>
            <p className="text-xl text-slate-300">{ranked.filter((r) => r.status === "escaped").length} team(s) escaped Server Room 7.</p>
          </div>
        )}

        {phase === "results" && (
          <section>
            <p className="font-mono text-sm font-black uppercase tracking-[0.5em] text-amber-300">Final leaderboard</p>
            <h1 className="mb-6 mt-2 font-mono text-5xl font-black uppercase sm:text-6xl">Who broke out?</h1>
            <LeaderboardTable rows={ranked.slice(0, 10)} totalStages={data.totalStages} big />
          </section>
        )}
      </div>
    </main>
  );
}
