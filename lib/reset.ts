import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Reset the event: delete every team's run (progress, hints, attempts) and go
 * back to "Doors Sealed". Keeps teams, logins, puzzles and the admin. Needs a
 * service-role client.
 *
 * First tries the database function admin_reset_event() (one transaction).
 * Hosted Supabase refuses a DELETE or UPDATE without a WHERE clause; if that
 * ever happens the same steps are done here, one table at a time.
 */
export async function resetEventData(db: SupabaseClient): Promise<"function" | "step-by-step"> {
  const { error } = await db.rpc("admin_reset_event");
  if (!error) return "function";
  if (!/WHERE clause/i.test(error.message)) throw new Error(error.message);

  const clear = async (table: string, column: string) => {
    const { error: e } = await db.from(table).delete().not(column, "is", null);
    if (e) throw new Error(`Reset stopped at ${table}: ${e.message}`);
  };
  for (const table of ["escape_attempts", "escape_hint_uses", "escape_solves", "escape_runs"]) await clear(table, "team_id");
  await clear("login_attempts", "key");
  // Last, so a failure above leaves the phase unchanged and the reset can simply be run again.
  const ev = await db.from("event").update({ phase: "waiting", phase_ends_at: null, twist_released_at: null, updated_at: new Date().toISOString() }).eq("id", 1);
  if (ev.error) throw new Error(`Reset stopped at event: ${ev.error.message}`);
  return "step-by-step";
}
