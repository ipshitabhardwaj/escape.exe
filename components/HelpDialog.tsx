"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * "How to play / Rulebook" guide. Opens by itself on the first
 * visit in this browser (remembered in localStorage), and any time from the
 * ? button.
 */
export default function HelpDialog({ label, title, storageKey, children }: { label: string; title: string; storageKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) {
        ref.current?.showModal();
        localStorage.setItem(storageKey, "seen");
      }
    } catch {
      /* storage blocked: just don't auto-open */
    }
  }, [storageKey]);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-muted transition-all duration-200 hover:border-accent hover:bg-accent/10 hover:text-white cursor-pointer"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-bold">?</span>
        {label}
      </button>
      <dialog
        ref={ref}
        aria-label={title}
        className="m-auto w-[min(680px,calc(100vw-32px))] rounded-3xl border border-white/15 bg-[#101722] p-0 text-text shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">Escape Protocol</span>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">{title}</h2>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-muted transition-colors hover:border-white/30 hover:text-white"
              aria-label="Close help"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-muted/90">{children}</div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="w-full rounded-2xl bg-accent py-3 font-bold text-white transition-all duration-200 hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(255,107,53,0.3)] cursor-pointer"
            >
              Ready to Escape →
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Numbered list used inside the help dialogs. */
export function HelpSteps({ steps }: { steps: [string, string][] }) {
  return (
    <ol className="space-y-3">
      {steps.map(([t, d], i) => (
        <li key={t} className="flex gap-3.5 rounded-xl border border-white/5 bg-[#141d2a]/60 p-3.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent font-mono text-xs font-black text-white shadow-sm shadow-accent/40">
            {i + 1}
          </span>
          <div>
            <b className="text-white text-sm block">{t}</b>
            <span className="block text-xs text-muted/90 mt-0.5 leading-relaxed">{d}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
