import type { BoardRow, RunStatus } from "./types";

/**
 * Ranking, exactly as the rulebook says:
 *
 *  1. Teams that ESCAPED come first, fastest total time wins.
 *     total time = time taken + (hints used × fixed penalty)
 *     ties: fewer hints, then the earlier finish.
 *  2. Teams that did not escape follow: more stages cleared first,
 *     then fewer hints used.
 *  3. Teams that never started are not ranked.
 *
 * Teams with identical results share a rank (1, 2, 2, 4 …).
 */
type RankFields = Pick<BoardRow, "status" | "stages_cleared" | "hints_used" | "total_seconds" | "finished_at" | "started_at">;

const num = (n: number) => (Number.isFinite(n) ? n : 0);

export function compareRuns(a: RankFields, b: RankFields): number {
  const ae = a.status === "escaped";
  const be = b.status === "escaped";
  if (ae !== be) return ae ? -1 : 1;
  if (ae && be) {
    return (
      num(a.total_seconds) - num(b.total_seconds) ||
      num(a.hints_used) - num(b.hints_used) ||
      Date.parse(a.finished_at ?? "") - Date.parse(b.finished_at ?? "") ||
      0
    );
  }
  return num(b.stages_cleared) - num(a.stages_cleared) || num(a.hints_used) - num(b.hints_used);
}

/** Two results share a rank only when nothing in the rulebook can tell them apart. */
const sameResult = (a: RankFields, b: RankFields) => compareRuns(a, b) === 0;

export function isRanked(status: RunStatus, started: string | null): boolean {
  return status !== "ready" && !!started;
}

export function rankBoard<T extends RankFields>(rows: T[]): (T & { rank: number | null })[] {
  const played = rows.filter((r) => isRanked(r.status, r.started_at)).sort(compareRuns);
  const out: (T & { rank: number | null })[] = [];
  played.forEach((r, i) => {
    const prev = out[i - 1];
    const rank = prev && sameResult(prev, r) ? prev.rank : i + 1;
    out.push({ ...r, rank });
  });
  for (const r of rows) if (!isRanked(r.status, r.started_at)) out.push({ ...r, rank: null });
  return out;
}
