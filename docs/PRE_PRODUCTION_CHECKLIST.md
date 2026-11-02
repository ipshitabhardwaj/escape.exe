# Pre-Production Checklist — Escape.exe

Everything here must be verified on the **real** Supabase project and Vercel before event day. Nothing in this repository can prove it for you.

| Tag | Meaning |
| --- | --- |
| **[LOCAL ✓]** | Tested on a local Postgres 16 in development, not on hosted Supabase |
| **[PROD]** | Must be verified on the real Supabase project / Vercel |
| **[DRY RUN]** | Can only be proven with real people, the room and venue Wi-Fi |

---

## 1. What the platform does

Each team (2 players) plays one timed slot in the escape room. The team's own clock starts when a Game Master presses START. A chain of puzzles is solved strictly in order, hints add a fixed time penalty, and the ranking follows the rulebook (see [`RANKING.md`](RANKING.md)). Phases and permissions: [`STATE_MACHINE.md`](STATE_MACHINE.md). Room, props and answers: [`ESCAPE_SETUP.md`](ESCAPE_SETUP.md).

## 2. Migrations  [PROD]

Run in the Supabase SQL Editor, in order, once each, on a fresh project:

1. `0001_init.sql` — **never re-run** (stops at its first line when already applied)
2. `0002_event_operations.sql`, `0003_hardening.sql`, `0004_event_rules.sql`, `0005_reset_fix.sql`
3. **`0006_escape_runs.sql`** — the Escape.exe layer (runs, stages, hints, ranking board). Safe to re-run.

Already running the older "AI Files" version? Just run `0006_escape_runs.sql`. The old tables stay in the database, unused.

Then:

- Run `supabase/tests/escape_checks.sql` (rolls back, changes nothing). It must end with `ALL ESCAPE CHECKS PASSED`.
- Run `select * from verify_escape();` — every row `ok = true`.
- On your laptop: `npm install`, `npm run seed` (loads the puzzles, one admin, 10 dummy teams; refuses outside Doors Sealed), then `npm run verify:prod -- --test-pin`. It needs `.env.local` for the real project and must show **0 fail**. If it says "Could not find the function … in the schema cache", run `NOTIFY pgrst, 'reload schema';` and retry.
- `npm test` must pass (ranking, phase rules, and an independent solve of every puzzle against the physical props).

## 3. Keep private

- The secret key (chat, git, screenshots, any `NEXT_PUBLIC_` variable) and `.env.local`
- `puzzles/`, `docs/ESCAPE_SETUP.md`, `docs/escape-props.html` — they contain every answer. Keep the GitHub repository **private**.
- The admin password, the logins CSV and printed slips.

## 4. Check in the Supabase dashboard *before* changing anything  [PROD]

I have not seen your dashboard, and menus differ by plan. For each item, note what it actually shows.

| Where | What to check |
|---|---|
| Project home / billing | Plan; whether a Free project pauses when idle (open it the day before); region |
| Authentication → Rate Limits | The exact name, **unit** (per 5 min or per hour) and value of the sign-in / token-refresh limit; whether it is per IP; whether your plan lets you edit it |
| Authentication → Sessions / refresh tokens | Single-session, time-box and inactivity timeout **off**. **Refresh-token reuse interval**: keep the default (I believe 10 s; verify). It tolerates two refreshes at the same moment. My local tests passed even with 0 s. |
| Authentication → Email / passwords | Email provider on; minimum length ≤ 6, no required character classes; leaked-password protection off; "Allow new users to sign up" off (`verify:prod` warns if on) |
| Project Settings → JWT Keys | Access-token expiry (default 3600 s; sets how often the refresh wave comes); legacy secret vs asymmetric keys (legacy means one extra Auth call per page load) |
| Data API settings | Max rows ≥ 1000 (`verify:prod` measures it) |
| Database → Backups | What your plan offers. Otherwise the backup is **Export CSV**. |

## 5. Login rate limit: calculation, not a fixed number

```
needed per 5 min = ceil(teams × devicesPerTeam × burstShare × 1.15 × 2)
burstShare = 1 if everyone logs in within 5 min, else min(1, 10 ÷ loginWindowMinutes)
```

70 teams:

| Devices per team | Everyone within 5 min | Staggered over 30 min |
|---|---|---|
| 1 | 161 | 54 |
| 2 | 322 | 108 |
| 3 | 483 | 161 |
| 4 | 644 | 215 |

