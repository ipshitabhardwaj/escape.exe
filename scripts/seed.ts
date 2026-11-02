/**
 * Seed the database for development and testing.
 *   npm run seed
 *
 * Creates (idempotent, safe to re-run):
 *   - 1 admin account         SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 *   - the Escape.exe puzzle chain from puzzles/escape-exe.json
 *   - 10 dummy teams          EXE-T01 ... EXE-T10 with random 6-digit PINs
 *
 * Real teams are NOT created here. They come from the registration-form CSV
 * import on /admin/teams (next build step).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomInt } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEscapeFile } from "../lib/escape/load";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.NEXT_PUBLIC_TEAM_EMAIL_DOMAIN ?? "teams.aifiles.local";
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@aifiles.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
if (url.includes("YOUR-PROJECT") || serviceKey.startsWith("your-")) {
  console.error(".env.local still has the placeholder values from .env.example.\nPaste your real Supabase URL and keys (Project Settings -> API), save the file, and run again.");
  process.exit(1);
}
if (!adminPassword) throw new Error("Set SEED_ADMIN_PASSWORD in .env.local");

const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const DUMMY_TEAMS = 10;

async function findUserByEmail(supabase: SupabaseClient, email: string) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 1000) return null;
  }
}

/** Create the auth user, or reset its password + metadata if it exists. */
async function ensureUser(email: string, password: string, app_metadata: Record<string, unknown>) {
  const existing = await findUserByEmail(db, email);
  if (existing) {
    const { error } = await db.auth.admin.updateUserById(existing.id, { password, app_metadata });
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, app_metadata });
  if (error) throw error;
  return data.user.id;
}

async function ensureProfile(user_id: string, role: "admin" | "team", display_name: string, team_id: string | null = null) {
  const { error } = await db.from("profiles").upsert({ user_id, role, display_name, team_id });
  if (error) throw error;
}

async function main() {
  // Safety: seeding re-creates dummy teams and resets the admin password. Never during an event.
  const { data: ev } = await db.from("event").select("phase").eq("id", 1).maybeSingle();
  if (ev && ev.phase !== "waiting" && !process.argv.includes("--force")) {
    console.error(`The event is in phase "${ev.phase}". Seeding is only allowed in "waiting" (add --force to override).`);
    process.exit(1);
  }

  // Staff
  const adminId = await ensureUser(adminEmail, adminPassword!, { role: "admin" });
  await ensureProfile(adminId, "admin", "Organiser");
  console.log(`Staff ready: ${adminEmail}`);

  // Puzzles
  const { stages, removed } = await loadEscapeFile(db, JSON.parse(readFileSync(join(process.cwd(), "puzzles", "escape-exe.json"), "utf8")));
  console.log(`Puzzles loaded: ${stages} stages${removed ? ` (${removed} old stage(s) removed)` : ""}`);

  // Dummy teams
  const slips: { code: string; pin: string; name: string }[] = [];
  for (let i = 1; i <= DUMMY_TEAMS; i++) {
    const code = `EXE-T${String(i).padStart(2, "0")}`;
    const name = `Test Team ${i}`;

    const { data: team, error: teamErr } = await db
      .from("teams")
      .upsert(
        {
          team_code: code,
          name,
          institution: "Dummy",
          members: [{ name: `Member ${i}A` }, { name: `Member ${i}B` }],
          is_dummy: true,
        },
        { onConflict: "team_code" },
      )
      .select("id")
      .single();
    if (teamErr) throw teamErr;

    const { data: cred } = await db.from("team_credentials").select("pin").eq("team_id", team.id).maybeSingle();
    const pin = cred?.pin ?? String(randomInt(0, 1_000_000)).padStart(6, "0");

    const userId = await ensureUser(`${code.toLowerCase()}@${domain}`, pin, { role: "team", team_id: team.id });
    await db.from("teams").update({ auth_user_id: userId }).eq("id", team.id);
    await db.from("team_credentials").upsert({ team_id: team.id, pin, updated_at: new Date().toISOString() });
    await ensureProfile(userId, "team", name, team.id);
    slips.push({ code, pin, name });
  }

  console.log("\nDummy team logins:");
  console.table(slips);
  console.log("\nDone. Start the app with `npm run dev` and open http://localhost:3000");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
