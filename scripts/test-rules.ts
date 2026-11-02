/**
 * Event-rule tests (no database):  npm run test:rules
 *  - phase state machine (allowed/forbidden transitions, guards)
 *  - login capacity calculation
 * Database-side rules (who may read what, answer checking, hints, cooldown)
 * run in Postgres; see supabase/tests/escape_checks.sql.
 */
import assert from "node:assert/strict";
import { capacitySettings, planAuthCapacity } from "../lib/capacity";
import { PHASES, type EventPhase } from "../lib/constants";
import { TRANSITIONS, checkTransition, findTransition } from "../lib/state-machine";

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  if (process.env.VERBOSE) console.log("  ✓", name);
};

const facts = { stages: 9, ranked: 10 };
const go = (from: EventPhase, to: EventPhase, o: Partial<{ confirmed: boolean; backWord: string }> = {}, f = facts) =>
  checkTransition(from, to, { confirmed: false, backWord: "", ...o }, f);

// ------------------------------------------------------------ state machine
test("happy path: Doors Sealed → Live → Closed → Results, with confirmations where they matter", () => {
  assert.equal(go("waiting", "investigation").ok, true);
  assert.equal(go("investigation", "closed").ok, false);
  assert.equal(go("investigation", "closed", { confirmed: true }).ok, true);
  assert.equal(go("closed", "results").ok, false);
  assert.equal(go("closed", "results", { confirmed: true }).ok, true);
});

test("skipping steps is impossible", () => {
  for (const [a, b] of [
    ["waiting", "closed"], ["waiting", "results"], ["investigation", "results"],
  ] as [EventPhase, EventPhase][]) {
    const r = go(a, b, { confirmed: true });
    assert.equal(r.ok, false, `${a} → ${b} should be refused`);
    if (!r.ok) assert.equal(r.reason, "invalid");
  }
});

test("going back needs the word BACK and only goes one step", () => {
  assert.equal(go("closed", "investigation").ok, false);
  assert.equal(go("closed", "investigation", { backWord: "back" }).ok, true);
  assert.equal(go("results", "closed", { backWord: "BACK" }).ok, true);
  assert.equal(go("results", "investigation", { backWord: "BACK" }).ok, false);
});

test("guards: no puzzles → cannot go Live; no runs → nothing to reveal; same phase is refused", () => {
  const none = go("waiting", "investigation", {}, { stages: 0, ranked: 0 });
  assert.equal(none.ok, false);
  if (!none.ok) assert.equal(none.reason, "no-stages");
  const empty = go("closed", "results", { confirmed: true }, { stages: 9, ranked: 0 });
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.reason, "no-runs");
  const same = go("investigation", "investigation");
  assert.equal(same.ok, false);
  if (!same.ok) assert.equal(same.reason, "already");
});

test("every phase is reachable and every phase except Doors Sealed has a way back", () => {
  assert.equal(PHASES.length, 4);
  for (const p of PHASES.map((x) => x.id)) {
    if (p !== "waiting") assert.ok(TRANSITIONS.some((t) => t.to === p && !t.back), `${p} unreachable`);
    if (p !== "waiting") assert.ok(TRANSITIONS.some((t) => t.from === p && t.back), `${p} has no way back`);
  }
  assert.equal(findTransition("results", "waiting"), null);
});

// ------------------------------------------------------------------ capacity
test("login capacity: documented table values", () => {
  // everyone at once (5-minute window), ×1.15 failures, ×2 safety
  assert.equal(planAuthCapacity({ teams: 70, devicesPerTeam: 1, loginWindowMinutes: 5 }).recommendedPer5Min, 161);
  assert.equal(planAuthCapacity({ teams: 70, devicesPerTeam: 2, loginWindowMinutes: 5 }).recommendedPer5Min, 322);
  assert.equal(planAuthCapacity({ teams: 70, devicesPerTeam: 3, loginWindowMinutes: 5 }).recommendedPer5Min, 483);
  assert.equal(planAuthCapacity({ teams: 70, devicesPerTeam: 4, loginWindowMinutes: 5 }).recommendedPer5Min, 644);
  // staggered over 30 minutes: peak ≈ devices ÷ 3
  assert.equal(planAuthCapacity({ teams: 70, devicesPerTeam: 4, loginWindowMinutes: 30 }).recommendedPer5Min, 215);
  assert.equal(planAuthCapacity({ teams: 0, devicesPerTeam: 3, loginWindowMinutes: 5 }).recommendedPer5Min, 0);
});

test("capacity settings: defaults and overrides from env", () => {
  assert.deepEqual(capacitySettings({}), { devicesPerTeam: 3, loginWindowMinutes: 5, configuredLimitPer5Min: 0 });
  assert.deepEqual(
    capacitySettings({ EVENT_DEVICES_PER_TEAM: "2", EVENT_LOGIN_WINDOW_MINUTES: "30", SUPABASE_AUTH_TOKEN_LIMIT_PER_5MIN: "600" }),
    { devicesPerTeam: 2, loginWindowMinutes: 30, configuredLimitPer5Min: 600 },
  );
  assert.equal(capacitySettings({ EVENT_DEVICES_PER_TEAM: "abc" }).devicesPerTeam, 3);
});

console.log(`rule tests passed (${passed} tests)`);
