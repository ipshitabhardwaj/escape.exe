import Link from "next/link";
import AutoRefresh from "@/components/admin/AutoRefresh";
import { PageHeader, Progress, Section, Stat } from "@/components/ui";
import { capacitySettings, planAuthCapacity } from "@/lib/capacity";
import { phaseInfo } from "@/lib/constants";
import { getEscapeConfig, getRankedBoard } from "@/lib/escape/board";
import { minSec } from "@/lib/escape/format";
import { getEvent } from "@/lib/event";
import { createAdminClient } from "@/lib/supabase/admin";
import { ui } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const db = createAdminClient();
  const event = await getEvent();
  const [board, cfg, stagesRes, keysRes] = await Promise.all([
    getRankedBoard(),
    getEscapeConfig(),
    db.from("escape_stages").select("id, code, hints"),
    db.from("escape_keys").select("stage_id, answers"),
  ]);
  const stages = stagesRes.data ?? [];
  const keyed = new Set((keysRes.data ?? []).filter((k) => (k.answers as string[]).length > 0).map((k) => k.stage_id as string));
  const incomplete = stages.filter((s) => !keyed.has(s.id as string) || !Array.isArray(s.hints) || s.hints.length === 0).map((s) => s.code as string);

  const real = board.filter((t) => !t.is_dummy);
  const dummy = board.length - real.length;
  const n = (f: (t: (typeof board)[number]) => boolean) => board.filter(f).length;

  const cap = capacitySettings();
  const plan = planAuthCapacity({ teams: real.length || board.length, devicesPerTeam: cap.devicesPerTeam, loginWindowMinutes: cap.loginWindowMinutes });
  const capOk = cap.configuredLimitPer5Min > 0 && cap.configuredLimitPer5Min >= plan.recommendedPer5Min;

  const ready: { ok: boolean; label: string; detail: string; href: string }[] = [
    { ok: stages.length > 0 && incomplete.length === 0, label: "Puzzles loaded", detail: stages.length ? `${stages.length} stages${incomplete.length ? ` · incomplete: ${incomplete.join(", ")}` : ", all with answers and hints"}` : "none loaded — run npm run seed or upload puzzles/escape-exe.json", href: "/admin/puzzles" },
    { ok: real.length > 0, label: "Real teams imported", detail: `${real.length} real team(s)`, href: "/admin/teams" },
    { ok: dummy === 0, label: "Dummy teams deleted", detail: dummy ? `${dummy} dummy team(s) left` : "OK", href: "/admin/teams" },
    { ok: board.length > 0 && n((t) => !t.has_login) === 0, label: "Every team has a login", detail: `${n((t) => !t.has_login)} without login`, href: "/admin/teams" },
    { ok: true, label: "Clock and hint rules", detail: `${cfg.duration_minutes} min per team · each hint +${minSec(cfg.hint_penalty_seconds)} (change in Control while Doors Sealed)`, href: "/admin/control" },
    {
      ok: capOk,
      label: "Login capacity confirmed",
      detail: cap.configuredLimitPer5Min
        ? `limit ${cap.configuredLimitPer5Min} / 5 min, need ≥ ${plan.recommendedPer5Min}`
        : `need ≥ ${plan.recommendedPer5Min} sign-ins+refreshes / 5 min — check Supabase → Authentication → Rate Limits, then set SUPABASE_AUTH_TOKEN_LIMIT_PER_5MIN`,
      href: "/admin",
    },
  ];
  const readyCount = ready.filter((r) => r.ok).length;
  const allReady = readyCount === ready.length;

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={30} />
      <PageHeader
        kicker="Step 1 · before the event"
        title="Setup"
        description={`Now: ${event ? phaseInfo(event.phase).label : "—"}. Work down this list; when it is all green, set up the room (docs/ESCAPE_SETUP.md) and go to Control.`}
        actions={
          <Link href="/admin/control" className={ui.btnLg}>
            Control →
          </Link>
        }
      />

      <Section title={allReady ? "Ready to go ✓" : "Before the event"} description={`${readyCount} of ${ready.length} done`}>
        <Progress value={readyCount} max={ready.length} tone={allReady ? "ok" : "accent"} label="Setup progress" />
        <ul className="mt-3 divide-y divide-line">
          {ready.map((r) => (
            <li key={r.label} className="flex items-start gap-3 py-3">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${r.ok ? "bg-ok text-ink" : "bg-accent text-white"}`}>{r.ok ? "✓" : "!"}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.label}</p>
                <p className="text-sm text-muted">{r.detail}</p>
              </div>
              {!r.ok && r.href !== "/admin" && (
                <Link href={r.href} className={ui.btnGhost}>
                  Fix →
                </Link>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-muted">
          Not tracked here — check by hand: the sticky note under every keyboard, the QR sticker on the rack, the lockbox set to 000 with the card inside, the webcam allowed in the browser on every room PC.
          Full list in <code>docs/ESCAPE_SETUP.md</code>.
        </p>
      </Section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Teams" value={board.length} note={`${n((t) => t.checked_in)} checked in`} href="/admin/teams" />
        <Stat label="In the room now" value={n((t) => t.status === "running")} note="clock running" href="/admin/live" />
        <Stat label="Escaped" value={n((t) => t.status === "escaped")} note={`${n((t) => t.status === "timeout" || t.status === "stopped")} did not`} href="/admin/results" />
        <Stat label="Still to play" value={n((t) => t.status === "ready")} note="not started yet" href="/admin/live" />
      </section>

      <details className="rounded-xl border border-line bg-panel">
        <summary className="cursor-pointer px-5 py-3 font-semibold">Details — login capacity</summary>
        <ul className="space-y-1.5 border-t border-line p-5 text-sm text-muted">
          <li>
            Logins: {plan.devices} devices ({real.length || board.length} teams × {cap.devicesPerTeam}), logins within {cap.loginWindowMinutes} min → need ≥{" "}
            <b className="text-text">{plan.recommendedPer5Min}</b> per 5 min{cap.configuredLimitPer5Min ? ` · configured ${cap.configuredLimitPer5Min}` : ""}
          </li>
        </ul>
      </details>
    </div>
  );
}
