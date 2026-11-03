"use server";

import { revalidatePath } from "next/cache";
import { UserError, confirmed, runAction } from "@/lib/admin-action";
import { requireRole } from "@/lib/auth";
import { PHASES, phaseInfo, type EventPhase } from "@/lib/constants";
import { resetEventData } from "@/lib/reset";
import { checkTransition } from "@/lib/state-machine";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Event control. The event has four phases (Doors Sealed → Event Live →
 * Event Closed → Results Out). Every change goes through goToPhase so the
 * side effects always happen, whichever button the organiser uses:
 *   entering Closed or later -> every run still going is stopped
 * Which changes are allowed, and which need "I'm sure" or the word BACK,
 * is defined once in lib/state-machine.ts.
 */
const ORDER: EventPhase[] = PHASES.map((p) => p.id);
const idx = (p: EventPhase) => ORDER.indexOf(p);
const PATH = "/admin/control";

async function goToPhase(phase: EventPhase, expected: EventPhase) {
  const db = createAdminClient();
  if (idx(phase) >= idx("closed")) {
    const { error } = await db.rpc("escape_admin_close_runs");
    if (error) throw new Error(`Stopping the running teams failed: ${error.message}`);
  }
  // Only if nobody else changed the phase meanwhile (two organisers clicking at once).
  const { data: moved, error } = await db
    .from("event")
    .update({ phase, phase_ends_at: null, twist_released_at: null, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .eq("phase", expected)
    .select("id");
  if (error) throw new Error(error.message);
  if (!moved?.length) throw new UserError("Someone else changed the phase at the same moment. Check the current phase and try again.");
}

/** Form action: `phase`, `confirm` checkbox, `override` text. */
export async function setPhase(formData: FormData) {
  await requireRole("admin");
  await runAction(PATH, async () => {
    const phase = String(formData.get("phase")) as EventPhase;
    if (!ORDER.includes(phase)) throw new UserError("Unknown phase.");
    const db = createAdminClient();
    const { data: ev } = await db.from("event").select("phase").eq("id", 1).single();
    const current = (ev?.phase ?? "waiting") as EventPhase;

    const [{ count: stages }, { count: ranked }, { count: running }] = await Promise.all([
      db.from("escape_stages").select("id", { count: "exact", head: true }),
      db.from("escape_runs").select("team_id", { count: "exact", head: true }).neq("status", "ready"),
      db.from("escape_runs").select("team_id", { count: "exact", head: true }).eq("status", "running"),
    ]);
    const check = checkTransition(
      current,
      phase,
      { confirmed: confirmed(formData), backWord: String(formData.get("override") ?? "") },
      { stages: stages ?? 0, ranked: ranked ?? 0 },
    );
    if (!check.ok) {
      const from = phaseInfo(current).label;
      const to = phaseInfo(phase).label;
      const msg: Record<string, string> = {
        already: `Already in “${to}”.`,
        invalid: `“${from}” → “${to}” is not an allowed step. Follow the steps in order.`,
        "needs-back": `Going back from “${from}” to “${to}” is unusual. Runs that already ended stay ended. Type BACK to confirm.`,
        "needs-confirm": `Tick “I’m sure” to move to “${to}”.`,
        "no-stages": "Load the puzzles first (Puzzles tab). There is nothing for teams to play yet.",
        "no-runs": "No team has played yet, so there are no results to reveal.",
      };
      throw new UserError(msg[check.reason] ?? "Not allowed.");
    }

    await goToPhase(phase, current);
    revalidatePath("/admin", "layout");
    const stopped = idx(phase) >= idx("closed") && current === "investigation" && running ? ` ${running} running team(s) were stopped.` : "";
    return `Phase is now “${phaseInfo(phase).label}”.${stopped}`;
  });
}

/** Clock length and hint penalty. Only before the event goes live, so nobody's rules change mid-run. */
export async function saveConfig(formData: FormData) {
  await requireRole("admin");
  await runAction(PATH, async () => {
    const minutes = Math.round(Number(formData.get("duration_minutes")));
    const penaltyMin = Number(formData.get("hint_penalty_minutes"));
    if (!Number.isFinite(minutes) || minutes < 5 || minutes > 240) throw new UserError("The clock must be between 5 and 240 minutes.");
    if (!Number.isFinite(penaltyMin) || penaltyMin < 0 || penaltyMin > 30) throw new UserError("The hint penalty must be between 0 and 30 minutes.");
    const db = createAdminClient();
    const { data: ev } = await db.from("event").select("phase").eq("id", 1).single();
    if (ev?.phase !== "waiting") throw new UserError("The rules can only be changed while the event is in “Doors Sealed”. Changing them mid-event would be unfair to teams that already played.");
    const { error } = await db
      .from("escape_config")
      .update({ duration_minutes: minutes, hint_penalty_seconds: Math.round(penaltyMin * 60) })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
    return `Saved: ${minutes} minutes per team, each hint costs ${penaltyMin} minute(s).`;
  });
}

/** Dry-run reset: wipes every run, keeps teams, logins and puzzles. */
export async function resetEvent(formData: FormData) {
  await requireRole("admin");
  await runAction(PATH, async () => {
    if (String(formData.get("confirm")).trim() !== "RESET") throw new UserError("Type RESET (capitals) to confirm.");
    const db = createAdminClient();
    await resetEventData(db);
    revalidatePath("/admin", "layout");
    return "Event reset: every run, hint and attempt was deleted. Phase is Doors Sealed. Teams, logins and puzzles were kept.";
  });
}