- Supabase counts sign-ins **and** token refreshes against this limit. Refreshes come in a similar wave about one token lifetime after the logins.
- The admin dashboard computes the figure for your real team count. Set `EVENT_DEVICES_PER_TEAM` / `EVENT_LOGIN_WINDOW_MINUTES` if your plan differs.
- After you set the limit in Supabase, record it as `SUPABASE_AUTH_TOKEN_LIMIT_PER_5MIN` so the dashboard and `verify:prod` can compare.
- The 150 per 5 min default I quoted earlier comes from my research, not from your dashboard. Verify it.

## 6. Vercel deployment  [PROD]

1. Private GitHub repo. `git ls-files` shows `.env.example` but **not** `.env.local`.
2. Vercel → New Project → import (Next.js, default commands).
3. **Environment variables**, Production scope:

   | Variable | Class |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_TEAM_EMAIL_DOMAIN`, `NEXT_PUBLIC_SITE_URL` | **Public** (built into the browser code) |
   | `SUPABASE_SERVICE_ROLE_KEY` | **Server-only, SENSITIVE** — mark it Sensitive; never `NEXT_PUBLIC_` |
   | `EVENT_DEVICES_PER_TEAM`, `EVENT_LOGIN_WINDOW_MINUTES`, `SUPABASE_AUTH_TOKEN_LIMIT_PER_5MIN` | Server-only, not sensitive |
   | `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | **Local only, SENSITIVE** — not on Vercel |

4. Don't give **Preview** deployments the production keys (or disable previews).
5. Settings → Functions → region **Mumbai (bom1)**, if your plan allows it.
6. Deploy. Set `NEXT_PUBLIC_SITE_URL` to the final URL, then **redeploy** (public values are built in).
7. **Deployment Protection:** the production URL must open without a Vercel login.
8. Smoke test:
   - `/` and `/screen` load.
   - Admin login works; the dashboard shows only expected warnings.
   - A dummy team sees the Escape.exe lobby (story + rulebook) and "Doors sealed".
9. Leak check (§7).
10. Check your plan's function time limit with one 70-row CSV import. [DRY RUN]
11. No deploys on event day.

## 7. Proving the secret key is not in the browser  [PROD]

[LOCAL ✓] Searching this build's browser files for the full secret key found 0 matches.

**Pitfalls when searching (checked on this build):**

- With old-style JWT keys, the first ~30 characters of the public and secret keys are **identical** (the JWT header). Always search for the **end** of the key.
- The text `sb_secret_` appears legitimately inside the Supabase library (a key-format check). A match on it is not a leak.

**A. Automated (PowerShell, on your laptop).** You type the **last 16 characters** of the secret key; they never leave your machine. I have not run this on Windows. Its file pattern matched 10 script files on this build's home page.

```powershell
$site   = "https://YOUR-APP.vercel.app"
$needle = Read-Host "LAST 16 characters of the SECRET key"
$files  = @()
foreach ($p in "/", "/play", "/admin", "/screen") {
  $html  = (Invoke-WebRequest "$site$p" -UseBasicParsing).Content
  $files += [regex]::Matches($html, '/_next/static/[^"'' ]+?\.js') | ForEach-Object Value
}
$files = $files | Sort-Object -Unique
foreach ($f in $files) {
  $js = (Invoke-WebRequest "$site$f" -UseBasicParsing).Content
  foreach ($bad in $needle, "SUPABASE_SERVICE_ROLE_KEY") {
    if ($js.Contains($bad)) { Write-Host "FOUND '$bad' in $f" -ForegroundColor Red }
  }
}
"Checked $($files.Count) files."
```

Pass: only "Checked N files", with N > 0.

**B. Logged in (covers lazily loaded scripts).**

1. Log in as admin, then as a team.
2. DevTools → Network → *Disable cache* → reload each page.
3. Press **Ctrl+Shift+F** and search for the last 16 characters of the key. There should be no results.

## 8. Dry run  [DRY RUN]

Do this once in the real room, with two volunteers who have never seen the puzzles, on the real PC and venue Wi-Fi:

1. Import 2 test teams, check them in, set slots. Open the event, START one team.
2. Play the whole chain without help from you. Time it: a good team should finish in about 30 minutes; if the volunteers need more than 40 without hints, the chain is too hard for a 45-minute slot.
3. On the way, confirm: the webcam asks permission once and then scans the rack sticker from the seat; the sticky note is found; the lockbox opens with 416; the card grid matches the on-screen moves.
4. Use one hint (check the penalty shows on the screen and on Live slots). Let the second pair run out of time and check the "TIME'S UP" screen and the ranking.
5. Open `/screen` on the projector. Open the same login on a second laptop: both screens must stay in step.
6. Reset the room with the checklist in `docs/ESCAPE_SETUP.md`. Time how long a reset takes: that is your changeover time between slots.
7. Delete the test teams and press **Reset event** (Control tab → More options) before the real day.
