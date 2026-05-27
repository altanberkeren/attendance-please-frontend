"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  QrCode, ChevronRight, ChevronLeft, Check, Scan, RefreshCw,
  Wifi, Nfc, UserPlus, Search, Clock, StopCircle,
  CheckCircle2, Circle, ExternalLink, Pencil, ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Mock data ─────────────────────────────────────────────────────────────────

const ASSIGNED_COURSES = [
  { id: "co1", code: "CS101", name: "Intro to Computer Science", term: "Spring 2025" },
  { id: "co2", code: "CS301", name: "Algorithms",                term: "Spring 2025" },
  { id: "co3", code: "CS201", name: "Data Structures",           term: "Spring 2025" },
]

const SECTIONS: Record<string, { id: string; label: string }[]> = {
  co1: [{ id: "s1", label: "Section A" }, { id: "s2", label: "Section B" }],
  co2: [{ id: "s1", label: "Section A" }],
  co3: [{ id: "s1", label: "Section A" }, { id: "s2", label: "Section B" }],
}

const MODULES: Record<string, { id: string; name: string }[]> = {
  co1: [
    { id: "m1", name: "Module 1: Introduction" },
    { id: "m2", name: "Module 2: Variables & Types" },
    { id: "m3", name: "Module 3: Functions" },
    { id: "m4", name: "Module 4: Loops & Iteration" },
  ],
  co2: [
    { id: "m1", name: "Module 1: Big O Notation" },
    { id: "m2", name: "Module 2: Sorting Algorithms" },
    { id: "m3", name: "Module 3: Graph Algorithms" },
  ],
  co3: [
    { id: "m1", name: "Module 1: Arrays & Lists" },
    { id: "m2", name: "Module 2: Stacks & Queues" },
    { id: "m3", name: "Module 3: Trees" },
  ],
}

const ROSTER: Record<string, { id: string; name: string; studentId: string }[]> = {
  co1: [
    { id: "st1", name: "Alice Johnson", studentId: "20190001" },
    { id: "st2", name: "Bob Smith",     studentId: "20190002" },
    { id: "st3", name: "Carol White",   studentId: "20190003" },
    { id: "st4", name: "David Brown",   studentId: "20190004" },
    { id: "st5", name: "Eve Davis",     studentId: "20190005" },
    { id: "st6", name: "Frank Wilson",  studentId: "20190006" },
  ],
  co2: [
    { id: "st7",  name: "Grace Lee",    studentId: "20190007" },
    { id: "st8",  name: "Henry Taylor", studentId: "20190008" },
    { id: "st9",  name: "Irene Park",   studentId: "20190009" },
    { id: "st10", name: "James Kim",    studentId: "20190010" },
  ],
  co3: [
    { id: "st11", name: "Karen Liu",    studentId: "20190011" },
    { id: "st12", name: "Leo Chen",     studentId: "20190012" },
    { id: "st13", name: "Maria Santos", studentId: "20190013" },
    { id: "st14", name: "Nathan Wu",    studentId: "20190014" },
    { id: "st15", name: "Olivia Hart",  studentId: "20190015" },
  ],
}

// ── Method definitions ─────────────────────────────────────────────────────────

type MethodId = "qr" | "qr-wifi" | "nfc"

