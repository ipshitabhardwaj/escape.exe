# Escape.exe — event platform

A tech-themed escape room for a college fest: teams of 2, a 45-minute slot each, a chain of puzzles solved strictly in order (some on the PC, some physical: a hidden note, a QR sticker read by the PC's webcam, a lockbox). Fastest total time wins; hints add a fixed penalty. Next.js 16 + Supabase.

| Who | Where | What they do |
| --- | --- | --- |
| Teams | `/play` | Read the story and rules, then play their slot: live countdown, puzzle exhibit, answer terminal, hints (with confirm), key stack, camera QR scanner, escaped / time-up screen |
| Game Masters | `/admin` | Setup checklist, puzzles with answers, import teams and print slips, open/close the event, **START each team's slot**, add time / skip a stage / stop / reset a run, ranked results and CSV |
| Projector | `/screen` | Attract screen, teams in the room with live clocks and progress, then the top 10 |

Event day: [`RUNBOOK.md`](RUNBOOK.md). Room, props, answers, problems: [`docs/ESCAPE_SETUP.md`](docs/ESCAPE_SETUP.md). Ranking: [`docs/RANKING.md`](docs/RANKING.md). Phases: [`docs/STATE_MACHINE.md`](docs/STATE_MACHINE.md). Before going live: [`docs/PRE_PRODUCTION_CHECKLIST.md`](docs/PRE_PRODUCTION_CHECKLIST.md).

## Setup

1. Create a Supabase project. In the SQL Editor run `supabase/migrations/0001` … `0006` in order (0001 only once, on an empty project; already on the older "AI Files" version? run only `0006_escape_runs.sql`).
2. Run `supabase/tests/escape_checks.sql`: it must end with `ALL ESCAPE CHECKS PASSED`.
3. Copy `.env.example` to `.env.local` and fill it in (Supabase URL and keys).
4. `npm install` then `npm run seed` (loads the puzzles from `puzzles/escape-exe.json`, one admin, 10 dummy teams `EXE-T01…`; refuses outside Doors Sealed). `npm run dev` → http://localhost:3000.
5. `npm test` (ranking, phase rules, and an independent solve of every puzzle against the printed props) · `npm run lint` · `npm run typecheck` · `npm run verify:prod`.

Deploy to Vercel as in `docs/PRE_PRODUCTION_CHECKLIST.md` §6. The QR scanner needs HTTPS (Vercel) or localhost.

## Puzzles

`puzzles/escape-exe.json` is the whole chain (story, clue, accepted answers, hints, key-stack letter, WARDEN's reaction per stage); `puzzles/props.json` holds the physical props and is used by `npm run validate:puzzles` to prove every puzzle is still solvable. Edit the JSON, validate, then upload it on Admin → Puzzles (stages update in place, progress is kept).

## How it is built

- One run per team (`escape_runs`); the clock is the database's. Teams call only three database functions: `escape_state`, `escape_submit`, `escape_use_hint`. They return the solved stages and the current one only; answer keys are in a table no participant can read. Wrong-answer cool-down: 6 per minute.
- Roles: admin and team. Phases: Doors Sealed → Event Live → Event Closed → Results Out.
- The old detective-case, judge and presentation features were removed from the app (their tables remain in the database, unused). Team codes look like `EXE-001`.

| Path | What |
| --- | --- |
| `components/play`, `app/play` | Team screens |
| `app/admin`, `app/actions/admin*.ts` | Game Master pages and actions |
| `components/ScreenView.tsx`, `app/screen` | Projector |
| `lib/escape` | Puzzle schema/loader, ranking, formats, story text |
| `supabase/migrations/0006_escape_runs.sql` | Runs, stages, hints, ranking board, reset |
| `puzzles`, `docs/escape-props.html` | Puzzle data, printable props |
