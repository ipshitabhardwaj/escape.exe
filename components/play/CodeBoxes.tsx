"use client";

import { useRef } from "react";

/**
 * Numeric lock input: `length` digit boxes, one hidden real input on top.
 * Works with a keyboard, paste, and phone/tablet keypads.
 */
export default function CodeBoxes({
  value,
  onChange,
  onEnter,
  length,
  disabled,
  shakeKey,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  length: number;
  disabled?: boolean;
  shakeKey: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const clean = (s: string) => s.replace(/\D/g, "").slice(0, length);
  return (
    <div
      key={shakeKey}
      className={`relative cursor-text ${shakeKey ? "anim-shake" : ""}`}
      onClick={() => ref.current?.focus()}
    >
      <div className="flex justify-center gap-2.5 sm:gap-3">
        {Array.from({ length }, (_, i) => {
          const ch = value[i] ?? "";
          const active = !disabled && i === Math.min(value.length, length - 1);
          return (
            <div
              key={i}
              className={`flex h-16 w-12 items-center justify-center rounded-xl border-2 bg-black/50 font-mono text-3xl font-black sm:h-[72px] sm:w-14 ${
                ch ? "border-cyan-400/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.25)]" : active ? "border-accent text-white" : "border-white/15 text-muted"
              }`}
            >
              {ch || (active ? <span className="anim-caret h-8 w-0.5 rounded bg-white" /> : "")}
            </div>
          );
        })}
      </div>
      <input
        ref={ref}
        autoFocus
        value={value}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={length}
        aria-label={`Enter the ${length}-character code`}
        onChange={(e) => onChange(clean(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") onEnter();
        }}
        className="bare-input absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  );
}
