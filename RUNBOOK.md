# Event-day runbook — Escape.exe

Details: `docs/ESCAPE_SETUP.md` (room, answers, problems). Keep one Game Master on the **Live slots** tab at all times.

## The day before
- `npm run verify:prod` shows 0 FAIL; `npm test` passes; Supabase project is awake.
- Teams imported, slips printed (Teams → Credential slips), dummy teams deleted, event reset (Control → More options).
- Every team has a **slot label** on Live slots (e.g. `10:30`).
- Room built from `docs/escape-props.html`; scan test done from the seat; lockbox opens on 416.

## T-30 min
- Control: confirm clock (45 min) and hint penalty. Check teams in as they arrive.
- Room PC logged in as the first team; projector on `/screen` (Big Screen ↗).

## OPEN
- Control → **Open the event (Live)**.

## Each slot
1. Reset the room (checklist in ESCAPE_SETUP.md). Log in the next team on the room PC.
2. Brief the two players (rules are on their screen too). Phones out of the room.
3. Live slots → **▶ START** on their row. Their first clue appears at once.
4. Watch their row: puzzle count, time left, hints. Help only with faults (camera, props, PC).
5. When they escape or time runs out, they see their result. Thank them; next team.

## CLOSE
- After the last slot: Control → **Close the event** (stops any run still going).
- Results: check the ranking, **Download CSV** and keep it.
- Control → **Reveal results** when ready; the projector shows the top 10.

## Emergencies
See the table in `docs/ESCAPE_SETUP.md`. Never edit the database by hand during slots; use the row menu (More).