const METHODS: {
  id: MethodId; label: string
  icon: React.ElementType; secondaryIcon?: React.ElementType
  color: string; bg: string; ring: string
}[] = [
  { id: "qr",      label: "QR Code",   icon: QrCode, color: "text-primary",    bg: "bg-primary/10",    ring: "ring-primary"    },
  { id: "qr-wifi", label: "QR + WiFi", icon: QrCode, secondaryIcon: Wifi,
                                                       color: "text-blue-500",  bg: "bg-blue-500/10",   ring: "ring-blue-500"   },
  { id: "nfc",     label: "NFC",       icon: Nfc,    color: "text-violet-500", bg: "bg-violet-500/10", ring: "ring-violet-500" },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "course" | "session-setup" | "method" | "live"

interface Selection {
  courseId:  string | null
  sectionId: string | null
  moduleId:  string | null
  method:    MethodId | null
}

interface MarkedStudent {
  id: string; name: string; studentId: string; markedAt: Date; via: "auto" | "manual"
}

export interface SessionRecord {
  id:           string
  courseCode:   string
  moduleName:   string
  sectionLabel: string
  method:       MethodId
  startedAt:    Date
  endedAt:      Date | null
  duration:     string
  attendance:   MarkedStudent[]
  totalRoster:  number
  status:       "active" | "closed"
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  return `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEP_DEFS: { key: Step; label: string }[] = [
  { key: "course",        label: "Course"  },
  { key: "session-setup", label: "Session" },
  { key: "method",        label: "Method"  },
]

function StepIndicator({ current }: { current: Step }) {
  if (current === "live") return null
  const idx = STEP_DEFS.findIndex(s => s.key === current)
  return (
    <div className="flex items-center">
      {STEP_DEFS.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
              i < idx   && "bg-primary text-primary-foreground",
              i === idx && "bg-primary text-primary-foreground ring-[3px] ring-primary/20 ring-offset-2",
              i > idx   && "bg-muted text-muted-foreground",
            )}>
              {i < idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn(
              "text-sm hidden sm:block",
              i === idx ? "font-semibold text-foreground" : "text-muted-foreground",
            )}>
              {step.label}
            </span>
          </div>
          {i < STEP_DEFS.length - 1 && (
            <div className={cn("flex-1 h-px mx-3", i < idx ? "bg-primary" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Course ─────────────────────────────────────────────────────────────

function CourseStep({ sel, setSel, onNext }: {
  sel: Selection; setSel: (s: Selection) => void; onNext: () => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Which course are you teaching right now?</p>
      <div className="space-y-2">
        {ASSIGNED_COURSES.map(c => {
          const active = sel.courseId === c.id
          return (
            <button
              key={c.id}
              onClick={() => setSel({ ...sel, courseId: c.id, sectionId: null, moduleId: null })}
              className={cn(
                "w-full text-left rounded-xl border px-4 py-3.5 transition-all",
                "hover:border-primary/50 hover:bg-muted/50",
                active && "border-primary bg-primary/5 ring-1 ring-primary/30",
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  {c.code.replace(/[^A-Z]/g, "").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.code}</span>
                    <span className="text-xs text-muted-foreground">{c.term}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{c.name}</p>
                </div>
                {active && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!sel.courseId} className="gap-1.5">
          Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Step 2: Section + Module ───────────────────────────────────────────────────

function SessionSetupStep({ sel, setSel, onNext, onBack }: {
  sel: Selection; setSel: (s: Selection) => void; onNext: () => void; onBack: () => void
}) {
  const sections  = sel.courseId ? (SECTIONS[sel.courseId] ?? []) : []
  const modules   = sel.courseId ? (MODULES[sel.courseId]  ?? []) : []
  const singleSec = sections.length === 1

  useEffect(() => {
    if (singleSec) setSel({ ...sel, sectionId: sections[0].id })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel.courseId])

  return (
    <div className="space-y-5">
      {!singleSec && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section</p>
          <div className="flex gap-2">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setSel({ ...sel, sectionId: s.id })}
                className={cn(
                  "px-5 py-2 rounded-lg border text-sm font-medium transition-all",
                  sel.sectionId === s.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="h-px bg-border" />
        </div>
      )}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Module</p>
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {modules.map((m, i) => {
            const active = sel.moduleId === m.id
            return (
              <button
                key={m.id}
                onClick={() => setSel({ ...sel, moduleId: m.id })}
                className={cn(
                  "w-full text-left rounded-lg border px-3.5 py-2.5 transition-all flex items-center justify-between",
                  "hover:border-primary/40 hover:bg-muted/50",
                  active && "border-primary bg-primary/5 ring-1 ring-primary/30",
                )}
              >
                <span className={cn("text-sm", active && "font-medium")}>{m.name}</span>
                {active
                  ? <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  : <span className="text-xs text-muted-foreground shrink-0">#{i + 1}</span>
                }
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-1.5"><ChevronLeft className="h-4 w-4" />Back</Button>
        <Button onClick={onNext} disabled={!sel.sectionId || !sel.moduleId} className="gap-1.5">
          Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Step 3: Method ─────────────────────────────────────────────────────────────

function MethodStep({ sel, setSel, onNext, onBack }: {
  sel: Selection; setSel: (s: Selection) => void; onNext: () => void; onBack: () => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">How will students mark their attendance?</p>
      <div className="grid grid-cols-3 gap-3">
        {METHODS.map(m => {
          const active = sel.method === m.id
          const Icon = m.icon
          const SecIcon = m.secondaryIcon
          return (
            <button
              key={m.id}
              onClick={() => setSel({ ...sel, method: m.id })}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border p-5 transition-all",
                "hover:border-primary/40 hover:bg-muted/30",
                active && `border-primary ring-1 ${m.ring} bg-primary/5`,
              )}
            >
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center relative", m.bg)}>
                <Icon className={cn("h-6 w-6", m.color)} />
                {SecIcon && (
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background border flex items-center justify-center">
                    <SecIcon className={cn("h-2.5 w-2.5", m.color)} />
                  </span>
                )}
              </div>
              <p className={cn("text-sm font-medium", active && m.color)}>{m.label}</p>
              <div className={cn(
                "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                active ? "border-primary bg-primary" : "border-muted-foreground/30",
              )}>
                {active && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-1.5"><ChevronLeft className="h-4 w-4" />Back</Button>
        <Button onClick={onNext} disabled={!sel.method} className="gap-1.5">
          Start Session <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Manual add panel ───────────────────────────────────────────────────────────

function ManualAddPanel({ roster, markedIds, onMark }: {
  roster: { id: string; name: string; studentId: string }[]
  markedIds: Set<string>
  onMark: (s: { id: string; name: string; studentId: string }) => void
}) {
  const [open,      setOpen]      = useState(false)
  const [addSearch, setAddSearch] = useState("")
  const [addId,     setAddId]     = useState("")

  function addByStudentId() {
    const id = addId.trim()
    if (!id) return
    const existing = roster.find(s => s.studentId === id)
    onMark(existing ?? { id: `extra-${id}`, name: `Student #${id}`, studentId: id })
    setAddId("")
  }

  const filtered = roster.filter(s =>
    s.name.toLowerCase().includes(addSearch.toLowerCase()) || s.studentId.includes(addSearch)
  )

  return (
    <div className="rounded-xl border overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <UserPlus className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium flex-1 text-left">Add student manually</span>
        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="border-t px-4 py-3 bg-muted/20 space-y-3">
          <div className="flex gap-2">
            <Input
              className="h-8 text-sm font-mono flex-1"
              placeholder="Student ID (e.g. 20190099)"
              value={addId}
              onChange={e => setAddId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addByStudentId()}
              autoFocus
            />
            <Button size="sm" className="h-8 px-3 shrink-0" onClick={addByStudentId} disabled={!addId.trim()}>Add</Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="h-8 text-sm pl-8"
              placeholder="Search roster…"
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
            />
          </div>
          <div className="space-y-0.5 max-h-36 overflow-y-auto">
            {filtered.map(s => {
              const isMarked = markedIds.has(s.id)
              return (
                <div
                  key={s.id}
                  onClick={() => !isMarked && onMark(s)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-2 text-sm",
                    isMarked ? "opacity-40" : "hover:bg-muted/60 cursor-pointer",
                  )}
                >
                  <div className="min-w-0">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground font-mono ml-2">{s.studentId}</span>
                  </div>
                  {isMarked
                    ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    : <span className="text-xs text-primary font-medium shrink-0">Mark present</span>
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Live session ───────────────────────────────────────────────────────────────

function LiveSession({ sel, onUpdate, onDone }: {
  sel: Selection
  onUpdate: (r: SessionRecord) => void
  onDone:   (r: SessionRecord) => void
}) {
  const course  = ASSIGNED_COURSES.find(c => c.id === sel.courseId)!
  const section = SECTIONS[sel.courseId!]?.find(s => s.id === sel.sectionId)
  const module  = MODULES[sel.courseId!]?.find(m => m.id === sel.moduleId)!
  const method  = METHODS.find(m => m.id === sel.method)!
  const roster  = ROSTER[sel.courseId!] ?? []

  const startedAt  = useState(() => new Date())[0]
  const sessionId  = useState(() => `session-${Date.now()}`)[0]

  const [marked,  setMarked]  = useState<MarkedStudent[]>([])
  const [qrToken, setQrToken] = useState(`att://${sel.courseId}/${sel.moduleId}/${sel.sectionId}?ts=${Date.now()}`)
  const [ended,   setEnded]   = useState(false)
  const [newIds,  setNewIds]  = useState<Set<string>>(new Set())
  const timer = useTimer(!ended)

  const markedIds    = new Set(marked.map(m => m.id))
  const presentCount = marked.length
  const totalCount   = roster.length
  const pct          = totalCount ? Math.round((presentCount / totalCount) * 100) : 0
  const absent       = roster.filter(s => !markedIds.has(s.id))

  const buildRecord = useCallback((att: MarkedStudent[], status: "active" | "closed", endedAt: Date | null): SessionRecord => ({
    id: sessionId,
    courseCode:   course.code,
    moduleName:   module.name,
    sectionLabel: section?.label ?? "",
    method:       sel.method!,
    startedAt, endedAt, duration: timer, attendance: att, totalRoster: roster.length, status,
  }), [sessionId, course.code, module.name, section, sel.method, startedAt, timer, roster.length])

  function addMark(s: { id: string; name: string; studentId: string }, via: "auto" | "manual") {
    if (markedIds.has(s.id)) return
    setMarked(prev => {
      const next = [...prev, { ...s, markedAt: new Date(), via }]
      onUpdate(buildRecord(next, ended ? "closed" : "active", null))
      return next
    })
    setNewIds(prev => { const n = new Set(prev); n.add(s.id); return n })
    setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(s.id); return n }), 800)
  }

  function unmark(id: string) {
    setMarked(prev => {
      const next = prev.filter(m => m.id !== id)
      onUpdate(buildRecord(next, "closed", new Date()))
      return next
    })
  }

  // Simulate auto-marks
  useEffect(() => {
    if (ended || !absent.length) return
    const id = setTimeout(() => addMark(absent[Math.floor(Math.random() * absent.length)], "auto"), 2000 + Math.random() * 3000)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marked, ended])

  function openQRTab() {
    const params = new URLSearchParams({ t: qrToken, c: course.code, m: module.name, s: section?.label ?? "" })
    window.open(`/qr?${params}`, "_blank", "noopener")
  }

  function refreshQR() {
    setQrToken(`att://${sel.courseId}/${sel.moduleId}/${sel.sectionId}?ts=${Date.now()}`)
  }

  function endSession() {
    setEnded(true)
    onUpdate(buildRecord(marked, "closed", new Date()))
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  if (ended) {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <div className="flex flex-col items-center py-6 gap-4 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Session Complete</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {course.code}{section ? ` · ${section.label}` : ""} · {module.name}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              { label: "Present",  value: presentCount,              cls: "text-primary" },
              { label: "Absent",   value: totalCount - presentCount, cls: "text-muted-foreground" },
              { label: "Duration", value: timer,                      cls: "" },
            ].map(item => (
              <div key={item.label} className="rounded-xl border p-4 text-center">
                <p className={cn("text-2xl font-bold", item.cls)}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Edit attendance */}
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Edit Attendance</span>
          </div>
          <div className="divide-y max-h-60 overflow-y-auto">
            {roster.map(s => {
              const isPresent = markedIds.has(s.id)
              return (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{s.studentId}</p>
                  </div>
                  <button
                    onClick={() => isPresent ? unmark(s.id) : addMark(s, "manual")}
                    className={cn(
                      "text-xs font-medium px-3 py-1 rounded-lg border transition-colors",
                      isPresent
                        ? "border-primary/30 text-primary bg-primary/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5",
                    )}
                  >
                    {isPresent ? "Present ✓" : "Absent"}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <ManualAddPanel roster={roster} markedIds={markedIds} onMark={s => addMark(s, "manual")} />

        <Button className="w-full" onClick={() => onDone(buildRecord(marked, "closed", new Date()))}>
          Save & Close
        </Button>
      </div>
    )
  }

  // ── Active ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 rounded-xl border bg-card px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="font-semibold">{presentCount}</span>
              <span className="text-muted-foreground">/ {totalCount} present</span>
            </div>
            <span className={cn("font-bold tabular-nums",
              pct >= 80 ? "text-primary" : pct >= 60 ? "text-amber-500" : "text-muted-foreground"
            )}>{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center text-center py-3">
          <span className="font-mono text-lg font-bold">{timer}</span>
          <span className="text-[11px] text-muted-foreground">elapsed</span>
        </div>
      </div>

      {/* Method + roster */}
      <div className="grid grid-cols-5 gap-3" style={{ minHeight: 280 }}>
        <div className="col-span-3 rounded-xl border bg-card flex flex-col items-center justify-center p-5 gap-3">
          {(sel.method === "qr" || sel.method === "qr-wifi") && (
            <>
              {sel.method === "qr-wifi" && (
                <div className="flex items-center gap-1.5 text-xs text-blue-500 bg-blue-500/10 rounded-lg px-3 py-1.5 w-full justify-center">
                  <Wifi className="h-3.5 w-3.5" />Campus WiFi: <strong className="font-mono ml-1">IUS-Campus</strong>
                </div>
              )}
              <div className="p-3.5 rounded-2xl bg-white shadow border">
                <QRCodeSVG value={qrToken} size={155} level="M" includeMargin={false} />
              </div>
              <div className="flex items-center gap-4">
                <button onClick={refreshQR} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="h-3 w-3" />Refresh
                </button>
                <button onClick={openQRTab} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  <ExternalLink className="h-3 w-3" />Project QR
                </button>
              </div>
            </>
          )}
          {sel.method === "nfc" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center h-28 w-28">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/15 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute inset-4 rounded-full border border-violet-500/25 animate-pulse" />
                <div className="h-14 w-14 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <Nfc className="h-7 w-7 text-violet-500" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Waiting for taps</p>
                <p className="text-xs text-muted-foreground mt-0.5">Students tap their student card</p>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 rounded-xl border bg-card overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Students</span>
            <span className="text-xs text-muted-foreground">{presentCount}/{totalCount}</span>
          </div>
          <div className="overflow-y-auto flex-1 divide-y">
            {[...marked].reverse().map(s => (
              <div key={s.id} className={cn("flex items-center gap-2 px-3 py-2 transition-colors duration-300", newIds.has(s.id) && "bg-primary/10")}>
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium truncate flex-1">{s.name}</span>
                {s.via === "manual" && <span className="text-[9px] border rounded px-1 text-muted-foreground shrink-0">M</span>}
              </div>
            ))}
            {absent.map(s => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 group">
                <Circle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                <span className="text-xs text-muted-foreground truncate flex-1">{s.name}</span>
                <button onClick={() => addMark(s, "manual")} className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline shrink-0">
                  Mark
                </button>
              </div>
            ))}
            {absent.length === 0 && presentCount > 0 && (
              <div className="px-3 py-4 text-center text-xs text-primary font-medium">All present 🎉</div>
            )}
          </div>
        </div>
      </div>

      <ManualAddPanel roster={roster} markedIds={markedIds} onMark={s => addMark(s, "manual")} />

      <div className="flex justify-end">
        <Button variant="destructive" size="sm" onClick={endSession} className="gap-2">
          <StopCircle className="h-4 w-4" />End Session
        </Button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("course")
  const [sel,  setSel]  = useState<Selection>({ courseId: null, sectionId: null, moduleId: null, method: null })
  const [sessions, setSessions] = useState<SessionRecord[]>([])

  function handleUpdate(record: SessionRecord) {
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === record.id)
      if (idx === -1) return [...prev, record]
      const next = [...prev]; next[idx] = record; return next
    })
  }

  function handleDone(record: SessionRecord) {
    handleUpdate(record)
    router.push("/overview")
  }

  const isLive = step === "live"

  return (
    <div className="max-w-screen-md mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-4">
        {!isLive && (
          <button
            onClick={() => router.push("/overview")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />Back
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Scan className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">AttendancePlease</h1>
            {isLive && (
              <p className="text-xs text-muted-foreground">
                {ASSIGNED_COURSES.find(c => c.id === sel.courseId)?.code}
                {SECTIONS[sel.courseId!]?.find(s => s.id === sel.sectionId)?.label ? ` · ${SECTIONS[sel.courseId!]?.find(s => s.id === sel.sectionId)?.label}` : ""}
                {" · "}{MODULES[sel.courseId!]?.find(m => m.id === sel.moduleId)?.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Step indicator */}
      {!isLive && <StepIndicator current={step} />}

      {/* Content */}
      {step === "course"        && <CourseStep       sel={sel} setSel={setSel} onNext={() => setStep("session-setup")} />}
      {step === "session-setup" && <SessionSetupStep sel={sel} setSel={setSel} onNext={() => setStep("method")} onBack={() => setStep("course")} />}
      {step === "method"        && <MethodStep       sel={sel} setSel={setSel} onNext={() => setStep("live")} onBack={() => setStep("session-setup")} />}
      {step === "live"          && <LiveSession      sel={sel} onUpdate={handleUpdate} onDone={handleDone} />}
    </div>
  )
}
