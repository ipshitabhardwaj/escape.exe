"use server";

import { revalidatePath } from "next/cache";
import { UserError, backTo, confirmed, runAction } from "@/lib/admin-action";
import { requireRole } from "@/lib/auth";
import { loadEscapeFile } from "@/lib/escape/load";
import { createAdminClient } from "@/lib/supabase/admin";

const PATH = "/admin/live";

async function teamCode(db: ReturnType<typeof createAdminClient>, id: string) {
  const { data } = await db.from("teams").select("team_code").eq("id", id).maybeSingle();
  if (!data) throw new UserError("Team not found.");
  return data.team_code as string;
}

/** START the team's slot: its clock begins now and it sees the first clue. */
export async function startRun(formData: FormData) {
  await requireRole("admin");
  const back = backTo(formData, PATH);
  await runAction(back, async () => {
    const db = createAdminClient();
    const id = String(formData.get("teamId"));
    const code = await teamCode(db, id);
    const { data, error } = await db.rpc("escape_admin_start", { p_team: id });
    if (error) throw new Error(error.message);
    const msg: Record<string, string> = {
      not_live: "The event is not Live. Open it in the Control tab first.",
      no_stages: "No puzzles are loaded.",
      no_team: "Team not found.",
    };
    if (data !== "started") {
      throw new UserError(msg[data as string] ?? `${code} cannot be started (${String(data).replace("already_", "run is already ")}). Use “Reset run” to let it play again.`);
    }
    revalidatePath("/admin", "layout");
    return `${code} started. The clock is running.`;
  });
}

/** Game Master skips the team's current stage (broken prop, camera fault). No time penalty. */
export async function skipStage(formData: FormData) {
  await requireRole("admin");
  const back = backTo(formData, PATH);
  await runAction(back, async () => {
    if (!confirmed(formData)) throw new UserError("Tick “sure” first: the stage is marked cleared without an answer.");
    const db = createAdminClient();
    const id = String(formData.get("teamId"));
    const code = await teamCode(db, id);
    const { data, error } = await db.rpc("escape_admin_skip", { p_team: id });
    if (error) throw new Error(error.message);
    if (data === "not_running") throw new UserError(`${code} is not running.`);
    revalidatePath("/admin", "layout");
    return data === "finished" ? `${code}: last stage skipped. The team has escaped.` : `${code}: ${String(data).replace("skipped:", "")} skipped (no penalty).`;
  });
}

/** End a team's run now. It counts as "did not escape". */
export async function stopRun(formData: FormData) {
  await requireRole("admin");
  const back = backTo(formData, PATH);
  await runAction(back, async () => {
    if (!confirmed(formData)) throw new UserError("Tick “sure” first.");
    const db = createAdminClient();
    const id = String(formData.get("teamId"));
    const code = await teamCode(db, id);
    const { data, error } = await db.rpc("escape_admin_stop", { p_team: id });
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
    return data === "stopped" ? `${code}'s run was stopped.` : `${code} was not running.`;
  });
}

/** Wipe one team's run (progress, hints, attempts) so it can play its slot again. */
export async function resetRun(formData: FormData) {
  await requireRole("admin");
  const back = backTo(formData, PATH);
  await runAction(back, async () => {
    if (String(formData.get("confirm")).trim().toUpperCase() !== "RESET") throw new UserError("Type RESET to confirm. This deletes the team's progress, hints and time.");
    const db = createAdminClient();
    const id = String(formData.get("teamId"));
    const code = await teamCode(db, id);
    const { error } = await db.rpc("escape_admin_reset_team", { p_team: id });
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
    return `${code}'s run was reset. It can be started again.`;
  });
}

/** Add (or remove) minutes on one team's clock, e.g. after a computer fault. Max +60 in total. */
export async function addRunMinutes(formData: FormData) {
  await requireRole("admin");
  const back = backTo(formData, PATH);
  await runAction(back, async () => {
    const minutes = Math.round(Number(formData.get("minutes") || 0));
    if (!minutes || Math.abs(minutes) > 30) throw new UserError("Enter a number of minutes between -30 and 30.");
    const db = createAdminClient();
    const id = String(formData.get("teamId"));
    const code = await teamCode(db, id);
    const { data: run } = await db.from("escape_runs").select("extra_minutes, status").eq("team_id", id).maybeSingle();
    if (!run || run.status === "ready") throw new UserError(`${code} has not started yet.`);
    if (run.status === "timeout" && minutes > 0) throw new UserError(`${code}'s time already ran out. Reset the run to replay, or tell the team the result stands.`);
    const extra = Math.max(0, Math.min(60, (run.extra_minutes ?? 0) + minutes));
    const { error } = await db.from("escape_runs").update({ extra_minutes: extra, updated_at: new Date().toISOString() }).eq("team_id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
    return `${code}: clock extension is now +${extra} min. The team's screen updates within a few seconds.`;
  });
}

/** Free-text slot label ("10:30–11:15", "Slot 4") shown to the team and on the board. */
export async function setSlot(formData: FormData) {
  await requireRole("admin");
  const back = backTo(formData, PATH);
  await runAction(back, async () => {
    const db = createAdminClient();
    const id = String(formData.get("teamId"));
    const code = await teamCode(db, id);
    const label = String(formData.get("slot") ?? "").trim().slice(0, 30);
    const { data: run } = await db.from("escape_runs").select("team_id").eq("team_id", id).maybeSingle();
    const res = run
      ? await db.from("escape_runs").update({ slot_label: label, updated_at: new Date().toISOString() }).eq("team_id", id)
      : await db.from("escape_runs").insert({ team_id: id, slot_label: label });
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/admin", "layout");
    return label ? `${code}: slot set to “${label}”.` : `${code}: slot cleared.`;
  });
}

export type UploadResult = { ok: true; message: string } | { ok: false; error: string };

/** Upload / update the puzzle chain (puzzles/escape-exe.json). Only before the event is Live, unless confirmed. */
export async function uploadPuzzles(jsonText: string, allowDuringEvent: boolean): Promise<UploadResult> {
  await requireRole("admin");
  if (typeof jsonText !== "string" || jsonText.length > 1_000_000) return { ok: false, error: "File too large (max 1 MB)." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${e instanceof Error ? e.message : e}` };
  }
  const db = createAdminClient();
  const { data: ev } = await db.from("event").select("phase").eq("id", 1).single();
  if (ev && ev.phase !== "waiting" && !allowDuringEvent) {
    return { ok: false, error: "The event has started. Tick the confirmation to change puzzles now — running teams will see the corrected puzzle." };
  }
  try {
    const { stages, removed } = await loadEscapeFile(db, parsed);
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Loaded ${stages} stages.${removed ? ` ${removed} stage(s) no longer in the file were removed.` : ""}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
