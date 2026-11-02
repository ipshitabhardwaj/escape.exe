import Link from "next/link";
import { logout } from "@/app/actions/auth";
import CrimeTape from "@/components/CrimeTape";

export default function AppHeader({ area, who }: { area: string; who: string }) {
  return (
    <header className="relative border-b border-white/10 bg-[#0a0d14]/80 backdrop-blur-xl">
      <CrimeTape />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        {/* Brand & Area */}
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/play" className="group flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/40 bg-accent/15 font-mono text-xs font-bold text-accent shadow-[0_0_12px_rgba(225,29,72,0.4)]">
              ⚡
            </span>
            <span className="font-mono text-lg font-black tracking-tight text-white group-hover:text-accent transition-colors">
              ESCAPE<span className="text-accent">.EXE</span>
            </span>
          </Link>
          <span className="hidden rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent sm:inline-block">
            {area}
          </span>
        </div>

        {/* User / Team credentials & Logout */}
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#141d2a] px-3 py-1 text-xs font-medium text-white/90">
            <span className="text-accent">🔑</span>
            <span className="max-w-[180px] truncate font-mono sm:max-w-[260px]" title={who}>
              {who}
            </span>
          </div>

          <form action={logout}>
            <button className="whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-semibold text-muted transition-all duration-200 hover:border-accent hover:bg-accent/10 hover:text-white cursor-pointer">
              Eject / Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
