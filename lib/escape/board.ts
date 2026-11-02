import "server-only";
import { selectAll } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { rankBoard } from "./rank";
import type { BoardRow } from "./types";

/** Every team with its run and its rank. Service-role only (the database function times out overdue runs first). */
export async function getRankedBoard() {
  const db = createAdminClient();
  const rows = await selectAll<BoardRow>((a, b) => db.rpc("escape_board").range(a, b));
  return rankBoard(rows);
}

export async function getEscapeConfig() {
  const db = createAdminClient();
  const { data } = await db.from("escape_config").select("duration_minutes, hint_penalty_seconds").eq("id", 1).maybeSingle();
  return { duration_minutes: data?.duration_minutes ?? 45, hint_penalty_seconds: data?.hint_penalty_seconds ?? 180 };
}
