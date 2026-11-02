/**
 * Reset the event from the terminal (same as Control room → More options →
 * Danger zone → Reset event):
 *
 *   npm run reset -- RESET
 *
 * Deletes every team's run (progress, hints, attempts, times) and puts the
 * event back to Doors Sealed. Keeps teams, PINs, check-ins, puzzles and the
 * admin account.
 * The word RESET is required so it cannot be run by accident.
 */
import { createClient } from "@supabase/supabase-js";
import { resetEventData } from "../lib/reset";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");

async function main() {
  const db = createClient(url!, serviceKey!, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: before } = await db.from("event").select("phase").eq("id", 1).single();

  if (process.argv[2] !== "RESET") {
    console.log(`The event is in phase "${before?.phase}". Nothing was changed.`);
    console.log("To reset it to Doors Sealed and delete every run, hint and time, run:\n\n  npm run reset -- RESET\n");
    process.exit(1);
  }

  await resetEventData(db);
  const [{ data: after }, { count: runs }, { count: teams }] = await Promise.all([
    db.from("event").select("phase").eq("id", 1).single(),
    db.from("escape_runs").select("team_id", { count: "exact", head: true }),
    db.from("teams").select("id", { count: "exact", head: true }),
  ]);
  console.log(`Event reset: "${before?.phase}" → "${after?.phase}". Runs left: ${runs ?? 0}. Teams kept: ${teams ?? 0}.`);
  console.log("Next: check the puzzles are loaded (`npm run seed` or the Puzzles page), then open the event from the Control tab.");
}

main().catch((e) => {
  console.error("Reset failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
