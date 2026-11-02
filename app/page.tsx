import Image from "next/image";
import Link from "next/link";
import CrimeTape from "@/components/CrimeTape";
import LoginForm from "@/components/LoginForm";
import SampleEscapePuzzle from "@/components/SampleEscapePuzzle";

const RULEBOOK_STEPS = [
  {
    step: "01",
    title: "Enter the Room",
    desc: "Study the escape room scenario, examine hidden clues scattered across the environment, and identify the puzzle elements.",
    tag: "Phase 1 · Discovery",
    icon: "🚪",
    accent: "text-rose-400",
    border: "border-rose-500/40",
  },
  {
    step: "02",
    title: "Solve the Puzzles",
    desc: "Crack logic puzzles one by one. Each solved puzzle reveals a key fragment needed to unlock the final exit.",
    tag: "Phase 2 · Puzzle Solving",
    icon: "🧩",
    accent: "text-red-400",
    border: "border-red-500/40",
  },
  {
    step: "03",
    title: "First Lock Attempt",
    desc: "Use your gathered clues to identify the correct combination and make your first attempt at cracking the main lock.",
    tag: "Phase 3 · First Attempt",
    icon: "🔐",
    accent: "text-amber-400",
    border: "border-amber-500/40",
  },
  {
    step: "04",
    title: "The Plot Twist",
    desc: "A hidden mechanism activates! New puzzles appear that change everything you thought you knew. Adapt and solve fast!",
    tag: "Phase 4 · Twist Round",
    icon: "⚡",
    accent: "text-cyan-400",
    border: "border-cyan-500/40",
  },
  {
    step: "05",
    title: "Final Escape",
    desc: "Combine all keys and solutions into the master lock. Crack the final code and escape the room to top the leaderboard!",
    tag: "Phase 5 · Freedom",
    icon: "🏆",
    accent: "text-emerald-400",
    border: "border-emerald-500/40",
  },
];

