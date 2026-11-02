"use client";

import { useActionState, useState } from "react";
import { loginStaff, loginTeam, type LoginState } from "@/app/actions/auth";

const initial: LoginState = { error: null };

const input =
  "w-full rounded-xl border border-line bg-ink/80 px-4 py-3 text-text placeholder:text-muted/50 transition-all duration-200 focus:border-accent focus:bg-ink focus:shadow-[0_0_15px_rgba(225,29,72,0.2)] focus:outline-none";

export default function LoginForm() {
  const [tab, setTab] = useState<"team" | "staff">("team");
  // Controlled so a failed attempt doesn't clear them (React resets forms after an action).
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [teamState, teamAction, teamPending] = useActionState(loginTeam, initial);
  const [staffState, staffAction, staffPending] = useActionState(loginStaff, initial);

  return (
    <div id="login-terminal" className="rounded-3xl border border-line/80 bg-panel/95 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/70 relative overflow-hidden">
      {/* Decorative ambient top glow from Photo 1 crimson spotlight */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-rose-600/20 blur-3xl" />

      <div className="relative mb-6 flex items-center justify-between">
        <div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
            Room Access
          </span>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-text">Enter Escape Room</h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-ink text-accent shadow-sm shadow-accent/20">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>

      <div className="relative mb-6 grid grid-cols-2 gap-1 rounded-xl bg-ink/70 p-1 text-sm border border-line/50">
        {(["team", "staff"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg py-2.5 font-semibold transition-all duration-200 cursor-pointer ${
              tab === t ? "bg-panel2 text-accent shadow-sm border border-accent/40 font-bold" : "text-muted hover:text-text"
            }`}
          >
            {t === "team" ? "Team Player" : "Game Master"}
          </button>
        ))}
      </div>

      {tab === "team" ? (
        <form action={teamAction} className="relative space-y-4">
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
              <span>Team Code</span>
              <span className="font-mono text-[10px] text-accent/90">ROOM CODE</span>
            </span>
            <input
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ESC-001"
              autoComplete="username"
              className={`${input} font-mono uppercase tracking-wider font-semibold`}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
              <span>Room PIN</span>
              <span className="font-mono text-[10px] text-accent/90">PIN CODE</span>
            </span>
            <input
              name="pin"
              type="password"
              placeholder="••••••••"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="current-password"
              className={`${input} font-mono`}
              required
            />
          </label>
          {teamState.error && (
            <div role="alert" className="rounded-xl border border-danger/60 bg-danger/10 p-3 text-sm text-danger flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{teamState.error}</span>
            </div>
          )}
          <button
            disabled={teamPending}
            className="btn-shimmer w-full rounded-xl bg-accent py-3.5 font-bold text-white transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent/30"
          >
            {teamPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Entering Room…</span>
              </>
            ) : (
              <>
                <span>Enter Escape Room</span>
                <span>→</span>
              </>
            )}
          </button>
          <p className="text-xs text-muted/80 leading-relaxed text-center pt-1">
            Your team code & PIN are on your room entry slip. All teammates use the same credentials.
          </p>
        </form>
      ) : (
        <form action={staffAction} className="relative space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Game Master Email</span>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="organizer@escape.exe"
              autoComplete="username"
              className={input}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Admin Password</span>
            <input
              name="password"
              type="password"
              placeholder="••••••••••••"
              autoComplete="current-password"
              className={input}
              required
            />
          </label>
          {staffState.error && (
            <div role="alert" className="rounded-xl border border-danger/60 bg-danger/10 p-3 text-sm text-danger flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{staffState.error}</span>
            </div>
          )}
          <button
            disabled={staffPending}
            className="btn-shimmer w-full rounded-xl bg-accent py-3.5 font-bold text-white transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent/30"
          >
            {staffPending ? "Authenticating Master Key…" : "Access Control Center →"}
          </button>
        </form>
      )}
    </div>
  );
}
