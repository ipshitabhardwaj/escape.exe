"use client";

import { useEffect, useState } from "react";
import { mmss } from "@/lib/escape/format";

/** Time left on a running team's clock. `serverNow` (ms) lets us ignore a wrong laptop clock. */
export default function RunClock({ endsAt, serverNow }: { endsAt: string; serverNow: number }) {
  const [offset] = useState(() => serverNow - Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((Date.parse(endsAt) - (now + offset)) / 1000));
  return (
    <span suppressHydrationWarning className={`font-mono text-lg font-black tabular-nums ${left <= 300 ? "text-danger" : "text-cyan-200"}`}>
      {mmss(left)}
    </span>
  );
}
