import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeAnswer } from "./normalize";
import { EscapeFileSchema, type EscapeFile } from "./schema";

/**
 * Validate the puzzle file and write it to the database (service-role client).
 * Re-loading updates stages in place by code, so teams' progress survives a
 * corrected typo. Stages that are no longer in the file are deleted (their
 * solves go with them), so the caller should refuse that during a live event.
 */
export async function loadEscapeFile(supabase: SupabaseClient, raw: unknown): Promise<{ stages: number; removed: number }> {
  const parsed = EscapeFileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid puzzle file:\n" + parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n"));
  }
  const file: EscapeFile = parsed.data;

  const { data: rows, error } = await supabase
    .from("escape_stages")
    .upsert(
      file.stages.map((s, i) => ({
        code: s.code,
        sort_order: i,
        title: s.title,
        kind: s.kind,
        zone: s.zone,
        story: s.story,
        clue: s.clue,
        prompt: s.prompt,
        input: s.input,
        hints: s.hints,
        fragment: s.fragment,
        solved_message: s.solved_message,
      })),
      { onConflict: "code" },
    )
    .select("id, code");
  if (error) throw new Error(error.message);

  const idByCode = new Map((rows ?? []).map((r) => [r.code as string, r.id as string]));
  const { error: keyErr } = await supabase.from("escape_keys").upsert(
    file.stages.map((s) => ({
      stage_id: idByCode.get(s.code)!,
      answers: [...new Set(s.answers.map(normalizeAnswer).filter(Boolean))],
    })),
  );
  if (keyErr) throw new Error(keyErr.message);

  const keep = new Set(file.stages.map((s) => s.code));
  const { data: all } = await supabase.from("escape_stages").select("id, code");
  const stale = (all ?? []).filter((r) => !keep.has(r.code as string)).map((r) => r.id as string);
  if (stale.length) {
    const del = await supabase.from("escape_stages").delete().in("id", stale);
    if (del.error) throw new Error(del.error.message);
  }
  return { stages: file.stages.length, removed: stale.length };
}
