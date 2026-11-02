# Ranking (as in the Escape.exe rulebook)

1. Teams that **escaped** rank first. **Total time = time taken + (hints used × penalty)**; lowest wins. Ties: fewer hints, then the earlier finish.
2. Teams that did **not** escape (time up or stopped) follow: more puzzles cleared first, then fewer hints.
3. Teams that never played are not ranked.
4. Identical results share a rank (1, 2, 2, 4).

The time limit is on real elapsed time (45:00 plus any minutes a Game Master added for a fault); hint penalties only affect the ranking time. The logic lives in `lib/escape/rank.ts` and is tested by `npm run test:rank`. There are no judges, rubrics or presentations.
