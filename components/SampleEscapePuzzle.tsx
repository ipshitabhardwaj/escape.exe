"use client";

import { useState } from "react";

const SAMPLE_PUZZLE = {
  id: "demo-cipher",
  code: "ENIGMA-00",
  title: "The Grandfather Clock & The Three Keys",
  category: "MEDIUM LOGIC // TIMESTAMP PARADOX",
  briefing:
    "An antique grandfather clock sits in the chamber corner. Its pendulum is locked at 10:47 PM with a red string tied from the hands to a brass key rack containing three keys (Iron, Brass, and Silver).\n\n" +
    "A cryptic cipher note pinned to the mantle reads:\n" +
    "• The Iron Key [A] can only turn in the keyway while rain is falling.\n" +
    "• The Silver Key [C] automatically locks into place once the hands pass 10:30 PM.\n" +
    "• Only the key whose logic condition holds at the stopped timestamp can release the chamber lock.\n\n" +
    "Weather telemetry confirmed: Rain occurred strictly from 9:00 PM until 10:00 PM.",
  question: "Which key must your squad select to release the chamber lock at 10:47 PM?",
  options: [
    {
      id: 0,
      letter: "A",
      text: "Iron Key — because the rainfall earlier in the evening saturated the soil and activated the latch.",
      correct: false,
      feedback: "Incorrect: The rule explicitly requires rain to be actively falling. At 10:47 PM, rain had ended 47 minutes prior.",
    },
    {
      id: 1,
      letter: "B",
      text: "Brass Key — Iron is invalid without active rain, and Silver locked down after 10:30 PM.",
      correct: true,
      feedback: "Cipher Decrypted! At 10:47 PM, it was neither raining (Iron locked) nor before 10:30 PM (Silver locked). The Brass Key is the sole unbroken logic path!",
    },
    {
      id: 2,
      letter: "C",
      text: "Silver Key — the 10:47 PM timestamp falls within the secondary late-night lock cycle.",
      correct: false,
      feedback: "Incorrect: The note says the Silver key permanently locks once hands pass 10:30 PM. At 10:47 PM, it is already immobilized.",
    },
    {
      id: 3,
      letter: "D",
      text: "All three keys must be turned simultaneously in the lock barrel.",
      correct: false,
      feedback: "Incorrect: Overcomplicating the mechanism. The clue specifies only the key with a valid logic condition can turn.",
    },
  ],
};

export default function SampleEscapePuzzle() {
  const [selected, setSelected] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);

  const handleSelect = (idx: number) => {
    setSelected(idx);
    if (SAMPLE_PUZZLE.options[idx].correct) {
      setSolved(true);
    } else {
      setSolved(false);
    }
  };

  const choice = selected !== null ? SAMPLE_PUZZLE.options[selected] : null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c111a]/90 via-[#0e1522]/90 to-[#070a10]/95 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      {/* Decorative background grid and spotlight */}
      <div className="pointer-events-none absolute -top-20 right-10 h-64 w-64 rounded-full bg-rose-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-cyan-500/15 blur-[100px]" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 font-mono text-sm font-bold text-accent shadow-[0_0_12px_rgba(225,29,72,0.4)]">
            🧩
          </span>
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-accent flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
              INTERACTIVE PUZZLE LAB
            </p>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Try a Sample Escape Room Cipher
            </h3>
          </div>
        </div>

        {/* Live Key Decryption Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-xs font-bold transition-all duration-300 ${
              solved
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "border-white/10 bg-white/5 text-muted"
            }`}
          >
            <span>{solved ? "🗝️" : "🔒"}</span>
            <span>{solved ? "KEY #00 UNLOCKED" : "KEY #00 ENCRYPTED"}</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="relative z-10 mt-6 grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Clue Exhibit & Red String Pin */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-[#070a10]/80 p-5 sm:p-6 shadow-inner">
            {/* Top Red Tack & Stamp */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600/30 border border-rose-500 text-xs text-rose-400">
                  📍
                </span>
                <span className="stamp text-[10px] text-accent border-accent py-0.5">
                  EXHIBIT {SAMPLE_PUZZLE.code}
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
                  {SAMPLE_PUZZLE.category}
                </span>
              </div>
              <span className="font-mono text-[11px] text-cyan-400 font-bold">
                100 KEY PTS
              </span>
            </div>

            <h4 className="mt-4 text-lg font-bold text-white tracking-tight">
              {SAMPLE_PUZZLE.title}
            </h4>

            {/* Clue Text Box */}
            <div className="mt-3 rounded-xl bg-[#0d121c]/90 border border-white/5 p-4 text-xs sm:text-sm text-white/90 leading-relaxed font-sans whitespace-pre-line">
              {SAMPLE_PUZZLE.briefing}
            </div>

            {/* Red String Vector Accent */}
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-muted/80">
              <span className="text-rose-400 font-bold">🧶 LOGIC LINK:</span>
              <span>Clock stopped at 10:47 PM → Trace rain interval and 10:30 PM cutoff.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Deduction Options & Decryption Feedback */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 flex items-center gap-1.5">
              <span>⚡</span>
              <span>SELECT DEDUCTION TO UNLOCK KEY</span>
            </p>
            <h4 className="mt-1 text-base font-bold text-white leading-snug">
              {SAMPLE_PUZZLE.question}
            </h4>
          </div>

          <div className="space-y-2.5" role="radiogroup" aria-label="Sample puzzle options">
            {SAMPLE_PUZZLE.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = isSelected && opt.correct;
              const isWrong = isSelected && !opt.correct;

              return (
                <button
                  key={opt.letter}
                  type="button"
                  onClick={() => handleSelect(i)}
                  className={`w-full flex items-start gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all duration-200 cursor-pointer ${
                    isCorrect
                      ? "border-emerald-500 bg-emerald-500/20 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500"
                      : isWrong
                      ? "border-rose-500 bg-rose-500/15 text-white ring-1 ring-rose-500"
                      : "border-white/10 bg-[#0e141f]/70 text-white/90 hover:border-accent/60 hover:bg-[#131b29]"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-black transition-colors ${
                      isCorrect
                        ? "bg-emerald-500 text-black font-extrabold"
                        : isWrong
                        ? "bg-rose-500 text-white"
                        : "border border-white/15 bg-white/5 text-muted"
                    }`}
                  >
                    {opt.letter}
                  </span>
                  <span className="text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feedback Card */}
          {choice && (
            <div
              className={`rounded-2xl border p-4 text-xs sm:text-sm transition-all duration-300 backdrop-blur-md ${
                choice.correct
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200 shadow-lg shadow-emerald-500/10"
                  : "border-rose-500/50 bg-rose-500/10 text-rose-200 shadow-lg shadow-rose-500/10"
              }`}
            >
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
                <span>{choice.correct ? "🎉 KEY UNLOCKED" : "🔒 LOGIC REJECTED"}</span>
                <span>·</span>
                <span>{choice.correct ? "+100 SCORE" : "RE-EVALUATE EVIDENCE"}</span>
              </div>
              <p className="mt-1.5 leading-relaxed font-sans">{choice.feedback}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

