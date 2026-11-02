import AutoRefresh from "@/components/admin/AutoRefresh";
import LiveClock from "@/components/admin/LiveClock";
import { PageHeader } from "@/components/ui";
import { resetEvent, saveConfig, setPhase } from "@/app/actions/admin";
import { PHASES, phaseInfo, type EventPhase } from "@/lib/constants";
import { getEscapeConfig, getRankedBoard } from "@/lib/escape/board";
import { getEvent } from "@/lib/event";
import { transitionsFrom } from "@/lib/state-machine";
import { ui } from "@/lib/ui";

export const dynamic = "force-dynamic";

const STEPS: { phase: EventPhase; title: string; detail: string }[] = [
  { phase: "investigation", title: "Open the event (Live)", detail: "Teams can now be started from Live slots. Each team's own clock begins only when you press START for it." },
  { phase: "closed", title: "Close the event", detail: "Ends the day. Any slot still running is stopped and counts as “did not escape”. Scores are final." },
  { phase: "results", title: "Reveal results", detail: "The leaderboard appears on the big screen and on every team's screen." },
];

const DURING: Record<EventPhase, string> = {
  waiting: "Set the clock and hint rules, check teams in, build the room. When the first team is seated, open the event.",
  investigation: "Start each team on the Live slots tab when it is inside the room, one slot at a time. Close the event after the last slot.",
  closed: "All slots are over. Check the Results tab, export the CSV, then reveal the results.",
  results: "Results are public. Export the CSV from Results and keep it safe.",
};

export default async function ControlPage() {
  const event = await getEvent();
  const [board, cfg] = await Promise.all([getRankedBoard(), getEscapeConfig()]);
  const rawPhase = event?.phase ?? "waiting";
  const unknown = !PHASES.some((p) => p.id === rawPhase);
  const phase = (unknown ? "waiting" : rawPhase) as EventPhase;
  const current = PHASES.findIndex((p) => p.id === phase);
  const running = board.filter((t) => t.status === "running").length;
  const forward = transitionsFrom(phase).filter((t) => !t.back);
  const back = transitionsFrom(phase).find((t) => t.back);

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={15} />
      <PageHeader kicker="Run the event" title="Control" description="Four phases, one step at a time. Each team's own 45-minute clock is started separately on the Live slots tab." />

      <section className="rounded-2xl border border-line bg-panel p-6" aria-label="Now">
        <div className="flex flex-wrap items-start gap-6">
          <LiveClock initial={event} />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm text-slate-300">{DURING[phase]}</p>
            <ol className="flex flex-wrap items-center gap-2 pt-1">
              {PHASES.map((p, i) => (
                <li key={p.id} className={`rounded-full border px-3 py-1 font-mono text-xs font-bold ${i < current ? "border-ok/40 text-ok" : i === current ? "border-accent bg-accent/15 text-white" : "border-white/10 text-muted"}`}>
                  {i < current ? "✓ " : ""}
                  {p.label}
                </li>
              ))}
            </ol>
            {phase === "investigation" && <p className="text-sm text-cyan-200">{running} team(s) in the room right now.</p>}
          </div>
        </div>
      </section>

      {unknown && (
        <section role="alert" className="rounded-2xl border-2 border-danger/60 bg-danger/10 p-6">
          <h2 className="text-lg font-bold text-danger">The event is in an old phase (“{String(rawPhase)}”)</h2>
          <p className="mt-1 text-sm text-slate-300">It is left over from the previous detective version, so no step is available. Open “More options” below and use Reset event (type RESET): it returns to Doors Sealed and keeps your teams and puzzles.</p>
        </section>
      )}

      {forward.map((t) => {
        const step = STEPS.find((s) => s.phase === t.to)!;
        return (
          <form key={t.to} action={setPhase} className="rounded-2xl border-2 border-accent/60 bg-accent/10 p-6">
            <input type="hidden" name="phase" value={t.to} />
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-accent">Next step</p>
            <h2 className="mt-1 text-xl font-bold text-white">{step.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">{step.detail}</p>
            {t.confirm && (
              <label className="mt-4 flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirm" /> I’m sure
              </label>
            )}
            <button className={`${ui.btnLg} mt-4`}>{step.title} →</button>
          </form>
        );
      })}

      {phase === "waiting" && (
        <section className={ui.card}>
          <h2 className="font-semibold">Clock and hints</h2>
          <p className="mt-1 text-sm text-muted">The same for every team. Locked as soon as the event goes Live, so no one plays under different rules.</p>
          <form action={saveConfig} className="mt-4 flex flex-wrap items-end gap-4">
            <label className="text-sm">
              <span className={ui.label}>Minutes per team slot</span>
              <input name="duration_minutes" type="number" min={5} max={240} defaultValue={cfg.duration_minutes} className={`${ui.input} w-28`} />
            </label>
            <label className="text-sm">
              <span className={ui.label}>Minutes added per hint</span>
              <input name="hint_penalty_minutes" type="number" min={0} max={30} step={0.5} defaultValue={cfg.hint_penalty_seconds / 60} className={`${ui.input} w-28`} />
            </label>
            <button className={ui.btn}>Save</button>
          </form>
        </section>
      )}

      <details className="rounded-xl border border-line bg-panel" open={unknown}>
        <summary className="cursor-pointer px-5 py-3 font-semibold">More options</summary>
        <div className="space-y-6 border-t border-line p-5">
          {back && (
            <form action={setPhase} className="space-y-2">
              <input type="hidden" name="phase" value={back.to} />
              <h3 className="font-medium">Go back to “{phaseInfo(back.to).label}”</h3>
              <p className="text-sm text-muted">Runs that already ended stay ended. Type BACK to confirm.</p>
              <div className="flex gap-2">
                <input name="override" placeholder="BACK" aria-label="Type BACK to confirm" className={`${ui.input} w-28`} />
                <button className={ui.btnGhost}>Go back</button>
              </div>
            </form>
          )}
          <form action={resetEvent} className="space-y-2 rounded-xl border border-danger/40 p-4">
            <h3 className="font-medium text-danger">Danger zone — reset the event</h3>
            <p className="text-sm text-muted">
              For after a dry run. Deletes every team’s run: progress, hints, attempts and times. Back to Doors Sealed. Teams, logins and puzzles stay.
            </p>
            <div className="flex gap-2">
              <input name="confirm" placeholder="type RESET" aria-label="Type RESET to confirm" className={`${ui.input} w-36`} />
              <button className={ui.btnDanger}>Reset event</button>
            </div>
          </form>
        </div>
      </details>
    </div>
  );
}
