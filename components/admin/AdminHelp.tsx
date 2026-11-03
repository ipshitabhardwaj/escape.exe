import HelpDialog, { HelpSteps } from "@/components/HelpDialog";

/** Quick operations guide for Game Masters. */
export default function AdminHelp() {
  return (
    <HelpDialog label="Guide" title="Game Master guide — Escape.exe" storageKey="escape-help-admin-v2">
      <p className="text-white/90">Work through the tabs left to right. All teams (2 people each) play at the same time, each against its own 45-minute clock.</p>
      <HelpSteps
        steps={[
          ["1 · Setup", "Checklist: puzzles loaded, teams imported, test data removed. Fix anything red before the event."],
          ["2 · Puzzles", "Read the full chain with answers. Re-upload puzzles/escape-exe.json if you change a puzzle."],
          ["3 · Teams", "Import the registration sheet and print login slips. Check teams in when they arrive."],
          ["4 · Control", "Set the clock length and hint penalty (before the event), then open the event: Doors Sealed → Event Live."],
          ["5 · Live", "When everyone is seated, press START ALL. Then watch progress, add time for faults, skip a broken stage."],
          ["6 · Results", "Ranked as per the rulebook. Close the event, then reveal results on the big screen."],
        ]}
      />
      <p className="text-xs text-muted">Between teams: press “Reset run” only for a team that must replay, and re-set the room (see docs/ESCAPE_SETUP.md).</p>
    </HelpDialog>
  );
}
