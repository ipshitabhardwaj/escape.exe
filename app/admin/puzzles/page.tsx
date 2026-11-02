import UploadPuzzles from "@/components/admin/UploadPuzzles";
import { PageHeader } from "@/components/ui";
import { getEvent } from "@/lib/event";
import { createAdminClient } from "@/lib/supabase/admin";
import { ui } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Stage = {
  id: string;
  code: string;
  sort_order: number;
  title: string;
  kind: string;
  zone: string;
  story: string;
  clue: { label: string; text: string; scanner?: boolean };
  prompt: string;
  hints: string[];
  fragment: string;
  escape_keys: { answers: string[] } | { answers: string[] }[] | null;
};

const KIND: Record<string, string> = { digital: "text-cyan-300", physical: "text-amber-300", hybrid: "text-fuchsia-300" };

/** Organiser-only: the whole chain with its answers, in play order. */
export default async function PuzzlesPage() {
  const db = createAdminClient();
  const event = await getEvent();
  const { data } = await db.from("escape_stages").select("*, escape_keys(answers)").order("sort_order").returns<Stage[]>();
  const stages = data ?? [];
  const started = !!event && event.phase !== "waiting";
  const answersOf = (s: Stage) => (Array.isArray(s.escape_keys) ? s.escape_keys[0]?.answers : s.escape_keys?.answers) ?? [];
  const frags = stages.map((s) => s.fragment).join("");

  return (
    <div className="space-y-6">
      <PageHeader kicker="The puzzle chain" title="Puzzles" description="Every stage in play order with its accepted answers. Organisers only — never show this page to teams." />

      <section className={ui.card}>
        <h2 className="mb-1 font-semibold">Upload / update puzzles</h2>
        <p className="mb-4 text-sm text-muted">
          JSON in the format of <code>puzzles/escape-exe.json</code>. It is validated before anything is saved.
        </p>
        <UploadPuzzles inProgress={started} />
      </section>

      {stages.length > 0 && (
        <p className="font-mono text-sm text-muted">
          Key stack, in the order teams earn it: <b className="text-amber-300">{frags.split("").join(" ")}</b> → final override is the reverse.
        </p>
      )}

      <ol className="space-y-3">
        {stages.map((s) => (
          <li key={s.id} className={`${ui.card} space-y-3`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs font-black text-accent">{s.code}</span>
              <h3 className="font-semibold text-white">{s.title}</h3>
              <span className={`font-mono text-[11px] font-bold uppercase tracking-widest ${KIND[s.kind] ?? ""}`}>{s.kind}</span>
              <span className="text-xs text-muted">{s.zone}</span>
              {s.fragment && <span className="ml-auto rounded border border-amber-300/50 px-2 font-mono text-xs text-amber-200">fragment {s.fragment}</span>}
            </div>
            <p className="text-sm text-slate-300">
              <b className="text-white">Asks:</b> {s.prompt}
            </p>
            <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 font-mono text-sm text-emerald-200">
              Answer: {answersOf(s).join("  /  ")}
            </p>
            <details className="text-sm">
              <summary className="cursor-pointer text-muted">Clue shown to the team, and hints</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-ink p-3 font-mono text-xs text-slate-300">{s.clue.text}</pre>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-400">
                {s.hints.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ol>
            </details>
          </li>
        ))}
        {stages.length === 0 && <p className="text-muted">No puzzles loaded yet. Run <code>npm run seed</code> or upload the JSON above.</p>}
      </ol>
    </div>
  );
}
