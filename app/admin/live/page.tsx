import AutoRefresh from "@/components/admin/AutoRefresh";
import RunClock from "@/components/admin/RunClock";
import { PageHeader, Stat } from "@/components/ui";
import { addRunMinutes, resetRun, setSlot, skipStage, startRun, stopRun } from "@/app/actions/admin-escape";
import { getRankedBoard } from "@/lib/escape/board";
import { mmss } from "@/lib/escape/format";
import type { BoardRow } from "@/lib/escape/types";
import { getEvent } from "@/lib/event";
import { createAdminClient } from "@/lib/supabase/admin";
import { nowMs } from "@/lib/time";
import { ui } from "@/lib/ui";

export const dynamic = "force-dynamic";

const STATE: Record<string, { label: string; cls: string }> = {
  ready: { label: "WAITING", cls: "text-muted" },
  running: { label: "IN THE ROOM", cls: "text-cyan-300" },
  escaped: { label: "ESCAPED", cls: "text-emerald-300" },
  timeout: { label: "TIME UP", cls: "text-danger" },
  stopped: { label: "STOPPED", cls: "text-amber-300" },
};

function ago(iso: string | null, now: number) {
  if (!iso) return "—";
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)} min ago`;
}

function Row({ t, total, live, now }: { t: BoardRow; total: number; live: boolean; now: number }) {
  const st = STATE[t.status];
  const hidden = (
    <>
      <input type="hidden" name="teamId" value={t.team_id} />
      <input type="hidden" name="back" value="/admin/live" />
    </>
  );
  return (
    <tr className="border-t border-line align-top">
      <td className={ui.td}>
        <form action={setSlot} className="flex gap-1">
          {hidden}
          <input name="slot" defaultValue={t.slot_label} placeholder="slot" aria-label={`Slot for ${t.team_code}`} className={`${ui.input} w-24 py-1 text-xs`} />
          <button className="text-xs text-muted hover:text-text">Set</button>
        </form>
      </td>
      <td className={ui.td}>
        <div className="font-medium">{t.name}</div>
        <div className="font-mono text-xs text-muted">
          {t.team_code}
          {t.is_dummy && " · dummy"}
          {!t.checked_in && " · not checked in"}
          {!t.has_login && " · NO LOGIN"}
        </div>
      </td>
      <td className={`${ui.td} font-mono text-xs font-black tracking-widest ${st.cls}`}>{st.label}</td>
      <td className={`${ui.td} font-mono`}>
        {t.stages_cleared}
        <span className="text-muted">/{total}</span>
        {t.status === "running" && t.current_stage && <span className="ml-1.5 text-xs text-cyan-300">on {t.current_stage}</span>}
      </td>
      <td className={ui.td}>
        {t.status === "running" && t.ends_at ? (
          <RunClock endsAt={t.ends_at} serverNow={now} />
        ) : t.status === "ready" ? (
          "—"
        ) : (
          <span className="font-mono text-sm">{mmss(t.total_seconds)}</span>
        )}
        {t.extra_minutes > 0 && <div className="text-xs text-amber-300">+{t.extra_minutes} min given</div>}
      </td>
      <td className={`${ui.td} font-mono`}>
        {t.hints_used}
        <span className="text-xs text-muted"> · {t.wrong_attempts} wrong</span>
      </td>
      <td className={`${ui.td} text-xs text-muted`}>{t.status === "running" ? ago(t.last_activity, now) : "—"}</td>
      <td className={ui.td}>
        <div className="flex flex-wrap items-start gap-2">
          {t.status === "ready" && (
            <form action={startRun}>
              {hidden}
              <button disabled={!live} title={live ? "Start this team's clock now" : "Open the event first (Control tab)"} className={`${ui.btn} py-1.5 disabled:cursor-not-allowed`}>
                ▶ START
              </button>
            </form>
          )}
          {t.status === "running" && (
            <form action={addRunMinutes} className="flex gap-1">
              {hidden}
              <input type="hidden" name="minutes" value="5" />
              <button className={ui.btnGhost} title="Give this team 5 extra minutes (e.g. computer fault)">
                +5 min
              </button>
            </form>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer py-1.5 text-muted">More</summary>
            <div className="mt-2 space-y-2 rounded-lg border border-line bg-ink p-3">
              {t.status === "running" && (
                <>
                  <form action={addRunMinutes} className="flex items-center gap-1">
                    {hidden}
                    <input name="minutes" type="number" defaultValue={5} className={`${ui.input} w-16 py-1`} aria-label="Minutes (negative removes)" />
                    <button className={ui.btnGhost}>Add / remove min</button>
                  </form>
                  <form action={skipStage} className="flex items-center gap-1">
                    {hidden}
                    <label className="flex items-center gap-1">
                      <input type="checkbox" name="confirm" /> sure
                    </label>
                    <button className={ui.btnGhost} title="Mark the current puzzle cleared without an answer (broken prop). No penalty.">
                      Skip current stage
                    </button>
                  </form>
                  <form action={stopRun} className="flex items-center gap-1">
                    {hidden}
                    <label className="flex items-center gap-1">
                      <input type="checkbox" name="confirm" /> sure
                    </label>
                    <button className={ui.btnDanger}>Stop run</button>
                  </form>
                </>
              )}
              {t.status !== "ready" && (
                <form action={resetRun} className="flex items-center gap-1">
                  {hidden}
                  <input name="confirm" placeholder="RESET" aria-label="Type RESET to confirm" className={`${ui.input} w-20 py-1`} />
                  <button className={ui.btnDanger} title="Deletes this team's progress, hints and time so it can play again">
                    Reset run
                  </button>
                </form>
              )}
              {t.status === "ready" && <p className="text-muted">Nothing else to do until this team starts.</p>}
            </div>
          </details>
        </div>
      </td>
    </tr>
  );
}

function Table({ rows, total, live, now, empty }: { rows: BoardRow[]; total: number; live: boolean; now: number; empty: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full text-sm">
        <thead className="text-muted">
          <tr>
            <th className={ui.th}>Slot</th>
            <th className={ui.th}>Team</th>
            <th className={ui.th}>State</th>
            <th className={ui.th}>Puzzles</th>
            <th className={ui.th}>Time</th>
            <th className={ui.th}>Hints</th>
            <th className={ui.th}>Last action</th>
            <th className={ui.th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <Row key={t.team_id} t={t} total={total} live={live} now={now} />
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-muted">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function LivePage() {
  const [board, event, stageRes] = await Promise.all([getRankedBoard(), getEvent(), createAdminClient().from("escape_stages").select("id", { count: "exact", head: true })]);
  const total = stageRes.count ?? 0;
  const live = event?.phase === "investigation";
  const now = nowMs();
  const real = board.filter((t) => !t.is_dummy);
  const rows = real.length ? real : board;

  const bySlot = (a: BoardRow, b: BoardRow) => (a.slot_label || "~").localeCompare(b.slot_label || "~", undefined, { numeric: true }) || a.team_code.localeCompare(b.team_code);
  const running = rows.filter((t) => t.status === "running").sort(bySlot);
  const waiting = rows.filter((t) => t.status === "ready").sort(bySlot);
  const done = rows.filter((t) => ["escaped", "timeout", "stopped"].includes(t.status)).sort((a, b) => Date.parse(b.finished_at ?? "") - Date.parse(a.finished_at ?? ""));

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={5} />
      <PageHeader
        kicker="During the event"
        title="Live slots"
        description={
          live
            ? "Press START when a team is seated in the room. Their clock begins that second and the first clue appears on their screen."
            : "The event is not Live, so teams cannot be started. Open it on the Control tab."
        }
      />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="In the room" value={running.length} tone={running.length ? "info" : undefined} />
        <Stat label="Waiting" value={waiting.length} note={`${waiting.filter((t) => t.slot_label).length} with a slot`} />
        <Stat label="Finished" value={done.length} note={`${done.filter((t) => t.status === "escaped").length} escaped`} tone="ok" />
        <Stat label="Hint penalty" value={`${rows.reduce((n, t) => n + t.hints_used, 0)} hints`} note="across all teams" />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">In the room now</h2>
        <Table rows={running} total={total} live={live} now={now} empty="Nobody is playing right now." />
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Waiting for their slot ({waiting.length})</h2>
        <Table rows={waiting} total={total} live={live} now={now} empty="Everyone has played." />
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Finished ({done.length})</h2>
        <Table rows={done} total={total} live={live} now={now} empty="No finished run yet." />
      </section>
    </div>
  );
}
