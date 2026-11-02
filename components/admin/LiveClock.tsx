"use client";

import { useEvent } from "@/components/useEvent";
import { phaseInfo } from "@/lib/constants";
import type { EventRow } from "@/lib/types";

/** Current phase of the event, updated live. */
export default function LiveClock({ initial, compact = false }: { initial: EventRow | null; compact?: boolean }) {
  const { event, online } = useEvent(initial, 4000);
  const label = event ? phaseInfo(event.phase).label : "—";
  if (compact) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink px-3 py-1 text-xs">
        <span className={`h-2 w-2 rounded-full ${online ? "bg-ok" : "bg-danger"}`} aria-hidden />
        <span className="font-semibold">{label}</span>
      </span>
    );
  }
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Current phase</p>
      <p className="text-3xl font-bold">{label}</p>
      <p className="text-sm text-muted">{event ? phaseInfo(event.phase).teamMessage : ""}</p>
    </div>
  );
}
