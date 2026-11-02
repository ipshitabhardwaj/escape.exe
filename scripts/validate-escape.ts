/**
 * Check the puzzle chain:  npm run validate:puzzles
 *
 *  - the file passes the schema (lib/escape/schema.ts)
 *  - no answer is printed in its own story / clue / hints
 *  - every puzzle is SOLVED here independently from the physical props
 *    (puzzles/props.json): hex decode, shift cipher, logic gates, QR maths,
 *    keypad trace, key stack. If a puzzle or a prop is edited and the two
 *    no longer agree, this fails before a team ever meets the mistake.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeAnswer } from "../lib/escape/normalize";
import { EscapeFileSchema, type EscapeStageFile } from "../lib/escape/schema";

const read = (f: string) => JSON.parse(readFileSync(join(process.cwd(), "puzzles", f), "utf8"));
const parsed = EscapeFileSchema.safeParse(read("escape-exe.json"));
if (!parsed.success) {
  console.error("Schema errors:\n" + parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);
}
const file = parsed.data;
const props = read("props.json") as {
  sticky_note: { text: string };
  qr_sticker: { payload: string };
  lockbox: { combination: string };
  card: { token: string; grid: string[]; star_row: number; star_col: number };
};
const stage = (code: string): EscapeStageFile => file.stages.find((s) => s.code === code)!;
const answers = (code: string) => stage(code).answers.map(normalizeAnswer);

let passed = 0;
const check = (name: string, fn: () => void) => {
  try {
    fn();
    passed++;
    if (process.env.VERBOSE) console.log("  ✓", name);
  } catch (e) {
    console.error(`✗ ${name}\n  ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  }
};

// ----------------------------------------------------------------- hygiene
check("every stage has answers and 1–3 hints, and codes run S1…Sn", () => {
  file.stages.forEach((s, i) => {
    assert.equal(s.code, `S${i + 1}`);
    assert.ok(s.answers.length >= 1 && s.hints.length >= 1 && s.hints.length <= 3, s.code);
  });
});

check("no answer appears in its own story, clue, prompt, notes or hints", () => {
  for (const s of file.stages) {
    const text = normalizeAnswer([s.story, s.clue.text, s.prompt, ...s.clue.notes, ...s.hints].join(" "));
    for (const a of s.answers.map(normalizeAnswer)) {
      if (a.length >= 4) assert.ok(!text.includes(a), `${s.code}: the answer “${a}” is printed in the stage text`);
    }
  }
});

// ------------------------------------------------------------------ solvers
const shiftBack = (word: string, k: number) =>
  word.replace(/[A-Z]/gi, (c) => String.fromCharCode(((c.toUpperCase().charCodeAt(0) - 65 - k + 26 * 10) % 26) + 65));

check("S1 acrostic: first letters of the log lines spell the answer", () => {
  const lines = stage("S1").clue.text.split("\n");
  const letters = lines.map((l) => l.trim()[0]).filter((c) => /[A-Za-z]/.test(c)).join("");
  assert.deepEqual(answers("S1"), [letters.toUpperCase()]);
});

check("S2 hex: the WARDEN_MSG row decodes to the answer", () => {
  const row = stage("S2").clue.text.split("\n").find((l) => l.includes("WARDEN_MSG"))!;
  const bytes = row.replace(/^0x[0-9A-F]+\s+/i, "").split("<<")[0].trim().split(/\s+/);
  assert.deepEqual(answers("S2"), [bytes.map((b) => String.fromCharCode(parseInt(b, 16))).join("")]);
});

check("S3 sticky note: the note carries the 4-digit answer", () => {
  assert.deepEqual(answers("S3"), [normalizeAnswer(props.sticky_note.text.replace(/\D/g, ""))]);
});

check("S4 shift cipher: key = digit sum of the PIN, decrypts to the answer", () => {
  const pin = props.sticky_note.text.replace(/\D/g, "");
  const key = [...pin].reduce((n, d) => n + Number(d), 0);
  const data = /DATA\s*:\s*([A-Z]+)/.exec(stage("S4").clue.text)![1];
  assert.deepEqual(answers("S4"), [shiftBack(data, key)]);
});

check("S5 QR: voltage × current from the sticker = the answer in watts", () => {
  const v = Number(/([\d.]+)\s*V/.exec(props.qr_sticker.payload)![1]);
  const a = Number(/([\d.]+)\s*A/.exec(props.qr_sticker.payload)![1]);
  assert.deepEqual(answers("S5"), [String(v * a)]);
});

check("S6 logic gates: three states give the lockbox combination", () => {
  const out = [
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 0],
  ]
    .map(([A, B, C]) => {
      const X = A & (B | C);
      const Y = 1 - (A ^ B);
      const Z = (B & C) | (1 - A);
      return X * 4 + Y * 2 + Z;
    })
    .join("");
  assert.deepEqual(answers("S6"), [out]);
  assert.equal(props.lockbox.combination, out, "the lockbox is set to a different combination than the puzzle computes");
});

check("S7 lockbox: the card token is the answer", () => {
  assert.deepEqual(answers("S7"), [normalizeAnswer(props.card.token)]);
});

check("S8 keypad trace: moves from the star spell the answer on the printed grid", () => {
  const grid = props.card.grid.map((r) => r.split(/\s+/));
  let r = props.card.star_row;
  let c = props.card.star_col;
  assert.equal(grid[r][c], "*", "the star is not where props.json says");
  const moves = /MOVES\s*:\s*([UDLR\s]+)/.exec(stage("S8").clue.text)![1].trim().split(/\s+/);
  const d: Record<string, [number, number]> = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
  let got = "";
  for (const m of moves) {
    r += d[m][0];
    c += d[m][1];
    got += grid[r][c];
  }
  assert.deepEqual(answers("S8"), [got]);
});

check("S9 key stack: the fragments, popped, spell the final override", () => {
  const frags = file.stages.map((s) => s.fragment).join("");
  assert.deepEqual(answers("S9"), [[...frags].reverse().join("")]);
  assert.equal(stage("S9").fragment, "", "the final stage should not push a fragment");
});

if (!process.exitCode) console.log(`puzzle checks passed (${passed} checks, ${file.stages.length} stages)`);
