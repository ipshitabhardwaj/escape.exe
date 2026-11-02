import Link from "next/link";
import AutoRefresh from "@/components/admin/AutoRefresh";
import LeaderboardTable from "@/components/LeaderboardTable";
import { PageHeader, Stat } from "@/components/ui";
import { getEscapeConfig, getRankedBoard } from "@/lib/escape/board";
import { minSec } from "@/lib/escape/format";
import { getEvent } from "@/lib/event";
import { createAdminClient } from "@/lib/supabase/admin";
import { ui } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ResultsAdminPage() {
  const [board, cfg, event, stageRes] = await Promise.all([
    getRankedBoard(),
    getEscapeConfig(),
    getEvent(),
    createAdminClient().from("escape_stages").select("id", { count: "exact", head: true }),
  ]);
  const total = stageRes.count ?? 0;
  const real = board.filter((r) => !r.is_dummy);
  const rows = real.length ? real : board;
  const played = rows.filter((r) => r.rank !== null);
  const escaped = played.filter((r) => r.status === "escaped");

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={15} />
      <PageHeader
        kicker="Rankings"
        title="Results"
        description={`Ranked exactly as the rulebook says: escaped teams by total time (time taken + ${minSec(cfg.hint_penalty_seconds)} per hint); everyone else by puzzles cleared, then fewer hints. The winner is decided by the clock, not by a judge.`}
        actions={
          <Link href="/admin/export" className={ui.btnGhost} prefetch={false}>
            Download CSV
          </Link>
        }
      />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Played" value={played.length} note={`of ${rows.length} teams`} />
        <Stat label="Escaped" value={escaped.length} tone="ok" />
        <Stat label="Best time" value={escaped[0] ? `${Math.floor(escaped[0].total_seconds / 60)}:${String(escaped[0].total_seconds % 60).padStart(2, "0")}` : "—"} note={escaped[0]?.name} />
        <Stat label="Phase" value={event?.phase === "results" ? "Revealed" : "Hidden"} note={event?.phase === "results" ? "public on the big screen" : "reveal from Control"} tone={event?.phase === "results" ? "ok" : undefined} />
      </section>
      <LeaderboardTable rows={[...played, ...rows.filter((r) => r.rank === null).map((r) => ({ ...r, rank: null }))]} totalStages={total} />
      <p className="text-xs text-muted">Ties on time are split by fewer hints, then the earlier finish. Teams with identical results share a rank.</p>
    </div>
  );
}
