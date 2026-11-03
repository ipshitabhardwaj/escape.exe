"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEscapeState } from "@/app/actions/escape";
import type { EscapeState } from "@/lib/escape/types";

/** Current wall-clock time, ticking. */
export function useNow(intervalMs = 500) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/**
 * Live view of the team's run. The server is the only source of truth: this
 * polls the database function every few seconds (and right after every
 * action) and keeps the offset between this laptop's clock and the server's,
 * so the countdown is right even if the laptop clock is wrong.
 * Two laptops on one login stay in step through the same polling.
 */
export function useEscape(initial: EscapeState | null) {
  const [state, setState] = useState<EscapeState | null>(initial);
  const [offsetMs, setOffsetMs] = useState(() => (initial ? Date.parse(initial.server_now) - Date.now() : 0));
  const [online, setOnline] = useState(true);
  const [authLost, setAuthLost] = useState(false);
  const seq = useRef(0);
  const applied = useRef(0);

  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    const t0 = Date.now();
    try {
      const r = await fetchEscapeState();
      const t1 = Date.now();
      if (mine < applied.current) return; // an older answer arriving late
      if (r.ok) {
        applied.current = mine;
        setState(r.state);
        setOffsetMs(Date.parse(r.state.server_now) - (t0 + t1) / 2);
        setOnline(true);
        setAuthLost(false);
      } else if (r.code === "AUTH") {
        setAuthLost(true);
      } else {
        setOnline(false);
      }
    } catch {
      setOnline(false);
    }
  }, []);

  const status = state?.run?.status ?? "ready";
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    // Gentle on the server (80+ teams at once), but quick to notice START ALL.
    const base = status === "running" ? 8000 : status === "ready" ? (state?.phase === "investigation" ? 3000 : 12000) : 20000;
    const loop = async () => {
      await refresh();
      if (!cancelled) timer = setTimeout(loop, base * (0.8 + Math.random() * 0.4));
    };
    const wake = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        void loop();
      }
    };
    void loop();
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
    };
  }, [refresh, status, state?.phase]);

  return { state, offsetMs, online, authLost, refresh };
}
