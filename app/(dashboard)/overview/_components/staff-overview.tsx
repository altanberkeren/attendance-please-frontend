"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Scan, ChevronRight,
  Users, CalendarCheck, BarChart3, AlertTriangle,
  TrendingUp, TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Mock data ──────────────────────────────────────────────────────────────────

const STAFF_STATS = [
  { label: "My Students",    value: "81",    change: "across 3 courses",   up: true,  icon: Users },
  { label: "This Week",      value: "6",     change: "sessions held",       up: true,  icon: CalendarCheck },
  { label: "Avg Attendance", value: "83.2%", change: "-1.4% vs last week",  up: false, icon: BarChart3 },
  { label: "At Risk",        value: "4",     change: "below 60% threshold", up: false, icon: AlertTriangle },
]

const TODAY_SCHEDULE = [
  { id: "ts1", time: "09:00 – 10:30", code: "CS101", module: "Module 4: Loops & Iteration", section: "Section A", students: 28, status: "done",     present: 24 },
  { id: "ts2", time: "11:00 – 12:30", code: "CS301", module: "Module 6: Graph Algorithms",  section: "Section A", students: 22, status: "upcoming",  present: null },
  { id: "ts3", time: "14:00 – 15:30", code: "CS201", module: "Module 5: Trees",              section: "Section B", students: 31, status: "upcoming",  present: null },
]

const MY_COURSES = [
  { id: "co1", code: "CS101", name: "Intro to Computer Science", term: "Spring 2025", students: 28, attendance: 91 },
  { id: "co2", code: "CS301", name: "Algorithms",                term: "Spring 2025", students: 22, attendance: 79 },
  { id: "co3", code: "CS201", name: "Data Structures",           term: "Spring 2025", students: 31, attendance: 74 },
]

const AT_RISK_STUDENTS = [
  { name: "Alice Johnson", initials: "AJ", course: "CS301", attendance: 52 },
  { name: "Bob Smith",     initials: "BS", course: "CS201", attendance: 58 },
  { name: "Carol White",   initials: "CW", course: "CS101", attendance: 61 },
  { name: "David Brown",   initials: "DB", course: "CS201", attendance: 55 },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function barColor(v: number) {
  return v >= 80 ? "bg-primary" : v >= 65 ? "bg-amber-500" : "bg-destructive"
}
function textColor(v: number) {
  return v >= 80 ? "text-primary" : v >= 65 ? "text-amber-500" : "text-destructive"
}

// ── Staff Overview ─────────────────────────────────────────────────────────────

export function StaffOverview() {
  const router  = useRouter()
  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Good morning 👋</h1>
          <p className="text-sm text-muted-foreground">{dateStr} · Spring 2025, Week 11</p>
        </div>
        <button
          onClick={() => router.push("/attendance")}
          className={cn(
            "group flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 px-5 py-3",
            "hover:border-primary/60 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/10 active:scale-[0.98]",
            "transition-all duration-150 self-start sm:self-auto",
          )}
        >
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/40">
            <Scan className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold leading-tight">AttendancePlease</p>
            <p className="text-[11px] text-muted-foreground">Start taking attendance</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground ml-1 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAFF_STATS.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className={cn("h-4 w-4", stat.up ? "text-primary" : "text-destructive")} />
              </div>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <div className={cn("flex items-center gap-1 mt-1 text-xs", stat.up ? "text-primary" : "text-destructive")}>
                {stat.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />Today's Schedule
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{TODAY_SCHEDULE.length} sessions</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {TODAY_SCHEDULE.map(session => (
              <div key={session.id} className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                session.status === "done" ? "bg-muted/40 border-transparent" : "border-border",
              )}>
                <div className="text-[11px] font-mono text-muted-foreground w-20 shrink-0 text-center whitespace-pre-line leading-tight">
                  {session.time.replace(" – ", "\n")}
                </div>
                <div className={cn("w-0.5 self-stretch rounded-full shrink-0",
                  session.status === "done" ? "bg-muted-foreground/30" : "bg-primary"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-sm">{session.code}</span>
                    <span className="text-xs text-muted-foreground">{session.section}</span>
                    <Badge className={cn("text-[10px] px-1.5 py-0 ml-auto border-0",
                      session.status === "done" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    )}>
                      {session.status === "done" ? "Done" : "Upcoming"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{session.module}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">{session.status === "done" ? `${session.present}/` : ""}{session.students}</p>
                  <p className="text-[10px] text-muted-foreground">{session.status === "done" ? "present" : "students"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
              <Badge variant="destructive" className="ml-auto text-xs">{AT_RISK_STUDENTS.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {AT_RISK_STUDENTS.map(s => (
              <div key={s.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-destructive/20 text-destructive font-semibold">{s.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.course}</p>
                </div>
                <Badge variant="destructive" className="shrink-0 tabular-nums">{s.attendance}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Course attendance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />Attendance Rate by Course
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {MY_COURSES.map(c => (
              <div key={c.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm">{c.code}</span>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </div>
                  <span className={cn("text-lg font-bold tabular-nums", textColor(c.attendance))}>{c.attendance}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", barColor(c.attendance))} style={{ width: `${c.attendance}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground">{c.students} students · {c.term}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
