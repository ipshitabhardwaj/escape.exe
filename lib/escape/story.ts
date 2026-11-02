import { minSec } from "./format";

/** The framing text shown in the lobby. The rules mirror the event rulebook (Escape.exe, section 1.1). */
export const SCENARIO = {
  title: "SERVER ROOM 7",
  time: "02:13 AM",
  lines: [
    "The lights died at 02:13. Every door in this room sealed itself, and a thermal purge countdown started on the wall.",
    "Something inside the facility's systems has taken control. It left fragments of itself on this machine and hidden in the room.",
    "Solve the chain in order. Each answer unlocks the next clue. Enter the final override before the clock runs out.",
  ],
};

export function buildRules(durationMinutes: number, hintPenaltySeconds: number): { title: string; body: string }[] {
  return [
    { title: "Your clock", body: `${durationMinutes} minutes, starting when your Game Master presses START. You see your first clue at that moment.` },
    { title: "In order, no skipping", body: "Every puzzle unlocks the next one. You cannot jump ahead, and you cannot go back to change an answer." },
    { title: "Screen and room", body: "Some puzzles are on this screen. Others are in the room: hidden objects, a locked box, a QR sticker you read with this machine's camera." },
    { title: "Hints cost time", body: `Each hint adds ${minSec(hintPenaltySeconds)} to your final time. Use them wisely — they also count in the tie-breaker.` },
    { title: "Hands and phones", body: "No phones and no outside internet. Handle every prop gently. Forcing, breaking or opening anything by damage means disqualification." },
    { title: "How winners are decided", body: "Fastest total time (time taken + hint penalties) among teams that escape. If you do not escape, you are ranked by puzzles cleared, then fewer hints." },
  ];
}
