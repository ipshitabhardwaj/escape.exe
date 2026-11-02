import { mmss } from "@/lib/escape/format";
import type { BoardRow } from "@/lib/escape/types";

export type RankedRow = BoardRow & { rank: number | null };

const STATUS: Record<string, { label: string; cls: string }> = {
  escaped: { label: "ESCAPED", cls: "text-emerald-300" },
  running: { label: "IN THE ROOM", cls: "text-cyan-300" },
  timeout: { label: "TIME UP", cls: "text-danger" },
  stopped: { label: "STOPPED", cls: "text-amber-300" },
  ready: { label: "NOT PLAYED", cls: "text-muted" },
};

/** The leaderboard as the rulebook ranks it. Plain table: used on team, admin and projector pages. */
export default function LeaderboardTable({
  rows,
  totalStages,
  highlight,
  big = false,
}: {
  rows: RankedRow[];
  totalStages: number;
  highlight?: string;
  big?: boolean;
}) {
  const text = big ? "text-xl sm:text-2xl" : "text-sm";
  const pad = big ? "px-5 py-4" : "px-3 py-2.5";
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0c111a]/80">
      <table className={`w-full ${text}`}>
        <thead>
          <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-widest text-muted">
            <th className={`${pad} text-left`}>#</th>
            <th className={`${pad} text-left`}>Team</th>
            <th className={`${pad} text-left`}>Result</th>
            <th className={`${pad} text-right`}>Puzzles</th>
            <th className={`${pad} text-right`}>Hints</th>
            <th className={`${pad} text-right`}>Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r) => {
            const st = STATUS[r.status] ?? STATUS.ready;
            const escaped = r.status === "escaped";
            return (
              <tr key={r.team_id} className={r.team_id === highlight ? "bg-accent/10" : ""}>
                <td className={`${pad} font-mono font-black ${r.rank === 1 && escaped ? "text-amber-300" : "text-white"}`}>{r.rank ?? "–"}</td>
                <td className={pad}>
                  <span className="font-semibold text-white">{r.name}</span>
                  {r.institution && <span className="ml-2 text-xs text-muted">{r.institution}</span>}
                </td>
                <td className={`${pad} font-mono text-xs font-black tracking-widest ${st.cls}`}>{st.label}</td>
                <td className={`${pad} text-right font-mono`}>
                  {r.stages_cleared}
                  <span className="text-muted">/{totalStages}</span>
                </td>
                <td className={`${pad} text-right font-mono`}>{r.hints_used}</td>
                <td className={`${pad} text-right font-mono font-bold ${escaped ? "text-cyan-200" : "text-muted"}`}>{r.status === "ready" ? "—" : mmss(r.total_seconds)}</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-muted">
                No team has played yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
