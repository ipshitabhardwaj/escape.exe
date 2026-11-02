"use client";

import type { StageView } from "@/lib/escape/types";

/** The fragments earned so far, in the order they were pushed. */
export default function KeyStack({ stages, slots, big = false }: { stages: StageView[]; slots: number; big?: boolean }) {
  const frags = stages.filter((s) => s.solved && s.fragment).map((s) => s.fragment!);
  const n = Math.max(slots, frags.length);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: n }, (_, i) => {
          const f = frags[i];
          return (
            <div
              key={i}
              className={`flex items-center justify-center rounded-lg border font-mono font-black ${big ? "h-14 w-11 text-2xl" : "h-10 w-8 text-lg"} ${
                f ? "anim-pop border-amber-300/70 bg-amber-300/15 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.3)]" : "border-white/10 bg-white/[0.03] text-white/20"
              }`}
              title={f ? `Fragment ${i + 1}` : "Not found yet"}
            >
              {f ?? "?"}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted">
        <span>pushed first</span>
        <span>pushed last ▸ top</span>
      </div>
    </div>
  );
}
