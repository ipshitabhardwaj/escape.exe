"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminHelp from "@/components/admin/AdminHelp";
import LiveClock from "@/components/admin/LiveClock";
import type { EventRow } from "@/lib/types";

const TABS = [
  { href: "/admin", label: "1 Setup" },
  { href: "/admin/puzzles", label: "2 Puzzles" },
  { href: "/admin/teams", label: "3 Teams" },
  { href: "/admin/control", label: "4 Control" },
  { href: "/admin/live", label: "5 Live" },
  { href: "/admin/results", label: "6 Results" },
];

export default function AdminNav({ event }: { event: EventRow | null }) {
  const path = usePathname();
  return (
    <nav className="border-b border-white/10 bg-[#0e1520]/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1.5 px-4 py-2.5">
        {TABS.map((t) => {
          const active = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                active
                  ? "bg-accent/20 text-accent ring-1 ring-accent/60 shadow-sm"
                  : "text-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
        <span className="ml-auto flex items-center gap-3">
          <LiveClock initial={event} compact />
          <AdminHelp />
          <a
            href="/screen"
            target="_blank"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-white"
          >
            Big Screen ↗
          </a>
        </span>
      </div>
    </nav>
  );
}
