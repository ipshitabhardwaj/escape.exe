"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const KEY = (stage: string) => `escape-qr-${stage}`;

/**
 * Reads a QR code with the machine's own camera, fully in the browser: no
 * phone, no internet lookup. The decoded text is kept for this stage so a
 * page reload does not lose it.
 */
export default function QrScanner({ stage }: { stage: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [error, setError] = useState("");
  const [packet, setPacket] = useState<string | null>(() => {
    try {
      return typeof window === "undefined" ? null : window.sessionStorage.getItem(KEY(stage));
    } catch {
      return null;
    }
  });

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    setError("");
    setMode("starting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser cannot open a camera here.");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Scanner view is not ready.");
      video.srcObject = stream;
      await video.play();
      setMode("scanning");
      const { default: jsQR } = await import("jsqr");
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      let last = 0;
      const tick = (ts: number) => {
        rafRef.current = requestAnimationFrame(tick);
        if (ts - last < 110 || video.readyState < 2 || !video.videoWidth) return; // ~9 scans a second is plenty
        last = ts;
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
        if (hit?.data) {
          stop();
          setPacket(hit.data);
          setMode("idle");
          try {
            window.sessionStorage.setItem(KEY(stage), hit.data);
          } catch {
            /* storage unavailable: the packet just stays on screen */
          }
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      stop();
      const name = e instanceof DOMException ? e.name : "";
      setError(
        name === "NotAllowedError"
          ? "Camera access was blocked. Click the camera icon in the address bar, allow it, then try again."
          : name === "NotFoundError"
            ? "No camera was found on this machine. Use a hint, or ask a Game Master for help."
            : e instanceof Error
              ? e.message
              : "The camera could not be started.",
      );
      setMode("error");
    }
  }, [stage, stop]);

  const lines = packet ? packet.split(/\s*\|\s*|\r?\n/).filter(Boolean) : [];

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-black/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-cyan-300">◉ Optical scanner</p>
        {mode === "scanning" ? (
          <button type="button" onClick={() => { stop(); setMode("idle"); }} className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-muted hover:text-white cursor-pointer">
            Close camera
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={mode === "starting"}
            className="rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300 disabled:opacity-60 cursor-pointer"
          >
            {mode === "starting" ? "Starting…" : packet ? "Scan again" : "Open scanner"}
          </button>
        )}
      </div>

      <div className={`relative mt-3 overflow-hidden rounded-xl border border-white/10 bg-black ${mode === "scanning" || mode === "starting" ? "" : "hidden"}`}>
        <video ref={videoRef} playsInline muted className="aspect-video w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-2/3 aspect-square rounded-2xl border-2 border-cyan-300/80 shadow-[0_0_30px_rgba(34,211,238,0.35)]">
            <div className="anim-scan absolute inset-x-0 h-0.5 bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {mode === "error" && <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">{error}</p>}

      {packet && mode !== "scanning" && (
        <div className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4">
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-emerald-300">Packet received</p>
          <ul className="mt-2 space-y-1 font-mono text-sm text-emerald-100">
            {lines.map((l, i) => (
              <li key={i}>
                <span className="text-emerald-400">&gt;</span> {l}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!packet && mode === "idle" && <p className="mt-3 text-xs text-muted">Allow the camera when your browser asks. Nothing is recorded or uploaded.</p>}
    </div>
  );
}
