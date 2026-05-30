"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Newsreader, Mulish } from "next/font/google"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Mail,
  MapPin,
  Menu,
  MonitorSmartphone,
  MousePointer2,
  Phone,
  QrCode,
  X,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import {
  CONTACT,
  FEATURES,
  STATS,
  UNIVERSITY_LINKS,
  WORKFLOW,
} from "@/lib/landing"

const display = Newsreader({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--d3" })
const body = Mulish({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--b3" })

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

type Student = { name: string; meta: string; ok: boolean }

const ROSTER: Student[] = [
  { name: "Altan Berk Eren", meta: "IUS-20413 · Row 2", ok: true },
  { name: "Ahmet Tarık Duyar", meta: "IUS-20571 · Row 1", ok: true },
  { name: "Doğukan Yurttürk", meta: "IUS-20622 · Row 4", ok: true },
  { name: "Lamija Kozo", meta: "IUS-20688 · Row 3", ok: true },
  { name: "Unknown device", meta: "Off-campus · 4.2 km", ok: false },
]

const initials = (n: string) =>
  n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

// ---- deterministic QR matrix (21×21, version-1 look) ----
const QR_N = 21
const QR_CELLS: boolean[] = (() => {
  const m: number[][] = Array.from({ length: QR_N }, () => Array(QR_N).fill(0))
  const finder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        const edge = i === 0 || i === 6 || j === 0 || j === 6
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4
        m[r + i][c + j] = edge || core ? 1 : 0
      }
  }
  finder(0, 0)
  finder(0, QR_N - 7)
  finder(QR_N - 7, 0)
  let seed = 7
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return (seed >> 16) & 1
  }
  for (let r = 0; r < QR_N; r++)
    for (let c = 0; c < QR_N; c++) {
      const inFinder =
        (r < 8 && c < 8) || (r < 8 && c >= QR_N - 8) || (r >= QR_N - 8 && c < 8)
      if (inFinder) continue
      if (r === 6 || c === 6) {
        m[r][c] = (r + c) % 2 === 0 ? 1 : 0
        continue
      }
      m[r][c] = rnd()
    }
  return m.flat().map((v) => v === 1)
})()

type Phase = "ready" | "open" | "scanning" | "done"

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 text-[#c9a456]/50">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#c9a456]/40" />
      <span className="text-xs">✦</span>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#c9a456]/40" />
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated, isReady } = useAuth()
  const [open, setOpen] = useState(false)
  const href = isReady && isAuthenticated ? "/overview" : "/login"
  const label = isReady && isAuthenticated ? "Enter Dashboard" : "Sign In"

  // ---- Auto-playing board animation (loops) ----
  const [phase, setPhase] = useState<Phase>("ready")
  const [scanned, setScanned] = useState<number[]>([])
  const [activePhone, setActivePhone] = useState<number>(-1)

  useEffect(() => {
    let cancelled = false
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const loop = async () => {
      while (!cancelled) {
        setScanned([])
        setActivePhone(-1)
        setPhase("ready")
        await wait(1500)
        if (cancelled) return

        setPhase("open") // QR draws + phones rise
        await wait(1300)
        if (cancelled) return

        setPhase("scanning")
        for (let i = 0; i < ROSTER.length; i++) {
          await wait(i === 0 ? 650 : 780)
          if (cancelled) return
          setActivePhone(i < 4 ? i : -1)
          setScanned((prev) => [...prev, i])
        }
        await wait(800)
        if (cancelled) return
        setActivePhone(-1)
        setPhase("done")

        await wait(3000)
        if (cancelled) return
      }
    }
    loop()
    return () => {
      cancelled = true
    }
  }, [])

  const presentCount = scanned.filter((i) => ROSTER[i].ok).length
  const flaggedCount = scanned.filter((i) => !ROSTER[i].ok).length
  const progress = Math.round((scanned.length / ROSTER.length) * 100)
  const phonesUp = phase !== "ready"
  const qrShown = phase !== "ready"

  return (
    <div className={`${display.variable} ${body.variable} relative min-h-screen bg-[#0a1424] text-[#d7dae1] [font-family:var(--b3)]`}>
      <style>{`
        @keyframes d3cell { from{opacity:0;transform:scale(.1)} to{opacity:1;transform:scale(1)} }
        @keyframes d3drop { from{opacity:0;transform:translateY(-18px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes d3ring { 0%{transform:scale(.7);opacity:.8} 100%{transform:scale(1.8);opacity:0} }
        @keyframes d3float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes d3beam { 0%{opacity:0} 25%{opacity:1} 100%{opacity:0} }
        @keyframes d3pulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.12);opacity:0} }
        @keyframes d3in { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes d3cursor { 0%{opacity:0;transform:translate(70px,52px) scale(1)} 22%{opacity:1} 64%{transform:translate(0,0) scale(1)} 73%{transform:translate(0,0) scale(.78)} 82%{transform:translate(0,0) scale(1)} 100%{opacity:1;transform:translate(0,0) scale(1)} }
        @keyframes d3click { 0%,62%{opacity:0;transform:scale(.7)} 74%{opacity:.85;transform:scale(.95)} 100%{opacity:0;transform:scale(1.7)} }
        .d3-cell { animation: d3cell .32s ease both; }
        .d3-drop { animation: d3drop .5s cubic-bezier(.2,.85,.25,1) both; }
        .d3-in { animation: d3in .8s cubic-bezier(.2,.7,.2,1) both; }
        .d3-phone { transition: transform .7s cubic-bezier(.2,.8,.2,1), opacity .7s ease; }
      `}</style>

      <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a1424]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/ius-logo-medium.png" alt="IUS" width={44} height={44} priority className="h-10 w-10 object-contain" />
            <div className="leading-tight">
              <p className="text-lg italic text-[#f4f1ea] [font-family:var(--d3)]">Attendance Please</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#8c95a6]">IUS Academic Portal</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {UNIVERSITY_LINKS.map((l) => (<a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="text-sm text-[#aeb4c0] transition hover:text-[#f4f1ea]">{l.label}</a>))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href={href} className="hidden items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-[#e8e3d6] transition hover:bg-[#e8e3d6] hover:text-[#0a1424] sm:inline-flex">{label}<ArrowRight className="h-4 w-4" /></Link>
            <button aria-label="Menu" onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-md border border-white/15 text-[#d7dae1] lg:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {open && (
          <div className="border-t border-white/10 lg:hidden">
            <nav className="mx-auto grid max-w-6xl gap-1 px-6 py-4">
              {UNIVERSITY_LINKS.map((l) => (<a key={l.label} href={l.href} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="border-b border-white/5 py-2 text-sm text-[#aeb4c0]">{l.label}</a>))}
              <Link href={href} className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-[#e8e3d6]">{label}<ArrowRight className="h-4 w-4" /></Link>
            </nav>
          </div>
        )}
      </header>

      {/* ============ HERO ============ */}
      <section id="platform" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.45]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)", backgroundSize: "26px 26px", maskImage: "radial-gradient(ellipse 75% 60% at 60% 35%, #000 30%, transparent 75%)" }} />
        <div className="pointer-events-none absolute -left-20 top-0 h-[520px] w-[520px] rounded-full bg-[#16385f] opacity-50 blur-[140px]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[0.74fr_1.26fr] lg:py-24">
          {/* LEFT - copy */}
          <div className="d3-in">
            <h1 className="mt-7 text-6xl leading-[0.98] text-[#f4f1ea] [font-family:var(--d3)] sm:text-7xl">
              One tap.
              <br />
              <span className="italic"><span className="text-[#c9a456]">Everyone</span> in.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-[#9aa1ae]">
              Open the QR on the board - the whole room checks in at once, and
              anyone off-campus is flagged instantly.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href={href} className="inline-flex items-center gap-2 rounded-full bg-[#e8e3d6] px-8 py-3.5 text-sm font-bold text-[#0a1424] transition hover:bg-white active:scale-[0.98]">
                {label}<ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-3.5 text-sm font-semibold text-[#d7dae1] transition hover:border-white/45">How it works</a>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-2 text-xs text-[#8c95a6]">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#56b072]" /> Verified in the hall</span>
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#d9655c]" /> Off-campus - flagged</span>
            </div>
          </div>

          {/* RIGHT - auto-playing board (fixed size) */}
          <div className="d3-in pb-14" style={{ animationDelay: "120ms" }}>
            <div className="relative">
              <div className="relative z-10 rounded-[1.6rem] bg-gradient-to-b from-[#22324d] to-[#0c1424] p-[1.5px] shadow-[0_50px_120px_-45px_#000]">
                <div className="relative overflow-hidden rounded-[1.5rem] border border-black/40 bg-[#0c1830]">
                  <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />

                  {/* top bar */}
                  <div className="relative flex items-center justify-between border-b border-white/10 bg-[#0a1424] px-5 py-3">
                    <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] text-[#8c95a6]">
                      <MonitorSmartphone className="h-4 w-4 text-[#aeb4c0]" />
                      <span className="hidden sm:inline">Smart Board · Hall A-F2.10</span>
                      <span className="sm:hidden">Hall A-F2.10</span>
                    </div>
                    <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8c95a6]">
                      <span className={`h-2 w-2 rounded-full ${phase === "ready" ? "bg-[#5b6473]" : "animate-pulse bg-[#56b072]"}`} />
                      {phase === "ready" ? "Standby" : "Live"}
                    </span>
                  </div>

                  {/* body - fixed-height panels (no layout shift) */}
                  <div className="grid gap-4 p-5 sm:grid-cols-[1.12fr_1fr]">
                    {/* QR / Take attendance */}
                    <div className="relative grid h-[404px] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#12284a,#0a1424)]">
                      {!qrShown ? (
                        <div className="flex flex-col items-center gap-4 text-center">
                          <span className="relative inline-flex">
                            <span className="absolute inset-0 rounded-full bg-[#e8e3d6]/30" style={{ animation: "d3pulse 1.6s ease-out infinite" }} />
                            <span className="pointer-events-none absolute -inset-2 rounded-full border-2 border-white/70" style={{ animation: "d3click 1.5s ease-out both" }} />
                            <span className="relative inline-flex items-center gap-2 rounded-full bg-[#e8e3d6] px-6 py-3.5 text-sm font-bold text-[#0a1424]">
                              <QrCode className="h-4 w-4" /> Take attendance
                            </span>
                            <span className="pointer-events-none absolute left-[70%] top-[58%] z-20 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.7)]" style={{ animation: "d3cursor 1.5s ease-in-out both" }}>
                              <MousePointer2 className="h-6 w-6 fill-white" />
                            </span>
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.25em] text-[#6f7889]">Tap to generate the code</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="relative mx-auto overflow-hidden rounded-xl bg-white p-4 shadow-[0_0_50px_-14px_rgba(255,255,255,0.4)]">
                            <div className="grid h-[176px] w-[176px] sm:h-[196px] sm:w-[196px]" style={{ gridTemplateColumns: `repeat(${QR_N},1fr)`, gridTemplateRows: `repeat(${QR_N},1fr)` }}>
                              {QR_CELLS.map((on, idx) => {
                                const r = Math.floor(idx / QR_N)
                                const c = idx % QR_N
                                return <span key={idx} className={on ? "d3-cell bg-[#0a1424]" : ""} style={on ? { animationDelay: `${(r + c) * 14}ms` } : undefined} />
                              })}
                            </div>
                          </div>
                          <p className="mt-3 text-center text-[11px] uppercase tracking-[0.25em] text-[#6f7889]">CS 301 · Live</p>
                        </div>
                      )}
                    </div>

                    {/* Attendance - fixed height */}
                    <div className="flex h-[404px] flex-col rounded-2xl border border-white/10 bg-[#0a1424]/70 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e8e3d6]">Attendance</p>
                        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider">
                          <span className="text-[#7fd89a]">{presentCount} in</span>
                          {flaggedCount > 0 && <span className="text-[#f0867d]">{flaggedCount} flagged</span>}
                        </div>
                      </div>
                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#56b072] to-[#7fd89a] transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>

                      <div className="mt-3 flex-1 space-y-2 overflow-hidden">
                        {scanned.length === 0 && (
                          <p className="pt-10 text-center text-sm text-[#5d6473]">Waiting for the room…</p>
                        )}
                        {scanned.map((idx, k) => {
                          const s = ROSTER[idx]
                          return (
                            <div key={`${idx}-${k}`} className={`d3-drop flex items-center gap-2.5 rounded-xl border px-3 py-1.5 ${s.ok ? "border-[#56b072]/25 bg-[#56b072]/[0.08]" : "border-[#d9655c]/45 bg-[#d9655c]/[0.16]"}`}>
                              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${s.ok ? "bg-[#56b072]/20 text-[#8fe0a6]" : "bg-[#d9655c]/25 text-[#f5a39b]"}`}>
                                {s.ok ? initials(s.name) : <AlertTriangle className="h-4 w-4" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className={`block truncate text-sm font-semibold ${s.ok ? "text-[#e8e3d6]" : "text-[#f0a59d]"}`}>{s.name}</span>
                                <span className={`block truncate text-[11px] ${s.ok ? "text-[#8c95a6]" : "text-[#e1857c]"}`}>{s.meta}</span>
                              </span>
                              {s.ok ? (
                                <Check className="h-4 w-4 shrink-0 text-[#7fd89a]" />
                              ) : (
                                <span className="shrink-0 rounded-full bg-[#d9655c] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Out of school</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* phones rising (overlap board bottom) */}
              <div className="absolute inset-x-0 bottom-0 z-20 flex translate-y-[44%] justify-center gap-3 sm:gap-5">
                {[0, 1, 2, 3].map((i) => {
                  const isScanned = scanned.includes(i)
                  const isActive = activePhone === i
                  return (
                    <div
                      key={i}
                      className="d3-phone relative"
                      style={{
                        transform: phonesUp ? "translateY(0)" : "translateY(80px)",
                        opacity: phonesUp ? 1 : 0,
                        transitionDelay: `${i * 90}ms`,
                        animation: phonesUp && phase !== "scanning" ? `d3float 3.4s ease-in-out ${i * 0.35}s infinite` : undefined,
                      }}
                    >
                      {isActive && (
                        <span className="pointer-events-none absolute bottom-full left-1/2 h-24 w-[3px] -translate-x-1/2 bg-gradient-to-t from-[#56b072] via-[#56b072]/50 to-transparent" style={{ animation: "d3beam 1s ease-out infinite" }} />
                      )}
                      {isActive && <span className="absolute -inset-1.5 rounded-[1.5rem] border-2 border-[#56b072]" style={{ animation: "d3ring .8s ease-out infinite" }} />}
                      <div className={`relative grid h-[100px] w-[52px] place-items-center rounded-[1.1rem] border-2 bg-gradient-to-b from-[#11203a] to-[#0a1424] shadow-[0_18px_30px_-12px_#000] transition sm:h-[112px] sm:w-[58px] ${isActive ? "border-[#56b072]" : isScanned ? "border-[#56b072]/50" : "border-white/15"}`}>
                        <span className="absolute top-2 h-1 w-6 rounded-full bg-white/15" />
                        {isScanned ? <Check className="h-6 w-6 text-[#7fd89a]" /> : <QrCode className={`h-6 w-6 ${isActive ? "text-[#56b072]" : "text-[#6f7889]"}`} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Ornament />
            <h2 className="mt-4 text-4xl text-[#f4f1ea] [font-family:var(--d3)]">Considered in every detail</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <article key={f.title} className="group rounded-xl border border-white/10 bg-[#0c1830] p-7 transition hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_24px_50px_-30px_#000]">
                <div className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-[#e8e3d6] transition group-hover:border-[#c9a456]/60 group-hover:text-[#c9a456]"><f.icon className="h-5 w-5" /></div>
                <h3 className="mt-5 text-xl text-[#f4f1ea] [font-family:var(--d3)]">{f.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#9aa1ae]">{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <Ornament />
          <h2 className="mt-4 text-center text-4xl text-[#f4f1ea] [font-family:var(--d3)]">From entry to record</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {WORKFLOW.map((w) => (
              <div key={w.step} className="text-center">
                <p className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-white/15 text-2xl italic text-[#e8e3d6] [font-family:var(--d3)]">{w.step}</p>
                <h3 className="mt-5 text-lg font-semibold text-[#f4f1ea]">{w.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#9aa1ae]">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-white/10 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
          {STATS.map(([v, l]) => (
            <div key={l} className="bg-[#0c1830] px-4 py-7 text-center">
              <p className="text-3xl text-[#e8e3d6] [font-family:var(--d3)]">{v}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#8c95a6]">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-4xl italic text-[#f4f1ea] [font-family:var(--d3)] sm:text-5xl">Open the platform.</h2>
          <p className="mt-4 text-[#9aa1ae]">Continue with your International University of Sarajevo account.</p>
          <Link href={href} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#e8e3d6] px-8 py-3.5 text-sm font-bold text-[#0a1424] transition hover:bg-white">{label}<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#081020]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-xl italic text-[#f4f1ea] [font-family:var(--d3)]">Attendance Please</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#7e8696]">The attendance platform of the {CONTACT.university}.</p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#aeb4c0]">University</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#9aa1ae]">{UNIVERSITY_LINKS.slice(1, 5).map((l) => (<li key={l.label}><a href={l.href} target="_blank" rel="noreferrer" className="hover:text-[#f4f1ea]">{l.label}</a></li>))}</ul>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#aeb4c0]">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#9aa1ae]">
              <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8c95a6]" />{CONTACT.address}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#8c95a6]" />{CONTACT.phone}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#8c95a6]" />{CONTACT.email}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-5 text-center text-xs text-[#6f7889]">© {new Date().getFullYear()} {CONTACT.university} · {CONTACT.tagline}</div>
      </footer>
    </div>
  )
}
