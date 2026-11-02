/**
 * Ranking tests (no database):  npm run test:rank
 * The rulebook: fastest total time wins; if nobody escapes, stages cleared,
 * then fewer hints. Total time = time taken + hints × penalty (computed by
 * the database as total_seconds).
 */
import assert from "node:assert/strict";
import { rankBoard } from "../lib/escape/rank";
import type { RunStatus } from "../lib/escape/types";

type R = { id: string; status: RunStatus; stages_cleared: number; hints_used: number; total_seconds: number; finished_at: string | null; started_at: string | null };
let n = 0;
const run = (id: string, status: RunStatus, stages: number, hints: number, total: number, finished = "2026-11-10T10:00:00Z"): R => ({
  id, status, stages_cleared: stages, hints_used: hints, total_seconds: total,
  finished_at: status === "ready" ? null : finished, started_at: status === "ready" ? null : "2026-11-10T09:00:00Z",
});
const order = (rows: R[]) => rankBoard(rows).map((r) => `${r.id}:${r.rank}`).join(" ");
const test = (name: string, fn: () => void) => { fn(); n++; if (process.env.VERBOSE) console.log("  ✓", name); };

test("fastest total time wins among escaped teams", () => {
  assert.equal(order([run("a", "escaped", 9, 0, 2000), run("b", "escaped", 9, 0, 1500), run("c", "escaped", 9, 0, 1800)]), "b:1 c:2 a:3");
});

test("hint penalties are already inside total_seconds: a slower hint-free team can beat a faster hinting team", () => {
  // x finished in 25:00 but used 3 hints (+9:00) = 34:00 ; y finished in 30:00 with none
  assert.equal(order([run("x", "escaped", 9, 3, 25 * 60 + 9 * 60), run("y", "escaped", 9, 0, 30 * 60)]), "y:1 x:2");
});

test("equal total time: fewer hints first, then the earlier finish", () => {
  assert.equal(order([run("a", "escaped", 9, 2, 1800), run("b", "escaped", 9, 1, 1800)]), "b:1 a:2");
  assert.equal(order([run("a", "escaped", 9, 1, 1800, "2026-11-10T11:00:00Z"), run("b", "escaped", 9, 1, 1800, "2026-11-10T10:00:00Z")]), "b:1 a:2");
});

test("an escaped team always beats a team that did not escape, however many puzzles that team cleared", () => {
  assert.equal(order([run("slow", "escaped", 9, 9, 2700 + 9 * 180), run("close", "timeout", 8, 0, 2700)]), "slow:1 close:2");
});

test("nobody escaped: most puzzles cleared, then fewer hints", () => {
  assert.equal(order([run("a", "timeout", 5, 0, 2700), run("b", "timeout", 7, 3, 2700), run("c", "timeout", 7, 1, 2700)]), "c:1 b:2 a:3");
});

test("stopped runs rank with the teams that did not escape", () => {
  assert.equal(order([run("a", "stopped", 4, 0, 900), run("b", "timeout", 6, 2, 2700)]), "b:1 a:2");
});

test("identical results share a rank and the next rank is skipped", () => {
  assert.equal(order([run("a", "timeout", 5, 1, 2700), run("b", "timeout", 5, 1, 2700), run("c", "timeout", 4, 0, 2700)]), "a:1 b:1 c:3");
});

test("teams that never started are unranked and listed last; running teams rank among those who have not escaped", () => {
  const rows = rankBoard([run("idle", "ready", 0, 0, 0), run("live", "running", 3, 0, 600), run("done", "escaped", 9, 0, 2000)]);
  assert.deepEqual(rows.map((r) => `${r.id}:${r.rank}`), ["done:1", "live:2", "idle:null"]);
});

console.log(`ranking tests passed (${n} tests)`);