const CHAMBER_TIERS = [
  {
    level: "Room Alpha",
    name: "The Locked Study",
    difficulty: "Medium Logic",
    desc: "A sealed study with hidden compartments, a stopped clock frozen at 10:47, and cryptic symbols etched into the walls.",
    keys: "8 Puzzle Keys + 3 Twist Keys",
    badge: "Active Room",
    color: "from-rose-950/60 via-[#0e141f]/80 to-slate-900/90",
    border: "border-rose-500/40 hover:border-rose-500",
    accentGlow: "shadow-rose-600/10",
  },
  {
    level: "Room Beta",
    name: "The Cipher Vault",
    difficulty: "Medium Cryptography",
    desc: "An encrypted terminal room with coded messages, pattern locks, and a sequence of riddles guarding the exit key.",
    keys: "8 Logic Gates + 3 Twist Puzzles",
    badge: "Ready",
    color: "from-cyan-950/60 via-[#0e141f]/80 to-slate-900/90",
    border: "border-cyan-500/40 hover:border-cyan-500",
    accentGlow: "shadow-cyan-500/10",
  },
  {
    level: "Room Gamma",
    name: "The Laser Vault",
    difficulty: "Advanced Puzzles",
    desc: "A high-security vault protected by laser grids, pressure plates, and a multi-layered combination lock on the final door.",
    keys: "8 Puzzle Tokens + 3 Rapid Decrypts",
    badge: "High Security",
    color: "from-emerald-950/60 via-[#0e141f]/80 to-slate-900/90",
    border: "border-emerald-500/40 hover:border-emerald-500",
    accentGlow: "shadow-emerald-500/10",
  },
];

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col text-[#f8fafc] selection:bg-accent/40 selection:text-white overflow-x-hidden">
      {/* Dynamic Red String Web Background Animation */}
      <svg className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
        <path d="M 50 120 Q 300 240 600 150 T 1200 320" stroke="#e11d48" strokeWidth="1.5" fill="none" className="anim-red-string" />
        <path d="M 200 800 Q 550 500 850 720 T 1400 600" stroke="#e11d48" strokeWidth="1" fill="none" className="anim-red-string" />
        <circle cx="300" cy="240" r="3" fill="#e11d48" className="anim-lamp" />
        <circle cx="600" cy="150" r="3" fill="#0ea5e9" />
        <circle cx="850" cy="720" r="3" fill="#e11d48" />
      </svg>

      {/* Top Warning Strip */}
      <CrimeTape />

      {/* Floating Pill Navbar matching reference photo */}
      <div className="sticky top-4 z-50 mx-auto w-full max-w-6xl px-4 pt-2">
        <header className="relative flex items-center justify-between rounded-full border border-white/12 bg-[#0c1017]/80 px-6 py-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300">
          {/* Top Center Notch Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-accent/60 bg-[#07090e] px-4 py-0.5 shadow-[0_0_18px_rgba(225,29,72,0.4)]">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-accent flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
              ESCAPE.EXE
            </span>
          </div>

          {/* Left Navigation Links */}
          <nav className="hidden items-center gap-6 text-xs font-bold uppercase tracking-wider text-muted md:flex">
            <a href="#about" className="transition-colors hover:text-white">Dossier</a>
            <a href="#features" className="transition-colors hover:text-white">Evidence Web</a>
            <a href="#rulebook" className="transition-colors hover:text-white">Rulebook</a>
            <a href="#chambers" className="transition-colors hover:text-white">Chambers</a>
          </nav>

          {/* Mobile Brand Label */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="font-mono text-sm font-black tracking-tight text-white">
              ESCAPE<span className="text-accent">.EXE</span>
            </span>
          </div>

          {/* Right Navigation Links & CTA */}
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <a href="#rulebook" className="hidden text-muted transition-colors hover:text-white sm:inline-block">
              Rules & Safety
            </a>
            <a
              href="#login-terminal"
              className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 font-bold text-white shadow-md shadow-accent/30 transition-all duration-200 hover:bg-accent-hover hover:scale-105 hover:shadow-[0_0_20px_rgba(225,29,72,0.5)] cursor-pointer"
            >
              <span>ACCESS TERMINAL</span>
              <span className="text-sm">🔑</span>
            </a>
          </div>
        </header>
      </div>

      {/* Main Container */}
      <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-20 relative z-10">
        
        {/* HERO SECTION - Atmospheric Translucent Glass Surface */}
        <section id="about" className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-[#0f1420]/70 via-[#0a0e16]/75 to-[#07090e]/85 p-8 md:p-14 shadow-2xl backdrop-blur-md">
          {/* Overhead red lamp pulsing ambient glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-rose-600/30 blur-[130px] anim-lamp" />
          <div className="pointer-events-none absolute top-1/3 -right-24 h-[400px] w-[400px] rounded-full bg-sky-500/15 blur-[120px]" />

          {/* Subtle grid background */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_1.1fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-accent shadow-[0_0_15px_rgba(225,29,72,0.2)]">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                SYSTEM LOCKDOWN // ESCAPE ROOM ACTIVE
              </div>

              <h1 className="mt-4 text-5xl font-black uppercase tracking-tight text-white sm:text-6xl md:text-7xl leading-[0.95]">
                WELCOME TO <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-rose-400 to-cyan-400 drop-shadow-sm">
                  ESCAPE.EXE
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base text-muted/95 sm:text-lg leading-relaxed">
                Step into a high-stakes escape room challenge. Crack logic puzzles, decode hidden clues, and collect key fragments to unlock the master exit before the countdown hits zero.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#login-terminal"
                  className="btn-shimmer rounded-full bg-accent px-8 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-accent/30 transition-all duration-200 hover:bg-accent-hover hover:scale-105 hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] cursor-pointer"
                >
                  ENTER CHAMBER NOW
                </a>
                <a
                  href="#rulebook"
                  className="rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:border-white/30 hover:scale-105"
                >
                  VIEW RULEBOOK
                </a>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/10 pt-6 text-xs font-mono text-muted">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                  Logic Puzzles & Riddles
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Hidden Keys & Locks
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Zero Penalty Scoring
                </span>
              </div>
            </div>

            {/* Right Side Visual Showcase: The Escape Room Scene with Red Overhead Lamp */}
            <div className="relative group anim-float">
              {/* Outer decorative card frame */}
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#0f1420]/80 p-3 shadow-2xl backdrop-blur-xl transition-all duration-500 group-hover:border-accent/60 group-hover:shadow-[0_0_35px_rgba(225,29,72,0.25)]">
                <div className="relative h-[360px] sm:h-[400px] w-full overflow-hidden rounded-2xl bg-black">
                  <Image
                    src="/images/escape-room-bg.jpg"
                    alt="Atmospheric escape room with overhead red lamp, TV terminal, and mystery evidence"
                    fill
                    priority
                    className="object-cover object-center filter brightness-95 contrast-110 transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Atmospheric overlay with crimson/cyan vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-black/25" />
                  <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-rose-600/40 blur-3xl anim-lamp" />

                  {/* Stamp & Badges on the board */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="stamp-box">ESCAPE ROOM</span>
                    <span className="rounded-full bg-black/65 px-2.5 py-0.5 font-mono text-[10px] text-cyan-300 font-bold backdrop-blur-sm border border-cyan-500/30">
                      LOCKED // SOLVE TO EXIT
                    </span>
                  </div>

                  {/* Chamber footer caption */}
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-[#080b12]/85 p-3.5 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                        DECODE THE CHAIN OF LOGIC
                      </p>
                      <span className="font-mono text-[10px] text-cyan-400 font-semibold">
                        LIVE MATRIX
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/90 leading-snug">
                      Inspect the red lamp evidence chamber. Trace timestamps, witness testimony, and clues to uncover the master escape override.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* "WHAT AWAITS YOU" SECTION - 3 Pillars matching Photo 1 & 2 */}
        <section id="features" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
              WHAT AWAITS YOU
            </h2>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              ENTER A REALM WHERE CIPHERS COME TO LIFE · EVIDENCE BOARD ARCHITECTURE
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Feature 1: Red String Web */}
            <div className="glass-panel glass-panel-hover group relative overflow-hidden rounded-3xl p-7">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-2xl text-accent shadow-inner transition-transform group-hover:scale-110">
                🧶
              </div>
              <h3 className="font-mono text-sm font-extrabold uppercase tracking-wider text-accent">
                RED STRING LOGIC WEB:
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Inspired by authentic conspiracy and evidence boards. Every clue is a node in an interconnected web — eliminate impossible alibis and trace the chain of proof.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-white/80 group-hover:text-accent transition-colors">
                <span>Explore deduction web</span>
                <span>→</span>
              </div>
            </div>

            {/* Feature 2: Forensic Newspaper & Collage Decryptor */}
            <div className="glass-panel glass-panel-hover group relative overflow-hidden rounded-3xl p-7">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/40 bg-cyan-500/10 text-2xl text-cyan-400 shadow-inner transition-transform group-hover:scale-110">
                📰
              </div>
              <h3 className="font-mono text-sm font-extrabold uppercase tracking-wider text-cyan-400">
                FORENSIC NEWSPAPER CLIPPINGS:
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Analyze torn journal scraps, audio transcripts, doctor notes, and classified memos. Decrypt hidden key tokens concealed in plain sight.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-white/80 group-hover:text-cyan-400 transition-colors">
                <span>Examine clue exhibits</span>
                <span>→</span>
              </div>
            </div>

            {/* Feature 3: The Twist Anomaly */}
            <div className="glass-panel glass-panel-hover group relative overflow-hidden rounded-3xl p-7">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 text-2xl text-rose-400 shadow-inner transition-transform group-hover:scale-110">
                ⚡
              </div>
              <h3 className="font-mono text-sm font-extrabold uppercase tracking-wider text-rose-400">
                THE TWIST ANOMALY:
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Emergency sirens trigger mid-investigation! Dynamic evidence drops invert earlier deductions, forcing teams to pivot and decrypt emergency anomaly keys.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-white/80 group-hover:text-rose-400 transition-colors">
                <span>Prepare for twists</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE SAMPLE PUZZLE LAB */}
        <SampleEscapePuzzle />

        {/* RULEBOOK COMPONENT SPECIFICATION */}
        <section id="rulebook" className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c111a]/80 p-8 md:p-12 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-accent">
                OFFICIAL PROTOCOL
              </p>
              <h2 className="mt-1 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                ESCAPE.EXE RULEBOOK & PHASES
              </h2>
            </div>
            <span className="rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-mono text-xs font-bold uppercase text-accent shadow-sm shadow-accent/20">
              PROTOCOL v3.2 · HIGH PRODUCTION EDITION
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {RULEBOOK_STEPS.map((s) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-white/5 bg-[#121926]/70 p-5 transition-all duration-300 hover:border-accent/60 hover:bg-[#151f30] hover:-translate-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent font-mono text-xs font-black text-white shadow-sm shadow-accent/40">
                    {s.step}
                  </span>
                  <span className="text-base group-hover:scale-125 transition-transform">{s.icon}</span>
                </div>
                <h4 className="mt-4 text-base font-bold text-white group-hover:text-accent transition-colors">{s.title}</h4>
                <p className="mt-2 text-xs text-muted leading-relaxed">{s.desc}</p>
                <p className={`mt-3 font-mono text-[10px] font-semibold uppercase ${s.accent}`}>{s.tag}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-xs text-muted flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-white/90">
              <span className="text-accent font-bold">💡 SQUAD GUIDANCE:</span>
              <span>All squad mates share the identical Team Code and PIN. Answers synchronize automatically across laptops and phones.</span>
            </span>
            <span className="font-mono text-accent font-semibold">ZERO NEGATIVE MARKING</span>
          </div>
        </section>

        {/* CHAMBERS SHOWCASE */}
        <section id="chambers" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">
                CHOOSE YOUR ESCAPE CHAMBER
              </p>
              <h2 className="mt-1 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
                ACTIVE ESCAPE CHAMBERS
              </h2>
            </div>
            <p className="text-sm text-muted max-w-md">
              Each chamber features medium-difficulty logic questions, red string timestamp connections, and high-tension anomaly overrides.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {CHAMBER_TIERS.map((c) => (
              <div
                key={c.name}
                className={`rounded-3xl border ${c.border} bg-gradient-to-b ${c.color} p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-xl hover:shadow-2xl ${c.accentGlow}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted uppercase tracking-wider">{c.level}</span>
                    <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white">
                      {c.badge}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-white">{c.name}</h3>
                  <p className="mt-1 font-mono text-xs text-accent font-semibold">{c.difficulty}</p>
                  <p className="mt-3 text-xs text-muted leading-relaxed">{c.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-muted">
                  <span>{c.keys}</span>
                  <span className="text-accent font-semibold">Locked 🔒</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TERMINAL SIGN-IN SECTION */}
        <section className="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center pt-6">
          <div className="space-y-6">
            <span className="inline-block rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-accent shadow-[0_0_15px_rgba(225,29,72,0.2)]">
              AUTHENTICATION GATEWAY
            </span>
            <h2 className="text-4xl font-black uppercase tracking-tight text-white md:text-5xl leading-tight">
              READY TO BREACH <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-rose-400 to-cyan-400">
                ESCAPE.EXE?
              </span>
            </h2>
            <p className="text-muted leading-relaxed max-w-lg">
              Collect your room credentials from the game master desk. Once signed in, your timer activates and your squad receives live synchronization across all devices.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 font-mono text-xs font-bold text-accent">✓</span>
                <span className="text-sm text-white/90">Instant real-time multi-device answer synchronization</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-xs font-bold text-cyan-400">✓</span>
                <span className="text-sm text-white/90">Live key decryption matrix with progress badges</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 font-mono text-xs font-bold text-accent">✓</span>
                <span className="text-sm text-white/90">Automated draft recovery and countdown lock protection</span>
              </div>
            </div>
          </div>

          <div>
            <LoginForm />
          </div>
        </section>

      </div>

      {/* Bottom Caution Strip */}
      <div className="mt-16 relative z-10">
        <CrimeTape />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#05070a]/90 py-8 text-center text-xs text-muted/60 relative z-10 backdrop-blur-md">
        <p className="font-mono uppercase tracking-widest">
          Escape.exe · Investigation & Logic Challenge Platform · High Production UI Edition
        </p>
      </footer>
    </main>
  );
}
