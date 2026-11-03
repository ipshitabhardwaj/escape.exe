import type { EventPhase } from "./constants";

/**
 * The event's phase machine — the single source of truth used by the
 * Control room (which buttons exist) and by setPhase (what is allowed).
 *
 *   waiting ⇄ investigation (LIVE) ⇄ closed ⇄ results
 *
 * Each team's own 45-minute clock is separate from this: it starts when a
 * Game Master starts all teams together (START ALL) while the event is LIVE.
 * Going back is possible only to the immediately previous phase, only with
 * the word BACK. It never restarts a run that has already ended.
 */
export type Transition = {
  from: EventPhase;
  to: EventPhase;
  /** needs the "I'm sure" tick */
  confirm: boolean;
  /** backwards move: needs the word BACK */
  back: boolean;
};

const FORWARD: [EventPhase, EventPhase, boolean][] = [
  ["waiting", "investigation", false],
  ["investigation", "closed", true],
  ["closed", "results", true],
];

const BACKWARD: [EventPhase, EventPhase][] = [
  ["investigation", "waiting"],
  ["closed", "investigation"],
  ["results", "closed"],
];

export const TRANSITIONS: Transition[] = [
  ...FORWARD.map(([from, to, confirm]) => ({ from, to, confirm, back: false })),
  ...BACKWARD.map(([from, to]) => ({ from, to, confirm: true, back: true })),
];

export function findTransition(from: EventPhase, to: EventPhase): Transition | null {
  return TRANSITIONS.find((t) => t.from === from && t.to === to) ?? null;
}

export function transitionsFrom(from: EventPhase): Transition[] {
  return TRANSITIONS.filter((t) => t.from === from);
}

export type TransitionCheck = { ok: true; t: Transition } | { ok: false; reason: string };

/**
 * Validate a requested phase change. `facts` carries what the database says;
 * the caller turns a refusal reason into a message for the organiser.
 */
export function checkTransition(
  from: EventPhase,
  to: EventPhase,
  input: { confirmed: boolean; backWord: string },
  facts: { stages: number; ranked: number },
): TransitionCheck {
  if (from === to) return { ok: false, reason: "already" };
  const t = findTransition(from, to);
  if (!t) return { ok: false, reason: "invalid" };
  if (t.back && input.backWord.trim().toUpperCase() !== "BACK") return { ok: false, reason: "needs-back" };
  if (!t.back && t.confirm && !input.confirmed) return { ok: false, reason: "needs-confirm" };
  if (to === "investigation" && !t.back && facts.stages === 0) return { ok: false, reason: "no-stages" };
  if (to === "results" && !t.back && facts.ranked === 0) return { ok: false, reason: "no-runs" };
  return { ok: true, t };
}
