import "server-only";
import { cache } from "react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { EscapeState } from "@/lib/escape/types";

/** The team's session plus its first screen state. RLS-free: the database functions decide what comes back. Cached per request. */
export const getPlayContext = cache(async function getPlayContext() {
  const session = await requireRole("team");
  const supabase = await createClient();
  const { data } = await supabase.rpc("escape_state");
  return { team: session.team!, state: (data ?? null) as EscapeState | null };
});
