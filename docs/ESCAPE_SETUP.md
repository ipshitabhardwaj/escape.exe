# Escape.exe — room setup, answers and reset (organisers only)

**Keep this file private.** It contains every answer.

## What teams do

A team of 2 sits at one PC in the room. A Game Master presses START on the Live slots tab; the team's 45:00 clock begins and puzzle 1 appears. Nine puzzles, strictly in order. Hints cost +3:00 each (changeable in Control, before the event is Live).

| # | Puzzle | Where | Answer | Fragment |
|---|---|---|---|---|
| S1 | BOOT.LOG — acrostic in a boot log | screen | WARDEN | T |
| S2 | MEMORY DUMP — hex → ASCII | screen | KEYBOARD | U |
| S3 | UNDER THE KEYBOARD — find the sticky note | room | 3719 | O |
| S4 | INTERCEPTED PACKET — shift cipher, key = digit sum of the PIN (20) | screen | FIREWALL | K |
| S5 | RACK SCAN — webcam reads the QR sticker, 48 V × 12 A | room + screen | 576 | A |
| S6 | CIRCUIT BOARD — logic gates give the lock combination | screen | 416 | E |
| S7 | THE LOCKBOX — open it, read TOKEN on the card | room | KERNEL | R |
| S8 | KEYPAD TRACE — moves U R D D L L on the card's 5×5 grid | room + screen | DAEMON | B |
| S9 | MASTER OVERRIDE — key stack popped (last in, first out) | screen | BREAKOUT | — |

Answers ignore case, spaces and dashes. Six wrong answers in a minute lock the terminal for a short cool-down.

## Props (print `docs/escape-props.html` at 100%)

| Prop | Where | Notes |
|---|---|---|
| Orange sticky note "ROOT PIN 3719" | flat on the desk, under the keyboard | Not taped to anything |
| QR sticker (RACK B · STATUS PLATE) | on the front of the "server rack" (any shelf/cabinet), seated eye level, 20–40 cm from the webcam | Matt paper. Test the scan from the seat |
| Small combination lockbox (3 wheels) | on a shelf beside the rack | Opens on **416**. Card inside |
| Card, front: `TOKEN: KERNEL` · back: 5×5 grid with ★ | inside the lockbox, front face up | Both sides printed |
| Sign "Handle props gently" | on the wall (optional) | Rule 4: no forcing, no damage |

PC: Chrome or Edge, full screen, zoom 100 %, logged in with the team's code and PIN **before** the team sits down. Allow the camera for the site once (the address-bar camera icon → Always allow) so the scanner opens at once. No phones in the room.

## Between teams (reset checklist)

1. Lockbox: card back inside (front up), lid closed, wheels scrambled to 000.
2. Sticky note flat under the keyboard. QR sticker straight and unscratched.
3. Pen/paper the previous team used removed. Browser: log out; log in the next team.
4. Live slots tab: next team has its slot label; press START only when they are seated and have heard the rules.

## When something goes wrong

| Problem | What to do |
|---|---|
| Webcam will not scan | Hint 2 of S5 gives the sticker text (costs a hint). If the fault is yours, press **More → Skip current stage** (no penalty, flagged in the data) |
| A prop is missing or broken | Skip the stage (same menu), fix it after the slot |
| PC crashed / Wi-Fi dropped | Log in again: progress and the clock are on the server. If time was lost, **+5 min** on the team's row |
| Started the wrong team | **More → Reset run** (type RESET), start again |
| Team gives up | **More → Stop run**: ranked by puzzles cleared, then fewer hints |
| Teammate on a second laptop | Same login works; both screens stay in step |

## How the rulebook is enforced

| Rule | Enforcement |
|---|---|
| Slots of 45 minutes, timed | Each team's clock starts at START and is judged by the database clock, not the laptop |
| Strict order, no skipping | The database accepts only the current stage and never sends later puzzles to the browser |
| Hint = fixed penalty on final time | Each hint is recorded once; total time = time taken + hints × penalty |
| No damage, no phones | Rules shown in the lobby and the Rules button; enforced by invigilators |
| Escape = final answer before time | Last correct answer sets the finish time; later answers are refused |
| No escape: stages cleared, then hints | See `docs/RANKING.md` |
