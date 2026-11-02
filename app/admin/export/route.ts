import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { selectAll } from "@/lib/db";
import { getRankedBoard } from "@/lib/escape/board";
import { mmss } from "@/lib/escape/format";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Quote for CSV and neutralise spreadsheet formulas (a team called "=HYPERLINK(...)"
// must not become a live formula when the organiser opens the file in Excel/Sheets).
const esc = (v: unknown) => {
  let s = v === null || v === undefined ? "" : Array.isArray(v) ? v.join("; ") : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Ranked results with every team's run details, as CSV (open in Excel / Sheets). */
export async function GET() {
  const session = await getSession();
  if (session?.profile.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const db = createAdminClient();
  const [board, teams] = await Promise.all([
    getRankedBoard(),
    selectAll<{ id: string; members: { name: string }[]; contact_email: string | null; contact_phone: string | null }>((a, b) =>
      db.from("teams").select("id, members, contact_email, contact_phone").order("id").range(a, b),
    ),
  ]);

  const header = [
    "rank", "team_code", "team", "institution", "members", "email", "phone", "slot", "result",
    "puzzles_cleared", "hints_used", "wrong_answers", "time_taken", "hint_penalty", "total_time", "total_seconds", "started_at", "finished_at",
  ];
  const lines = [header.join(",")];
  for (const r of board) {
    const t = teams.find((x) => x.id === r.team_id);
    lines.push(
      [
        r.rank, r.team_code, r.name, r.institution, (t?.members ?? []).map((m) => m.name), t?.contact_email, t?.contact_phone, r.slot_label, r.status,
        r.stages_cleared, r.hints_used, r.wrong_attempts, mmss(r.elapsed_seconds), mmss(r.penalty_seconds), mmss(r.total_seconds), r.total_seconds, r.started_at, r.finished_at,
      ].map(esc).join(","),
    );
  }

  return new NextResponse("﻿" + lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="escape-exe-results-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.csv"`,
    },
  });
}
