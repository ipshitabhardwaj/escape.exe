# Event phases

```
Doors Sealed (waiting) ⇄ Event Live (investigation) ⇄ Event Closed ⇄ Results Out
```

| Phase | Teams | Game Masters |
|---|---|---|
| Doors Sealed | log in, read the story and rules | set clock/hint rules, import teams, load puzzles |
| Event Live | see their slot; a team with a started clock plays | START teams one by one, add time, skip a stage, stop or reset a run |
| Event Closed | every running slot is stopped; no answers accepted | check results, export CSV |
| Results Out | see the leaderboard | projector shows the top 10 |

- Forward steps: Live → Closed and Closed → Results need "I'm sure". Going back needs the word BACK and never revives a run that has ended.
- Going Live requires puzzles; revealing results requires at least one team that played.
- A team's own clock is separate from these phases: it starts only when its Game Master presses START while the event is Live.
- Rules (clock length, hint penalty) can only be changed in Doors Sealed.
- Code: `lib/state-machine.ts`; tests: `npm run test:rules`; database: `supabase/migrations/0006_escape_runs.sql`, `supabase/tests/escape_checks.sql`.
