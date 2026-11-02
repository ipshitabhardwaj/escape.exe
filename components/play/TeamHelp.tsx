import HelpDialog, { HelpSteps } from "@/components/HelpDialog";
import { minSec } from "@/lib/escape/format";

/** Short rulebook for participants, available during the run. */
export default function TeamHelp({ durationMinutes, penaltySeconds }: { durationMinutes: number; penaltySeconds: number }) {
  return (
    <HelpDialog label="Rules" title="Escape.exe — Rules" storageKey="escape-help-team-v2">
      <p className="text-white/90">
        Solve a chain of puzzles — on this screen and in the room — before <b>{durationMinutes} minutes</b> run out. Fastest team to escape wins.
      </p>
      <HelpSteps
        steps={[
          ["Strictly in order", "Each answer unlocks the next puzzle. You cannot skip ahead or return to an earlier answer."],
          ["Screen + room", "Some clues are on the screen. Others are physical: hidden objects, a locked box, a QR sticker you scan with this machine's camera."],
          ["Hints", `Each hint adds ${minSec(penaltySeconds)} to your final time (and counts in tie-breaks). You always confirm before one is charged.`],
          ["Wrong answers", "Free, but six wrong tries in a minute locks the terminal for a short cool-down."],
          ["Do not", "Use phones or outside internet. Break, force open or take apart anything. Damage means disqualification."],
          ["Ranking", "Escaped teams: lowest total time (time taken + hint penalties). Not escaped: most puzzles cleared, then fewer hints."],
        ]}
      />
      <p className="text-xs text-muted">Two teammates can use two screens with the same login — they stay in sync.</p>
    </HelpDialog>
  );
}
