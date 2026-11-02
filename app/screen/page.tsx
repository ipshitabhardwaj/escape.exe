import ScreenView from "@/components/ScreenView";
import { getEscapeConfig, getRankedBoard } from "@/lib/escape/board";
import { getEvent } from "@/lib/event";
import { createAdminClient } from "@/lib/supabase/admin";
import { nowMs } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * Public projector page. No login. It shows team names, puzzle counts, clocks
 * and times only: never clues, answers or PINs.
 */
export default async function ScreenPage() {
  const event = await getEvent();
  const live = event && event.phase !== "waiting";
  const [board, cfg, stages] = live
    ? await Promise.all([getRankedBoard(), getEscapeConfig(), createAdminClient().from("escape_stages").select("id", { count: "exact", head: true })])
    : [[], await getEscapeConfig(), { count: 0 }];
  const real = board.filter((r) => !r.is_dummy);
  return (
    <ScreenView
      initial={event}
      data={{ rows: real.length ? real : board, totalStages: stages.count ?? 0, durationMinutes: cfg.duration_minutes, serverNow: nowMs() }}
    />
  );
}
