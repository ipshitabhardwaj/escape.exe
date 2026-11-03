/** Judges no longer exist in Escape.exe (the winner is decided by the clock), so only two roles log in. */
export type AppRole = "admin" | "team";

/**
 * The event moves through four phases (the database enum has older values
 * that are simply never used any more):
 *   waiting       doors sealed: teams can log in and read the briefing
 *   investigation LIVE: Game Master starts all teams together, runs are timed
 *   closed        event over: running runs are stopped, scores are final
 *   results       the leaderboard is public on the projector and on team screens
 */
export type EventPhase = "waiting" | "investigation" | "closed" | "results";

export const PHASES: { id: EventPhase; label: string; teamMessage: string }[] = [
  { id: "waiting", label: "Doors Sealed", teamMessage: "The event has not opened yet. Read the briefing and wait for the start." },
  { id: "investigation", label: "Event Live", teamMessage: "The event is live. Every team starts together when the Game Master presses START." },
  { id: "closed", label: "Event Closed", teamMessage: "The event is over. Results will be announced soon." },
  { id: "results", label: "Results Out", teamMessage: "The leaderboard is live. Thanks for playing!" },
];

export const phaseInfo = (p: EventPhase) => PHASES.find((x) => x.id === p) ?? PHASES[0];

export const ROLE_HOME: Record<AppRole, string> = {
  admin: "/admin",
  team: "/play",
};

/** Area prefix -> role allowed in it. */
export const PROTECTED_AREAS: { prefix: string; role: AppRole }[] = [
  { prefix: "/play", role: "team" },
  { prefix: "/admin", role: "admin" },
];

export const TEAM_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_TEAM_EMAIL_DOMAIN ?? "teams.aifiles.local";

/** EXE-014 -> exe-014@teams.aifiles.local */
export function teamCodeToEmail(code: string) {
  return `${code.trim().toLowerCase()}@${TEAM_EMAIL_DOMAIN}`;
}

export function normaliseTeamCode(code: string) {
  return code.trim().toUpperCase();
}
