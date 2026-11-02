"use server";

import { createClient } from "@/lib/supabase/server";
import type { EscapeState } from "@/lib/escape/types";

/**
 * Team actions. Each one is a single call to a database function
 * (migration 0006) that runs as the logged-in team and decides everything:
 * which stage is current, whether the clock is still running, whether the
 * answer is right, and what a hint costs. Nothing here can be bent from the
 * browser: the answer key never leaves the database.
 *
 * Errors are returned, not thrown, so the screen can show them.
 */
type Fail = { ok: false; code: "AUTH" | "ERROR"; error: string };

function fail(message: string | undefined): Fail {
  if (message && /NOT_TEAM|JWT|auth/i.test(message)) return { ok: false, code: "AUTH", error: "You are logged out. Log in again with your team code and PIN." };
  return { ok: false, code: "ERROR", error: "Could not reach the server. Check the connection; your progress is safe." };
}

export type StateResult = { ok: true; state: EscapeState } | Fail;

/** Everything the team screen needs. Called on load, after every action, and every few seconds. */
export async function fetchEscapeState(): Promise<StateResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("escape_state");
  if (error || !data) return fail(error?.message);
  return { ok: true, state: data as EscapeState };
}

export type SubmitResult =
  | { ok: true; result: "correct"; finished: boolean }
  | { ok: true; result: "wrong" | "stale" | "closed" | "empty" }
  | { ok: true; result: "cooldown"; retryIn: number }
  | Fail;

/** Try an answer for the team's current stage. */
export async function submitAnswer(stage: string, answer: string): Promise<SubmitResult> {
  const clean = String(answer ?? "").slice(0, 60);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("escape_submit", { p_stage: String(stage), p_answer: clean });
  if (error || !data) return fail(error?.message);
  const d = data as { result: string; finished?: boolean; retry_in?: number };
  switch (d.result) {
    case "correct":
      return { ok: true, result: "correct", finished: !!d.finished };
    case "cooldown":
      return { ok: true, result: "cooldown", retryIn: Math.max(1, Number(d.retry_in ?? 10)) };
    case "wrong":
    case "stale":
    case "closed":
    case "empty":
      return { ok: true, result: d.result };
    default:
      return { ok: false, code: "ERROR", error: "Unexpected answer from the server." };
  }
}

export type HintResult =
  | { ok: true; result: "ok"; level: number; text: string; charged: boolean; penaltySeconds: number }
  | { ok: true; result: "none_left" | "stale" | "closed" | "invalid" }
  | Fail;

/** Reveal hint number `level` of the current stage. The first reveal costs the time penalty; asking again is free. */
export async function requestHint(stage: string, level: number): Promise<HintResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("escape_use_hint", { p_stage: String(stage), p_level: Math.trunc(Number(level)) });
  if (error || !data) return fail(error?.message);
  const d = data as { result: string; level?: number; text?: string; charged?: boolean; penalty_seconds?: number };
  if (d.result === "ok") {
    return { ok: true, result: "ok", level: Number(d.level), text: String(d.text ?? ""), charged: !!d.charged, penaltySeconds: Number(d.penalty_seconds ?? 0) };
  }
  if (d.result === "none_left" || d.result === "stale" || d.result === "closed" || d.result === "invalid") return { ok: true, result: d.result };
  return { ok: false, code: "ERROR", error: "Unexpected answer from the server." };
}
