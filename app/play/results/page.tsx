import Link from "next/link";
import LeaderboardTable from "@/components/LeaderboardTable";
import { getEvent } from "@/lib/event";
import { requireRole } from "@/lib/auth";
import { getRankedBoard } from "@/lib/escape/board";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Leaderboard for participants. Visible only once the organisers reveal the results. */
export default async function ResultsPage() {
  const session = await requireRole("team");
  const event = await getEvent();
  const revealed = event?.phase === "results";

  if (!revealed) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.3em] text-accent">Results are sealed</p>
        <h1 className="mt-3 font-mono text-3xl font-black uppercase text-white">Not announced yet</h1>
        <p className="mt-3 text-slate-400">The Game Masters reveal the leaderboard when every team has finished. Watch the big screen.</p>
        <Link href="/play" className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-2 font-mono text-sm font-bold text-muted hover:text-white">
          ← Back to my run
        </Link>
      </main>
    );
  }

  const board = await getRankedBoard();
  const real = board.filter((r) => !r.is_dummy);
  const rows = real.length ? real : board;
  const played = rows.filter((r) => r.rank !== null);
  const stageCount = (await createAdminClient().from("escape_stages").select("id", { count: "exact", head: true })).count ?? 0;
  const mine = played.find((r) => r.team_id === session.team?.id);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.3em] text-accent">Final leaderboard</p>
          <h1 className="mt-1 font-mono text-3xl font-black uppercase text-white">Escape.exe results</h1>
        </div>
        {mine && (
          <p className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-sm font-bold text-white">
            Your rank: <span className="text-2xl text-accent">#{mine.rank}</span>
          </p>
        )}
      </div>
      <LeaderboardTable rows={played.slice(0, 10)} totalStages={stageCount} highlight={session.team?.id} />
      {mine && (mine.rank ?? 0) > 10 && <LeaderboardTable rows={[mine]} totalStages={stageCount} highlight={mine.team_id} />}
      <p className="text-xs text-muted">Escaped teams are ranked by total time (time taken + hint penalties). Teams that did not escape follow, by puzzles cleared and then fewer hints.</p>
      <Link href="/play" className="inline-flex rounded-full border border-white/15 px-5 py-2 font-mono text-sm font-bold text-muted hover:text-white">
        ← Back to my run
      </Link>
    </main>
  );
}
