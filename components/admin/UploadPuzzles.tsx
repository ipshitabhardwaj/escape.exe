"use client";

import { useState, useTransition } from "react";
import { uploadPuzzles, type UploadResult } from "@/app/actions/admin-escape";
import { ui } from "@/lib/ui";

export default function UploadPuzzles({ inProgress }: { inProgress: boolean }) {
  const [result, setResult] = useState<UploadResult | null>(null);
  const [allow, setAllow] = useState(false);
  const [pending, start] = useTransition();

  const onFile = (file: File) =>
    start(async () => {
      setResult(null);
      try {
        setResult(await uploadPuzzles(await file.text(), allow));
      } catch {
        setResult({ ok: false, error: "Upload failed (network). Try again." });
      }
    });

  return (
    <div className="space-y-2">
      {inProgress && (
        <label className="flex items-center gap-2 rounded-md border border-accent/50 bg-accent/10 p-2 text-sm">
          <input type="checkbox" checked={allow} onChange={(e) => setAllow(e.target.checked)} />
          The event has started. I understand that changing a puzzle now changes what teams see and which answers are accepted.
        </label>
      )}
      <input type="file" accept=".json,application/json" disabled={pending} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }} className="text-sm" />
      {pending && <p className="text-sm text-muted">Validating and loading…</p>}
      {result?.ok && <p className="text-sm text-ok">{result.message}</p>}
      {result && !result.ok && <pre className={`${ui.card} whitespace-pre-wrap text-sm text-danger`}>{result.error}</pre>}
      <p className="text-xs text-muted">Stages are matched by code (S1, S2 …) and updated in place, so teams keep their progress. Stages removed from the file are deleted.</p>
    </div>
  );
}
