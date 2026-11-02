import EscapeRoom from "@/components/play/EscapeRoom";
import { getPlayContext } from "@/lib/play";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const { team, state } = await getPlayContext();
  return <EscapeRoom initial={state} teamName={team.name} teamCode={team.team_code} members={team.members.map((m) => m.name)} />;
}
