import AppHeader from "@/components/AppHeader";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PlayLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("team");
  const team = session.team;
  return (
    <div className="min-h-screen text-[#f1f5f9] selection:bg-accent/40 selection:text-white">
      <AppHeader area="Escape Room" who={team ? `${team.team_code} · ${team.name}` : "Squad"} />
      {children}
    </div>
  );
}
