"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Mock data ─────────────────────────────────────────────────────────────────

const STATS = [
  {
    label: "Total Students",
    value: "248",
    change: "+14 this month",
    up: true,
    icon: Users,
  },
  {
    label: "Active Sessions",
    value: "3",
    change: "Live right now",
    up: true,
    icon: Activity,
  },
  {
    label: "Avg Attendance",
    value: "87.4%",
    change: "+2.1% vs last term",
    up: true,
    icon: BarChart3,
  },
  {
    label: "Total Courses",
    value: "12",
    change: "+2 this term",
    up: true,
    icon: BookOpen,
  },
];

const ATTENDANCE_BARS = [
  { code: "CS101", name: "Intro to CS", value: 92 },
  { code: "CS301", name: "Algorithms", value: 88 },
  { code: "CS450", name: "Machine Learning", value: 84 },
  { code: "CS201", name: "Data Structures", value: 78 },
  { code: "CS401", name: "Operating Systems", value: 71 },
  { code: "MATH301", name: "Discrete Math", value: 65 },
];

const ACTIVE_SESSIONS = [
  {
    course: "CS101",
    section: "Sec A",
    module: "Module 3: Functions",
    present: 22,
    total: 28,
  },
  {
    course: "CS301",
    section: "Sec B",
    module: "Module 6: Sorting",
    present: 17,
    total: 19,
  },
];

const RECENT_ACTIVITY = [
  {
    msg: "Session CS101 / Section A opened",
    time: "2 min ago",
    type: "session",
  },
  {
    msg: "John Doe marked present in CS301",
    time: "4 min ago",
    type: "attend",
  },
  {
    msg: "25 students enrolled in CS201 Section B",
    time: "1 hr ago",
    type: "enroll",
  },
  {
    msg: "Session MATH301 / Section A closed",
    time: "2 hrs ago",
    type: "session",
  },
  {
    msg: "New course 'CS450 Machine Learning' added",
    time: "1 day ago",
    type: "course",
  },
];

const AT_RISK = [
  { name: "Alice Johnson", initials: "AJ", course: "MATH301", attendance: 55 },
  { name: "Bob Smith", initials: "BS", course: "CS201", attendance: 62 },
  { name: "Carol White", initials: "CW", course: "CS401", attendance: 58 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function barColor(v: number) {
  if (v >= 80) return "bg-primary";
  if (v >= 65) return "bg-secondary";
  return "bg-destructive";
}

function textColor(v: number) {
  if (v >= 80) return "text-primary";
  if (v >= 65) return "text-secondary";
  return "text-destructive";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Spring 2025 — Week 11</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {stat.value}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Middle row: chart + sessions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Attendance by course */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate by Course
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ATTENDANCE_BARS.map((item) => (
              <div key={item.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>
                    <span className="font-mono font-semibold">{item.code}</span>
                    <span className="text-muted-foreground ml-2">
                      {item.name}
                    </span>
                  </span>
                  <span className={`font-bold ${textColor(item.value)}`}>
                    {item.value}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor(item.value)}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active sessions */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Active Sessions
              </CardTitle>
              <Badge className="animate-pulse text-xs">
                {ACTIVE_SESSIONS.length} Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ACTIVE_SESSIONS.map((s) => (
              <div
                key={`${s.course}-${s.section}-${s.module}`}
                className="space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="font-mono font-semibold text-sm">
                        {s.course}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.section}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 pl-4">
                      {s.module}
                    </p>
                  </div>
                  <span className="text-xs font-semibold shrink-0">
                    {s.present}/{s.total}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(s.present / s.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}

            {ACTIVE_SESSIONS.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active sessions
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom row: activity + at-risk ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent activity */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {RECENT_ACTIVITY.map((item) => (
              <div
                key={`${item.msg}-${item.time}`}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="flex-1 text-sm">{item.msg}</span>
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.time}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* At-risk students */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-medium">
                At-Risk Students
              </CardTitle>
              <Badge variant="destructive" className="ml-auto text-xs">
                {AT_RISK.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {AT_RISK.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-destructive/20 text-destructive font-semibold">
                    {s.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.course}</p>
                </div>
                <Badge variant="destructive" className="shrink-0 tabular-nums">
                  {s.attendance}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
