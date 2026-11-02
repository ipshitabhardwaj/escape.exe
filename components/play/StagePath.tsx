"use client";

import type { StageView } from "@/lib/escape/types";

/** The chain at a glance: solved ✓, current (pulsing), locked 🔒. */
export default function StagePath({ stages, total }: { stages: StageView[]; total: number }) {
  return (
    <ol className="flex items-center gap-1.5 overflow-x-auto pb-1" aria-label="Puzzle chain">
      {Array.from({ length: total }, (_, i) => {
        const s = stages[i];
        const solved = !!s?.solved;
        const current = !!s && !s.solved;
        return (
          <li key={i} className="flex items-center gap-1.5">
            <span
              title={s ? `${s.code} · ${s.title}` : `Stage ${i + 1} (locked)`}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-black ${
                solved
                  ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                  : current
                    ? "anim-pulse-ring border-accent bg-accent/20 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/25"
              }`}
            >
              {solved ? "✓" : current ? i + 1 : "🔒"}
            </span>
            {i < total - 1 && <span className={`h-0.5 w-3 rounded ${solved ? "bg-emerald-400/60" : "bg-white/10"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
